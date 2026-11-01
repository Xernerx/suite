/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

const discordUserCache = new Map<string, { payload: any; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const tokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];

	if (!id || tokens.length === 0) {
		return NextResponse.json({ error: 'Missing ID or token' }, { status: 400 });
	}

	const cachedDirect = discordUserCache.get(id);
	if (cachedDirect && cachedDirect.expiresAt > Date.now()) {
		return NextResponse.json(cachedDirect.payload, { status: 200 });
	}

	let resolvedId = id;
	let fallbackRecord: any = null;

	if (!/^\d{15,22}$/.test(id)) {
		try {
			const { models } = await database('xernerx');
			const slug = id.toLowerCase();
			const userDoc = await (models.users.User as any)
				.findOne({ vanitySlug: slug })
				.select('id name icon discordCache')
				.lean()
				.catch(() => null);
			if (userDoc?.id) {
				resolvedId = String(userDoc.id);
				fallbackRecord = { ...userDoc, isBot: false };
			} else {
				const botDoc = await (models.bots.Bot as any)
					.findOne({ vanitySlug: slug })
					.select('id name avatar discordCache')
					.lean()
					.catch(() => null);
				if (botDoc?.id) {
					resolvedId = String(botDoc.id);
					fallbackRecord = { ...botDoc, isBot: true };
				}
			}
		} catch {}
	}

	const cachedResolved = discordUserCache.get(resolvedId);
	if (cachedResolved && cachedResolved.expiresAt > Date.now()) {
		return NextResponse.json(cachedResolved.payload, { status: 200 });
	}

	try {
		let res: Response | null = null;
		if (/^\d{15,22}$/.test(resolvedId)) {
			for (const token of tokens) {
				res = await fetch(`https://discord.com/api/v10/users/${resolvedId}`, {
					headers: {
						Authorization: `Bot ${token}`,
					},
					next: { revalidate: 3600 },
				});
				if (res.ok) break;
			}
		}

		if (!res || !res.ok) {
			if (!fallbackRecord && /^\d{15,22}$/.test(resolvedId)) {
				try {
					const { models } = await database('xernerx');
					const userDoc = await (models.users.User as any)
						.findOne({ id: resolvedId })
						.select('id name icon discordCache')
						.lean()
						.catch(() => null);
					if (userDoc) {
						fallbackRecord = { ...userDoc, isBot: false };
					} else {
						const botDoc = await (models.bots.Bot as any)
							.findOne({ id: resolvedId })
							.select('id name avatar discordCache')
							.lean()
							.catch(() => null);
						if (botDoc) {
							fallbackRecord = { ...botDoc, isBot: true };
						}
					}
				} catch {}
			}

			const dc = fallbackRecord?.discordCache;
			if (fallbackRecord && (dc?.username || fallbackRecord.name)) {
				const rawAvatar = dc?.avatar || fallbackRecord.avatar || null;
				const avatarUrl =
					dc?.avatarUrl ||
					(rawAvatar
						? String(rawAvatar).startsWith('http')
							? String(rawAvatar)
							: `https://cdn.discordapp.com/avatars/${resolvedId}/${rawAvatar}.png?size=1024`
						: fallbackRecord.icon && String(fallbackRecord.icon).startsWith('http')
							? String(fallbackRecord.icon)
							: null);
				const fallbackPayload = {
					id: resolvedId,
					username: dc?.username || fallbackRecord.name || resolvedId,
					global_name: dc?.globalName || fallbackRecord.name || dc?.username || resolvedId,
					avatar: rawAvatar,
					banner: dc?.banner || null,
					avatarUrl,
					bannerUrl: dc?.bannerUrl || null,
					bot: Boolean(fallbackRecord.isBot),
				};
				return NextResponse.json(fallbackPayload, { status: 200 });
			}

			return NextResponse.json({ error: 'Discord user not found' }, { status: res?.status || 404 });
		}

		const data = await res.json();
		const payload = {
			...data,
			avatarUrl: data.avatar ? `https://cdn.discordapp.com/avatars/${resolvedId}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,
			bannerUrl: data.banner ? `https://cdn.discordapp.com/banners/${resolvedId}/${data.banner}.${data.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,
		};

		discordUserCache.set(resolvedId, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
		if (id !== resolvedId) {
			discordUserCache.set(id, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
		}

		// Persist discordCache onto existing User or Bot document in background
		setTimeout(async () => {
			try {
				const { models } = await database('xernerx');
				const cacheDoc = {
					username: data.username || '',
					globalName: data.global_name || data.globalName || data.username || '',
					avatar: data.avatar || '',
					banner: data.banner || '',
					avatarUrl: payload.avatarUrl || '',
					bannerUrl: payload.bannerUrl || '',
					updatedAt: new Date(),
				};
				if (data.bot) {
					await (models.bots.Bot as any).updateOne({ id: resolvedId }, { $set: { discordCache: cacheDoc } }).catch(() => {});
				} else {
					await (models.users.User as any).updateOne({ id: resolvedId }, { $set: { discordCache: cacheDoc } }).catch(() => {});
				}
			} catch {}
		}, 0);

		return NextResponse.json(payload, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch Discord user:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
