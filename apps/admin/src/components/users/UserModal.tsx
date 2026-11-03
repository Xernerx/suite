/** @format */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Confirm, Modal } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { DiscordProfile, FullUser, getNormalizedRoles, Role, UserConnectionItem, UserDeviceItem, UserShowcaseItem, UserSummary } from './types';
import { UserProfilePreview } from './UserProfilePreview';
import { UserIdentityTab } from './UserIdentityTab';
import { UserEconomyPerksTab } from './UserEconomyPerksTab';
import { UserAssetsModerationTab } from './UserAssetsModerationTab';

interface UserModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: UserSummary;
	discord: DiscordProfile | null;
	roles: Role[];
	getEnvUrl: (url: string) => string;
	onUserDeleted: (id: string) => void;
	onUserUpdated: (updated: FullUser) => void;
	onViewAuditLogs?: (userId: string) => void;
	onNavigateEntity?: (tab: string, query: string) => void;
	initialTab?: 'profile' | 'economy' | 'assets';
}

export function UserModal({ open, onOpenChange, user, discord, roles, getEnvUrl, onUserDeleted, onUserUpdated, onViewAuditLogs, onNavigateEntity, initialTab = 'profile' }: UserModalProps) {
	const { toast } = useToast();
	const { t } = useDictionary();

	const [activeTab, setActiveTab] = useState<'profile' | 'economy' | 'assets'>(initialTab);
	const [fullUser, setFullUser] = useState<FullUser | null>(null);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	useEffect(() => {
		if (open) {
			setActiveTab(initialTab);
		}
	}, [open, initialTab]);

	// Profile & Identity states
	const [name, setName] = useState(user.name || '');
	const [icon, setIcon] = useState(user.icon || '');
	const [email, setEmail] = useState('');
	const initialRoles = getNormalizedRoles(user);
	const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(initialRoles);
	const [stripeCustomerId, setStripeCustomerId] = useState(user.stripeCustomerId || '');
	const [description, setDescription] = useState('');
	const [info, setInfo] = useState('');
	const [privacy, setPrivacy] = useState('private');
	const [verified, setVerified] = useState(Boolean(user.verified));
	const [vanityUnlocked, setVanityUnlocked] = useState(Boolean(user.vanitySlug));
	const [vanitySlug, setVanitySlug] = useState(user.vanitySlug || '');
	const [widgets, setWidgets] = useState(false);
	const [blacklisted, setBlacklisted] = useState(Boolean(user.blacklisted));
	const [services, setServices] = useState(user.services !== false);
	const [staffSubscription, setStaffSubscription] = useState(false);
	const [pronouns, setPronouns] = useState('');
	const [gender, setGender] = useState('');
	const [birthday, setBirthday] = useState('');
	const [timezone, setTimezone] = useState('');
	const [subLoading, setSubLoading] = useState(false);

	// Economy, Level & Perks states
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

	// Moderation Assets states
	const [showcases, setShowcases] = useState<UserShowcaseItem[]>([]);
	const [connections, setConnections] = useState<UserConnectionItem[]>([]);
	const [devices, setDevices] = useState<UserDeviceItem[]>([]);

	useEffect(() => {
		if (open && !fullUser && !loadingDetails) {
			setLoadingDetails(true);
			fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				credentials: 'include',
				cache: 'no-store',
			})
				.then((res) => (res.ok ? res.json() : null))
				.then((data: FullUser | null) => {
					if (data) {
						setFullUser(data);
						setName(data.name || '');
						setIcon(data.icon || '');
						setEmail(data.email || '');
						setSelectedRoleIds(getNormalizedRoles(data));
						setStripeCustomerId(data.stripeCustomerId || '');
						setDescription(data.description || '');
						setInfo(data.info || '');
						setPrivacy(data.privacy || 'private');
						setVerified(Boolean(data.verified || (data.agreedTerms && data.agreedPrivacy)));
						setVanityUnlocked(Boolean(data.vanityUnlocked || data.vanitySlug));
						setVanitySlug(data.vanitySlug || '');
						setWidgets(Boolean(data.widgets));
						setBlacklisted(Boolean(data.blacklisted));
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
					}
				})
				.catch((err) => {
					console.error('Failed to fetch user details:', err);
				})
				.finally(() => {
					setLoadingDetails(false);
				});
		}
	}, [open, fullUser, loadingDetails, user.id, getEnvUrl]);

	const isDirty = useMemo(() => {
		if (!fullUser) return false;
		const rolesChanged = JSON.stringify([...selectedRoleIds].sort()) !== JSON.stringify([...getNormalizedRoles(fullUser)].sort());
		const origBirthday = fullUser.birthday ? String(fullUser.birthday).slice(0, 10) : '';
		return (
			name !== (fullUser.name || '') ||
			icon !== (fullUser.icon || '') ||
			email !== (fullUser.email || '') ||
			rolesChanged ||
			stripeCustomerId !== (fullUser.stripeCustomerId || '') ||
			description !== (fullUser.description || '') ||
			info !== (fullUser.info || '') ||
			privacy !== (fullUser.privacy || 'private') ||
			verified !== Boolean(fullUser.verified || (fullUser.agreedTerms && fullUser.agreedPrivacy)) ||
			vanityUnlocked !== Boolean(fullUser.vanityUnlocked || fullUser.vanitySlug) ||
			vanitySlug !== (fullUser.vanitySlug || '') ||
			widgets !== Boolean(fullUser.widgets) ||
			blacklisted !== Boolean(fullUser.blacklisted) ||
			services !== (fullUser.services !== false) ||
			staffSubscription !== Boolean(fullUser.staffSubscription) ||
			pronouns !== (fullUser.pronouns || '') ||
			gender !== (fullUser.gender || '') ||
			birthday !== origBirthday ||
			timezone !== (fullUser.timezone || '') ||
			credits !== (fullUser.credits?.balance || 0) ||
			streak !== (fullUser.credits?.streak || 0) ||
			streakShields !== (fullUser.credits?.streakShields || 0) ||
			totalSpent !== (fullUser.credits?.totalSpent || 0) ||
			globalLevel !== (fullUser.level?.level ?? 1) ||
			globalXp !== (fullUser.level?.xp ?? 0) ||
			extraBotSlots !== (fullUser.credits?.extraBotSlots || 0) ||
			extraCdnSlots !== (fullUser.credits?.extraCdnSlots || 0) ||
			extraShowcaseSlots !== (fullUser.credits?.extraShowcaseSlots || 0) ||
			extraVanitySlots !== (fullUser.credits?.extraVanitySlots || 0) ||
			referredBy !== (fullUser.credits?.referredBy || '') ||
			referralBonusClaimed !== Boolean(fullUser.credits?.referralBonusClaimed) ||
			dotMatrixVariant !== (fullUser.credits?.dotMatrixVariant || 'orbit') ||
			JSON.stringify(unlockedBadges) !== JSON.stringify(fullUser.credits?.unlockedBadges || []) ||
			JSON.stringify(activeBadges) !== JSON.stringify(fullUser.credits?.activeBadges || []) ||
			JSON.stringify(claimedAchievements) !== JSON.stringify(fullUser.credits?.claimedAchievements || []) ||
			JSON.stringify(showcases) !== JSON.stringify(fullUser.showcases || []) ||
			JSON.stringify(connections) !== JSON.stringify(fullUser.connections || []) ||
			JSON.stringify(devices) !== JSON.stringify(fullUser.devices || [])
		);
	}, [
		fullUser,
		name,
		icon,
		email,
		selectedRoleIds,
		stripeCustomerId,
		description,
		info,
		privacy,
		verified,
		vanityUnlocked,
		vanitySlug,
		widgets,
		blacklisted,
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
	]);

	const handleStaffSubscriptionToggle = async (checked: boolean) => {
		setSubLoading(true);
		try {
			const endpoint = checked ? `secure/store/${user.id}/product` : `secure/store/${user.id}/cancel`;
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/${endpoint}`), {
				method: 'POST',
				credentials: 'include',
			});
			if (res.ok) {
				setStaffSubscription(checked);
				toast({ title: checked ? t('admin.users.toast.staffApplied') : t('admin.users.toast.staffCanceled'), type: 'success' });
			} else {
				throw new Error('Failed to update subscription status');
			}
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
			const creditsPayload = {
				balance: credits,
				streak,
				streakShields,
				totalSpent,
				extraBotSlots,
				extraCdnSlots,
				extraShowcaseSlots,
				extraVanitySlots,
				referredBy: referredBy.trim() || null,
				referralBonusClaimed,
				dotMatrixVariant,
				unlockedBadges,
				activeBadges,
				claimedAchievements,
			};

			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					name,
					icon: icon.trim() || '',
					email: email.trim() || '',
					roles: selectedRoleIds,
					stripeCustomerId: stripeCustomerId.trim() || null,
					description,
					info,
					privacy,
					verified,
					vanityUnlocked: vanityUnlocked || Boolean(vanitySlug.trim()),
					vanitySlug: vanitySlug.trim(),
					widgets,
					blacklisted,
					services,
					staffSubscription,
					pronouns: pronouns.trim() || '',
					gender: gender || undefined,
					birthday: birthday.trim() || null,
					timezone: timezone.trim() || '',
					showcases,
					connections,
					devices,
					credits: creditsPayload,
					level: {
						level: Math.max(0, globalLevel),
						xp: Math.max(0, globalXp),
					},
				}),
			});
			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || t('admin.users.updateFailed'));
			}
			const updated = await res.json();

			const previousRoles = fullUser ? getNormalizedRoles(fullUser) : initialRoles;
			for (const r of roles) {
				const discordRoleId = r.role;
				if (!discordRoleId || !r.sync) continue;
				const wasAssigned = previousRoles.includes(r.id);
				const isAssigned = selectedRoleIds.includes(r.id);
				if (wasAssigned === isAssigned) continue;
				await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}/discord/roles`), {
					method: isAssigned ? 'POST' : 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ roleId: discordRoleId }),
				}).catch((err) => {
					toast({ type: 'error', title: isAssigned ? t('admin.users.assignRoleFailed') : t('admin.users.removeRoleFailed'), description: err.message });
				});
			}

			const manuallyUpdatedUser: FullUser = {
				...(fullUser as FullUser),
				...updated,
				name,
				icon,
				email,
				roles: selectedRoleIds,
				stripeCustomerId: stripeCustomerId.trim() || undefined,
				description,
				info,
				privacy,
				verified,
				vanityUnlocked: vanityUnlocked || Boolean(vanitySlug.trim()),
				vanitySlug: vanitySlug.trim(),
				widgets,
				blacklisted,
				services,
				staffSubscription,
				pronouns,
				gender,
				birthday: birthday.trim() || undefined,
				timezone,
				showcases,
				connections,
				devices,
				credits: { ...fullUser?.credits, ...creditsPayload },
				level: { level: Math.max(0, globalLevel), xp: Math.max(0, globalXp) },
			};
			setFullUser(manuallyUpdatedUser);
			onUserUpdated(manuallyUpdatedUser);
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
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
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

	const avatarUrl =
		discord?.avatarUrl ||
		(discord?.avatar && user.id ? `https://cdn.discordapp.com/avatars/${user.id}/${discord.avatar}.${discord.avatar.startsWith('a_') ? 'gif' : 'png'}` : null) ||
		icon ||
		user.icon;
	const discordBanner = discord?.banner ? `https://cdn.discordapp.com/banners/${user.id}/${discord.banner}.${discord.banner.startsWith('a_') ? 'gif' : 'png'}?size=512` : null;
	const displayName = discord?.globalName || discord?.username || user.name || t('account.account.fallbackName');

	return (
		<>
			<Modal open={open} onOpenChange={onOpenChange} title={t('admin.users.manageUser')} description={t('admin.users.manageProfileDesc', { name: displayName })} maxWidth="max-w-7xl">
				<div className="flex flex-col overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
					{loadingDetails ? (
						<div className="flex justify-center py-6">
							<Loading variant="small" />
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-3 items-start overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
							<div className="md:sticky md:top-0">
								<UserProfilePreview
									user={user}
									discord={discord}
									fullUser={fullUser}
									displayName={displayName}
									avatarUrl={avatarUrl}
									discordBanner={discordBanner}
									globalLevel={globalLevel}
									globalXp={globalXp}
									verified={verified}
									vanitySlug={vanitySlug}
									blacklisted={blacklisted}
									services={services}
									onViewAuditLogs={
										onViewAuditLogs
											? () => {
													onOpenChange(false);
													onViewAuditLogs(user.id);
												}
											: undefined
									}
								/>
							</div>

							<form onSubmit={handleUpdate} className="col-span-1 md:col-span-2 flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 1.25)' }}>
								<div className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 bg-(--background)/95 backdrop-blur-md p-1 rounded-2xl border border-(--border)/10">
									{(['profile', 'economy', 'assets'] as const).map((tabKey) => (
										<button
											key={tabKey}
											type="button"
											onClick={() => setActiveTab(tabKey)}
											className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
												activeTab === tabKey
													? 'bg-(--accent) text-white shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_35%,transparent)]'
													: 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)/50'
											}`}
										>
											{t(`admin.users.tabs.${tabKey}`)}
										</button>
									))}
								</div>

								{activeTab === 'profile' && (
									<UserIdentityTab
										name={name}
										setName={setName}
										icon={icon}
										setIcon={setIcon}
										email={email}
										setEmail={setEmail}
										stripeCustomerId={stripeCustomerId}
										setStripeCustomerId={setStripeCustomerId}
										selectedRoleIds={selectedRoleIds}
										setSelectedRoleIds={setSelectedRoleIds}
										roles={roles}
										privacy={privacy}
										setPrivacy={setPrivacy}
										verified={verified}
										setVerified={setVerified}
										vanityUnlocked={vanityUnlocked}
										setVanityUnlocked={setVanityUnlocked}
										vanitySlug={vanitySlug}
										setVanitySlug={setVanitySlug}
										widgets={widgets}
										setWidgets={setWidgets}
										blacklisted={blacklisted}
										setBlacklisted={setBlacklisted}
										services={services}
										setServices={setServices}
										staffSubscription={staffSubscription}
										subLoading={subLoading}
										onStaffSubscriptionToggle={handleStaffSubscriptionToggle}
										pronouns={pronouns}
										setPronouns={setPronouns}
										gender={gender}
										setGender={setGender}
										birthday={birthday}
										setBirthday={setBirthday}
										timezone={timezone}
										setTimezone={setTimezone}
										description={description}
										setDescription={setDescription}
										info={info}
										setInfo={setInfo}
									/>
								)}

								{activeTab === 'economy' && (
									<UserEconomyPerksTab
										credits={credits}
										setCredits={setCredits}
										streak={streak}
										setStreak={setStreak}
										streakShields={streakShields}
										setStreakShields={setStreakShields}
										totalSpent={totalSpent}
										setTotalSpent={setTotalSpent}
										globalLevel={globalLevel}
										setGlobalLevel={setGlobalLevel}
										globalXp={globalXp}
										setGlobalXp={setGlobalXp}
										extraBotSlots={extraBotSlots}
										setExtraBotSlots={setExtraBotSlots}
										extraCdnSlots={extraCdnSlots}
										setExtraCdnSlots={setExtraCdnSlots}
										extraShowcaseSlots={extraShowcaseSlots}
										setExtraShowcaseSlots={setExtraShowcaseSlots}
										extraVanitySlots={extraVanitySlots}
										setExtraVanitySlots={setExtraVanitySlots}
										referredBy={referredBy}
										setReferredBy={setReferredBy}
										referralBonusClaimed={referralBonusClaimed}
										setReferralBonusClaimed={setReferralBonusClaimed}
										dotMatrixVariant={dotMatrixVariant}
										setDotMatrixVariant={setDotMatrixVariant}
										unlockedBadges={unlockedBadges}
										setUnlockedBadges={setUnlockedBadges}
										activeBadges={activeBadges}
										setActiveBadges={setActiveBadges}
										claimedAchievements={claimedAchievements}
										setClaimedAchievements={setClaimedAchievements}
										transactions={fullUser?.credits?.transactions || []}
									/>
								)}

								{activeTab === 'assets' && (
									<UserAssetsModerationTab
										showcases={showcases}
										setShowcases={setShowcases}
										connections={connections}
										setConnections={setConnections}
										devices={devices}
										setDevices={setDevices}
										ownedBots={fullUser?.ownedBots || []}
										ownedServers={fullUser?.ownedServers || []}
										userOrganizations={fullUser?.userOrganizations || []}
										onNavigateEntity={
											onNavigateEntity
												? (tab, query) => {
														onOpenChange(false);
														onNavigateEntity(tab, query);
													}
												: undefined
										}
									/>
								)}

								<div className="sticky bottom-0 z-10 flex items-center justify-between pt-3 pb-1 bg-(--background)/95 backdrop-blur-md border-t border-(--border)/10 mt-auto">
									<button
										type="button"
										onClick={() => setConfirmDeleteOpen(true)}
										className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-(--accent-red)/10 hover:bg-(--accent-red)/20 text-(--accent-red) text-xs font-medium transition-colors cursor-pointer"
									>
										<Trash2 size={14} />
										{t('admin.users.deleteButton')}
									</button>
									<Button type="submit" disabled={saving || !isDirty}>
										{saving ? t('admin.roles.saving') : t('admin.roles.saveChanges')}
									</Button>
								</div>
							</form>
						</div>
					)}
				</div>
			</Modal>

			<Confirm
				open={confirmDeleteOpen}
				onOpenChange={setConfirmDeleteOpen}
				title={t('admin.users.deleteUserTitle')}
				description={t('admin.users.deleteUserConfirmDesc', { name: displayName, id: user.id })}
				confirmKeyword={user.id}
				confirmText={t('admin.roles.confirmDelete')}
				cancelText={t('admin.roles.cancel')}
				onConfirm={handleDelete}
				loading={deleting}
			/>
		</>
	);
}
