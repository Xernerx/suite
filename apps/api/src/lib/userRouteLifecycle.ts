/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';
import { mergeUserDevices, parseUserAgentDevice, type TrackedUserDevice } from './userRouteActions';

export async function handleGetUserById(req: NextRequest, id: string): Promise<NextResponse> {
	try {
		const requestedSecrets = req.nextUrl.searchParams.get('includeSecrets') === 'true';
		const { models } = await database('xernerx');

		const user = await models.users.User.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const resolvedId = user.id;
		const caller = await resolveCallerAuth(req, ['users']);
		const isSelfCaller = Boolean(!caller.isSystemToken && caller.userId && caller.userId === resolvedId);
		const includeSecrets = requestedSecrets && Boolean(caller.isSystemToken || caller.authorized || isSelfCaller || caller.userId === id);

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
		if (isStaffSubActive && !hasStaffSubRecord) {
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

		const hasBonusTx = Array.isArray((credits as any)?.transactions) && (credits as any).transactions.some((tx: any) => tx?.itemId === 'signin_bonus');
		const signInBonusClaimed = Boolean((credits as any)?.signInBonusClaimed || hasBonusTx);
		const isTombstone = (Boolean((user as any).blacklisted) || (user as any).services === false) && !user.name && !user.email && (!Array.isArray(user.roles) || user.roles.length === 0);

		let resolvedDevices: TrackedUserDevice[] = Array.isArray((user as any).devices) ? (user as any).devices : [];
		if (!isTombstone) {
			if (isSelfCaller) {
				const liveDevice = parseUserAgentDevice(req.headers.get('user-agent'));
				if (liveDevice) {
					const merged = mergeUserDevices(resolvedDevices, liveDevice);
					resolvedDevices = merged.devices;
					if (merged.shouldPersist) {
						await models.users.User.updateOne({ id: resolvedId }, { $set: { devices: resolvedDevices } }).catch(() => {});
					}
				}
			}

			const hasWebSignInEvidence = Boolean(user.agreedTerms || user.agreedPrivacy || user.email || (user as any).onboarding?.suiteIntroCompleted || (user as any).onboarding?.completedAt);
			const revokedAtMs = (user as any).sessionRevokedAt ? new Date((user as any).sessionRevokedAt).getTime() : 0;
			const lastAuthEvidenceMs = Math.max(
				user.agreedTerms ? new Date(user.agreedTerms).getTime() : 0,
				user.agreedPrivacy ? new Date(user.agreedPrivacy).getTime() : 0,
				(user as any).onboarding?.completedAt ? new Date((user as any).onboarding.completedAt).getTime() : 0
			);
			if (resolvedDevices.length === 0 && hasWebSignInEvidence && (!revokedAtMs || lastAuthEvidenceMs > revokedAtMs)) {
				const fallbackLastActive =
					(user as any).seen || (user as any).onboarding?.completedAt || user.agreedTerms || user.agreedPrivacy || (user as any).updatedAt || (user as any).createdAt || new Date();
				resolvedDevices = [
					{
						id: 'web-oauth-session',
						browser: 'Discord OAuth2',
						os: 'Web Session',
						deviceType: 'desktop',
						lastActive: new Date(fallbackLastActive),
					},
				];
				await models.users.User.updateOne({ id: resolvedId }, { $set: { devices: resolvedDevices } }).catch(() => {});
			}
		}

		return NextResponse.json({
			...user,
			devices: resolvedDevices,
			verified: isVerified,
			blacklisted: Boolean((user as any).blacklisted),
			services: (user as any).services !== false,
			tombstone: isTombstone,
			sessionVersion: Number((user as any).sessionVersion) || 1,
			sessionRevokedAt: (user as any).sessionRevokedAt || null,
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

export function normalizeUserOnboardingAndVerification(userBody: Record<string, any>, existingDoc: any): void {
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

	if (userBody.onboarding && typeof userBody.onboarding === 'object') {
		const prevOnboarding = (existingDoc as any)?.onboarding || {};
		const prevBots = Array.isArray(prevOnboarding.onboardedBots) ? prevOnboarding.onboardedBots.map(String) : [];
		const incomingBots = Array.isArray(userBody.onboarding.onboardedBots) ? userBody.onboarding.onboardedBots.map(String) : [];
		const mergedBots = Array.from(new Set([...prevBots, ...incomingBots].filter(Boolean)));
		const validPersonas = ['user', 'developer', 'both'];
		const validTourPhases = ['header', 'sidebar', 'dashboard', 'portal', 'explore', 'ready'];
		const nextTourPostponed = typeof userBody.onboarding.tourPostponed === 'boolean' ? userBody.onboarding.tourPostponed : Boolean(prevOnboarding.tourPostponed);
		const rawPostponedPhase = userBody.onboarding.tourPostponedPhase !== undefined ? userBody.onboarding.tourPostponedPhase : prevOnboarding.tourPostponedPhase;
		userBody.onboarding = {
			persona: validPersonas.includes(userBody.onboarding.persona) ? userBody.onboarding.persona : validPersonas.includes(prevOnboarding.persona) ? prevOnboarding.persona : 'user',
			suiteIntroCompleted: Boolean(userBody.onboarding.suiteIntroCompleted ?? prevOnboarding.suiteIntroCompleted),
			dashboardTourCompleted: Boolean(userBody.onboarding.dashboardTourCompleted ?? prevOnboarding.dashboardTourCompleted),
			supportPromptCompleted: Boolean(userBody.onboarding.supportPromptCompleted ?? prevOnboarding.supportPromptCompleted),
			tourPostponed: nextTourPostponed,
			tourPostponedPhase: nextTourPostponed && validTourPhases.includes(rawPostponedPhase) ? rawPostponedPhase : null,
			completedAt:
				nextTourPostponed || userBody.onboarding.completedAt === null ? null : userBody.onboarding.completedAt ? new Date(userBody.onboarding.completedAt) : prevOnboarding.completedAt || null,
			onboardedBots: mergedBots,
		};
	}
}

export async function handleDeleteUserById(req: NextRequest, id: string): Promise<NextResponse> {
	try {
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
		let wasBlacklisted = Boolean((deletedUser as any).blacklisted);
		let wasServicesOptOut = (deletedUser as any).services === false;

		const DispatchInvite = (models.dispatch as any)?.Invite;
		await Promise.all([
			models.users.Appearance.findOneAndDelete({ ownerId: resolvedId }),
			models.users.Credit.findOneAndDelete({ ownerId: resolvedId }),
			models.users.Level.deleteMany({ ownerId: resolvedId }),
			models.users.Subscription.deleteMany({ ownerId: resolvedId }),
			DispatchInvite?.deleteMany({ targetId: resolvedId }).catch(() => null),
			DispatchInvite?.updateMany({ targetId: 'global', $or: [{ readBy: resolvedId }, { deletedBy: resolvedId }] }, { $pull: { readBy: resolvedId, deletedBy: resolvedId } }).catch(() => null),
		]);

		try {
			const virtueDb = await database('virtue');
			const VUserModel = (virtueDb.models.profiles as any)?.User;
			if (VUserModel) {
				const existingVirtueUser = (await VUserModel.findOne({ id: resolvedId })
					.lean()
					.catch(() => null)) as any;
				if (existingVirtueUser?.blacklisted) wasBlacklisted = true;
				if (existingVirtueUser?.services === false) wasServicesOptOut = true;
			}
			const virtueModelsToDelete = Array.from(
				new Set(
					[
						VUserModel,
						(virtueDb.models.levels as any)?.Level,
						(virtueDb.models.levels as any)?.Text,
						(virtueDb.models.levels as any)?.Voice,
						(virtueDb.models.profiles as any)?.Level,
						(virtueDb.models.profiles as any)?.Text,
						(virtueDb.models.profiles as any)?.Voice,
					].filter(Boolean)
				)
			);
			await Promise.all(virtueModelsToDelete.map((m: any) => m.deleteMany({ id: resolvedId }).catch(() => null)));

			if ((wasBlacklisted || wasServicesOptOut) && VUserModel) {
				const virtueTombstone: Record<string, any> = {
					id: resolvedId,
					...(wasBlacklisted ? { blacklisted: true } : {}),
					...(wasServicesOptOut ? { services: false } : {}),
				};
				await VUserModel.collection.replaceOne({ id: resolvedId }, virtueTombstone, { upsert: true }).catch(() => null);
			}
		} catch {}

		if (wasBlacklisted || wasServicesOptOut) {
			const tombstoneDoc: Record<string, any> = {
				id: resolvedId,
				...(wasBlacklisted ? { blacklisted: true } : {}),
				...(wasServicesOptOut ? { services: false } : {}),
			};
			await models.users.User.collection.replaceOne({ id: resolvedId }, tombstoneDoc, { upsert: true });
		}

		await recordAuditLog(req, {
			action: 'user.delete',
			targetType: 'user',
			targetId: resolvedId,
			summary: `Deleted user "${deletedUser.name || resolvedId}"${wasBlacklisted || wasServicesOptOut ? ' (tombstone persisted)' : ''}`,
			metadata: {
				email: deletedUser.email || null,
				tombstonePersisted: wasBlacklisted || wasServicesOptOut,
				...(wasBlacklisted ? { blacklisted: true } : {}),
				...(wasServicesOptOut ? { services: false } : {}),
			},
		});

		return NextResponse.json({
			success: true,
			deletedId: resolvedId,
			tombstonePersisted: wasBlacklisted || wasServicesOptOut,
		});
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
