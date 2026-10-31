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
		const OrganizationModel = (db.models.organizations as any).Organization;
		const BotModel = (db.models.bots as any).Bot;
		const GuildModel = (db.models.guilds as any).Guild;

		const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
		const query = isObjectId ? { $or: [{ _id: id }, { vanitySlug: id.toLowerCase() }] } : { vanitySlug: id.toLowerCase() };
		const organization = await OrganizationModel.findOne(query).lean();
		const privacy = organization?.config?.privacy || organization?.privacy;
		const isExternalWidget = format === 'svg' || format === 'iframe' || format === 'html' || fetchDest === 'iframe';

		if (!organization || privacy === 'private' || (isExternalWidget && !organization.widgets)) {
			return NextResponse.json({ error: 'Organization profile not found or private' }, { status: 404 });
		}

		const orgId = String(organization._id);
		const [botCount, serverCount] = await Promise.all([
			BotModel.countDocuments({ organization: orgId, privacy: { $ne: 'private' } }),
			GuildModel.countDocuments({ organization: orgId, privacy: { $ne: 'private' } }),
		]);

		const memberCount = new Set([organization.owner, ...(organization.members || [])].filter(Boolean)).size;

		const payload = {
			id: String(organization._id),
			name: organization.name || 'Unknown Organization',
			description: organization.description || '',
			info: organization.info || '',
			iconUrl: organization.iconUrl || organization.icon || null,
			bannerUrl: organization.bannerUrl || null,
			verified: Boolean(organization.verified),
			widgets: Boolean(organization.widgets),
			memberCount,
			botCount,
			serverCount,
		};

		const widgetOpts = {
			type: 'organization' as const,
			name: payload.name,
			description: payload.description || payload.info,
			avatarUrl: payload.iconUrl,
			bannerUrl: payload.bannerUrl,
			verified: payload.verified,
			profileUrl: `${resolveAppBaseUrl(req.url)}/organization/${payload.id}`,
			theme: (url.searchParams.get('theme') === 'light' ? 'light' : 'dark') as 'dark' | 'light',
			stats: [
				{ label: 'Members', value: payload.memberCount },
				{ label: 'Bots', value: payload.botCount },
				{ label: 'Servers', value: payload.serverCount },
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
		console.error('Failed to fetch public organization embed info:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
