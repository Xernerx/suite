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
		const BotModel = (db.models.bots as any).Bot;

		const bot = await BotModel.findOne({ id }).select('votes').lean();
		const userVotes = bot?.votes?.filter((v: any) => v.userId === userId) || [];
		const lastVote = userVotes.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

		if (!lastVote) {
			return NextResponse.json({ canVote: true, nextVoteAt: null }, { status: 200 });
		}

		const nextVoteAt = new Date(new Date(lastVote.timestamp).getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
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
		const BotModel = (db.models.bots as any).Bot;
		const StatModel = (db.models.bots as any).Stat;
		const UserModel = (db.models.users as any).User;

		// 1. Check cooldown
		const bot = await BotModel.findOne({ id }).select('votes').lean();
		const userVotes = bot?.votes?.filter((v: any) => v.userId === userId) || [];
		const lastVote = userVotes.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

		if (lastVote) {
			const nextVoteAt = new Date(new Date(lastVote.timestamp).getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
			if (new Date() < nextVoteAt) {
				return NextResponse.json({ error: 'Cooldown active', nextVoteAt: nextVoteAt.toISOString() }, { status: 429 });
			}
		}

		// 2 & 3. Log the vote and increment cache
		await BotModel.updateOne(
			{ id },
			{
				$push: { votes: { userId, timestamp: new Date() } },
				$inc: { voteCount: 1 }
			}
		);

		// 4. Reward the user with 100 credits
		await UserModel.updateOne({ id: userId }, { $inc: { 'billing.credits.balance': 100 } });

		return NextResponse.json({ success: true, message: 'Vote cast successfully and 100 credits awarded' }, { status: 201 });
	} catch (error) {
		console.error('Failed to cast vote:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
