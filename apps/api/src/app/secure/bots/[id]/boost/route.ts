/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';

const BOOST_TIERS: Record<string, { cost: number; durationMs: number; label: string }> = {
	'24h': { cost: 1000, durationMs: 24 * 60 * 60 * 1000, label: '24 Hours' },
	'7d': { cost: 5000, durationMs: 7 * 24 * 60 * 60 * 1000, label: '7 Days' },
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getServerSession(auth);
		const userId = (session?.user as any)?.id;

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized: Please sign in to boost a bot.' }, { status: 401 });
		}

		const { id } = await params;
		const body = await req.json().catch(() => ({}));
		const durationKey = body?.duration === '7d' ? '7d' : '24h';
		const tier = BOOST_TIERS[durationKey];

		const { models } = await database('xernerx');
		const Bot = (models.bots as any).Bot;
		const Credit = (models.users as any).Credit;

		const bot = await Bot.findOne({ id });
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found.' }, { status: 404 });
		}

		let creditDoc = await Credit.findOne({ ownerId: userId });
		if (!creditDoc) {
			creditDoc = await Credit.create({ ownerId: userId, balance: 0, streak: 0 });
		}

		if ((creditDoc.balance || 0) < tier.cost) {
			return NextResponse.json(
				{
					error: `Insufficient credits. Need ${tier.cost.toLocaleString()} credits, but you have ${(creditDoc.balance || 0).toLocaleString()}.`,
				},
				{ status: 400 }
			);
		}

		const nowMs = Date.now();
		const currentBoostUntil = bot.boostedUntil ? new Date(bot.boostedUntil).getTime() : 0;
		const currentPromotedUntil = bot.promotedUntil ? new Date(bot.promotedUntil).getTime() : 0;
		const baseTime = Math.max(nowMs, currentBoostUntil, currentPromotedUntil);
		const nextUntil = new Date(baseTime + tier.durationMs);

		bot.boostedUntil = nextUntil;
		bot.promotedUntil = nextUntil;
		bot.boostedBy = userId;
		await bot.save();

		const txEntry = {
			id: `tx_boost_bot_${crypto.randomBytes(6).toString('hex')}`,
			type: 'spend',
			amount: tier.cost,
			itemId: `boost_bot_${durationKey}`,
			itemName: `Spotlight Boost (${tier.label}) — ${bot.name || bot.id}`,
			createdAt: new Date(),
		};

		const updatedCredit = await Credit.findOneAndUpdate(
			{ ownerId: userId },
			{
				$inc: { balance: -tier.cost, totalSpent: tier.cost },
				$push: { transactions: { $each: [txEntry], $slice: -100 } },
			},
			{ new: true }
		).lean();

		return NextResponse.json({
			success: true,
			boostedUntil: nextUntil.toISOString(),
			promotedUntil: nextUntil.toISOString(),
			boostedBy: userId,
			balance: updatedCredit?.balance ?? 0,
		});
	} catch (err: any) {
		console.error('Bot Spotlight boost error:', err);
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
