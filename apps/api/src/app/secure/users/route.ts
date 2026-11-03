/** @format */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

const SIGN_IN_BONUS_AMOUNT = 1000;
const DEFAULT_JOIN_ROLE_ID = '1b333119-d818-4fb1-a5dc-12621fd14198';

async function reconcileVirtueAndOrphanUsers(xernerxDb: any) {
	try {
		const UserModel = xernerxDb.models.users?.User;
		const LevelModel = xernerxDb.models.users?.Level;
		const CreditModel = xernerxDb.models.users?.Credit;
		const SettingModel = xernerxDb.models.core?.Setting;
		if (!UserModel) return;

		const virtueDb = await database('virtue').catch(() => null);
		const VUser = (virtueDb?.models?.profiles as any)?.User;
		const LLevel = (virtueDb?.models?.levels as any)?.Level;
		const LText = (virtueDb?.models?.levels as any)?.Text;
		const LVoice = (virtueDb?.models?.levels as any)?.Voice;
		const PLevel = (virtueDb?.models?.profiles as any)?.Level;
		const PText = (virtueDb?.models?.profiles as any)?.Text;
		const PVoice = (virtueDb?.models?.profiles as any)?.Voice;

		const [existingUserIds, optOutUserDocs, existingCreditOwnerIds, existingLevelOwnerIds, vUserIds, optOutVUserDocs, lLevelIds, lTextIds, lVoiceIds, pLevelIds, pTextIds, pVoiceIds] =
			await Promise.all([
				UserModel.distinct('id').catch(() => []),
				UserModel.find({ $or: [{ services: false }, { blacklisted: true }] })
					.select('id')
					.lean()
					.catch(() => []),
				CreditModel ? CreditModel.distinct('ownerId').catch(() => []) : Promise.resolve([]),
				LevelModel ? LevelModel.distinct('ownerId').catch(() => []) : Promise.resolve([]),
				VUser ? VUser.distinct('id').catch(() => []) : Promise.resolve([]),
				VUser
					? VUser.find({ $or: [{ services: false }, { blacklisted: true }] })
							.select('id')
							.lean()
							.catch(() => [])
					: Promise.resolve([]),
				LLevel ? LLevel.distinct('id').catch(() => []) : Promise.resolve([]),
				LText ? LText.distinct('id').catch(() => []) : Promise.resolve([]),
				LVoice ? LVoice.distinct('id').catch(() => []) : Promise.resolve([]),
				PLevel ? PLevel.distinct('id').catch(() => []) : Promise.resolve([]),
				PText ? PText.distinct('id').catch(() => []) : Promise.resolve([]),
				PVoice ? PVoice.distinct('id').catch(() => []) : Promise.resolve([]),
			]);

		const existingUserSet = new Set((existingUserIds || []).map((id: any) => String(id)));
		const existingCreditSet = new Set((existingCreditOwnerIds || []).map((id: any) => String(id)));
		const existingLevelSet = new Set((existingLevelOwnerIds || []).map((id: any) => String(id)));
		const optOutSet = new Set([...(optOutUserDocs || []).map((d: any) => String(d?.id || '')), ...(optOutVUserDocs || []).map((d: any) => String(d?.id || ''))]);

		const candidateIds = new Set<string>();
		for (const list of [existingUserIds, existingCreditOwnerIds, existingLevelOwnerIds, vUserIds, lLevelIds, lTextIds, lVoiceIds, pLevelIds, pTextIds, pVoiceIds]) {
			for (const rawId of list || []) {
				const uid = String(rawId || '').trim();
				if (/^\d{15,22}$/.test(uid) && !optOutSet.has(uid)) {
					candidateIds.add(uid);
				}
			}
		}

		const missingUsers: string[] = [];
		const missingCredits: string[] = [];
		const missingLevels: string[] = [];

		for (const uid of candidateIds) {
			if (!existingUserSet.has(uid)) missingUsers.push(uid);
			if (!existingCreditSet.has(uid)) missingCredits.push(uid);
			if (!existingLevelSet.has(uid)) missingLevels.push(uid);
		}

		if (missingUsers.length === 0 && missingCredits.length === 0 && missingLevels.length === 0) {
			return;
		}

		let defaultRoles = [DEFAULT_JOIN_ROLE_ID];
		if (SettingModel) {
			const joinRolesSetting = await SettingModel.findOne({ id: 'join_roles' })
				.lean()
				.catch(() => null);
			if (joinRolesSetting?.value) {
				try {
					const parsed = JSON.parse(joinRolesSetting.value);
					if (Array.isArray(parsed)) {
						defaultRoles = Array.from(new Set([DEFAULT_JOIN_ROLE_ID, ...parsed.filter((r) => typeof r === 'string' && r)]));
					}
				} catch {}
			}
		}

		await Promise.all([
			...missingUsers.map((uid) =>
				UserModel.create({
					id: uid,
					roles: defaultRoles,
				}).catch(() => {})
			),
			...(CreditModel
				? missingCredits.map((uid) =>
						CreditModel.create({
							ownerId: uid,
							balance: SIGN_IN_BONUS_AMOUNT,
							signInBonusClaimed: true,
							transactions: [
								{
									id: crypto.randomUUID(),
									type: 'earn',
									amount: SIGN_IN_BONUS_AMOUNT,
									multiplierPercent: 100,
									itemId: 'signin_bonus',
									itemName: 'Welcome Sign-In Bonus',
									createdAt: new Date(),
								},
							],
						}).catch(() => {})
					)
				: []),
			...(LevelModel
				? missingLevels.map((uid) =>
						LevelModel.create({
							id: crypto.randomUUID(),
							ownerId: uid,
							level: 1,
							xp: 0,
						}).catch(() => {})
					)
				: []),
		]);
	} catch {}
}

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const privacy = url.searchParams.get('privacy');
		const xernerxDb = await database('xernerx');
		const db = xernerxDb.models.users as any;

		const isPublicOnly = privacy === 'public' || url.searchParams.get('public') === 'true';
		if (!isPublicOnly) {
			await reconcileVirtueAndOrphanUsers(xernerxDb);
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
				.select(['id', 'name', 'icon', 'roles', 'privacy', 'verified', 'blacklisted', 'services', 'vanitySlug', 'stripeCustomerId', 'agreedTerms', 'agreedPrivacy', 'discordCache']),
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
			blacklisted: Boolean(u.blacklisted),
			services: u.services !== false,
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
