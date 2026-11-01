/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const privacy = url.searchParams.get('privacy');
		const db = (await database('xernerx')).models.users as any;

		const query: Record<string, any> = {};
		if (privacy === 'public' || url.searchParams.get('public') === 'true') {
			query.privacy = 'public';
		}

		await db.User.updateMany({ agreedTerms: { $ne: null }, agreedPrivacy: { $ne: null }, verified: { $ne: true } }, { $set: { verified: true } }).catch(() => {});

		const [users, levels, credits] = await Promise.all([
			db.User.find(query).lean().select(['id', 'name', 'icon', 'roles', 'privacy', 'verified', 'vanitySlug', 'stripeCustomerId', 'agreedTerms', 'agreedPrivacy', 'discordCache']),
			db.Level.find({})
				.select(['ownerId', 'level', 'xp'])
				.lean()
				.catch(() => []),
			db.Credit.find({})
				.select(['ownerId', 'balance', 'streak'])
				.lean()
				.catch(() => []),
		]);

		const levelMap = new Map<string, { level: number; xp: number }>();
		for (const lvl of levels || []) {
			if (lvl?.ownerId) {
				levelMap.set(String(lvl.ownerId), {
					level: Number(lvl.level) || 1,
					xp: Number(lvl.xp) || 0,
				});
			}
		}

		const creditMap = new Map<string, { balance: number; streak: number }>();
		for (const cred of credits || []) {
			if (cred?.ownerId) {
				creditMap.set(String(cred.ownerId), {
					balance: Number(cred.balance) || 0,
					streak: Number(cred.streak) || 0,
				});
			}
		}

		const normalized = users.map((u: any) => ({
			...u,
			verified: Boolean(u.verified || (u.agreedTerms && u.agreedPrivacy)),
			discord: u.discordCache?.username ? u.discordCache : undefined,
			level: levelMap.get(String(u.id)) || { level: 1, xp: 0 },
			credits: creditMap.get(String(u.id)) || { balance: 0, streak: 0 },
		}));

		return NextResponse.json(normalized, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch users:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
