/** @format */

import { NextRequest, NextResponse } from 'next/server';

import Stripe from 'stripe';
import { database } from '@xernerx/lib/server';
import { products } from '@xernerx/lib';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
	apiVersion: '2026-07-29.dahlia',
});

const STAFF_COUPON_ID = process.env.STRIPE_COUPON_ID;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const userId = (await params).id;

		if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

		const user = await (await database('xernerx')).models.users.User.findOne({ id: userId });
		if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

		// 1. Ensure the user has a Stripe Customer ID
		let customerId = user.stripeCustomerId;
		if (!customerId) {
			const customer = await stripe.customers.create({
				email: user.email || undefined,
				name: user.name || undefined,
				metadata: { userId: user.id },
			});
			customerId = customer.id;
			user.stripeCustomerId = customerId;
			await user.save();
		}

		// 2. Collect all products defined in your library
		const allProductIds = [...(products.users || []), ...(products.developers || []), ...(products.servers || [])];

		if (allProductIds.length === 0) {
			return NextResponse.json({ error: 'No products configured to grant' }, { status: 400 });
		}

		// 3. Fetch all products from Stripe to get their default prices
		const stripeProducts = await stripe.products.list({
			ids: allProductIds,
			limit: 100,
		});

		const priceIds = stripeProducts.data.map((p) => (typeof p.default_price === 'string' ? p.default_price : p.default_price?.id)).filter(Boolean) as string[];

		if (priceIds.length === 0) {
			return NextResponse.json({ error: 'No default prices found for the configured products' }, { status: 400 });
		}

		// 4. Check if an active staff override subscription already exists in Stripe
		const existingSubs = await stripe.subscriptions.list({
			customer: customerId,
			status: 'active',
		});

		let activeStaffSub = existingSubs.data.find((s: any) => s.metadata.xernerx_staff_override === 'true');
		const fallbackPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

		if (activeStaffSub) {
			// Check if current subscription items match all priceIds from the library
			const currentSubPriceIds = activeStaffSub.items.data.map((item) => item.price.id);
			const needsUpdate = priceIds.some((id) => !currentSubPriceIds.includes(id)) || currentSubPriceIds.some((id) => !priceIds.includes(id));

			if (needsUpdate) {
				// Automatically sync items: update/remove old ones, add new ones from @xernerx/lib
				const itemsParam: Stripe.SubscriptionUpdateParams.Item[] = activeStaffSub.items.data.map((item) => {
					if (!priceIds.includes(item.price.id)) {
						return { id: item.id, deleted: true };
					}
					return { id: item.id, price: item.price.id };
				});

				priceIds.forEach((newPriceId) => {
					if (!currentSubPriceIds.includes(newPriceId)) {
						itemsParam.push({ price: newPriceId });
					}
				});

				activeStaffSub = await stripe.subscriptions.update(activeStaffSub.id, {
					items: itemsParam,
				});
			}
		} else {
			// Create a brand new master subscription if none exists
			const subPayload: Stripe.SubscriptionCreateParams = {
				customer: customerId,
				items: priceIds.map((price) => ({ price })),
				metadata: { xernerx_staff_override: 'true' },
			};

			if (STAFF_COUPON_ID) {
				subPayload.discounts = [{ coupon: STAFF_COUPON_ID }];
			}

			activeStaffSub = await stripe.subscriptions.create(subPayload);
		}

		const rawPeriodEnd = (activeStaffSub as any).current_period_end;
		const finalPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000) : fallbackPeriodEnd;

		// 5. Sync database subscriptions array to match active items cleanly
		user.subscriptions = user.subscriptions || [];

		// Filter out existing entries that belong to this staff subscription ID to prevent duplicates
		user.subscriptions = user.subscriptions.filter((sub: any) => sub.stripeSubscriptionId !== activeStaffSub?.id);

		// Push current active items
		activeStaffSub.items.data.forEach((item) => {
			user.subscriptions.push({
				stripeSubscriptionId: activeStaffSub!.id,
				priceId: item.price.id,
				status: activeStaffSub!.status,
				currentPeriodEnd: finalPeriodEnd,
			});
		});

		// Toggle the staff flag locally
		user.staffSubscription = true;

		await user.save();

		return NextResponse.json(user, { status: 200 });
	} catch (error: any) {
		console.error('Error applying staff subscription via Stripe:', error);
		return NextResponse.json({ error: 'Failed to apply staff subscription', details: error.message }, { status: 500 });
	}
}
