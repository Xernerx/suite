/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { renderWidgetHtml, renderWidgetPng, renderWidgetSvg, resolveAppBaseUrl } from '@/lib/widgetRenderer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const url = new URL(req.url);
		const format = (url.searchParams.get('type') || url.searchParams.get('format') || '').toLowerCase();
		const accept = req.headers.get('accept') || '';
		const fetchDest = req.headers.get('sec-fetch-dest') || '';
		const userAgent = (req.headers.get('user-agent') || '').toLowerCase();
		const isChatBotUnfurl = userAgent.includes('discordbot') || userAgent.includes('twitterbot') || userAgent.includes('slackbot');

		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;
		const StatModel = (db.models.bots as any).Stat;
		const VoteModel = (db.models.bots as any).Vote;

		const bot = await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		const isExternalWidget = format === 'svg' || format === 'iframe' || format === 'html' || fetchDest === 'iframe';
		if (!bot || bot.privacy === 'private' || (isExternalWidget && !bot.widgets)) {
			return NextResponse.json({ error: 'Bot profile not found or private' }, { status: 404 });
		}

		const resolvedId = String(bot.id);
		const [latestStat, voteCount] = await Promise.all([StatModel.findOne({ id: resolvedId }).sort({ timestamp: -1 }).lean(), VoteModel.countDocuments({ botId: resolvedId })]);

		let discordName: string | undefined;
		let avatarUrl: string | null = bot.avatar && bot.avatar.startsWith('http') ? bot.avatar : null;
		let bannerUrl: string | null = null;

		const tokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];
		for (const token of tokens) {
			try {
				const discordRes = await fetch(`https://discord.com/api/v10/users/${resolvedId}`, {
					headers: { Authorization: `Bot ${token}` },
					next: { revalidate: 3600 },
				});
				if (discordRes.ok) {
					const discordUser = await discordRes.json();
					discordName = discordUser.global_name || discordUser.username;
					if (discordUser.avatar) {
						const ext = discordUser.avatar.startsWith('a_') ? 'gif' : 'png';
						avatarUrl = `https://cdn.discordapp.com/avatars/${resolvedId}/${discordUser.avatar}.${ext}?size=512`;
					}
					if (discordUser.banner) {
						const ext = discordUser.banner.startsWith('a_') ? 'gif' : 'png';
						bannerUrl = `https://cdn.discordapp.com/banners/${resolvedId}/${discordUser.banner}.${ext}?size=1024`;
					}
					break;
				}
			} catch {
				// Ignore Discord API error and fall back to database fields
			}
		}

		if (!avatarUrl && bot.avatar && !bot.avatar.startsWith('http')) {
			const ext = bot.avatar.startsWith('a_') ? 'gif' : 'png';
			avatarUrl = `https://cdn.discordapp.com/avatars/${resolvedId}/${bot.avatar}.${ext}?size=512`;
		}

		const payload = {
			id: bot.id,
			name: discordName || bot.name || 'Unknown Bot',
			description: bot.description || '',
			info: bot.info || '',
			avatarUrl,
			bannerUrl,
			verified: Boolean(bot.verified),
			widgets: Boolean(bot.widgets),
			guildCount: latestStat?.guildCount ?? 0,
			userCount: latestStat?.userCount ?? 0,
			voteCount: voteCount ?? bot.voteCount ?? 0,
		};

		const widgetOpts = {
			type: 'bot' as const,
			name: payload.name,
			description: payload.description || payload.info,
			avatarUrl: payload.avatarUrl,
			bannerUrl: payload.bannerUrl,
			verified: payload.verified,
			profileUrl: `${resolveAppBaseUrl(req.url)}/bots/${payload.id}`,
			theme: (url.searchParams.get('theme') === 'light' ? 'light' : 'dark') as 'dark' | 'light',
			stats: [
				{ label: 'Servers', value: payload.guildCount },
				{ label: 'Users', value: payload.userCount },
				{ label: 'Votes', value: payload.voteCount },
			],
		};

		if (format === 'iframe' || format === 'html' || fetchDest === 'iframe') {
			return new Response(renderWidgetHtml(widgetOpts), {
				status: 200,
				headers: {
					'Content-Type': 'text/html; charset=utf-8',
					'Cache-Control': 'no-cache, no-store, must-revalidate',
				},
			});
		}

		if (format === 'png' || format === 'image' || (isChatBotUnfurl && format !== 'json')) {
			return await renderWidgetPng(widgetOpts);
		}

		if (format === 'svg' || (format !== 'json' && accept.includes('image/') && !accept.includes('text/html'))) {
			const svg = await renderWidgetSvg(widgetOpts);
			return new Response(svg, {
				status: 200,
				headers: {
					'Content-Type': 'image/svg+xml; charset=utf-8',
					'Cache-Control': 'no-cache, no-store, must-revalidate',
				},
			});
		}

		return NextResponse.json(payload, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch public bot embed info:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
