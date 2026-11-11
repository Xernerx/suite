/** @format */

import crypto from 'crypto';
import { database } from '@xernerx/lib/core';

const SIGN_IN_BONUS_AMOUNT = 1000;

async function resolveDefaultJoinRoles(db: any): Promise<string[]> {
	const candidateIds = new Set<string>();
	try {
		const setting = await (db.models.core as any)?.Setting?.findOne({ id: 'join_roles' }).lean();
		if (setting?.value) {
			const parsed = JSON.parse(setting.value);
			if (Array.isArray(parsed)) {
				for (const r of parsed) {
					if (r && typeof r === 'string' && r.trim().length > 0) candidateIds.add(r.trim());
				}
			}
		}
		const ids = Array.from(candidateIds);
		if (ids.length === 0) return [];
		const RoleModel = (db.models.core as any)?.Role;
		if (!RoleModel) return [];
		const existingRoles = await RoleModel.find({ id: { $in: ids } })
			.select('id')
			.lean()
			.catch(() => []);
		return (existingRoles || []).map((r: any) => String(r.id)).filter(Boolean);
	} catch {
		return [];
	}
}

export async function canUseUserServices(userId: string): Promise<{ allowed: boolean; blacklisted: boolean; services: boolean; userDoc: any }> {
	if (!userId || !/^\d{15,22}$/.test(String(userId))) {
		return { allowed: true, blacklisted: false, services: true, userDoc: null };
	}
	try {
		const db = await database('xernerx');
		const UserModel = (db.models.users as any)?.User;
		const userDoc = UserModel ? ((await UserModel.findOne({ id: String(userId) }).lean()) as any) : null;
		if (userDoc) {
			const blacklisted = Boolean(userDoc.blacklisted);
			const services = userDoc.services !== false;
			return {
				allowed: !blacklisted && services,
				blacklisted,
				services,
				userDoc,
			};
		}

		const virtueDb = await database('virtue').catch(() => null);
		const VUserModel = (virtueDb?.models?.profiles as any)?.User;
		const vUserDoc = VUserModel
			? ((await VUserModel.findOne({ id: String(userId) })
					.select('blacklisted services')
					.lean()) as any)
			: null;
		if (vUserDoc) {
			const blacklisted = Boolean(vUserDoc.blacklisted);
			const services = vUserDoc.services !== false;
			return {
				allowed: !blacklisted && services,
				blacklisted,
				services,
				userDoc: null,
			};
		}
	} catch {}
	return { allowed: true, blacklisted: false, services: true, userDoc: null };
}

