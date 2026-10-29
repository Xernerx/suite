/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { dispatchBotWebhook } from '@/lib/webhookDispatcher';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const rawId = (await params).id;

		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;
		const botDoc = await BotModel.findOne({ $or: [{ id: rawId }, { vanitySlug: rawId.toLowerCase() }] })
			.select('id')
			.lean();
		const id = botDoc?.id || rawId;
		const ReviewModel = (db.models.bots as any).Review;

		const reviews = await ReviewModel.find({ botId: id }).sort({ createdAt: -1 }).lean();

		const userIds = [...new Set(reviews.map((r: any) => r.userId))] as string[];
		const userProfiles = await Promise.all(
			userIds.map(async (uid: string) => {
				try {
					const res = await fetch(`https://discord.com/api/v10/users/${uid}`, {
						headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
						next: { revalidate: 3600 },
					});
					if (res.ok) return await res.json();
				} catch (e) {
					console.error(`Failed to fetch discord user ${uid}`, e);
				}
				return { id: uid };
			})
		);
		const profileMap = new Map(userProfiles.map((p: any) => [p.id, p]));

		const populatedReviews = reviews.map((r: any) => ({
			...r,
			user: profileMap.get(r.userId) || null,
		}));

		return NextResponse.json(populatedReviews, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch reviews:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const rawId = (await params).id;
		const userId = session.user.id;

		const body = await request.json();
		const { rating, content } = body;

		if (!rating || rating < 1 || rating > 5) {
			return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
		}

		if (content && content.length > 2000) {
			return NextResponse.json({ error: 'Content too long' }, { status: 400 });
		}

		const db = await database('xernerx');
		const BotLookupModel = (db.models.bots as any).Bot;
		const resolvedBot = await BotLookupModel.findOne({ $or: [{ id: rawId }, { vanitySlug: rawId.toLowerCase() }] })
			.select('id')
			.lean();
		const id = resolvedBot?.id || rawId;
		const ReviewModel = (db.models.bots as any).Review;

		const existingReview = await ReviewModel.findOne({ botId: id, userId }).lean();
		const eventType = existingReview ? 'PATCH review' : 'POST review';

		await ReviewModel.updateOne({ botId: id, userId }, { rating, content }, { upsert: true });

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
				if (!hook.url || !hook.events?.includes(eventType)) continue;
				try {
					const authorName = session?.user?.name || session?.user?.global_name || 'A user';
					const authorIcon = session?.user?.image || undefined;
					const nowIso = new Date().toISOString();

					await dispatchBotWebhook({
						botId: id,
						url: hook.url,
						event: eventType,
						secret: hook.secret,
						payload: {
							event: eventType,
							botId: id,
							timestamp: nowIso,
							data: {
								userId,
								username: authorName,
								avatar: authorIcon || null,
								reviewed: true,
								rating,
								content: content || '',
							},
							username: 'Xernerx App',
							avatar_url: 'https://xernerx.com/logo.png',
							embeds: [
								{
									author: {
										name: authorName,
										icon_url: authorIcon,
									},
									title: eventType === 'POST review' ? 'New Review!' : 'Review Updated!',
									url: `https://xernerx.com/bots/${id}`,
									description: content || '*No text provided.*',
									fields: [
										{
											name: 'Rating',
											value: `**${rating}** ${'⭐'.repeat(rating)}`,
											inline: true,
										},
									],
									color: 0xff00a0,
									footer: {
										text: finalBotName,
										icon_url: finalBotAvatar,
									},
									timestamp: nowIso,
								},
							],
						},
					});
				} catch (e) {
					console.error('Failed to trigger bot webhook for review', e);
				}
			}
		}

		return NextResponse.json({ success: true, message: 'Review saved successfully' }, { status: 201 });
	} catch (error) {
		console.error('Failed to save review:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const rawId = (await params).id;
		const userId = session.user.id;

		const db = await database('xernerx');
		const BotLookupModel = (db.models.bots as any).Bot;
		const resolvedBot = await BotLookupModel.findOne({ $or: [{ id: rawId }, { vanitySlug: rawId.toLowerCase() }] })
			.select('id')
			.lean();
		const id = resolvedBot?.id || rawId;
		const ReviewModel = (db.models.bots as any).Review;

		await ReviewModel.deleteOne({ botId: id, userId });

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
				if (!hook.url || !hook.events?.includes('DELETE review')) continue;
				try {
					const authorName = session?.user?.name || session?.user?.global_name || 'A user';
					const authorIcon = session?.user?.image || undefined;
					const nowIso = new Date().toISOString();

					await dispatchBotWebhook({
						botId: id,
						url: hook.url,
						event: 'DELETE review',
						secret: hook.secret,
						payload: {
							event: 'DELETE review',
							botId: id,
							timestamp: nowIso,
							data: {
								userId,
								username: authorName,
								avatar: authorIcon || null,
								reviewed: false,
								rating: null,
								content: null,
							},
							username: 'Xernerx App',
							avatar_url: 'https://xernerx.com/logo.png',
							embeds: [
								{
									author: {
										name: authorName,
										icon_url: authorIcon,
									},
									title: 'Review Deleted',
									url: `https://xernerx.com/bots/${id}`,
									description: `This user deleted their review.`,
									color: 0xff0000,
									footer: {
										text: finalBotName,
										icon_url: finalBotAvatar,
									},
									timestamp: nowIso,
								},
							],
						},
					});
				} catch (e) {
					console.error('Failed to trigger bot webhook for review deletion', e);
				}
			}
		}

		return NextResponse.json({ success: true, message: 'Review deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete review:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
