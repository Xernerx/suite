/** @format */

import { NextResponse } from 'next/server';
import { database, sendWebhook } from '@xernerx/lib/server';
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
		const VoteModel = (db.models.bots as any).Vote;

		const lastVote = await VoteModel.findOne({ botId: id, userId }).sort({ createdAt: -1 }).lean();

		if (!lastVote) {
			return NextResponse.json({ canVote: true, nextVoteAt: null }, { status: 200 });
		}

		const nextVoteAt = new Date(new Date(lastVote.createdAt).getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
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
		const VoteModel = (db.models.bots as any).Vote;

		// 1. Check cooldown
		const lastVote = await VoteModel.findOne({ botId: id, userId }).sort({ createdAt: -1 }).lean();

		if (lastVote) {
			const nextVoteAt = new Date(new Date(lastVote.createdAt).getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
			if (new Date() < nextVoteAt) {
				return NextResponse.json({ error: 'Cooldown active', nextVoteAt: nextVoteAt.toISOString() }, { status: 429 });
			}
		}

		// 2. Log the vote in the distinct collection
		await VoteModel.create({ botId: id, userId });

		// 2.5 Immediately push a new stat to the historical log so the graph updates instantly
		const totalVotes = await VoteModel.countDocuments({ botId: id });
		const StatModel = (db.models.bots as any).Stat;
		const latestStat = await StatModel.findOne({ id }).sort({ timestamp: -1 }).lean();

		await StatModel.create({
			id,
			guildCount: latestStat?.guildCount ?? 0,
			shardCount: latestStat?.shardCount ?? 0,
			userCount: latestStat?.userCount ?? 0,
			voteCount: totalVotes,
			timestamp: new Date(),
		});

		// 3. Reward the user with 100 credits
		const CreditModel = (db.models.users as any).Credit;
		await CreditModel.updateOne({ ownerId: userId }, { $inc: { balance: 100 } }, { upsert: true });

		// 4. Trigger bot webhooks
		const BotModel = (db.models.bots as any).Bot;
		const HookModel = (db.models.bots as any).Hook;
		const hooks = await HookModel.find({ botId: id }).lean();

		if (hooks?.length) {
			let discordBot: any = null;
			try {
				const res = await fetch(`https://discord.com/api/v10/users/${id}`, {
					headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
					next: { revalidate: 3600 },
				});
				if (res.ok) discordBot = await res.json();
			} catch (e) {}

			const bot = await BotModel.findOne({ id }).select('name avatar').lean();
			const finalBotName = discordBot?.global_name || discordBot?.username || bot?.name || 'Unknown Bot';
			const finalBotAvatar = discordBot?.avatar
				? `https://cdn.discordapp.com/avatars/${id}/${discordBot.avatar}.png`
				: bot?.avatar
					? `https://cdn.discordapp.com/avatars/${id}/${bot.avatar}.png`
					: undefined;

			for (const hook of hooks) {
				if (!hook.url || !hook.events?.includes('POST vote')) continue;
				try {
					const authorName = session?.user?.name || session?.user?.global_name || 'A user';
					const authorIcon = session?.user?.image || undefined;

					await sendWebhook({
						url: hook.url,
						embeds: [
							{
								author: {
									name: authorName,
									icon_url: authorIcon,
								},
								title: 'New Vote!',
								url: `https://xernerx.com/bots/${id}`,
								description: `This user just voted for your bot! Your bot now has **${totalVotes}** votes.`,
								color: 0xff00a0,
								footer: {
									text: finalBotName,
									icon_url: finalBotAvatar,
								},
								timestamp: new Date().toISOString(),
							},
						],
					});
				} catch (e) {
					console.error('Failed to trigger bot webhook for vote', e);
				}
			}
		}

		return NextResponse.json({ success: true, message: 'Vote cast successfully and 100 credits awarded' }, { status: 201 });
	} catch (error) {
		console.error('Failed to cast vote:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