export async function ensureUserBonusAndDefaults(userId: string) {
	if (!userId || !/^\d{15,22}$/.test(String(userId))) return;
	try {
		const serviceCheck = await canUseUserServices(userId);
		if (!serviceCheck.allowed) return;

		const db = await database('xernerx');
		const CreditModel = (db.models.users as any)?.Credit;
		const LevelModel = (db.models.users as any)?.Level;
		const UserModel = (db.models.users as any)?.User;

		if (UserModel) {
			const userDoc = serviceCheck.userDoc || ((await UserModel.findOne({ id: userId }).lean()) as any);
			if (!userDoc) {
				const defaultRoles = await resolveDefaultJoinRoles(db);
				await UserModel.create({
					id: userId,
					roles: defaultRoles,
				}).catch(() => {});
			} else {
				if (userDoc.blacklisted || userDoc.services === false) return;
				const updates: Record<string, any> = {};
				if (userDoc.agreedTerms && userDoc.agreedPrivacy && !userDoc.verified) {
					updates.verified = true;
				}
				if (Object.keys(updates).length > 0) {
					await UserModel.updateOne({ id: userId }, { $set: updates }).catch(() => {});
				}
			}
		}

		if (CreditModel) {
			const existingCredit = (await CreditModel.findOne({ ownerId: userId }).lean()) as any;
			const bonusTx = {
				id: crypto.randomUUID(),
				type: 'earn',
				amount: SIGN_IN_BONUS_AMOUNT,
				multiplierPercent: 100,
				itemId: 'signin_bonus',
				itemName: 'Welcome Sign-In Bonus',
				createdAt: new Date(),
			};

			if (!existingCredit) {
				await CreditModel.create({
					ownerId: userId,
					balance: SIGN_IN_BONUS_AMOUNT,
					signInBonusClaimed: true,
					transactions: [bonusTx],
				}).catch(async () => {
					await CreditModel.updateOne(
						{ ownerId: userId, signInBonusClaimed: { $ne: true } },
						{
							$inc: { balance: SIGN_IN_BONUS_AMOUNT },
							$set: { signInBonusClaimed: true },
							$push: { transactions: { $each: [bonusTx], $position: 0 } },
						}
					).catch(() => {});
				});
			} else {
				const hasTx = Array.isArray(existingCredit.transactions) && existingCredit.transactions.some((t: any) => t?.itemId === 'signin_bonus');
				const alreadyClaimed = Boolean(existingCredit.signInBonusClaimed || hasTx);
				if (!alreadyClaimed) {
					await CreditModel.updateOne(
						{ ownerId: userId, signInBonusClaimed: { $ne: true } },
						{
							$inc: { balance: SIGN_IN_BONUS_AMOUNT },
							$set: { signInBonusClaimed: true },
							$push: { transactions: { $each: [bonusTx], $position: 0 } },
						}
					).catch(() => {});
				}
			}
		}

		if (LevelModel) {
			const existingLevel = await LevelModel.findOne({ ownerId: userId }).lean();
			if (!existingLevel) {
				await LevelModel.create({
					id: crypto.randomUUID(),
					ownerId: userId,
					level: 1,
					xp: 0,
				}).catch(() => {});
			}
		}
	} catch {}
}

async function getModel(action: string) {
	const db = await database('xernerx');

	switch (action) {
		case 'users':
		case 'user':
		case 'profile':
		case 'profiles':
			return (db.models.users as any)?.User;

		case 'levels':
		case 'level':
			return (db.models.users as any)?.Level;

		case 'credits':
		case 'credit':
			return (db.models.users as any)?.Credit;

		case 'tokens':
		case 'token':
			return (db.models.users as any)?.Token;

		case 'appearance':
		case 'appearances':
			return (db.models.users as any)?.Appearance;

		case 'subscriptions':
		case 'subscription':
			return (db.models.users as any)?.Subscription;

		case 'guilds':
		case 'guild':
			return (db.models.guilds as any)?.Guild;

		case 'bots':
		case 'bot':
			return (db.models.bots as any)?.Bot;

		case 'settings':
		case 'setting':
			return (db.models.core as any)?.Setting;

		default:
			return null;
	}
}

function getFilter(action: string, body: any) {
	switch (action) {
		case 'levels':
		case 'level':
		case 'credits':
		case 'credit':
		case 'subscriptions':
		case 'subscription':
		case 'appearance':
		case 'appearances':
			return {
				ownerId: body.ownerId || body.id,
			};

		case 'users':
		case 'user':
		case 'profile':
		case 'profiles':
		case 'tokens':
		case 'token':
		case 'guilds':
		case 'guild':
		case 'bots':
		case 'bot':
		case 'settings':
		case 'setting':
			return {
				id: body.id,
			};

		default:
			throw new Error(`Unsupported action: ${action}`);
	}
}

