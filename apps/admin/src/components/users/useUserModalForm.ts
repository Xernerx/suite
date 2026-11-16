/** @format */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDictionary, useToast, useUser } from '@xernerx/providers';
import {
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
import { buildUnverifiedFullUser, buildUpdatedFullUser, buildUserPatchRequest, isUserModalDirty, syncUserDiscordRoles, type UserModalDraft } from './userModalHelpers';

interface UseUserModalFormParams {
	open: boolean;
	user: UserSummary;
	roles: Role[];
	getEnvUrl: (url: string) => string;
	onUserDeleted: (id: string) => void;
	onUserUpdated: (updated: FullUser) => void;
}

export function useUserModalForm({ open, user, roles, getEnvUrl, onUserDeleted, onUserUpdated }: UseUserModalFormParams) {
	const { toast } = useToast();
	const { t } = useDictionary();
	const { user: currentUser, mutate: mutateCurrentUser } = useUser() as { user: any; mutate: () => Promise<void> };

	const [fullUser, setFullUser] = useState<FullUser | null>(null);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	const [name, setName] = useState(user.name || '');
	const [icon, setIcon] = useState(user.icon || '');
	const [email, setEmail] = useState('');
	const initialRoles = getNormalizedRoles(user);
	const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(initialRoles);
	const existingRoleIdSet = useMemo(() => new Set(roles.map((r) => r.id)), [roles]);
	const missingRoleCount = useMemo(() => selectedRoleIds.filter((rid) => Boolean(rid) && !existingRoleIdSet.has(rid)).length, [selectedRoleIds, existingRoleIdSet]);

	useEffect(() => {
		if (!open) {
			const latestRoles = getNormalizedRoles(user);
			setSelectedRoleIds(latestRoles);
			setFullUser((prev) => (prev ? { ...prev, roles: latestRoles } : prev));
		}
	}, [open, user.roles]);

	const [stripeCustomerId, setStripeCustomerId] = useState(user.stripeCustomerId || '');
	const [description, setDescription] = useState('');
	const [info, setInfo] = useState('');
	const [privacy, setPrivacy] = useState('private');
	const [persona, setPersona] = useState<UserPersona>(getUserPersona(user));
	const [tourCompleted, setTourCompleted] = useState(getUserTourStatus(user) === 'completed');
	const [verified, setVerified] = useState(Boolean(user.verified));
	const [vanityUnlocked, setVanityUnlocked] = useState(Boolean(user.vanitySlug));
	const [vanitySlug, setVanitySlug] = useState(user.vanitySlug || '');
	const [widgets, setWidgets] = useState(false);
	const [blacklisted, setBlacklisted] = useState(Boolean(user.blacklisted));
	const [shadowban, setShadowban] = useState(Boolean(user.shadowban));
	const [services, setServices] = useState(user.services !== false);
	const [staffSubscription, setStaffSubscription] = useState(false);
	const [pronouns, setPronouns] = useState('');
	const [gender, setGender] = useState('');
	const [birthday, setBirthday] = useState('');
	const [timezone, setTimezone] = useState('');
	const [subLoading, setSubLoading] = useState(false);

	const [credits, setCredits] = useState<number>(0);
	const [streak, setStreak] = useState<number>(0);
	const [streakShields, setStreakShields] = useState<number>(0);
	const [totalSpent, setTotalSpent] = useState<number>(0);
	const [globalLevel, setGlobalLevel] = useState<number>(1);
	const [globalXp, setGlobalXp] = useState<number>(0);
	const [extraBotSlots, setExtraBotSlots] = useState<number>(0);
	const [extraCdnSlots, setExtraCdnSlots] = useState<number>(0);
	const [extraShowcaseSlots, setExtraShowcaseSlots] = useState<number>(0);
	const [extraVanitySlots, setExtraVanitySlots] = useState<number>(0);
	const [referredBy, setReferredBy] = useState<string>('');
	const [referralBonusClaimed, setReferralBonusClaimed] = useState<boolean>(false);
	const [dotMatrixVariant, setDotMatrixVariant] = useState<string>('orbit');
	const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
	const [activeBadges, setActiveBadges] = useState<string[]>([]);
	const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);

	const [showcases, setShowcases] = useState<UserShowcaseItem[]>([]);
	const [connections, setConnections] = useState<UserConnectionItem[]>([]);
	const [devices, setDevices] = useState<UserDeviceItem[]>([]);

	useEffect(() => {
		if (open && !fullUser && !loadingDetails) {
			setLoadingDetails(true);
			fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), { credentials: 'include', cache: 'no-store' })
				.then((res) => (res.ok ? res.json() : null))
				.then((data: FullUser | null) => {
					if (!data) return;
					setFullUser(data);
					setName(data.name || '');
					setIcon(data.icon || '');
					setEmail(data.email || '');
					setSelectedRoleIds(getNormalizedRoles(data));
					setStripeCustomerId(data.stripeCustomerId || '');
					setDescription(data.description || '');
					setInfo(data.info || '');
					setPrivacy(data.privacy || 'private');
					setPersona(getUserPersona(data));
					setTourCompleted(getUserTourStatus(data) === 'completed');
					setVerified(Boolean(data.verified || (data.agreedTerms && data.agreedPrivacy)));
					setVanityUnlocked(Boolean(data.vanityUnlocked || data.vanitySlug));
					setVanitySlug(data.vanitySlug || '');
					setWidgets(Boolean(data.widgets));
					setBlacklisted(Boolean(data.blacklisted));
					setShadowban(Boolean(data.shadowban));
					setServices(data.services !== false);
					setStaffSubscription(Boolean(data.staffSubscription));
					setPronouns(data.pronouns || '');
					setGender(data.gender || '');
					setBirthday(data.birthday ? String(data.birthday).slice(0, 10) : '');
					setTimezone(data.timezone || '');
					setCredits(data.credits?.balance || 0);
					setStreak(data.credits?.streak || 0);
					setStreakShields(data.credits?.streakShields || 0);
					setTotalSpent(data.credits?.totalSpent || 0);
					setGlobalLevel(data.level?.level ?? 1);
					setGlobalXp(data.level?.xp ?? 0);
					setExtraBotSlots(data.credits?.extraBotSlots || 0);
					setExtraCdnSlots(data.credits?.extraCdnSlots || 0);
					setExtraShowcaseSlots(data.credits?.extraShowcaseSlots || 0);
					setExtraVanitySlots(data.credits?.extraVanitySlots || 0);
					setReferredBy(data.credits?.referredBy || '');
					setReferralBonusClaimed(Boolean(data.credits?.referralBonusClaimed));
					setDotMatrixVariant(data.credits?.dotMatrixVariant || 'orbit');
					setUnlockedBadges(Array.isArray(data.credits?.unlockedBadges) ? data.credits!.unlockedBadges! : []);
					setActiveBadges(Array.isArray(data.credits?.activeBadges) ? data.credits!.activeBadges! : []);
					setClaimedAchievements(Array.isArray(data.credits?.claimedAchievements) ? data.credits!.claimedAchievements! : []);
					setShowcases(Array.isArray(data.showcases) ? data.showcases : []);
					setConnections(Array.isArray(data.connections) ? data.connections : []);
					setDevices(Array.isArray(data.devices) ? data.devices : []);
				})
				.catch((err) => console.error('Failed to fetch user details:', err))
				.finally(() => setLoadingDetails(false));
		}
	}, [open, fullUser, loadingDetails, user.id, getEnvUrl]);

	const draft: UserModalDraft = {
		name,
		icon,
		email,
		selectedRoleIds,
		stripeCustomerId,
		description,
		info,
		privacy,
		persona,
		tourCompleted,
		verified,
		vanityUnlocked,
		vanitySlug,
		widgets,
		blacklisted,
		shadowban,
		services,
		staffSubscription,
		pronouns,
		gender,
		birthday,
		timezone,
		credits,
		streak,
		streakShields,
		totalSpent,
		globalLevel,
		globalXp,
		extraBotSlots,
		extraCdnSlots,
		extraShowcaseSlots,
		extraVanitySlots,
		referredBy,
		referralBonusClaimed,
		dotMatrixVariant,
		unlockedBadges,
		activeBadges,
		claimedAchievements,
		showcases,
		connections,
		devices,
	};

	const isDirty = useMemo(() => isUserModalDirty(fullUser, draft), [fullUser, JSON.stringify(draft)]);

	const handleStaffSubscriptionToggle = async (checked: boolean) => {
		setSubLoading(true);
		try {
			const endpoint = checked ? `secure/store/${user.id}/product` : `secure/store/${user.id}/cancel`;
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/${endpoint}`), { method: 'POST', credentials: 'include' });
			if (!res.ok) throw new Error('Failed to update subscription status');
			setStaffSubscription(checked);
			toast({ title: checked ? t('admin.users.toast.staffApplied') : t('admin.users.toast.staffCanceled'), type: 'success' });
		} catch (err) {
			console.error(err);
			toast({ title: t('admin.users.toast.staffError'), type: 'error' });
		} finally {
			setSubLoading(false);
		}
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const { creditsPayload, onboardingPayload, body } = buildUserPatchRequest(fullUser, draft);
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(body),
			});
			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || t('admin.users.updateFailed'));
			}
			const updated = await res.json();

			const previousRoles = fullUser ? getNormalizedRoles(fullUser) : initialRoles;
			await syncUserDiscordRoles({
				userId: user.id,
				roles,
				previousRoles,
				selectedRoleIds,
				getEnvUrl,
				onRoleError: (isAssigned, message) => toast({ type: 'error', title: isAssigned ? t('admin.users.assignRoleFailed') : t('admin.users.removeRoleFailed'), description: message }),
			});

			const manuallyUpdatedUser = buildUpdatedFullUser(fullUser, updated, draft, creditsPayload, onboardingPayload);
			setFullUser(manuallyUpdatedUser);
			onUserUpdated(manuallyUpdatedUser);
			if (currentUser?.id === user.id) mutateCurrentUser().catch(() => {});
			toast({ title: t('admin.users.toast.updateSuccess'), type: 'success' });
		} catch (err: any) {
			console.error(err);
			toast({ title: err.message || t('admin.users.toast.updateError'), type: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), { method: 'DELETE', credentials: 'include' });
			if (res.ok) {
				onUserDeleted(user.id);
				toast({ title: t('admin.users.toast.deleteSuccess'), type: 'success' });
			}
		} catch (err) {
			console.error(err);
			toast({ title: t('admin.users.toast.deleteError'), type: 'error' });
		} finally {
			setDeleting(false);
			setConfirmDeleteOpen(false);
		}
	};

	const handleUnverified = () => {
		setVerified(false);
		setTourCompleted(false);
		const nextFull = buildUnverifiedFullUser(fullUser, persona);
		setFullUser(nextFull);
		onUserUpdated(nextFull);
		if (currentUser?.id === user.id) mutateCurrentUser().catch(() => {});
	};

	const setters = {
		setName,
		setIcon,
		setEmail,
		setSelectedRoleIds,
		setStripeCustomerId,
		setDescription,
		setInfo,
		setPrivacy,
		setPersona,
		setTourCompleted,
		setVerified,
		setVanityUnlocked,
		setVanitySlug,
		setWidgets,
		setBlacklisted,
		setShadowban,
		setServices,
		setPronouns,
		setGender,
		setBirthday,
		setTimezone,
		setCredits,
		setStreak,
		setStreakShields,
		setTotalSpent,
		setGlobalLevel,
		setGlobalXp,
		setExtraBotSlots,
		setExtraCdnSlots,
		setExtraShowcaseSlots,
		setExtraVanitySlots,
		setReferredBy,
		setReferralBonusClaimed,
		setDotMatrixVariant,
		setUnlockedBadges,
		setActiveBadges,
		setClaimedAchievements,
		setShowcases,
		setConnections,
		setDevices,
	};

	return {
		fullUser,
		loadingDetails,
		saving,
		deleting,
		confirmDeleteOpen,
		setConfirmDeleteOpen,
		subLoading,
		missingRoleCount,
		isDirty,
		draft,
		setters,
		handleStaffSubscriptionToggle,
		handleUpdate,
		handleDelete,
		handleUnverified,
	};
}
