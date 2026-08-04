/** @format */

import { NextRequest, NextResponse } from 'next/server';

import Stripe from 'stripe';
import { database } from '@xernerx/lib/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
	apiVersion: '2026-07-29.dahlia',
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
	try {
		const resolvedParams = await params;
		const subscriptionId = resolvedParams.id;

		if (!subscriptionId) {
			return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
		}

		// 1. Tell Stripe to cancel at the end of the current billing cycle
		const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: true,
		});

		// 2. Update the user document in the database
		const { models } = await database('xernerx');
		await models.profiles.users.findOneAndUpdate(
			{ 'subscriptions.stripeSubscriptionId': subscriptionId },
			{
				$set: {
					'subscriptions.$.status': canceledSubscription.status,
					'subscriptions.$.cancelAtPeriodEnd': true,
				},
			}
		);

		return NextResponse.json({ success: true, status: canceledSubscription.status });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
