/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	if (!id) {
		return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
	}

	let authHeader = req.headers.get('authorization');

	try {
		const { models } = await database('xernerx');

		if (!authHeader || authHeader === 'Bearer undefined' || authHeader === 'Bearer null') {
			const user = (await models.users?.User?.findOne({ id })
				.lean()
				.catch(() => null)) as any;
			const fallbackToken = user?.accounts?.discord?.access_token || user?.token;
			if (fallbackToken) {
				authHeader = `Bearer ${fallbackToken}`;
			}
		}

		let rawGuilds: any[] = [];

		if (authHeader) {
			const res = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
				headers: {
					Authorization: authHeader,
				},
				next: { revalidate: 60 },
			}).catch(() => null);

			if (res && res.ok) {
				const data = await res.json().catch(() => []);
				if (Array.isArray(data)) {
					rawGuilds = data;
				}
			}
		}

		// Also verify membership in the main official server (admin_server_id) via Bot token
		// so SupportProvider & membership checks are always 100% accurate even if user OAuth is rate-limited/expired
		const botTokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];
		const adminSetting = (await models.core?.Setting?.findOne({ id: 'admin_server_id' })
			.lean()
			.catch(() => null)) as any;
		const adminServerId = String(adminSetting?.value || '687429190165069838').trim();

		if (botTokens.length > 0 && adminServerId && !rawGuilds.some((g: any) => String(g.id) === adminServerId)) {
			for (const botToken of botTokens) {
				const memRes = await fetch(`https://discord.com/api/v10/guilds/${adminServerId}/members/${id}`, {
					headers: {
						Authorization: `Bot ${botToken}`,
					},
					cache: 'no-store',
				}).catch(() => null);

				if (memRes && memRes.ok) {
					const dbGuild = (await models.guilds?.Guild?.findOne({ id: adminServerId })
						.lean()
						.catch(() => null)) as any;
					rawGuilds.push({
						id: adminServerId,
						name: dbGuild?.name || 'Xernerx Studios',
						icon: null,
						banner: null,
						iconUrl: dbGuild?.iconUrl || null,
						bannerUrl: dbGuild?.bannerUrl || null,
					});
					break;
				}
			}
		}

		const mappedGuilds = rawGuilds.map((guild: any) => ({
			...guild,
			iconUrl: guild.iconUrl ?? (guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${String(guild.icon).startsWith('a_') ? 'gif' : 'png'}?size=1024` : null),
			bannerUrl: guild.bannerUrl ?? (guild.banner ? `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.${String(guild.banner).startsWith('a_') ? 'gif' : 'png'}?size=2048` : null),
		}));

		return NextResponse.json(mappedGuilds, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch Discord user guilds:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
