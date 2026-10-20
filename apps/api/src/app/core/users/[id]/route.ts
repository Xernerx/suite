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
		const UserModel = (db.models.users as any).User;
		const CreditModel = (db.models.users as any).Credit;
		const BotModel = (db.models.bots as any).Bot;
		const OrganizationModel = (db.models.organizations as any).Organization;

		const user = await UserModel.findOne({ id }).lean();
		const isExternalWidget = format === 'svg' || format === 'iframe' || format === 'html' || fetchDest === 'iframe';
		if (user?.privacy === 'private' || (isExternalWidget && !user?.widgets)) {
			return NextResponse.json({ error: 'User profile is private or widgets are disabled' }, { status: 404 });
		}

		let discordUser: any = null;
		if (process.env.DISCORD_CLIENT_TOKEN) {
			try {
				const discordRes = await fetch(`https://discord.com/api/v10/users/${id}`, {
					headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
					next: { revalidate: 3600 },
				});
				if (discordRes.ok) {
					discordUser = await discordRes.json();
				}
			} catch {
				// Ignore Discord API error and fall back to database fields
			}
		}

		if (!user && !discordUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const [creditDoc, botCount, orgCount] = await Promise.all([
			CreditModel.findOne({ ownerId: id })
				.select('streak')
				.lean()
				.catch(() => null),
			BotModel.countDocuments({ owners: id, privacy: 'public' }).catch(() => 0),
			OrganizationModel.countDocuments({
				$or: [{ owner: id }, { members: id }],
				$and: [{ $or: [{ 'config.privacy': 'public' }, { privacy: 'public' }] }],
			}).catch(() => 0),
		]);

		let avatarUrl: string | null = user?.icon && user.icon.startsWith('http') ? user.icon : null;
		let bannerUrl: string | null = null;

		if (discordUser?.avatar) {
			const ext = discordUser.avatar.startsWith('a_') ? 'gif' : 'png';
			avatarUrl = avatarUrl || `https://cdn.discordapp.com/avatars/${id}/${discordUser.avatar}.${ext}?size=512`;
		}
		if (discordUser?.banner) {
			const ext = discordUser.banner.startsWith('a_') ? 'gif' : 'png';
			bannerUrl = `https://cdn.discordapp.com/banners/${id}/${discordUser.banner}.${ext}?size=1024`;
		}

		const displayName = user?.name || discordUser?.global_name || discordUser?.username || 'Xernerx User';
		const username = discordUser?.username || null;
		const handle = username && username !== displayName ? `@${username}` : null;

		const payload = {
			id,
			name: displayName,
			username,
			handle,
			description: user?.description || user?.info || '',
			pronouns: user?.pronouns || null,
			avatarUrl,
			bannerUrl,
			verified: Boolean(user?.verified),
			streak: (creditDoc as any)?.streak || 0,
			botCount: botCount || 0,
			orgCount: orgCount || 0,
		};

		const widgetOpts = {
			type: 'user' as const,
			name: payload.name,
			handle: payload.handle,
			description: payload.description || `Explore ${payload.name}'s profile, bots, and communities on Xernerx Studios.`,
			avatarUrl: payload.avatarUrl,
			bannerUrl: payload.bannerUrl,
			verified: payload.verified,
			profileUrl: `${resolveAppBaseUrl(req.url)}/users/${payload.id}`,
			stats: [
				{ label: 'Day Streak', value: payload.streak },
				{ label: 'Public Bots', value: payload.botCount },
				{ label: 'Organizations', value: payload.orgCount },
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

		if (format === 'png' || format === 'og' || format === 'image' || (isChatBotUnfurl && format !== 'json')) {
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
		console.error('Failed to fetch public user embed info:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
