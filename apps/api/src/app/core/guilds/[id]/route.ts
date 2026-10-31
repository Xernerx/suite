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
		const GuildModel = (db.models.guilds as any).Guild;
		const StatModel = (db.models.guilds as any).Stat;
		const VoteModel = (db.models.guilds as any).Vote;

		const guild = await GuildModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		const isExternalWidget = format === 'svg' || format === 'iframe' || format === 'html' || fetchDest === 'iframe';
		if (!guild || guild.privacy === 'private' || (isExternalWidget && !guild.widgets)) {
			return NextResponse.json({ error: 'Guild profile not found or private' }, { status: 404 });
		}

		const resolvedId = String(guild.id);
		const [latestStat, voteCount] = await Promise.all([StatModel.findOne({ id: resolvedId }).sort({ timestamp: -1 }).lean(), VoteModel.countDocuments({ guildId: resolvedId })]);

		const iconUrl = guild.icon
			? guild.icon.startsWith('http')
				? guild.icon
				: `https://cdn.discordapp.com/icons/${resolvedId}/${guild.icon}.${guild.icon.startsWith('a_') ? 'gif' : 'png'}?size=512`
			: null;

		const bannerUrl = guild.banner
			? guild.banner.startsWith('http')
				? guild.banner
				: `https://cdn.discordapp.com/banners/${resolvedId}/${guild.banner}.${guild.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024`
			: null;

		const payload = {
			id: guild.id,
			name: guild.name || 'Unknown Server',
			description: guild.description || '',
			info: guild.info || '',
			iconUrl,
			bannerUrl,
			verified: Boolean(guild.verified),
			widgets: Boolean(guild.widgets),
			memberCount: latestStat?.members ?? guild.memberCount ?? 0,
			messageCount: latestStat?.messages ?? guild.messages ?? 0,
			voteCount: voteCount ?? guild.voteCount ?? 0,
		};

		const widgetOpts = {
			type: 'guild' as const,
			name: payload.name,
			description: payload.description || payload.info,
			avatarUrl: payload.iconUrl,
			bannerUrl: payload.bannerUrl,
			verified: payload.verified,
			profileUrl: `${resolveAppBaseUrl(req.url)}/servers/${payload.id}`,
			theme: (url.searchParams.get('theme') === 'light' ? 'light' : 'dark') as 'dark' | 'light',
			stats: [
				{ label: 'Members', value: payload.memberCount },
				{ label: 'Messages', value: payload.messageCount },
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
		console.error('Failed to fetch public guild embed info:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
