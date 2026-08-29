/** @format */

import { NextRequest, NextResponse } from 'next/server';

import Stripe from 'stripe';
import { database } from '@xernerx/lib/server';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_placeholder', {
	apiVersion: '2026-08-26.dahlia' as any,
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const userId = (await params).id;

		if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

		const user = await (await database('xernerx')).models.users.User.findOne({ id: userId });
		if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

		if (user.stripeCustomerId) {
			// 1. Fetch active subscriptions for this customer from Stripe
			const subs = await stripe.subscriptions.list({
				customer: user.stripeCustomerId,
				status: 'active',
			});

			// 2. Find any subscriptions flagged as staff overrides
			const staffSubs = subs.data.filter((s: any) => s.metadata.xernerx_staff_override === 'true');

			for (const s of staffSubs) {
				try {
					// 3. Cancel the bundled subscription in Stripe
					await stripe.subscriptions.cancel(s.id);
				} catch (err: any) {
					console.warn(`Stripe cancellation failed for ${s.id}:`, err.message);
				}

				// 4. Clean up our local database arrays matching this subscription ID
				if (user.subscriptions) {
					user.subscriptions = user.subscriptions.filter((sub: any) => sub.stripeSubscriptionId !== s.id);
				}
			}
		}

		// Unflag it locally
		user.staffSubscription = false;

		await user.save();

		return NextResponse.json(user, { status: 200 });
	} catch (error: any) {
		console.error('Error canceling staff subscription via Stripe:', error);
		return NextResponse.json({ error: 'Failed to cancel staff subscription', details: error.message }, { status: 500 });
	}
}
