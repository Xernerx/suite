/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function POST(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
	try {
		const params = await context.params;
		const userId = params.id;

		if (!userId) {
			return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
		}

		const db = await database('xernerx');
		const User = db.models.profiles.users;

		const user = await User.findOne({ id: userId });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const now = new Date();
		const giftIn = user.credits?.giftIn ? new Date(user.credits.giftIn) : new Date(0);

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
		if (user.credits?.giftIn) {
			if (timeSinceUnlock <= gracePeriodMs) {
				newStreak = (user.credits?.streak || 0) + 1;
			} else {
				newStreak = 1; // Reset streak if the 48-hour window was missed
			}
		}

		// Random base reward (e.g., between 50 and 150 credits) + bonus scaling with the streak
		const randomBase = Math.floor(Math.random() * 101) + 50;
		const rewardCredits = randomBase + newStreak * 10;

		// Next gift available 24 hours from now
		const nextGiftIn = new Date(now.getTime() + 24 * 60 * 60 * 1000);

		const updatedUser = await User.findOneAndUpdate(
			{ id: userId },
			{
				$inc: { 'credits.balance': rewardCredits },
				$set: {
					'credits.streak': newStreak,
					'credits.giftIn': nextGiftIn,
				},
			},
			{ returnDocument: 'after' }
		);

		return NextResponse.json({
			success: true,
			reward: rewardCredits,
			credits: updatedUser.credits,
		});
	} catch (error: any) {
		console.error('Failed to process daily gift:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
