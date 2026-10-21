/** @format */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { applySubscriptionCreditMultiplier } from '@/lib/creditMultiplier';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');

		const now = Date.now();
		const existing = (await models.users.Credit.findOne({ ownerId: id }).lean()) as any;

		if (existing?.giftIn) {
			const nextGiftMs = new Date(existing.giftIn).getTime();
			if (nextGiftMs > now && (existing.streak || 0) > 0) {
				return NextResponse.json(
					{
						error: 'Daily reward already claimed',
						nextClaimAt: existing.giftIn,
					},
					{ status: 429 }
				);
			}
		}

		// Streak logic: 48-hour grace window from unlock time (unified with /secure/store/[id]/gift)
		const gracePeriodMs = 48 * 60 * 60 * 1000;
		let newStreak = 1;
		if (existing?.giftIn && (existing.streak || 0) > 0) {
			const msSinceAvailable = now - new Date(existing.giftIn).getTime();
			if (msSinceAvailable <= gracePeriodMs) {
				newStreak = (existing.streak || 0) + 1;
			}
		}

		// Random base reward (50 to 150 credits) + bonus scaling with streak
		const randomBase = Math.floor(Math.random() * 101) + 50;
		const baseReward = randomBase + newStreak * 10;

		// Check user subscriptions right before adding credits (125% for any sub, 200% for Ultra)
		const multiplierResult = await applySubscriptionCreditMultiplier(id, baseReward);
		const rewardEarned = multiplierResult.finalCredits;
		const newBalance = (existing?.balance || 0) + rewardEarned;
		const nextGiftIn = new Date(now + 24 * 60 * 60 * 1000);

		const updated = await models.users.Credit.findOneAndUpdate(
			{ ownerId: id },
			{
				$set: {
					balance: newBalance,
					streak: newStreak,
					giftIn: nextGiftIn,
				},
				$push: {
					transactions: {
						id: crypto.randomUUID(),
						type: 'earn',
						amount: rewardEarned,
						itemId: 'daily_gift',
						itemName: multiplierResult.multiplierPercent > 100 ? `Daily Gift (${multiplierResult.multiplierPercent}% Subscriber Bonus)` : 'Daily Gift',
						createdAt: new Date(now),
					},
				},
				$setOnInsert: {
					id: crypto.randomUUID(),
					ownerId: id,
				},
			},
			{ upsert: true, returnDocument: 'after' }
		).lean();

		return NextResponse.json({
			...updated,
			success: true,
			reward: rewardEarned,
			rewardEarned,
			baseReward,
			multiplier: multiplierResult.multiplier,
			multiplierPercent: multiplierResult.multiplierPercent,
			tier: multiplierResult.tier,
			streak: newStreak,
			credits: updated,
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
