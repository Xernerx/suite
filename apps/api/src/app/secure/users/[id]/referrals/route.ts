/** @format */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json().catch(() => ({}));
		const referrerId = String(body.referrerId || '').trim();

		if (!referrerId) {
			return NextResponse.json({ error: 'Referrer ID is required' }, { status: 400 });
		}
		if (referrerId === id) {
			return NextResponse.json({ error: 'You cannot refer yourself' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const CreditModel = (models.users as any).Credit;
		const UserModel = (models.users as any).User;

		const [userCredit, referrerUser, referrerCredit] = await Promise.all([
			CreditModel.findOne({ ownerId: id }).lean(),
			UserModel.findOne({ id: referrerId }).lean(),
			CreditModel.findOne({ ownerId: referrerId }).lean(),
		]);

		if ((userCredit as any)?.referredBy) {
			return NextResponse.json({ error: 'A referrer has already been linked to your account' }, { status: 400 });
		}
		if (!referrerUser && !referrerCredit) {
			return NextResponse.json({ error: 'Referrer user not found' }, { status: 404 });
		}
		if ((referrerCredit as any)?.referredBy === id) {
			return NextResponse.json({ error: 'Circular referrals are not allowed' }, { status: 400 });
		}

		const hasClaimedGift = (Number((userCredit as any)?.streak) || 0) >= 1;
		const shouldAwardNow = hasClaimedGift && !(userCredit as any)?.referralBonusClaimed;
		const now = new Date();

		let updatedUserCredit;
		if (shouldAwardNow) {
			updatedUserCredit = await CreditModel.findOneAndUpdate(
				{ ownerId: id },
				{
					$set: { referredBy: referrerId, referralBonusClaimed: true },
					$inc: { balance: 250 },
					$push: {
						transactions: {
							id: crypto.randomUUID(),
							type: 'referral',
							amount: 250,
							multiplierPercent: 100,
							itemId: `referral_from_${referrerId}`,
							itemName: `Referral Bonus (Referred by ${referrerId})`,
							createdAt: now,
						},
					},
				},
				{ upsert: true, returnDocument: 'after' }
			).lean();

			await CreditModel.findOneAndUpdate(
				{ ownerId: referrerId },
				{
					$inc: { balance: 250 },
					$push: {
						transactions: {
							id: crypto.randomUUID(),
							type: 'referral',
							amount: 250,
							multiplierPercent: 100,
							itemId: `referral_user_${id}`,
							itemName: `Referral Bonus (Invited User ${id})`,
							createdAt: now,
						},
					},
				},
				{ upsert: true }
			);
		} else {
			updatedUserCredit = await CreditModel.findOneAndUpdate({ ownerId: id }, { $set: { referredBy: referrerId } }, { upsert: true, returnDocument: 'after' }).lean();
		}

		return NextResponse.json({
			success: true,
			referredBy: referrerId,
			bonusAwarded: shouldAwardNow,
			rewardCredits: shouldAwardNow ? 250 : 0,
			credits: updatedUserCredit,
		});
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}
