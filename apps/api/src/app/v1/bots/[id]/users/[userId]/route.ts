/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

const COOLDOWN_HOURS = 12;

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
	const resolvedParams = await params;
	const rawId = String(resolvedParams?.id || '').trim();
	const userId = String(resolvedParams?.userId || '').trim();

	if (!rawId || !userId) {
		return NextResponse.json({ error: 'Both bot id and userId are required.' }, { status: 400, headers: corsHeaders });
	}

	try {
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;
		const VoteModel = (db.models.bots as any).Vote;
		const ReviewModel = (db.models.bots as any).Review;
		const CreditModel = (db.models.users as any).Credit;

		const botDoc = await BotModel.findOne({
			$or: [{ id: rawId }, { vanitySlug: rawId.toLowerCase() }],
		})
			.select('id vanitySlug')
			.lean();

		const botId = String(botDoc?.id || rawId);
		const vanitySlug = botDoc?.vanitySlug ? String(botDoc.vanitySlug).toLowerCase() : null;

		const [lastVote, review, creditDoc] = await Promise.all([
			VoteModel ? VoteModel.findOne({ botId, userId }).sort({ createdAt: -1 }).lean() : null,
			ReviewModel ? ReviewModel.findOne({ botId, userId }).select('rating').lean() : null,
			CreditModel ? CreditModel.findOne({ ownerId: userId }).select('transactions').lean() : null,
		]);

		let voted = false;
		let lastVotedAt: string | null = null;
		let nextVoteAt: string | null = null;

		if (lastVote?.createdAt) {
			const votedDate = new Date(lastVote.createdAt);
			const nextDate = new Date(votedDate.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
			lastVotedAt = votedDate.toISOString();
			nextVoteAt = nextDate.toISOString();
			voted = new Date() < nextDate;
		}

		const reviewed = Boolean(review);
		const rating = typeof review?.rating === 'number' ? review.rating : null;

		const validBotTipItemIds = new Set<string>([`tip_bot_${botId}`, `tip_bot_${rawId}`]);
		if (vanitySlug) {
			validBotTipItemIds.add(`tip_bot_${vanitySlug}`);
		}

		const transactions = Array.isArray(creditDoc?.transactions) ? creditDoc.transactions : [];
		const tipped = transactions
			.filter((tx: any) => (tx?.type === 'tip_sent' || tx?.type === 'tip_out') && typeof tx?.itemId === 'string' && validBotTipItemIds.has(tx.itemId))
			.reduce((sum: number, tx: any) => sum + Math.abs(Number(tx?.amount) || 0), 0);

		return NextResponse.json(
			{
				botId,
				userId,
				voted,
				lastVotedAt,
				nextVoteAt,
				reviewed,
				rating,
				tipped,
			},
			{ status: 200, headers: corsHeaders }
		);
	} catch (error) {
		console.error('Failed to fetch user bot engagement status:', error);
		return NextResponse.json(
			{
				botId: rawId,
				userId,
				voted: false,
				lastVotedAt: null,
				nextVoteAt: null,
				reviewed: false,
				rating: null,
				tipped: 0,
			},
			{ status: 200, headers: corsHeaders }
		);
	}
}
