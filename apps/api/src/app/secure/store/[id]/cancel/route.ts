/** @format */

import { NextRequest, NextResponse } from 'next/server';

import Stripe from 'stripe';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_placeholder', {
	apiVersion: '2026-10-28.endive',
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['users', 'manageStore']);
		if (!caller.authenticated) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const targetId = (await params).id;

		if (!targetId) return NextResponse.json({ error: 'Target ID is required' }, { status: 400 });

		const body = await req.json().catch(() => ({}));
		const requestedSubId =
			typeof body?.stripeSubscriptionId === 'string' && body.stripeSubscriptionId.trim()
				? body.stripeSubscriptionId.trim()
				: targetId.startsWith('sub_') || targetId === 'staff_infinite_sub'
					? targetId
					: null;

		const { models } = await database('xernerx');
		const SubscriptionModel = models.users.Subscription as any;

		// 1. User-initiated cancellation by Stripe subscription ID
		if (requestedSubId) {
			const ownerUserId = !targetId.startsWith('sub_') && targetId !== 'staff_infinite_sub' ? targetId : caller.userId;

			if (!caller.authorized) {
				if (ownerUserId && caller.userId !== ownerUserId) {
					return NextResponse.json({ error: 'Forbidden: You can only cancel your own subscriptions' }, { status: 403 });
				}
				if (SubscriptionModel) {
					const existingSub = await SubscriptionModel.findOne({
						stripeSubscriptionId: requestedSubId,
						ownerId: caller.userId,
					}).lean();
					if (!existingSub) {
						return NextResponse.json({ error: 'Forbidden: Subscription does not belong to you' }, { status: 403 });
					}
				}
			}

			if (requestedSubId === 'staff_infinite_sub') {
				if (SubscriptionModel && ownerUserId) {
					await SubscriptionModel.deleteMany({ ownerId: ownerUserId, stripeSubscriptionId: 'staff_infinite_sub' });
				}
				if (ownerUserId) {
					await models.users.User.findOneAndUpdate({ id: ownerUserId }, { $set: { staffSubscription: false } });
				}
				return NextResponse.json({ success: true, status: 'canceled' });
			}

			const canceledSubscription = await stripe.subscriptions.update(requestedSubId, {
				cancel_at_period_end: true,
			});

			if (SubscriptionModel) {
				await SubscriptionModel.updateMany({ stripeSubscriptionId: requestedSubId }, { $set: { status: canceledSubscription.status } });
			}

			await models.users.User.findOneAndUpdate(
				{ 'billing.subscriptions.stripeSubscriptionId': requestedSubId },
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
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Staff permission required' }, { status: 403 });
		}
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

		await recordAuditLog(req, {
			action: 'user.staff_subscription.revoke',
			targetType: 'user',
			targetId,
			summary: `Revoked staff subscription override from user "${user.name || targetId}"`,
			metadata: { staffSubscription: false },
		});

		return NextResponse.json({ ...updatedUser, staffSubscription: false, subscriptions: remainingSubs }, { status: 200 });
	} catch (error: any) {
		console.error('Error canceling staff subscription via Stripe:', error);
		return NextResponse.json({ error: 'Failed to cancel staff subscription', details: error.message }, { status: 500 });
	}
}
