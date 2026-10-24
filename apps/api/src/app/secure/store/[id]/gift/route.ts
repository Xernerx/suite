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
		// to maintain or increment the streak before it resets to 1 (unless a Streak Shield is active).
		const gracePeriodMs = 48 * 60 * 60 * 1000;
		const timeSinceUnlock = now.getTime() - giftIn.getTime();

		let newStreak = 1;
		let shieldUsed = false;
		const currentShields = Math.max(0, Number(creditRecord.streakShields) || 0);
		let nextShields = currentShields;

		if (creditRecord.giftIn && (creditRecord.streak || 0) > 0) {
			if (timeSinceUnlock <= gracePeriodMs) {
				newStreak = (creditRecord.streak || 0) + 1;
			} else if (currentShields > 0) {
				newStreak = (creditRecord.streak || 0) + 1;
				nextShields = currentShields - 1;
				shieldUsed = true;
			} else {
				newStreak = 1; // Reset streak if the 48-hour window was missed and no shield is active
			}
		}

		// Random base reward (e.g., between 50 and 150 credits) + bonus scaling with the streak + Day 7 Milestone Chest (+250 base credits every 7th day)
		const randomBase = Math.floor(Math.random() * 101) + 50;
		const milestoneBonus = newStreak > 0 && newStreak % 7 === 0 ? 250 : 0;
		const cycleDay = ((newStreak - 1) % 7) + 1;
		const baseRewardCredits = randomBase + newStreak * 10 + milestoneBonus;

		// Check user subscriptions right before adding credits (125% for any sub, 200% for Ultra)
		const multiplierResult = await applySubscriptionCreditMultiplier(userId, baseRewardCredits);
		const rewardCredits = multiplierResult.finalCredits;
		const giftLabel = milestoneBonus > 0 ? 'Daily Gift + Day 7 Milestone' : 'Daily Gift';

		// Next gift available 24 hours from now
		const nextGiftIn = new Date(now.getTime() + 24 * 60 * 60 * 1000);

		const shouldAwardReferral = Boolean(creditRecord.referredBy && !creditRecord.referralBonusClaimed);
		const referralBonus = shouldAwardReferral ? 250 : 0;

		const newTransactions: any[] = [
			{
				id: crypto.randomUUID(),
				type: 'earn',
				amount: rewardCredits,
				multiplierPercent: multiplierResult.multiplierPercent,
				itemId: milestoneBonus > 0 ? 'daily_gift_milestone' : 'daily_gift',
				itemName: multiplierResult.multiplierPercent > 100 ? `${giftLabel} (${multiplierResult.multiplierPercent}% Subscriber Bonus)` : giftLabel,
				createdAt: now,
			},
		];

		if (shouldAwardReferral) {
			newTransactions.push({
				id: crypto.randomUUID(),
				type: 'referral',
				amount: 250,
				multiplierPercent: 100,
				itemId: `referral_from_${creditRecord.referredBy}`,
				itemName: `Referral Bonus (Referred by ${creditRecord.referredBy})`,
				createdAt: now,
			});
		}

		const updatedCredit = await Credit.findOneAndUpdate(
			{ ownerId: userId },
			{
				$inc: { balance: rewardCredits + referralBonus },
				$set: {
					streak: newStreak,
					streakShields: nextShields,
					giftIn: nextGiftIn,
					...(shouldAwardReferral ? { referralBonusClaimed: true } : {}),
				},
				$push: {
					transactions: { $each: newTransactions },
				},
			},
			{ returnDocument: 'after' }
		);

		if (shouldAwardReferral && creditRecord.referredBy) {
			await Credit.findOneAndUpdate(
				{ ownerId: creditRecord.referredBy },
				{
					$inc: { balance: 250 },
					$push: {
						transactions: {
							id: crypto.randomUUID(),
							type: 'referral',
							amount: 250,
							multiplierPercent: 100,
							itemId: `referral_user_${userId}`,
							itemName: `Referral Bonus (Invited User ${userId})`,
							createdAt: now,
						},
					},
				},
				{ upsert: true }
			).catch(() => null);
		}

		return NextResponse.json({
			success: true,
			reward: rewardCredits,
			rewardEarned: rewardCredits,
			baseReward: baseRewardCredits,
			milestoneBonus,
			cycleDay,
			shieldUsed,
			streakShields: nextShields,
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
