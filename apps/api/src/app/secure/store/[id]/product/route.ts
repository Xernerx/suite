/** @format */

import { NextRequest, NextResponse } from 'next/server';

import Stripe from 'stripe';
import { database } from '@xernerx/lib/server';
import { products } from '@xernerx/lib';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_placeholder', {
	apiVersion: '2026-10-28.endive',
});

const STAFF_COUPON_ID = process.env.STRIPE_COUPON_ID;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const productId = (await params).id;

		if (!productId) {
			return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
		}

		// 1. Fetch the product details to get its real name from Stripe
		const product = await stripe.products.retrieve(productId);

		// 2. Fetch all active prices for this product
		const pricesList = await stripe.prices.list({
			product: productId,
			active: true,
		});

		const prices = pricesList.data.map((price) => ({
			id: price.id,
			unitAmount: price.unit_amount,
			currency: price.currency,
			interval: price.recurring?.interval,
			intervalCount: price.recurring?.interval_count,
		}));

		return NextResponse.json(
			{
				name: product.name,
				description: product.description,
				prices,
			},
			{ status: 200 }
		);
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const userId = (await params).id;

		if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

		const { models } = await database('xernerx');
		const user = await models.users.User.findOne({ id: userId });
		if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

		const fallbackPeriodEnd = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
		let customerId = (user as any).stripeCustomerId || null;
		let activeStaffSub: Stripe.Subscription | undefined;
		let syncedEntries: Array<{ stripeSubscriptionId: string; priceId: string; status: string; currentPeriodEnd: Date }> = [];

		try {
			// 1. Ensure the user has a Stripe Customer ID
			if (!customerId) {
				const customer = await stripe.customers.create({
					email: user.email || undefined,
					name: user.name || undefined,
					metadata: { userId: user.id },
				});
				customerId = customer.id;
			}

			// 2. Collect all products defined in database (or fallback to static library)
			const Item = models.store.Item as any;
			const dbItems = await Item.find({ enabled: true }).select('skuId').lean();
			let allProductIds = Array.from(new Set(dbItems.map((i: any) => i.skuId).filter(Boolean))) as string[];
			if (allProductIds.length === 0) {
				allProductIds = [...(products.users || []), ...(products.developers || []), ...(products.servers || [])];
			}

			if (allProductIds.length > 0) {
				const stripeProducts = await stripe.products.list({
					ids: allProductIds,
					limit: 100,
				});

				const priceIds = stripeProducts.data.map((p) => (typeof p.default_price === 'string' ? p.default_price : p.default_price?.id)).filter(Boolean) as string[];

				if (priceIds.length > 0) {
					const existingSubs = await stripe.subscriptions.list({
						customer: customerId,
						status: 'active',
					});

					activeStaffSub = existingSubs.data.find((s: any) => s.metadata?.xernerx_staff_override === 'true');

					if (activeStaffSub) {
						const currentSubPriceIds = activeStaffSub.items.data.map((item) => item.price.id);
						const needsUpdate = priceIds.some((id) => !currentSubPriceIds.includes(id)) || currentSubPriceIds.some((id) => !priceIds.includes(id));

						if (needsUpdate) {
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
					syncedEntries = activeStaffSub.items.data.map((item) => ({
						stripeSubscriptionId: activeStaffSub!.id,
						priceId: item.price.id,
						status: activeStaffSub!.status || 'active',
						currentPeriodEnd: finalPeriodEnd,
					}));
				}
			}
		} catch (stripeErr: any) {
			console.warn('[StaffSubscription] Falling back to local staff_infinite_sub override:', stripeErr?.message);
		}

		if (syncedEntries.length === 0) {
			syncedEntries = [
				{
					stripeSubscriptionId: 'staff_infinite_sub',
					priceId: 'ultra',
					status: 'active',
					currentPeriodEnd: fallbackPeriodEnd,
				},
			];
		}

		const SubscriptionModel = models.users.Subscription as any;
		if (SubscriptionModel) {
			const subIdsToReplace = Array.from(new Set(['staff_infinite_sub', ...syncedEntries.map((e) => e.stripeSubscriptionId)]));
			await SubscriptionModel.deleteMany({
				ownerId: userId,
				stripeSubscriptionId: { $in: subIdsToReplace },
			});
			await SubscriptionModel.insertMany(
				syncedEntries.map((entry) => ({
					ownerId: userId,
					...entry,
				}))
			);
		}

		const updatedUser = await models.users.User.findOneAndUpdate(
			{ id: userId },
			{
				$set: {
					staffSubscription: true,
					...(customerId ? { stripeCustomerId: customerId } : {}),
				},
			},
			{ returnDocument: 'after' }
		).lean();

		const allSubscriptions = SubscriptionModel ? await SubscriptionModel.find({ ownerId: userId }).lean() : syncedEntries;

		return NextResponse.json({ ...updatedUser, staffSubscription: true, subscriptions: allSubscriptions }, { status: 200 });
	} catch (error: any) {
		console.error('Error applying staff subscription:', error);
		return NextResponse.json({ error: 'Failed to apply staff subscription', details: error.message }, { status: 500 });
	}
}
