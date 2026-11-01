/** @format */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { database, sendWebhook } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth, sendUserNotification } from '@/lib/auditAndNotify';
import { syncUserRoles } from '@/lib/sync/users';
import { normalizeVanitySlug, unlockVanityWithUserCredits, VANITY_SLUG_REGEX } from '@/lib/vanityUnlock';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const requestedSecrets = req.nextUrl.searchParams.get('includeSecrets') === 'true';
		const { models } = await database('xernerx');

		const user = await models.users.User.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const resolvedId = user.id;
		let includeSecrets = false;
		if (requestedSecrets) {
			const caller = await resolveCallerAuth(req, ['users']);
			includeSecrets = Boolean(caller.isSystemToken || caller.authorized || caller.userId === resolvedId || caller.userId === id);
		}

		// Fetch separated domain models in parallel
		const [appearance, credits, levels, subscriptions, organizations, ownedBots, ownedServers, directOrgs, verifiedIssuesCount, approvedSuggestionsCount] = await Promise.all([
			models.users.Appearance.findOne({ ownerId: resolvedId }).lean(),
			models.users.Credit.findOne({ ownerId: resolvedId }).lean(),
			models.users.Level.find({ ownerId: resolvedId }).lean(),
			models.users.Subscription.find({ ownerId: resolvedId }).lean(),
			models.organizations.Member.find({ userId: resolvedId }).lean(),
			(models.bots.Bot as any)
				.find({ owners: resolvedId })
				.select(['id', 'name', 'avatar', 'privacy', 'verified', 'vanitySlug'])
				.lean()
				.catch(() => []),
			(models.guilds.Guild as any)
				.find({ owner: resolvedId })
				.select(['id', 'name', 'icon', 'privacy', 'verified', 'vanitySlug'])
				.lean()
				.catch(() => []),
			(models.organizations.Organization as any)
				.find({ $or: [{ owner: resolvedId }, { members: resolvedId }] })
				.select(['_id', 'name', 'icon', 'iconUrl', 'owner', 'verified', 'privacy', 'vanitySlug'])
				.lean()
				.catch(() => []),
			(models.core.Issue as any).countDocuments({ authorId: resolvedId, acknowledged: true }).catch(() => 0),
			(models.core.Suggestion as any)
				.countDocuments({
					$or: [{ authorId: resolvedId }, { 'author.id': resolvedId }],
					status: { $in: ['approved', 'implemented', 'completed'] },
				})
				.catch(() => 0),
		]);

		const userOrganizations = (directOrgs || []).map((org: any) => ({
			id: String(org._id || org.id),
			name: org.name || 'Unnamed Organization',
			icon: org.iconUrl || org.icon || '',
			privacy: org.privacy || 'private',
			verified: Boolean(org.verified),
			vanitySlug: org.vanitySlug || '',
			isOwner: org.owner === resolvedId,
		}));

		const sanitizedConnections = Array.isArray((user as any).connections)
			? (user as any).connections.map((conn: any) => {
					if (includeSecrets) {
						return {
							...conn,
							hasSecret: Boolean(conn.secret),
							hasToken: Boolean(conn.token),
						};
					}
					const { secret, token, ...rest } = conn;
					return {
						...rest,
						hasSecret: Boolean(secret),
						hasToken: Boolean(token),
					};
				})
			: [];

		const resolvedSubscriptions = Array.isArray(subscriptions) ? [...subscriptions] : [];
		const hasStaffSubRecord = resolvedSubscriptions.some((s: any) => s.stripeSubscriptionId === 'staff_infinite_sub');
		const isStaffSubActive = Boolean((user as any).staffSubscription || hasStaffSubRecord);
		if (isStaffSubActive && !resolvedSubscriptions.some((s: any) => s.status === 'active' || s.status === 'trialing')) {
			resolvedSubscriptions.push({
				ownerId: resolvedId,
				stripeSubscriptionId: 'staff_infinite_sub',
				priceId: 'ultra',
				status: 'active',
				currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
			} as any);
		}

		const isVerified = Boolean(user.verified || (user.agreedTerms && user.agreedPrivacy));
		if (isVerified && !user.verified) {
			await models.users.User.updateOne({ id: resolvedId }, { $set: { verified: true } }).catch(() => {});
		}

		const hasBonusTx = Array.isArray((credits as any)?.transactions) && (credits as any).transactions.some((t: any) => t?.itemId === 'signin_bonus');
		const signInBonusClaimed = Boolean((credits as any)?.signInBonusClaimed || hasBonusTx);

		return NextResponse.json({
			...user,
			verified: isVerified,
			staffSubscription: isStaffSubActive,
			connections: sanitizedConnections,
			vanityUnlocked: Boolean(user.vanityUnlocked || user.vanitySlug),
			appearance: appearance || {},
			credits: credits ? { ...credits, signInBonusClaimed } : { balance: 0, streak: 0, signInBonusClaimed: false },
			level: (levels && levels[0]) || { level: 1, xp: 0 },
			levels: levels || [],
			subscriptions: resolvedSubscriptions,
			organizations: organizations || [],
			ownedBots: ownedBots || [],
			ownedServers: ownedServers || [],
			userOrganizations,
			communityStats: {
				verifiedIssuesCount: verifiedIssuesCount || 0,
				approvedSuggestionsCount: approvedSuggestionsCount || 0,
			},
		});
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

