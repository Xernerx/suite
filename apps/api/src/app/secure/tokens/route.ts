/** @format */

import { NextRequest, NextResponse } from 'next/server';

import { database } from '@xernerx/lib/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';

export async function GET(request: NextRequest) {
	try {
		const admin = !!new URL(request.url).searchParams.get('admin');

		const caller = await resolveCallerAuth(request, ['tokens']);
		if (!caller.authenticated || !caller.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		if (admin && !caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Token management permission required' }, { status: 403 });
		}

		const userId = caller.userId;
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;
		const BotModel = (db.models.bots as any)?.Bot;

		let tokens: any[] = [];

		if (admin) {
			tokens = await TokenModel.find({}).lean();
		} else {
			tokens = await TokenModel.find({ owners: userId }).lean();
		}

		const botIds = Array.from(new Set(tokens.map((t) => t.botId).filter(Boolean)));
		const botDocs =
			BotModel && botIds.length > 0
				? await BotModel.find({ id: { $in: botIds } })
						.select('id name avatar vanitySlug discordCache')
						.lean()
						.catch(() => [])
				: [];
		const botMap = new Map<string, any>((botDocs || []).map((b: any) => [String(b.id), b]));

		// Clean up for standard view format
		const formattedTokens = tokens.map((t) => {
			const botDoc = t.botId ? botMap.get(String(t.botId)) : null;
			const dc = botDoc?.discordCache;
			const rawAvatar = dc?.avatar || botDoc?.avatar || null;
			const avatarUrl =
				dc?.avatarUrl || (rawAvatar ? (String(rawAvatar).startsWith('http') ? String(rawAvatar) : `https://cdn.discordapp.com/avatars/${botDoc.id}/${rawAvatar}.png?size=64`) : null);

			return {
				id: t.id,
				status: t.botId && t.status === 'pending' ? 'active' : !t.botId && t.status === 'active' ? 'pending' : t.status,
				name: t.name,
				botId: t.botId || null,
				botInfo: t.botId
					? {
							id: String(t.botId),
							name: dc?.globalName || dc?.username || botDoc?.name || `Bot ${t.botId}`,
							vanitySlug: botDoc?.vanitySlug || undefined,
							avatarUrl,
						}
					: null,
				owners: Array.isArray(t.owners) ? t.owners : [],
				permissions: t.permissions,
				requestCount: t.requestCount || 0,
				lastUsedAt: t.lastUsedAt || null,
				expiresAt: t.expiresAt || null,
				allowedIps: Array.isArray(t.allowedIps) ? t.allowedIps : [],
			};
		});

		return NextResponse.json(formattedTokens, { status: 200 });
	} catch (error) {
		console.error('GET Secure Tokens Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
