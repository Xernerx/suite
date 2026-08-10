/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';

const COOLDOWN_HOURS = 12;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const id = (await params).id;
		const userId = session.user.id;

		const db = await database('xernerx');
		const VoteModel = db.models.stats.votes;

		// Find the most recent vote by this user for this bot
		const lastVote = await VoteModel.findOne({ botId: id, userId }).sort({ createdAt: -1 });

		if (!lastVote) {
			return NextResponse.json({ canVote: true, nextVoteAt: null }, { status: 200 });
		}

		const nextVoteAt = new Date(lastVote.createdAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
		const canVote = new Date() >= nextVoteAt;

		return NextResponse.json({ canVote, nextVoteAt: nextVoteAt.toISOString() }, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch vote status:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const id = (await params).id;
		const userId = session.user.id;

		const db = await database('xernerx');
		const VoteModel = db.models.stats.votes;
		const BotModel = db.models.profiles.bots;
		const UserModel = db.models.profiles.users;

		// 1. Check cooldown
		const lastVote = await VoteModel.findOne({ botId: id, userId }).sort({ createdAt: -1 });

		if (lastVote) {
			const nextVoteAt = new Date(lastVote.createdAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
			if (new Date() < nextVoteAt) {
				return NextResponse.json({ error: 'Cooldown active', nextVoteAt: nextVoteAt.toISOString() }, { status: 429 });
			}
		}

		// 2. Log the vote
		await VoteModel.create({
			botId: id,
			userId,
		});

		// 3. Increment the cache on the Bot Profile
		await BotModel.updateOne({ id }, { $inc: { voteCount: 1 } });

		// 4. Reward the user with 100 credits
		await UserModel.updateOne({ id: userId }, { $inc: { 'credits.balance': 100 } });

		return NextResponse.json({ success: true, message: 'Vote cast successfully and 100 credits awarded' }, { status: 201 });
	} catch (error) {
		console.error('Failed to cast vote:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
