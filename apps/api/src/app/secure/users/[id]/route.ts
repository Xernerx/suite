/** @format */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { database, sendWebhook } from '@xernerx/lib/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';
import { syncUserRoles } from '@/lib/sync/users';
import { normalizeVanitySlug, VANITY_SLUG_REGEX } from '@/lib/vanityUnlock';
import { handleUserPatchAction, mergeUserDevices, parseUserAgentDevice, SIGN_IN_BONUS_AMOUNT } from '@/lib/userRouteActions';
import { syncVirtueAndRecordUserUpdateAudit, updateUserAppearanceCreditsAndLevel } from '@/lib/userRouteCosmeticsAndAudit';
import { handleDeleteUserById, handleGetUserById, normalizeUserOnboardingAndVerification } from '@/lib/userRouteLifecycle';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return handleGetUserById(req, id);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const caller = await resolveCallerAuth(req, ['users']);
		const isStaffOrSystem = Boolean(caller.isSystemToken || caller.authorized);
		if (!isStaffOrSystem && caller.userId !== id) {
			return NextResponse.json({ error: 'Forbidden: You can only initialize your own account profile.' }, { status: 403 });
		}

		const body = await req.json().catch(() => ({}));
		const { models } = await database('xernerx');

		const existingUser = (await models.users.User.findOne({ id }).lean()) as any;
		const { appearance, credits: rawCredits, level: rawLevel, _id: _omitId, __v: _omitV, ...userBody } = body || {};
		const credits = isStaffOrSystem ? rawCredits : undefined;
		const level = isStaffOrSystem ? rawLevel : undefined;
		if (!isStaffOrSystem) {
			delete userBody.roles;
			delete userBody.blacklisted;
			delete userBody.shadowban;
			delete userBody.staffSubscription;
			delete userBody.verified;
			delete userBody.vanityUnlocked;
			delete userBody.stripeCustomerId;
		}

		if ((existingUser?.blacklisted || existingUser?.services === false) && !isStaffOrSystem) {
			return NextResponse.json(
				{
					...existingUser,
					blacklisted: Boolean(existingUser.blacklisted),
					services: existingUser.services !== false,
					appearance: {},
					credits: { balance: 0, streak: 0, signInBonusClaimed: true },
					level: { level: 1, xp: 0 },
					levels: [],
					bonusGranted: false,
					isNewProfile: false,
				},
				{ status: 200 }
			);
		}

		const joinRolesSetting = await models.core.Setting.findOne({ id: 'join_roles' }).lean();
		let joinRoles: string[] = [];
		try {
			joinRoles = JSON.parse(joinRolesSetting?.value || '[]');
		} catch {}
		const candidateJoinRoleIds = Array.from(new Set((Array.isArray(joinRoles) ? joinRoles : []).filter((r): r is string => typeof r === 'string' && r.trim().length > 0)));
		const existingJoinRoleDocs =
			candidateJoinRoleIds.length > 0 && models.core?.Role
				? await models.core.Role.find({ id: { $in: candidateJoinRoleIds } })
						.select('id')
						.lean()
						.catch(() => [])
				: [];
		const validJoinRoles = (existingJoinRoleDocs || []).map((r: any) => String(r.id)).filter(Boolean);
		const explicitStaffRoles = isStaffOrSystem && Array.isArray(userBody.roles) ? userBody.roles.filter(Boolean) : [];
		const mergedRoles = !existingUser
			? Array.from(new Set([...explicitStaffRoles, ...validJoinRoles]))
			: explicitStaffRoles.length > 0
				? Array.from(new Set([...(existingUser.roles || []), ...explicitStaffRoles]))
				: Array.isArray(existingUser.roles)
					? existingUser.roles
					: [];

		let userDoc: any = existingUser;
		let rolesJustGranted = false;
		const selfLiveDevice = !caller.isSystemToken && caller.userId === id ? parseUserAgentDevice(req.headers.get('user-agent')) : null;

		if (!existingUser) {
			const initialDevices = Array.isArray(userBody.devices) && userBody.devices.length > 0 ? userBody.devices : selfLiveDevice ? [selfLiveDevice] : [];
			const created = await models.users.User.create({ ...userBody, devices: initialDevices, roles: mergedRoles, id });
			userDoc = created?.toObject ? created.toObject() : created;
			rolesJustGranted = mergedRoles.length > 0;
		} else {
			const hadRoles = Array.isArray(existingUser.roles) && existingUser.roles.length > 0;
			const backfillUpdates: Record<string, any> = {};
			if (explicitStaffRoles.length > 0) backfillUpdates.roles = mergedRoles;
			if (!existingUser.name && userBody.name) backfillUpdates.name = userBody.name;
			if (!existingUser.email && userBody.email) backfillUpdates.email = userBody.email;
			if (existingUser.agreedTerms && existingUser.agreedPrivacy && !existingUser.verified) {
				backfillUpdates.verified = true;
			}
			if (selfLiveDevice) {
				const merged = mergeUserDevices(existingUser.devices, selfLiveDevice);
				if (merged.shouldPersist) {
					backfillUpdates.devices = merged.devices;
				}
			}
			userDoc =
				Object.keys(backfillUpdates).length > 0
					? await models.users.User.findOneAndUpdate({ id }, { $set: backfillUpdates }, { returnDocument: 'after', runValidators: true }).lean()
					: existingUser;
			rolesJustGranted = !hadRoles && Boolean(backfillUpdates.roles?.length);
		}

		if (rolesJustGranted) {
			const webhookSetting = await models.core.Setting.findOne({ id: 'app_webhook_url' }).lean();
			if (webhookSetting?.value) {
				await sendWebhook({
					url: webhookSetting.value,
					embeds: [
						{
							title: '🛡️ Join Roles Granted',
							description: `New user <@${id}> (\`${id}\`) has been granted join roles.`,
							color: 0x8b5cf6,
							fields: [{ name: 'Roles Added', value: mergedRoles.join(', '), inline: false }],
							timestamp: new Date().toISOString(),
						},
					],
				}).catch(console.error);
			}
		}

		let appearanceDoc = (await models.users.Appearance.findOne({ ownerId: id }).lean()) as any;
		if (appearance && !appearanceDoc) {
			const createdApp = await models.users.Appearance.create({ ...appearance, ownerId: id, id: crypto.randomUUID() });
			appearanceDoc = createdApp?.toObject ? createdApp.toObject() : createdApp;
		}

		const existingCredit = (await models.users.Credit.findOne({ ownerId: id }).lean()) as any;
		let creditDoc: any = existingCredit;
		let bonusGranted = false;
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
			const initialBalance = Math.max(SIGN_IN_BONUS_AMOUNT, Number(credits?.balance) || 0);
			const createdCredit = await models.users.Credit.create({
				...(credits || {}),
				ownerId: id,
				balance: initialBalance,
				signInBonusClaimed: true,
				transactions: [bonusTx, ...(Array.isArray(credits?.transactions) ? credits.transactions : [])],
			});
			creditDoc = createdCredit?.toObject ? createdCredit.toObject() : createdCredit;
			bonusGranted = true;
		} else {
			const hasBonusTx = Array.isArray(existingCredit.transactions) && existingCredit.transactions.some((tx: any) => tx?.itemId === 'signin_bonus');
			const alreadyClaimed = Boolean(existingCredit.signInBonusClaimed || hasBonusTx);
			if (!alreadyClaimed) {
				creditDoc = await models.users.Credit.findOneAndUpdate(
					{ ownerId: id },
					{
						$inc: { balance: SIGN_IN_BONUS_AMOUNT },
						$set: { signInBonusClaimed: true },
						$push: { transactions: { $each: [bonusTx], $position: 0 } },
					},
					{ returnDocument: 'after', runValidators: true, strict: false }
				).lean();
				bonusGranted = true;
			}
		}

		let levelDoc = (await models.users.Level.findOne({ ownerId: id }).lean()) as any;
		if (!levelDoc) {
			const createdLevel = await models.users.Level.create({
				...(level || { level: 1, xp: 0 }),
				ownerId: id,
				id: crypto.randomUUID(),
			});
			levelDoc = createdLevel?.toObject ? createdLevel.toObject() : createdLevel;
		}

		return NextResponse.json(
			{
				...userDoc,
				appearance: appearanceDoc || {},
				credits: creditDoc || { balance: SIGN_IN_BONUS_AMOUNT, streak: 0, signInBonusClaimed: true },
				level: levelDoc || { level: 1, xp: 0 },
				levels: levelDoc ? [levelDoc] : [],
				bonusGranted,
				isNewProfile: !existingUser,
			},
			{ status: existingUser ? 200 : 201 }
		);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');

		const existingDoc = await models.users.User.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		const resolvedId = existingDoc?.id || id;

		const caller = await resolveCallerAuth(req, ['users']);
		const isStaffOrSystem = Boolean(caller.isSystemToken || caller.authorized);
		if (!isStaffOrSystem && caller.userId !== resolvedId && caller.userId !== id) {
			return NextResponse.json({ error: 'Forbidden: You can only update your own profile.' }, { status: 403 });
		}

		const { appearance, credits: rawCredits, level: rawLevel, _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, ...userBody } = body || {};
		let credits = isStaffOrSystem ? rawCredits : undefined;
		if (!isStaffOrSystem && rawCredits && typeof rawCredits === 'object') {
			const safeCredits: Record<string, any> = {};
			if (Array.isArray(rawCredits.activeBadges)) safeCredits.activeBadges = rawCredits.activeBadges.map(String);
			if (typeof rawCredits.dotMatrixVariant === 'string') safeCredits.dotMatrixVariant = rawCredits.dotMatrixVariant;
			if (rawCredits.profileCosmetics && typeof rawCredits.profileCosmetics === 'object') {
				safeCredits.profileCosmetics = {
					avatarFrame: String(rawCredits.profileCosmetics.avatarFrame || 'none'),
					nameplate: String(rawCredits.profileCosmetics.nameplate || 'none'),
					cardTheme: String(rawCredits.profileCosmetics.cardTheme || 'default'),
				};
			}
			if (Object.keys(safeCredits).length > 0) credits = safeCredits;
		}
		const level = isStaffOrSystem ? rawLevel : undefined;

		if (!isStaffOrSystem) {
			if (userBody.action === 'send_notification') {
				return NextResponse.json({ error: 'Forbidden: Only staff can dispatch manual notifications.' }, { status: 403 });
			}
			delete userBody.roles;
			delete userBody.blacklisted;
			delete userBody.shadowban;
			delete userBody.staffSubscription;
			delete userBody.vanityUnlocked;
			delete userBody.stripeCustomerId;
			if (!(userBody.agreedTerms && userBody.agreedPrivacy)) {
				delete userBody.verified;
			}
			if ((existingDoc as any)?.blacklisted) {
				if (userBody.action === 'unlock_vanity' || (userBody.vanitySlug !== undefined && userBody.vanitySlug !== '')) {
					return NextResponse.json({ error: 'Forbidden: Your account is restricted from using Xernerx services.' }, { status: 403 });
				}
			}
		}

		const unsetFields: Record<string, 1> = {};
		const isVanityAlreadyUnlocked = Boolean(existingDoc?.vanityUnlocked || existingDoc?.vanitySlug || (isStaffOrSystem && userBody.vanityUnlocked));

		const actionResponse = await handleUserPatchAction({
			req,
			models,
			resolvedId,
			existingDoc,
			userBody,
			isVanityAlreadyUnlocked,
		});
		if (actionResponse) return actionResponse;

		normalizeUserOnboardingAndVerification(userBody, existingDoc);
		delete userBody.action;

		if (!caller.isSystemToken && caller.userId === resolvedId && userBody.devices === undefined) {
			const liveDevice = parseUserAgentDevice(req.headers.get('user-agent'));
			if (liveDevice) {
				const merged = mergeUserDevices((existingDoc as any)?.devices, liveDevice);
				if (merged.shouldPersist) {
					userBody.devices = merged.devices;
				}
			}
		}

		if (userBody.birthday === '' || userBody.birthday === null) {
			delete userBody.birthday;
			unsetFields.birthday = 1;
		}

		if (userBody.gender === '' || userBody.gender === null) {
			delete userBody.gender;
			unsetFields.gender = 1;
		}

		if (userBody.vanitySlug !== undefined) {
			const rawSlug = normalizeVanitySlug(userBody.vanitySlug);
			if (rawSlug === '') {
				delete userBody.vanitySlug;
				unsetFields.vanitySlug = 1;
			} else {
				if (!isVanityAlreadyUnlocked && !isStaffOrSystem) {
					return NextResponse.json({ error: 'Custom Vanity URL is locked. Unlock it first before setting a vanity slug.' }, { status: 403 });
				}
				if (!VANITY_SLUG_REGEX.test(rawSlug)) {
					return NextResponse.json({ error: 'Vanity slug must be 2-32 characters (lowercase letters, numbers, and hyphens).' }, { status: 400 });
				}
				const slugTaken = await models.users.User.findOne({ vanitySlug: rawSlug, id: { $ne: resolvedId } }).lean();
				if (slugTaken) {
					return NextResponse.json({ error: 'This vanity slug is already taken.' }, { status: 409 });
				}
				userBody.vanityUnlocked = true;
				userBody.vanitySlug = rawSlug;
			}
		}

		let oldUser = null;
		if (userBody.roles) {
			oldUser = existingDoc || (await models.users.User.findOne({ id: resolvedId }).lean());
		}

		const mongoUpdate: Record<string, any> = {};
		if (Object.keys(userBody).length > 0) mongoUpdate.$set = userBody;
		if (Object.keys(unsetFields).length > 0) mongoUpdate.$unset = unsetFields;

		const updatedUser =
			Object.keys(mongoUpdate).length > 0
				? await models.users.User.findOneAndUpdate({ id: resolvedId }, mongoUpdate, { returnDocument: 'after', runValidators: true, strict: false }).lean()
				: existingDoc;

		if (typeof userBody.staffSubscription === 'boolean' && models.users.Subscription) {
			if (userBody.staffSubscription) {
				const existingStaffSub = await models.users.Subscription.findOne({ ownerId: resolvedId, stripeSubscriptionId: 'staff_infinite_sub' }).lean();
				if (!existingStaffSub) {
					await models.users.Subscription.create({
						ownerId: resolvedId,
						stripeSubscriptionId: 'staff_infinite_sub',
						priceId: 'ultra',
						status: 'active',
						currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
					});
				}
			} else {
				await models.users.Subscription.deleteMany({ ownerId: resolvedId, stripeSubscriptionId: 'staff_infinite_sub' });
			}
		}

		let addedRoles: string[] = [];
		let removedRoles: string[] = [];
		if (userBody.roles && oldUser && updatedUser) {
			const oldRoles = new Set((oldUser.roles || []) as string[]);
			const newRoles = new Set((updatedUser.roles || []) as string[]);
			addedRoles = [...newRoles].filter((r) => !oldRoles.has(r));
			removedRoles = [...oldRoles].filter((r) => !newRoles.has(r));

			if (addedRoles.length > 0 || removedRoles.length > 0) {
				const webhookSetting = await models.core.Setting.findOne({ id: 'app_webhook_url' }).lean();
				if (webhookSetting?.value) {
					await sendWebhook({
						url: webhookSetting.value,
						embeds: [
							{
								title: '🛡️ User Roles Updated',
								description: `Roles for user <@${resolvedId}> (\`${resolvedId}\`) were updated.`,
								color: 0x8b5cf6,
								fields: [
									...(addedRoles.length > 0 ? [{ name: 'Roles Added', value: addedRoles.join(', '), inline: false }] : []),
									...(removedRoles.length > 0 ? [{ name: 'Roles Removed', value: removedRoles.join(', '), inline: false }] : []),
								],
								timestamp: new Date().toISOString(),
							},
						],
					}).catch(console.error);
				}

				setTimeout(async () => {
					try {
						const db = await database('xernerx');
						await syncUserRoles(resolvedId, db);
					} catch (err) {
						console.error('[UserSync]', err);
					}
				}, 0);
			}
		}

		if (!updatedUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const { existingCredits, existingLevel, updatedAppearance, updatedCredits, updatedLevel } = await updateUserAppearanceCreditsAndLevel({
			models,
			resolvedId,
			appearance,
			credits,
			level,
		});

		await syncVirtueAndRecordUserUpdateAudit({
			req,
			resolvedId,
			existingDoc,
			updatedUser,
			userBody,
			unsetFields,
			addedRoles,
			removedRoles,
			credits,
			existingCredits,
			updatedCredits,
			level,
			existingLevel,
			updatedLevel,
		});

		return NextResponse.json({
			...updatedUser,
			vanitySlug: updatedUser.vanitySlug || '',
			appearance: updatedAppearance || {},
			credits: updatedCredits || {},
			level: updatedLevel || {},
		});
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return handleDeleteUserById(req, id);
}
