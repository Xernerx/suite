/** @format */

import {
	type DiscordProfile,
	type FullUser,
	getNormalizedRoles,
	getUserPersona,
	getUserTourStatus,
	type Role,
	type UserConnectionItem,
	type UserDeviceItem,
	type UserPersona,
	type UserShowcaseItem,
	type UserSummary,
} from './types';

export interface UserModalDraft {
	name: string;
	icon: string;
	email: string;
	selectedRoleIds: string[];
	stripeCustomerId: string;
	description: string;
	info: string;
	privacy: string;
	persona: UserPersona;
	tourCompleted: boolean;
	verified: boolean;
	vanityUnlocked: boolean;
	vanitySlug: string;
	widgets: boolean;
	blacklisted: boolean;
	shadowban: boolean;
	services: boolean;
	staffSubscription: boolean;
	pronouns: string;
	gender: string;
	birthday: string;
	timezone: string;
	credits: number;
	streak: number;
	streakShields: number;
	totalSpent: number;
	globalLevel: number;
	globalXp: number;
	extraBotSlots: number;
	extraCdnSlots: number;
	extraShowcaseSlots: number;
	extraVanitySlots: number;
	referredBy: string;
	referralBonusClaimed: boolean;
	dotMatrixVariant: string;
	unlockedBadges: string[];
	activeBadges: string[];
	claimedAchievements: string[];
	showcases: UserShowcaseItem[];
	connections: UserConnectionItem[];
	devices: UserDeviceItem[];
}

export function isUserModalDirty(fullUser: FullUser | null, d: UserModalDraft): boolean {
	if (!fullUser) return false;
	const rolesChanged = JSON.stringify([...d.selectedRoleIds].sort()) !== JSON.stringify([...getNormalizedRoles(fullUser)].sort());
	const origBirthday = fullUser.birthday ? String(fullUser.birthday).slice(0, 10) : '';
	return (
		d.name !== (fullUser.name || '') ||
		d.icon !== (fullUser.icon || '') ||
		d.email !== (fullUser.email || '') ||
		rolesChanged ||
		d.stripeCustomerId !== (fullUser.stripeCustomerId || '') ||
		d.description !== (fullUser.description || '') ||
		d.info !== (fullUser.info || '') ||
		d.privacy !== (fullUser.privacy || 'private') ||
		d.persona !== getUserPersona(fullUser) ||
		d.tourCompleted !== (getUserTourStatus(fullUser) === 'completed') ||
		d.verified !== Boolean(fullUser.verified || (fullUser.agreedTerms && fullUser.agreedPrivacy)) ||
		d.vanityUnlocked !== Boolean(fullUser.vanityUnlocked || fullUser.vanitySlug) ||
		d.vanitySlug !== (fullUser.vanitySlug || '') ||
		d.widgets !== Boolean(fullUser.widgets) ||
		d.blacklisted !== Boolean(fullUser.blacklisted) ||
		d.shadowban !== Boolean(fullUser.shadowban) ||
		d.services !== (fullUser.services !== false) ||
		d.staffSubscription !== Boolean(fullUser.staffSubscription) ||
		d.pronouns !== (fullUser.pronouns || '') ||
		d.gender !== (fullUser.gender || '') ||
		d.birthday !== origBirthday ||
		d.timezone !== (fullUser.timezone || '') ||
		d.credits !== (fullUser.credits?.balance || 0) ||
		d.streak !== (fullUser.credits?.streak || 0) ||
		d.streakShields !== (fullUser.credits?.streakShields || 0) ||
		d.totalSpent !== (fullUser.credits?.totalSpent || 0) ||
		d.globalLevel !== (fullUser.level?.level ?? 1) ||
		d.globalXp !== (fullUser.level?.xp ?? 0) ||
		d.extraBotSlots !== (fullUser.credits?.extraBotSlots || 0) ||
		d.extraCdnSlots !== (fullUser.credits?.extraCdnSlots || 0) ||
		d.extraShowcaseSlots !== (fullUser.credits?.extraShowcaseSlots || 0) ||
		d.extraVanitySlots !== (fullUser.credits?.extraVanitySlots || 0) ||
		d.referredBy !== (fullUser.credits?.referredBy || '') ||
		d.referralBonusClaimed !== Boolean(fullUser.credits?.referralBonusClaimed) ||
		d.dotMatrixVariant !== (fullUser.credits?.dotMatrixVariant || 'orbit') ||
		JSON.stringify(d.unlockedBadges) !== JSON.stringify(fullUser.credits?.unlockedBadges || []) ||
		JSON.stringify(d.activeBadges) !== JSON.stringify(fullUser.credits?.activeBadges || []) ||
		JSON.stringify(d.claimedAchievements) !== JSON.stringify(fullUser.credits?.claimedAchievements || []) ||
		JSON.stringify(d.showcases) !== JSON.stringify(fullUser.showcases || []) ||
		JSON.stringify(d.connections) !== JSON.stringify(fullUser.connections || []) ||
		JSON.stringify(d.devices) !== JSON.stringify(fullUser.devices || [])
	);
}

