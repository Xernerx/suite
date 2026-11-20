/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { renderWidgetHtml, renderWidgetPng, renderWidgetSvg, resolveAppBaseUrl } from '@/lib/widgetRenderer';
import { applyLiveDiscordToBot, buildDiscordAvatarUrl, fetchLiveDiscordUser, isDiscordManagedMediaValue } from '@/lib/botDiscordSync';

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

		const officialSlugMap: Record<string, string> = {
			virtue: '1484880634844287138',
			yourapps: '619328560141697036',
			todo: '782105629572464652',
			'to-do-list': '782105629572464652',
			'to-do-list-bot': '782105629572464652',
			todolistbot: '782105629572464652',
			tdl: '782105629572464652',
			metamorphosis: '881678826906730547',
			zodiac: '950251264095162418',
		};
		const mappedOfficialId = officialSlugMap[id.toLowerCase()];

		const bot = await BotModel.findOne({
			$or: [{ id }, { vanitySlug: id.toLowerCase() }, ...(mappedOfficialId ? [{ id: mappedOfficialId }] : [])],
		}).lean();
		const isExternalWidget = format === 'svg' || format === 'iframe' || format === 'html' || fetchDest === 'iframe';
		if (!bot || bot.privacy === 'private' || (isExternalWidget && !bot.widgets)) {
			return NextResponse.json({ error: 'Bot profile not found or private' }, { status: 404 });
		}

		const resolvedId = String(bot.id);
		const [latestStat, voteCount, discordUser] = await Promise.all([
			StatModel.findOne({ id: resolvedId }).sort({ timestamp: -1 }).lean(),
			VoteModel.countDocuments({ botId: resolvedId }),
			fetchLiveDiscordUser(resolvedId),
		]);

		let discordName: string | undefined;
		let avatarUrl: string | null = !isDiscordManagedMediaValue(bot.avatar) ? String(bot.avatar) : null;
		let bannerUrl: string | null = !isDiscordManagedMediaValue(bot.banner) ? String(bot.banner) : null;

		if (discordUser) {
			discordName = discordUser.global_name || discordUser.username;
			const synced = applyLiveDiscordToBot(bot, resolvedId, discordUser, BotModel, 512);
			avatarUrl = synced.avatarUrl;
			bannerUrl = synced.bannerUrl;
		} else {
			const dc = bot.discordCache;
			discordName = dc?.globalName || dc?.username;
			avatarUrl = avatarUrl || dc?.avatarUrl || buildDiscordAvatarUrl(resolvedId, dc?.avatar || bot.avatar, 512);
			bannerUrl = bannerUrl || dc?.bannerUrl || null;
		}

		const payload = {
			id: bot.id,
			vanitySlug: bot.vanitySlug || null,
			name: discordName || bot.name || 'Unknown Bot',
			description: bot.description || '',
			info: bot.info || '',
			tags: Array.isArray(bot.tags) ? bot.tags : [],
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
