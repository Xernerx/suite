/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { reconcileBotAndOrphanUsers, type UserBotProfileSummary } from '@/lib/botEntityReconciliation';

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const privacy = url.searchParams.get('privacy');
		const xernerxDb = await database('xernerx');
		const db = xernerxDb.models.users as any;

		const isPublicOnly = privacy === 'public' || url.searchParams.get('public') === 'true';
		let botSummaryMap = new Map<string, UserBotProfileSummary>();
		if (!isPublicOnly) {
			botSummaryMap = await reconcileBotAndOrphanUsers(xernerxDb);
		}

		const query: Record<string, any> = {};
		if (isPublicOnly) {
			query.privacy = 'public';
			query.blacklisted = { $ne: true };
		}

		await db.User.updateMany({ agreedTerms: { $ne: null }, agreedPrivacy: { $ne: null }, verified: { $ne: true } }, { $set: { verified: true } }).catch(() => {});

		const [users, levels, credits] = await Promise.all([
			db.User.find(query)
				.lean()
				.select([
					'id',
					'name',
					'icon',
					'roles',
					'privacy',
					'verified',
					'blacklisted',
					'shadowban',
					'services',
					'vanitySlug',
					'stripeCustomerId',
					'agreedTerms',
					'agreedPrivacy',
					'discordCache',
					'onboarding',
				]),
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

		const normalized = users.map((u: any) => {
			const uid = String(u.id);
			return {
				...u,
				verified: Boolean(u.verified || (u.agreedTerms && u.agreedPrivacy)),
				blacklisted: Boolean(u.blacklisted),
				shadowban: Boolean(u.shadowban),
				services: u.services !== false,
				discord: u.discordCache?.username ? u.discordCache : undefined,
				onboarding: u.onboarding || {
					persona: 'user',
					suiteIntroCompleted: false,
					dashboardTourCompleted: false,
					supportPromptCompleted: false,
					tourPostponed: false,
					tourPostponedPhase: null,
					completedAt: null,
					onboardedBots: [],
				},
				level: levelMap.get(uid) || { level: 1, xp: 0 },
				credits: creditMap.get(uid) || { balance: 0, streak: 0 },
				...(!isPublicOnly
					? {
							botProfiles: botSummaryMap.get(uid) || { bots: [], serverCount: 0 },
						}
					: {}),
			};
		});

		return NextResponse.json(normalized, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch users:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