export function buildUserPatchRequest(fullUser: FullUser | null, d: UserModalDraft) {
	const creditsPayload = {
		balance: d.credits,
		streak: d.streak,
		streakShields: d.streakShields,
		totalSpent: d.totalSpent,
		extraBotSlots: d.extraBotSlots,
		extraCdnSlots: d.extraCdnSlots,
		extraShowcaseSlots: d.extraShowcaseSlots,
		extraVanitySlots: d.extraVanitySlots,
		referredBy: d.referredBy.trim() || null,
		referralBonusClaimed: d.referralBonusClaimed,
		dotMatrixVariant: d.dotMatrixVariant,
		unlockedBadges: d.unlockedBadges,
		activeBadges: d.activeBadges,
		claimedAchievements: d.claimedAchievements,
	};

	const onboardingPayload = {
		...(fullUser?.onboarding || {}),
		persona: d.persona,
		...(d.tourCompleted
			? {
					suiteIntroCompleted: true,
					dashboardTourCompleted: true,
					supportPromptCompleted: true,
					tourPostponed: false,
					tourPostponedPhase: null,
					completedAt: fullUser?.onboarding?.completedAt || new Date().toISOString(),
				}
			: {
					dashboardTourCompleted: false,
					completedAt: null,
				}),
	};

	const body = {
		name: d.name,
		icon: d.icon.trim() || '',
		email: d.email.trim() || '',
		roles: d.selectedRoleIds,
		stripeCustomerId: d.stripeCustomerId.trim() || null,
		description: d.description,
		info: d.info,
		privacy: d.privacy,
		onboarding: onboardingPayload,
		verified: d.verified,
		vanityUnlocked: d.vanityUnlocked || Boolean(d.vanitySlug.trim()),
		vanitySlug: d.vanitySlug.trim(),
		widgets: d.widgets,
		blacklisted: d.blacklisted,
		shadowban: d.shadowban,
		services: d.services,
		staffSubscription: d.staffSubscription,
		pronouns: d.pronouns.trim() || '',
		gender: d.gender || undefined,
		birthday: d.birthday.trim() || null,
		timezone: d.timezone.trim() || '',
		showcases: d.showcases,
		connections: d.connections,
		devices: d.devices,
		credits: creditsPayload,
		level: {
			level: Math.max(0, d.globalLevel),
			xp: Math.max(0, d.globalXp),
		},
	};

	return { creditsPayload, onboardingPayload, body };
}

export function buildUpdatedFullUser(fullUser: FullUser | null, updated: any, d: UserModalDraft, creditsPayload: any, onboardingPayload: any): FullUser {
	return {
		...(fullUser as FullUser),
		...updated,
		name: d.name,
		icon: d.icon,
		email: d.email,
		roles: d.selectedRoleIds,
		stripeCustomerId: d.stripeCustomerId.trim() || undefined,
		description: d.description,
		info: d.info,
		privacy: d.privacy,
		onboarding: updated?.onboarding || onboardingPayload,
		verified: d.verified,
		...(d.verified === false ? { agreedTerms: null, agreedPrivacy: null } : {}),
		vanityUnlocked: d.vanityUnlocked || Boolean(d.vanitySlug.trim()),
		vanitySlug: d.vanitySlug.trim(),
		widgets: d.widgets,
		blacklisted: d.blacklisted,
		shadowban: d.shadowban,
		services: d.services,
		staffSubscription: d.staffSubscription,
		pronouns: d.pronouns,
		gender: d.gender,
		birthday: d.birthday.trim() || undefined,
		timezone: d.timezone,
		showcases: d.showcases,
		connections: d.connections,
		devices: d.devices,
		credits: { ...fullUser?.credits, ...creditsPayload },
		level: { level: Math.max(0, d.globalLevel), xp: Math.max(0, d.globalXp) },
	};
}

export async function syncUserDiscordRoles(params: {
	userId: string;
	roles: Role[];
	previousRoles: string[];
	selectedRoleIds: string[];
	getEnvUrl: (url: string) => string;
	onRoleError: (isAssigned: boolean, message: string) => void;
}) {
	const { userId, roles, previousRoles, selectedRoleIds, getEnvUrl, onRoleError } = params;
	for (const r of roles) {
		const discordRoleId = r.role;
		if (!discordRoleId || !r.sync) continue;
		const wasAssigned = previousRoles.includes(r.id);
		const isAssigned = selectedRoleIds.includes(r.id);
		if (wasAssigned === isAssigned) continue;
		await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}/discord/roles`), {
			method: isAssigned ? 'POST' : 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ roleId: discordRoleId }),
		}).catch((err) => {
			onRoleError(isAssigned, err.message);
		});
	}
}

export function buildUnverifiedFullUser(fullUser: FullUser | null, persona: UserPersona): FullUser {
	return {
		...(fullUser as FullUser),
		verified: false,
		agreedTerms: null,
		agreedPrivacy: null,
		onboarding: {
			persona,
			suiteIntroCompleted: false,
			dashboardTourCompleted: false,
			supportPromptCompleted: false,
			tourPostponed: false,
			tourPostponedPhase: null,
			completedAt: null,
			onboardedBots: fullUser?.onboarding?.onboardedBots || [],
		},
	};
}

export function resolveUserDisplayMedia(params: { user: UserSummary; discord: DiscordProfile | null; icon: string; fallbackName: string }) {
	const { user, discord, icon, fallbackName } = params;
	const avatarUrl =
		discord?.avatarUrl ||
		(discord?.avatar && user.id ? `https://cdn.discordapp.com/avatars/${user.id}/${discord.avatar}.${discord.avatar.startsWith('a_') ? 'gif' : 'png'}` : null) ||
		icon ||
		user.icon;
	const discordBanner = discord?.banner ? `https://cdn.discordapp.com/banners/${user.id}/${discord.banner}.${discord.banner.startsWith('a_') ? 'gif' : 'png'}?size=512` : null;
	const displayName = discord?.globalName || discord?.username || user.name || fallbackName;
	return { avatarUrl, discordBanner, displayName };
}
