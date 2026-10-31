/** @format */

import { NextRequest, NextResponse } from 'next/server';

import Stripe from 'stripe';
import { database } from '@xernerx/lib/server';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_placeholder', {
	apiVersion: '2026-10-28.endive',
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const targetId = (await params).id;

		if (!targetId) return NextResponse.json({ error: 'Target ID is required' }, { status: 400 });

		const { models } = await database('xernerx');
		const SubscriptionModel = models.users.Subscription as any;

		// 1. User-initiated cancellation by Stripe subscription ID
		if (targetId.startsWith('sub_') || targetId === 'staff_infinite_sub') {
			if (targetId === 'staff_infinite_sub') {
				if (SubscriptionModel) {
					await SubscriptionModel.deleteMany({ stripeSubscriptionId: 'staff_infinite_sub' });
				}
				return NextResponse.json({ success: true, status: 'canceled' });
			}

			const canceledSubscription = await stripe.subscriptions.update(targetId, {
				cancel_at_period_end: true,
			});

			if (SubscriptionModel) {
				await SubscriptionModel.updateMany({ stripeSubscriptionId: targetId }, { $set: { status: canceledSubscription.status } });
			}

			await models.users.User.findOneAndUpdate(
				{ 'billing.subscriptions.stripeSubscriptionId': targetId },
				{
					$set: {
						'billing.subscriptions.$.status': canceledSubscription.status,
						'billing.subscriptions.$.cancelAtPeriodEnd': true,
					},
				}
			);

			return NextResponse.json({ success: true, status: canceledSubscription.status });
		}

		// 2. Admin staff override cancellation by user ID
		const user = await models.users.User.findOne({ id: targetId });
		if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

		const canceledSubIds: string[] = ['staff_infinite_sub'];

		if ((user as any).stripeCustomerId) {
			try {
				const subs = await stripe.subscriptions.list({
					customer: (user as any).stripeCustomerId,
					status: 'active',
				});

				const staffSubs = subs.data.filter((s: any) => s.metadata?.xernerx_staff_override === 'true');

				for (const s of staffSubs) {
					canceledSubIds.push(s.id);
					try {
						await stripe.subscriptions.cancel(s.id);
					} catch (err: any) {
						console.warn(`Stripe cancellation failed for ${s.id}:`, err.message);
					}
				}
			} catch (err: any) {
				console.warn('Stripe subscription listing skipped during staff cancel:', err?.message);
			}
		}

		if (SubscriptionModel) {
			await SubscriptionModel.deleteMany({
				ownerId: targetId,
				stripeSubscriptionId: { $in: canceledSubIds },
			});
		}

		const updatedUser = await models.users.User.findOneAndUpdate({ id: targetId }, { $set: { staffSubscription: false } }, { returnDocument: 'after' }).lean();
		const remainingSubs = SubscriptionModel ? await SubscriptionModel.find({ ownerId: targetId }).lean() : [];

		return NextResponse.json({ ...updatedUser, staffSubscription: false, subscriptions: remainingSubs }, { status: 200 });
	} catch (error: any) {
		console.error('Error canceling staff subscription via Stripe:', error);
		return NextResponse.json({ error: 'Failed to cancel staff subscription', details: error.message }, { status: 500 });
	}
}
