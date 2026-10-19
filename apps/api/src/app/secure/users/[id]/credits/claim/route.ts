/** @format */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';

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

		// Determine if streak is preserved (claimed within 24h after giftIn became available, i.e., within 48h of previous claim)
		let newStreak = 1;
		if (existing?.giftIn && (existing.streak || 0) > 0) {
			const msSinceAvailable = now - new Date(existing.giftIn).getTime();
			if (msSinceAvailable <= 24 * 60 * 60 * 1000) {
				newStreak = (existing.streak || 0) + 1;
			}
		}

		const baseReward = 50;
		const streakBonus = Math.min(newStreak * 10, 150);
		const rewardEarned = baseReward + streakBonus;
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
				$setOnInsert: {
					id: crypto.randomUUID(),
					ownerId: id,
				},
			},
			{ upsert: true, returnDocument: 'after' }
		).lean();

		return NextResponse.json({
			...updated,
			rewardEarned,
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