export default async function Server(msg: any) {
	const model = await getModel(msg.action);

	if (!model) {
		throw new Error(`Unknown action: ${msg.action}`);
	}

	switch (msg.method) {
		case 'get':
			if (!msg.body?.ownerId && !msg.body?.id && (msg.action === 'levels' || msg.action === 'level')) {
				const limit = Math.min(200, Math.max(1, Number(msg.body?.limit) || 100));
				return model.find({}).sort({ level: -1, xp: -1 }).limit(limit).lean();
			}
			return model.findOne(getFilter(msg.action, msg.body)).lean();

		case 'create': {
			const isUserAction = msg.action === 'users' || msg.action === 'user' || msg.action === 'profile' || msg.action === 'profiles';
			const isCreditAction = msg.action === 'credits' || msg.action === 'credit';
			const isLevelAction = msg.action === 'levels' || msg.action === 'level';
			const targetUserId = String(msg.body?.ownerId || msg.body?.id || '');
			if ((isUserAction || isCreditAction || isLevelAction) && targetUserId) {
				const serviceCheck = await canUseUserServices(targetUserId);
				if (!serviceCheck.allowed) {
					return (
						serviceCheck.userDoc || {
							id: targetUserId,
							ownerId: targetUserId,
							blacklisted: serviceCheck.blacklisted,
							services: serviceCheck.services,
							balance: 0,
							level: 0,
							xp: 0,
							servicesDisabled: true,
						}
					);
				}
			}
			if (isUserAction) {
				if (msg.body?.agreedTerms && msg.body?.agreedPrivacy) {
					msg.body.verified = true;
				}
			}
			if (isCreditAction && msg.body && !msg.body.signInBonusClaimed) {
				const baseBalance = Number(msg.body.balance) || 0;
				msg.body.balance = baseBalance < SIGN_IN_BONUS_AMOUNT ? baseBalance + SIGN_IN_BONUS_AMOUNT : baseBalance;
				msg.body.signInBonusClaimed = true;
				const existingTxs = Array.isArray(msg.body.transactions) ? msg.body.transactions : [];
				if (!existingTxs.some((t: any) => t?.itemId === 'signin_bonus')) {
					msg.body.transactions = [
						{
							id: crypto.randomUUID(),
							type: 'earn',
							amount: SIGN_IN_BONUS_AMOUNT,
							multiplierPercent: 100,
							itemId: 'signin_bonus',
							itemName: 'Welcome Sign-In Bonus',
							createdAt: new Date(),
						},
						...existingTxs,
					];
				}
			}
			try {
				const res = await model.create(msg.body);
				if ((isUserAction || isCreditAction || isLevelAction) && targetUserId) {
					await ensureUserBonusAndDefaults(targetUserId);
					if (isUserAction) {
						return model.findOne(getFilter(msg.action, msg.body)).lean();
					}
				}
				return res?.toObject ? res.toObject() : res;
			} catch (error: any) {
				if (error?.code === 11000) {
					if ((isUserAction || isCreditAction || isLevelAction) && targetUserId) {
						await ensureUserBonusAndDefaults(targetUserId);
					}
					return model.findOne(getFilter(msg.action, msg.body)).lean();
				}
				throw error;
			}
		}

		case 'update': {
			const isUserAction = msg.action === 'users' || msg.action === 'user' || msg.action === 'profile' || msg.action === 'profiles';
			const isCreditAction = msg.action === 'credits' || msg.action === 'credit';
			const isLevelAction = msg.action === 'levels' || msg.action === 'level';
			const targetUserId = String(msg.body?.ownerId || msg.body?.id || '');
			const isExplicitServiceOrBlacklistMutation = isUserAction && (typeof msg.body?.services === 'boolean' || typeof msg.body?.blacklisted === 'boolean');
			if ((isUserAction || isCreditAction || isLevelAction) && targetUserId && !isExplicitServiceOrBlacklistMutation) {
				const serviceCheck = await canUseUserServices(targetUserId);
				if (!serviceCheck.allowed) {
					return (
						serviceCheck.userDoc || {
							id: targetUserId,
							ownerId: targetUserId,
							blacklisted: serviceCheck.blacklisted,
							services: serviceCheck.services,
							balance: 0,
							level: 0,
							xp: 0,
							servicesDisabled: true,
						}
					);
				}
			}
			if (isUserAction) {
				const keys = Object.keys(msg.body || {}).filter((k) => k !== 'id' && msg.body[k] !== undefined && msg.body[k] !== null && msg.body[k] !== '');
				if (keys.length === 0) {
					if (targetUserId) {
						await ensureUserBonusAndDefaults(targetUserId);
					}
					return model.findOne(getFilter(msg.action, msg.body)).lean();
				}
				if (msg.body?.agreedTerms && msg.body?.agreedPrivacy) {
					msg.body.verified = true;
				}
			}
			if ((msg.action === 'credits' || msg.action === 'credit') && typeof msg.body?.balance === 'number' && !msg.body?.skipMultiplier) {
				try {
					const db = await database('xernerx');
					const filter = getFilter(msg.action, msg.body);
					const ownerId = filter.ownerId;
					const existing = (await model.findOne(filter).lean()) as any;
					const prevBalance = existing?.balance || 0;
					const gained = msg.body.balance - prevBalance;

					if (ownerId && gained > 0) {
						const now = Date.now();
						const [userDoc, subDocs, ultraItem] = await Promise.all([
							(db.models.users as any)?.User?.findOne({ id: ownerId })
								.lean()
								.catch(() => null),
							(db.models.users as any)?.Subscription?.find({ ownerId, status: { $in: ['active', 'trialing'] } })
								.lean()
								.catch(() => []),
							(db.models.store as any)?.Item?.findOne({ id: 'ultra' })
								.lean()
								.catch(() => null),
						]);

						const billingSubs = Array.isArray(userDoc?.billing?.subscriptions) ? userDoc.billing.subscriptions : [];
						const validSubs = [...(Array.isArray(subDocs) ? subDocs : []), ...billingSubs].filter((s: any) => {
							if (!s || (s.status !== 'active' && s.status !== 'trialing')) return false;
							if (!s.currentPeriodEnd) return true;
							const endMs = new Date(s.currentPeriodEnd).getTime();
							return Number.isNaN(endMs) || endMs > now;
						});

						const ultraSkuId = ultraItem?.skuId || 'prod_V0pD5uXoTQkrYS';
						const hasUltra =
							Boolean(userDoc?.staffSubscription) ||
							validSubs.some(
								(s: any) =>
									String(s.stripeSubscriptionId || '')
										.toLowerCase()
										.includes('ultra') ||
									String(s.priceId || '')
										.toLowerCase()
										.includes('ultra') ||
									s.priceId === ultraSkuId
							);

						const multiplier = hasUltra ? 2 : validSubs.length > 0 ? 1.25 : 1;
						msg.body.balance = prevBalance + Math.round(gained * multiplier);
					}
				} catch {}
			}

			const updatedDoc = await model
				.findOneAndUpdate(
					getFilter(msg.action, msg.body),
					{
						$set: msg.body,
					},
					{
						returnDocument: 'after',
						runValidators: true,
						upsert: true,
					}
				)
				.lean();

			if ((isUserAction || isCreditAction || isLevelAction) && targetUserId) {
				await ensureUserBonusAndDefaults(targetUserId);
				if (isUserAction) {
					return model.findOne(getFilter(msg.action, msg.body)).lean();
				}
			}

			return updatedDoc;
		}

		case 'delete': {
			const deleted = (await model.findOneAndDelete(getFilter(msg.action, msg.body)).lean()) as any;
			const isUserDelete = msg.action === 'users' || msg.action === 'user' || msg.action === 'profile' || msg.action === 'profiles';
			const targetUserId = String(deleted?.id || msg.body?.id || '');
			if (isUserDelete && targetUserId) {
				try {
					const db = await database('xernerx');
					const DispatchInvite = (db.models.dispatch as any)?.Invite;
					await Promise.all([
						(db.models.users as any)?.Appearance?.deleteMany({ ownerId: targetUserId }).catch(() => null),
						(db.models.users as any)?.Credit?.deleteMany({ ownerId: targetUserId }).catch(() => null),
						(db.models.users as any)?.Level?.deleteMany({ ownerId: targetUserId }).catch(() => null),
						(db.models.users as any)?.Subscription?.deleteMany({ ownerId: targetUserId }).catch(() => null),
						DispatchInvite?.deleteMany({ targetId: targetUserId }).catch(() => null),
						DispatchInvite?.updateMany(
							{ targetId: 'global', $or: [{ readBy: targetUserId }, { deletedBy: targetUserId }] },
							{ $pull: { readBy: targetUserId, deletedBy: targetUserId } }
						).catch(() => null),
					]);
				} catch {}
			}
			return deleted;
		}

		default:
			throw new Error(`Unknown method: ${msg.method}`);
	}
}
