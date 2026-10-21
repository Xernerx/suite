/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { applySubscriptionCreditMultiplier } from '@/lib/creditMultiplier';

export async function POST(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
	try {
		const params = await context.params;
		const userId = params.id;

		if (!userId) {
			return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
		}

		const db = await database('xernerx');
		const Credit = (db.models.users as any).Credit;

		let creditRecord = await Credit.findOne({ ownerId: userId });

		if (!creditRecord) {
			creditRecord = new Credit({ ownerId: userId });
			await creditRecord.save();
		}

		const now = new Date();
		const giftIn = creditRecord.giftIn ? new Date(creditRecord.giftIn) : new Date(0);

		// Check if cooldown has passed
		if (now < giftIn) {
			return NextResponse.json({ error: 'Daily gift is not ready yet.', nextAvailable: giftIn }, { status: 400 });
		}

		// Streak logic:
		// giftIn is when the gift unlocked. We allow a 48-hour grace window from that unlock time
		// to maintain or increment the streak before it resets to 1.
		const gracePeriodMs = 48 * 60 * 60 * 1000;
		const timeSinceUnlock = now.getTime() - giftIn.getTime();

		let newStreak = 1;
		if (creditRecord.giftIn) {
			if (timeSinceUnlock <= gracePeriodMs) {
				newStreak = (creditRecord.streak || 0) + 1;
			} else {
				newStreak = 1; // Reset streak if the 48-hour window was missed
			}
		}

		// Random base reward (e.g., between 50 and 150 credits) + bonus scaling with the streak
		const randomBase = Math.floor(Math.random() * 101) + 50;
		const baseRewardCredits = randomBase + newStreak * 10;

		// Check user subscriptions right before adding credits (125% for any sub, 200% for Ultra)
		const multiplierResult = await applySubscriptionCreditMultiplier(userId, baseRewardCredits);
		const rewardCredits = multiplierResult.finalCredits;

		// Next gift available 24 hours from now
		const nextGiftIn = new Date(now.getTime() + 24 * 60 * 60 * 1000);

		const updatedCredit = await Credit.findOneAndUpdate(
			{ ownerId: userId },
			{
				$inc: { balance: rewardCredits },
				$set: {
					streak: newStreak,
					giftIn: nextGiftIn,
				},
				$push: {
					transactions: {
						id: crypto.randomUUID(),
						type: 'earn',
						amount: rewardCredits,
						itemId: 'daily_gift',
						itemName: multiplierResult.multiplierPercent > 100 ? `Daily Gift (${multiplierResult.multiplierPercent}% Subscriber Bonus)` : 'Daily Gift',
						createdAt: now,
					},
				},
			},
			{ returnDocument: 'after' }
		);

		return NextResponse.json({
			success: true,
			reward: rewardCredits,
			rewardEarned: rewardCredits,
			baseReward: baseRewardCredits,
			multiplier: multiplierResult.multiplier,
			multiplierPercent: multiplierResult.multiplierPercent,
			tier: multiplierResult.tier,
			streak: newStreak,
			credits: updatedCredit,
		});
	} catch (error: any) {
		console.error('Failed to process daily gift:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
