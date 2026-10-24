/** @format */

import { NextResponse } from 'next/server';
import { database, sendWebhook } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; reviewId: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, reviewId } = await params;
		const userId = session.user.id;

		const body = await request.json();
		const { action, devResponse, reply } = body;

		const db = await database('xernerx');
		const ReviewModel = (db.models.bots as any).Review;
		const BotProfileModel = (db.models.bots as any).Bot;

		const review = await ReviewModel.findById(reviewId);
		if (!review) {
			return NextResponse.json({ error: 'Review not found' }, { status: 404 });
		}

		let actualAction = '';

		// Handle Dev Response
		if (action === 'devResponse' || action === 'reply') {
			const bot = await BotProfileModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
			if (!bot || (!bot.owners?.includes(userId) && bot.owners?.[0] !== userId)) {
				return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
			}

			const responseText = typeof devResponse === 'string' ? devResponse : typeof reply === 'string' ? reply : reply?.content || '';
			if (responseText.length > 2000) {
				return NextResponse.json({ error: 'Response too long' }, { status: 400 });
			}

			review.devResponse = responseText;
			review.reply = {
				authorId: userId,
				content: responseText,
				updatedAt: new Date(),
			};
			actualAction = 'devResponse';
		}
		// Handle Voting
		else if (action === 'upvote' || action === 'helpful') {
			review.downvotes = (review.downvotes || []).filter((uid: string) => uid !== userId);
			if ((review.upvotes || []).includes(userId)) {
				review.upvotes = review.upvotes.filter((uid: string) => uid !== userId);
				actualAction = 'removed their upvote from';
			} else {
				review.upvotes = [...(review.upvotes || []), userId];
				actualAction = 'upvoted';
			}
			review.helpfulUserIds = [...review.upvotes];
		} else if (action === 'downvote') {
			review.upvotes = (review.upvotes || []).filter((uid: string) => uid !== userId);
			review.helpfulUserIds = [...review.upvotes];
			if ((review.downvotes || []).includes(userId)) {
				review.downvotes = review.downvotes.filter((uid: string) => uid !== userId);
				actualAction = 'removed their downvote from';
			} else {
				review.downvotes = [...(review.downvotes || []), userId];
				actualAction = 'downvoted';
			}
		} else {
			return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
		}

		await review.save();

		const HookModel = (db.models.bots as any).Hook;
		const hooks = await HookModel.find({ botId: review.botId || id }).lean();

		if (hooks?.length) {
			const botId = review.botId || id;
			let discordBot: any = null;
			try {
				const res = await fetch(`https://discord.com/api/v10/users/${botId}`, {
					headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
					next: { revalidate: 3600 },
				});
				if (res.ok) discordBot = await res.json();
			} catch (e) {}

			const botDoc = await BotProfileModel.findOne({ id: botId }).select('name avatar').lean();
			const finalBotName = discordBot?.global_name || discordBot?.username || botDoc?.name || 'Unknown Bot';
			const finalBotAvatar = discordBot?.avatar
				? `https://cdn.discordapp.com/avatars/${botId}/${discordBot.avatar}.png`
				: botDoc?.avatar
					? `https://cdn.discordapp.com/avatars/${botId}/${botDoc.avatar}.png`
					: undefined;

			const isDevReply = action === 'devResponse' || action === 'reply';
			const eventType = isDevReply ? 'PATCH review' : 'VOTE review';

			for (const hook of hooks) {
				if (!hook.url || !hook.events?.includes(eventType)) continue;
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
								title: isDevReply ? 'Developer responded to a review!' : 'Review Voted!',
								url: `https://xernerx.com/bots/${botId}`,
								description: isDevReply
									? `A developer just responded to a review on your bot.\n\n${review.devResponse || '*No text provided.*'}`
									: `A user just ${actualAction} a review on your bot!`,
								color: 0x00a0ff,
								footer: {
									text: finalBotName,
									icon_url: finalBotAvatar,
								},
								timestamp: new Date().toISOString(),
							},
						],
					});
				} catch (e) {
					console.error('Failed to trigger bot webhook for review interaction', e);
				}
			}
		}

		if (action === 'devResponse' || action === 'reply') {
			return NextResponse.json({ success: true, message: 'Dev response updated', review }, { status: 200 });
		}

		return NextResponse.json({ success: true, review }, { status: 200 });
	} catch (error) {
		console.error('Failed to update review:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
