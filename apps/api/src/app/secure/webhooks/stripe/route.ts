/** @format */

'use server';

import { NextRequest, NextResponse } from 'next/server';

import Stripe from 'stripe';
import { database } from '@xernerx/lib/server';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_placeholder', {
	apiVersion: '2026-07-29.dahlia',
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.text();
		const signature = req.headers.get('stripe-signature');

		if (!signature) {
			console.error('Webhook Error: No stripe-signature header found');
			return NextResponse.json({ error: 'No signature found' }, { status: 400 });
		}

		let event: Stripe.Event;

		// 1. Verify the request actually came from Stripe
		try {
			event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
		} catch (err: any) {
			console.error(`Webhook Signature Verification Failed: ${err.message}`);
			return NextResponse.json({ error: `Webhook Signature Error: ${err.message}` }, { status: 400 });
		}

		const db = await database('xernerx');
		const models = db?.models;

		if (!models?.profiles?.users) {
			console.error('Webhook Error: Database models or users model not found on connection');
			return NextResponse.json({ error: 'Database model initialization failed' }, { status: 500 });
		}

		// 2. Handle New Subscriptions
		if (event.type === 'checkout.session.completed') {
			const session = event.data.object as Stripe.Checkout.Session;

			const userId = session.client_reference_id || session.metadata?.userId;
			const subscriptionId = session.subscription as string;
			const customerId = session.customer as string;

			if (userId && subscriptionId) {
				const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as Stripe.Subscription;

				const priceId = subscription.items.data[0].price.id;
				const currentPeriodEnd = new Date(subscription.items.data[0].current_period_end * 1000);
				const status = subscription.status;

				await models.profiles.users.findOneAndUpdate(
					{ id: userId },
					{
						$set: { stripeCustomerId: customerId },
						$push: {
							subscriptions: {
								stripeSubscriptionId: subscriptionId,
								priceId: priceId,
								status: status,
								currentPeriodEnd: currentPeriodEnd,
							},
						},
					},
					{ runValidators: true }
				);
			}
		}

		// 3. Handle Renewals / Tier Changes
		if (event.type === 'customer.subscription.updated') {
			const subscription = event.data.object as Stripe.Subscription;

			const subscriptionId = subscription.id;
			const status = subscription.status;
			const currentPeriodEnd = new Date(subscription.items.data[0].current_period_end * 1000);

			await models.profiles.users.findOneAndUpdate(
				{ 'subscriptions.stripeSubscriptionId': subscriptionId },
				{
					$set: {
						'subscriptions.$.currentPeriodEnd': currentPeriodEnd,
						'subscriptions.$.status': status,
					},
				}
			);
		}

		// 4. Handle Cancellations
		if (event.type === 'customer.subscription.deleted') {
			const subscription = event.data.object as Stripe.Subscription;
			const subscriptionId = subscription.id;

			await models.profiles.users.findOneAndUpdate(
				{ 'subscriptions.stripeSubscriptionId': subscriptionId },
				{
					$set: { 'subscriptions.$.status': 'canceled' },
				}
			);
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error: unknown) {
		console.error('WEBHOOK CRASH:', error);
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