const SIGN_IN_BONUS_AMOUNT = 1000;
const DEFAULT_JOIN_ROLE_ID = '1b333119-d818-4fb1-a5dc-12621fd14198';

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
			delete userBody.staffSubscription;
			delete userBody.verified;
			delete userBody.vanityUnlocked;
			delete userBody.stripeCustomerId;
		}

		// Fetch default join roles
		const joinRolesSetting = await models.core.Setting.findOne({ id: 'join_roles' }).lean();
		let joinRoles: string[] = [];
		try {
			joinRoles = JSON.parse(joinRolesSetting?.value || '[]');
		} catch {}
		const mergedRoles = Array.from(new Set([...(existingUser?.roles || []), ...(isStaffOrSystem ? userBody.roles || [] : []), DEFAULT_JOIN_ROLE_ID, ...joinRoles].filter(Boolean)));

		let userDoc: any = existingUser;
		let rolesJustGranted = false;

		if (!existingUser) {
			const created = await models.users.User.create({ ...userBody, roles: mergedRoles, id });
			userDoc = created?.toObject ? created.toObject() : created;
			rolesJustGranted = mergedRoles.length > 0;
		} else {
			const hadRoles = Array.isArray(existingUser.roles) && existingUser.roles.length > 0;
			const backfillUpdates: Record<string, any> = { roles: mergedRoles };
			if (!existingUser.name && userBody.name) backfillUpdates.name = userBody.name;
			if (!existingUser.email && userBody.email) backfillUpdates.email = userBody.email;
			if (existingUser.agreedTerms && existingUser.agreedPrivacy && !existingUser.verified) {
				backfillUpdates.verified = true;
			}
			userDoc = await models.users.User.findOneAndUpdate({ id }, { $set: backfillUpdates }, { returnDocument: 'after', runValidators: true }).lean();
			rolesJustGranted = !hadRoles && mergedRoles.length > 0;
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
			const hasBonusTx = Array.isArray(existingCredit.transactions) && existingCredit.transactions.some((t: any) => t?.itemId === 'signin_bonus');
			const alreadyClaimed = Boolean(existingCredit.signInBonusClaimed || hasBonusTx);
			if (!alreadyClaimed) {
				creditDoc = await models.users.Credit.findOneAndUpdate(
					{ ownerId: id },
					{
						$inc: { balance: SIGN_IN_BONUS_AMOUNT },
						$set: { signInBonusClaimed: true },
						$push: { transactions: { $each: [bonusTx], $position: 0 } },
					},
					{ returnDocument: 'after', runValidators: true }
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
			delete userBody.staffSubscription;
			delete userBody.vanityUnlocked;
			delete userBody.stripeCustomerId;
			if (!(userBody.agreedTerms && userBody.agreedPrivacy)) {
				delete userBody.verified;
			}
		}

		const unsetFields: Record<string, 1> = {};
		const isVanityAlreadyUnlocked = Boolean(existingDoc?.vanityUnlocked || existingDoc?.vanitySlug || (isStaffOrSystem && userBody.vanityUnlocked));

		if (userBody.action === 'sync_roles') {
			const db = await database('xernerx');
			await syncUserRoles(resolvedId, db);
			await recordAuditLog(req, {
				action: 'user.roles.sync',
				targetType: 'user',
				targetId: resolvedId,
				summary: `Synced Discord roles for user "${existingDoc?.name || resolvedId}"`,
			});
			return NextResponse.json({ success: true });
		}

		if (userBody.action === 'send_notification') {
			const notifTitle = String(userBody.title || '').trim();
			const notifMessage = String(userBody.message || '').trim();
			const notifType = (['info', 'success', 'warning', 'error'].includes(userBody.type) ? userBody.type : 'info') as 'info' | 'success' | 'warning' | 'error';
			const notifLink = userBody.link ? String(userBody.link).trim() : null;
			if (!notifTitle || !notifMessage) {
				return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 });
			}
			await sendUserNotification({
				targetId: resolvedId,
				type: notifType,
				title: notifTitle,
				message: notifMessage,
				link: notifLink,
			});
			await recordAuditLog(req, {
				action: 'user.notify',
				targetType: 'user',
				targetId: resolvedId,
				summary: `Sent notification "${notifTitle}" to user "${existingDoc?.name || resolvedId}"`,
				metadata: { type: notifType, title: notifTitle, link: notifLink },
			});
			return NextResponse.json({ success: true });
		}

		if (userBody.agreedTerms && userBody.agreedPrivacy) {
			userBody.verified = true;
		} else if (userBody.verified === true) {
			const now = new Date();
			if (!existingDoc?.agreedTerms && !userBody.agreedTerms) userBody.agreedTerms = now;
			if (!existingDoc?.agreedPrivacy && !userBody.agreedPrivacy) userBody.agreedPrivacy = now;
		} else if (userBody.verified === false) {
			userBody.agreedTerms = null;
			userBody.agreedPrivacy = null;
		}

		if (userBody.action === 'unlock_vanity') {
			delete userBody.action;
			if (!isVanityAlreadyUnlocked) {
				const unlockRes = await unlockVanityWithUserCredits(models, resolvedId, existingDoc?.name || `User ${resolvedId}`);
				if (!unlockRes.ok) {
					return NextResponse.json({ error: unlockRes.error }, { status: 403 });
				}
				const unlockedUser = await models.users.User.findOneAndUpdate({ id: resolvedId }, { $set: { vanityUnlocked: true } }, { returnDocument: 'after', runValidators: true }).lean();
				return NextResponse.json({
					...unlockedUser,
					vanityUnlocked: true,
					vanitySlug: unlockedUser?.vanitySlug || '',
					credits: unlockRes.credits || {},
					usedSlot: unlockRes.usedSlot,
					cost: unlockRes.cost,
				});
			}
			return NextResponse.json({ ...existingDoc, vanityUnlocked: true, vanitySlug: existingDoc?.vanitySlug || '' });
		}

		delete userBody.action;

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

		// findOneAndUpdate with { returnDocument: 'after' } returns the updated document rather than the old one
		const updatedUser =
			Object.keys(mongoUpdate).length > 0 ? await models.users.User.findOneAndUpdate({ id: resolvedId }, mongoUpdate, { returnDocument: 'after', runValidators: true }).lean() : existingDoc;

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

				// Trigger background sync across Discord servers
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

		const existingCredits = (await models.users.Credit.findOne({ ownerId: resolvedId }).lean()) as any;
		const effectiveUnlockedBadges: string[] = Array.isArray(credits?.unlockedBadges)
			? credits.unlockedBadges.map(String)
			: Array.isArray(existingCredits?.unlockedBadges)
				? existingCredits.unlockedBadges.map(String)
				: [];

		const CHILD_TO_BUNDLE_MAP: Record<string, string> = {
			ambient_mesh_lava: 'ambient_scenes_pack',
			ambient_cyber_grid: 'ambient_scenes_pack',
			ambient_topography: 'ambient_scenes_pack',
			ambient_nebula_cosmos: 'ambient_scenes_pack',
			ambient_prism_caustics: 'ambient_scenes_pack',
			surface_crystal: 'surface_styles_pack',
			surface_holographic: 'surface_styles_pack',
			surface_neon: 'surface_styles_pack',
			surface_obsidian: 'surface_styles_pack',
			frame_plasma_ring: 'profile_frames_pack',
			frame_holo_crown: 'profile_frames_pack',
			frame_cyber_hex: 'profile_frames_pack',
			frame_solar_flare: 'profile_frames_pack',
			nameplate_aurora_wave: 'profile_nameplates_pack',
			nameplate_synth_horizon: 'profile_nameplates_pack',
			nameplate_nebula_shimmer: 'profile_nameplates_pack',
			nameplate_cyber_circuit: 'profile_nameplates_pack',
			cursor_starlight_trail: 'cursor_fx_bundle',
			cursor_plasma_sparks: 'cursor_fx_bundle',
			cursor_cyber_reticle: 'cursor_fx_bundle',
			cursor_sonic_rings: 'cursor_fx_bundle',
			cursor_aurora_ribbon: 'cursor_fx_bundle',
			skin_hud_tactical: 'overlay_skins_bundle',
			skin_frosted_prism: 'overlay_skins_bundle',
			skin_neon_arcade: 'overlay_skins_bundle',
			skin_minimal_pill: 'overlay_skins_bundle',
		};
		const hasCosmeticBadge = (reqBadge?: string) => {
			if (!reqBadge) return true;
			if (effectiveUnlockedBadges.includes(reqBadge)) return true;
			const parentBundle = CHILD_TO_BUNDLE_MAP[reqBadge];
			return Boolean(parentBundle && effectiveUnlockedBadges.includes(parentBundle));
		};

		let updatedAppearance: any = null;
		if (appearance) {
			const { uiPreferences, _id: _aId, __v: _aV, createdAt: _aCreated, updatedAt: _aUpdated, ownerId: _aOwner, ...restAppearance } = appearance;
			const appearanceUpdate: Record<string, any> = { ...restAppearance };
			if (uiPreferences && typeof uiPreferences === 'object') {
				const typeUnlock: Record<string, string> = {
					orbit: 'dot_matrix_banner',
					vortex: 'dot_matrix_banner',
					helix: 'dot_matrix_banner',
					prism: 'dot_matrix_banner',
					infinity: 'dot_matrix_banner',
					wavegrid: 'dot_matrix_banner',
					chronos: 'stage_constellation',
					supernova: 'stage_constellation',
					tesseract: 'stage_hexgrid',
					synthwave: 'stage_aurora',
					lotus: 'stage_glyphs',
				};
				const renderUnlock: Record<string, string> = {
					constellation: 'stage_constellation',
					hexgrid: 'stage_hexgrid',
					aurora: 'stage_aurora',
					glyphs: 'stage_glyphs',
				};
				const wcUnlock: Record<string, string> = {
					capsule: 'window_styles_pack',
					squircle: 'window_styles_pack',
					minimal: 'window_styles_pack',
				};
				const iconUnlock: Record<string, string> = {
					duotone: 'ui_icon_packs',
					bold: 'ui_icon_packs',
					precision: 'ui_icon_packs',
				};
				const sceneUnlock: Record<string, string> = {
					mesh_lava: 'ambient_mesh_lava',
					cyber_grid: 'ambient_cyber_grid',
					topography: 'ambient_topography',
					nebula_cosmos: 'ambient_nebula_cosmos',
					prism_caustics: 'ambient_prism_caustics',
				};
				const surfUnlock: Record<string, string> = {
					crystal: 'surface_crystal',
					holographic: 'surface_holographic',
					neon: 'surface_neon',
					obsidian: 'surface_obsidian',
				};
				const fxUnlock: Record<string, string> = {
					starlight_trail: 'cursor_starlight_trail',
					plasma_sparks: 'cursor_plasma_sparks',
					cyber_reticle: 'cursor_cyber_reticle',
					sonic_rings: 'cursor_sonic_rings',
					aurora_ribbon: 'cursor_aurora_ribbon',
				};
				const skinUnlock: Record<string, string> = {
					hud_tactical: 'skin_hud_tactical',
					frosted_prism: 'skin_frosted_prism',
					neon_arcade: 'skin_neon_arcade',
					minimal_pill: 'skin_minimal_pill',
				};

				for (const [k, rawVal] of Object.entries(uiPreferences)) {
					let v = rawVal;
					if (k === 'dotMatrixType' && typeof v === 'string' && !hasCosmeticBadge(typeUnlock[v])) v = 'default';
					if (k === 'dotMatrixRenderStyle' && typeof v === 'string' && !hasCosmeticBadge(renderUnlock[v])) v = 'dots';
					if (k === 'windowControls' && typeof v === 'string' && !hasCosmeticBadge(wcUnlock[v])) v = 'system';
					if (k === 'uiIconStyle' && typeof v === 'string' && !hasCosmeticBadge(iconUnlock[v])) v = 'standard';
					if (k === 'ambientScene' && typeof v === 'string' && !hasCosmeticBadge(sceneUnlock[v])) v = 'default';
					if (k === 'surfaceStyle' && typeof v === 'string' && !hasCosmeticBadge(surfUnlock[v])) v = 'default';
					if (k === 'cursorFx' && typeof v === 'string' && !hasCosmeticBadge(fxUnlock[v])) v = 'default';
					if (k === 'overlaySkin' && typeof v === 'string' && !hasCosmeticBadge(skinUnlock[v])) v = 'default';
					appearanceUpdate[`uiPreferences.${k}`] = v;
				}
			}
			updatedAppearance = await models.users.Appearance.findOneAndUpdate(
				{ ownerId: resolvedId },
				{ $set: appearanceUpdate },
				{ upsert: true, returnDocument: 'after', runValidators: true }
			).lean();
		} else {
			updatedAppearance = await models.users.Appearance.findOne({ ownerId: resolvedId }).lean();
		}

		let updatedCredits: any = null;
		if (credits) {
			const { _id: _cId, __v: _cV, createdAt: _cCreated, updatedAt: _cUpdated, ownerId: _cOwner, ...cleanCredits } = credits;
			if (cleanCredits.profileCosmetics && typeof cleanCredits.profileCosmetics === 'object') {
				const frameUnlock: Record<string, string> = {
					plasma_ring: 'frame_plasma_ring',
					holo_crown: 'frame_holo_crown',
					cyber_hex: 'frame_cyber_hex',
					solar_flare: 'frame_solar_flare',
				};
				const npUnlock: Record<string, string> = {
					aurora_wave: 'nameplate_aurora_wave',
					synth_horizon: 'nameplate_synth_horizon',
					nebula_shimmer: 'nameplate_nebula_shimmer',
					cyber_circuit: 'nameplate_cyber_circuit',
				};
				const cardUnlock: Record<string, string> = {
					holographic: 'nameplate_aurora_wave',
					celestial: 'nameplate_synth_horizon',
					cyber_neon: 'nameplate_nebula_shimmer',
					obsidian_gold: 'nameplate_cyber_circuit',
				};
				const reqFrame = String(cleanCredits.profileCosmetics.avatarFrame || 'none');
				const reqNp = String(cleanCredits.profileCosmetics.nameplate || 'none');
				const reqCard = String(cleanCredits.profileCosmetics.cardTheme || 'default');
				cleanCredits.profileCosmetics = {
					avatarFrame: hasCosmeticBadge(frameUnlock[reqFrame]) ? reqFrame : 'none',
					nameplate: hasCosmeticBadge(npUnlock[reqNp]) ? reqNp : 'none',
					cardTheme: hasCosmeticBadge(cardUnlock[reqCard]) ? reqCard : 'default',
				};
			}
			if (cleanCredits.dotMatrixVariant !== undefined) {
				if (!hasCosmeticBadge('dot_matrix_banner')) {
					cleanCredits.dotMatrixVariant = existingCredits?.dotMatrixVariant || 'orbit';
				}
			}
			updatedCredits = await models.users.Credit.findOneAndUpdate({ ownerId: resolvedId }, { $set: cleanCredits }, { upsert: true, returnDocument: 'after', runValidators: true }).lean();
		} else {
			updatedCredits = existingCredits;
		}

		const existingLevel = level ? await models.users.Level.findOne({ ownerId: resolvedId }).lean() : null;
		let updatedLevel: any = null;
		if (level) {
			const { _id: _lId, __v: _lV, createdAt: _lCreated, updatedAt: _lUpdated, ownerId: _lOwner, ...cleanLevel } = level;
			updatedLevel = await models.users.Level.findOneAndUpdate({ ownerId: resolvedId }, { $set: cleanLevel }, { upsert: true, returnDocument: 'after', runValidators: true }).lean();
		} else {
			updatedLevel = await models.users.Level.findOne({ ownerId: resolvedId }).lean();
		}

		const changes: string[] = [];
		const metaChanges: Record<string, any> = {};

		if (userBody.name !== undefined && (existingDoc?.name || null) !== (updatedUser.name || null)) {
			changes.push(`name: "${existingDoc?.name || ''}" → "${updatedUser.name || ''}"`);
			metaChanges.name = updatedUser.name || null;
		}
		if (userBody.privacy !== undefined && (existingDoc?.privacy || 'public') !== (updatedUser.privacy || 'public')) {
			changes.push(`privacy: ${existingDoc?.privacy || 'public'} → ${updatedUser.privacy}`);
			metaChanges.privacy = updatedUser.privacy;
		}
		if (userBody.description !== undefined && (existingDoc?.description || null) !== (updatedUser.description || null)) {
			changes.push('description updated');
			metaChanges.descriptionUpdated = true;
		}
		if (userBody.info !== undefined && (existingDoc?.info || null) !== (updatedUser.info || null)) {
			changes.push('info updated');
			metaChanges.infoUpdated = true;
		}
		if (typeof userBody.verified === 'boolean' && Boolean(existingDoc?.verified) !== Boolean(updatedUser.verified)) {
			changes.push(`verified: ${updatedUser.verified ? 'true' : 'false'}`);
			metaChanges.verified = Boolean(updatedUser.verified);
		}
		if (typeof userBody.widgets === 'boolean' && Boolean((existingDoc as any)?.widgets) !== Boolean((updatedUser as any).widgets)) {
			changes.push(`widgets: ${(updatedUser as any).widgets ? 'enabled' : 'disabled'}`);
			metaChanges.widgets = Boolean((updatedUser as any).widgets);
		}
		if (userBody.email !== undefined && (existingDoc?.email || '') !== (updatedUser.email || '')) {
			changes.push(`email: "${existingDoc?.email || ''}" → "${updatedUser.email || ''}"`);
			metaChanges.email = updatedUser.email || '';
		}
		if (userBody.icon !== undefined && (existingDoc?.icon || '') !== (updatedUser.icon || '')) {
			changes.push('avatar URL updated');
			metaChanges.icon = updatedUser.icon || '';
		}
		if (Array.isArray(userBody.showcases) && (existingDoc?.showcases?.length || 0) !== (updatedUser.showcases?.length || 0)) {
			changes.push(`showcases: ${existingDoc?.showcases?.length || 0} → ${updatedUser.showcases?.length || 0}`);
			metaChanges.showcasesCount = updatedUser.showcases?.length || 0;
		}
		if (Array.isArray(userBody.connections) && (existingDoc?.connections?.length || 0) !== (updatedUser.connections?.length || 0)) {
			changes.push(`connections: ${existingDoc?.connections?.length || 0} → ${updatedUser.connections?.length || 0}`);
			metaChanges.connectionsCount = updatedUser.connections?.length || 0;
		}
		if (Array.isArray(userBody.devices) && (existingDoc?.devices?.length || 0) !== (updatedUser.devices?.length || 0)) {
			changes.push(`devices: ${existingDoc?.devices?.length || 0} → ${updatedUser.devices?.length || 0}`);
			metaChanges.devicesCount = updatedUser.devices?.length || 0;
		}
		if (userBody.stripeCustomerId !== undefined && ((existingDoc as any)?.stripeCustomerId || null) !== ((updatedUser as any).stripeCustomerId || null)) {
			changes.push(`stripeCustomerId: ${(existingDoc as any)?.stripeCustomerId || 'none'} → ${(updatedUser as any).stripeCustomerId || 'none'}`);
			metaChanges.stripeCustomerId = (updatedUser as any).stripeCustomerId || null;
		}
		if (typeof userBody.staffSubscription === 'boolean' && Boolean((existingDoc as any)?.staffSubscription) !== userBody.staffSubscription) {
			changes.push(`staffSubscription: ${userBody.staffSubscription ? 'enabled' : 'disabled'}`);
			metaChanges.staffSubscription = userBody.staffSubscription;
		}
		if ((userBody.vanitySlug !== undefined || unsetFields.vanitySlug) && (existingDoc?.vanitySlug || '') !== (updatedUser.vanitySlug || '')) {
			changes.push(`vanitySlug: "${existingDoc?.vanitySlug || ''}" → "${updatedUser.vanitySlug || ''}"`);
			metaChanges.vanitySlug = updatedUser.vanitySlug || '';
		}
		if (addedRoles.length > 0) {
			changes.push(`roles +[${addedRoles.join(', ')}]`);
			metaChanges.rolesAdded = addedRoles.join(', ');
		}
		if (removedRoles.length > 0) {
			changes.push(`roles -[${removedRoles.join(', ')}]`);
			metaChanges.rolesRemoved = removedRoles.join(', ');
		}
		if (credits) {
			const oldBalance = Number((existingCredits as any)?.balance) || 0;
			const newBalance = Number(updatedCredits?.balance) || 0;
			const oldStreak = Number((existingCredits as any)?.streak) || 0;
			const newStreak = Number(updatedCredits?.streak) || 0;
			if (credits.balance !== undefined && oldBalance !== newBalance) {
				changes.push(`credits: ${oldBalance} → ${newBalance}`);
				metaChanges.creditsBalance = `${oldBalance} → ${newBalance}`;
			}
			if (credits.streak !== undefined && oldStreak !== newStreak) {
				changes.push(`streak: ${oldStreak} → ${newStreak}`);
				metaChanges.creditsStreak = `${oldStreak} → ${newStreak}`;
			}
			const slotKeys = ['streakShields', 'extraBotSlots', 'extraCdnSlots', 'extraShowcaseSlots', 'extraVanitySlots', 'totalSpent'] as const;
			for (const sk of slotKeys) {
				if ((credits as any)[sk] !== undefined) {
					const oldVal = Number((existingCredits as any)?.[sk]) || 0;
					const newVal = Number((updatedCredits as any)?.[sk]) || 0;
					if (oldVal !== newVal) {
						changes.push(`${sk}: ${oldVal} → ${newVal}`);
						metaChanges[sk] = `${oldVal} → ${newVal}`;
					}
				}
			}
			if (Array.isArray(credits.unlockedBadges)) {
				const oldB = ((existingCredits as any)?.unlockedBadges || []).join(',');
				const newB = (updatedCredits?.unlockedBadges || []).join(',');
				if (oldB !== newB) {
					changes.push(`unlockedBadges: [${newB}]`);
					metaChanges.unlockedBadges = updatedCredits?.unlockedBadges || [];
				}
			}
		}
		if (level) {
			const oldLvl = Number((existingLevel as any)?.level) || 1;
			const newLvl = Number(updatedLevel?.level) || 1;
			const oldXp = Number((existingLevel as any)?.xp) || 0;
			const newXp = Number(updatedLevel?.xp) || 0;
			if (level.level !== undefined && oldLvl !== newLvl) {
				changes.push(`level: ${oldLvl} → ${newLvl}`);
				metaChanges.globalLevel = `${oldLvl} → ${newLvl}`;
			}
			if (level.xp !== undefined && oldXp !== newXp) {
				changes.push(`xp: ${oldXp} → ${newXp}`);
				metaChanges.globalXp = `${oldXp} → ${newXp}`;
			}
		}

		if (changes.length > 0) {
			await recordAuditLog(req, {
				action: 'user.update',
				targetType: 'user',
				targetId: resolvedId,
				summary: `Updated user "${updatedUser.name || resolvedId}" (${changes.join(', ')})`,
				metadata: metaChanges,
			});
		}

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
	try {
		const { id } = await params;
		const { models } = await database('xernerx');

		const targetUser = await models.users.User.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] })
			.select('id')
			.lean();
		const resolvedTargetId = targetUser?.id || id;

		const caller = await resolveCallerAuth(req, ['users']);
		const isStaffOrSystem = Boolean(caller.isSystemToken || caller.authorized);
		if (!isStaffOrSystem && caller.userId !== resolvedTargetId && caller.userId !== id) {
			return NextResponse.json({ error: 'Forbidden: You can only delete your own account.' }, { status: 403 });
		}

		const deletedUser = await models.users.User.findOneAndDelete({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] });

		if (!deletedUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const resolvedId = deletedUser.id;

		await models.users.Appearance.findOneAndDelete({ ownerId: resolvedId });
		await models.users.Credit.findOneAndDelete({ ownerId: resolvedId });
		await models.users.Level.deleteMany({ ownerId: resolvedId });
		await models.users.Subscription.deleteMany({ ownerId: resolvedId });

		await recordAuditLog(req, {
			action: 'user.delete',
			targetType: 'user',
			targetId: resolvedId,
			summary: `Deleted user "${deletedUser.name || resolvedId}"`,
			metadata: { email: deletedUser.email || null },
		});

		return NextResponse.json({ success: true, deletedId: resolvedId });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
