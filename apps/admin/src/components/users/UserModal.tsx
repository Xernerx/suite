/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Confirm, Modal } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import type { DiscordProfile, FullUser, Role, UserSummary } from './types';
import { UserProfilePreview } from './UserProfilePreview';
import { UserIdentityTab } from './UserIdentityTab';
import { UserEconomyPerksTab } from './UserEconomyPerksTab';
import { UserAssetsModerationTab } from './UserAssetsModerationTab';
import { UserBotServerProfilesTab } from './UserBotServerProfilesTab';
import { resolveUserDisplayMedia } from './userModalHelpers';
import { useUserModalForm } from './useUserModalForm';

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
	initialTab?: 'profile' | 'economy' | 'assets' | 'bots';
}

export function UserModal({ open, onOpenChange, user, discord, roles, getEnvUrl, onUserDeleted, onUserUpdated, onViewAuditLogs, onNavigateEntity, initialTab = 'profile' }: UserModalProps) {
	const { t } = useDictionary();
	const [activeTab, setActiveTab] = useState<'profile' | 'economy' | 'assets' | 'bots'>(initialTab);

	useEffect(() => {
		if (open) {
			setActiveTab(initialTab);
		}
	}, [open, initialTab]);

	const {
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
	} = useUserModalForm({
		open,
		user,
		roles,
		getEnvUrl,
		onUserDeleted,
		onUserUpdated,
	});

	const { avatarUrl, discordBanner, displayName } = resolveUserDisplayMedia({
		user,
		discord,
		icon: draft.icon,
		fallbackName: t('account.account.fallbackName'),
	});

	return (
		<>
			<Modal open={open} onOpenChange={onOpenChange} title={t('admin.users.manageUser')} description={t('admin.users.manageProfileDesc', { name: displayName })} maxWidth="max-w-(--page-width)">
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
									globalLevel={draft.globalLevel}
									globalXp={draft.globalXp}
									verified={draft.verified}
									vanitySlug={draft.vanitySlug}
									blacklisted={draft.blacklisted}
									shadowban={draft.shadowban}
									services={draft.services}
									persona={draft.persona}
									tourCompleted={draft.tourCompleted}
									missingRoleCount={missingRoleCount}
									onViewAuditLogs={
										onViewAuditLogs
											? () => {
													onOpenChange(false);
													onViewAuditLogs(user.id);
												}
											: undefined
									}
									onUnverified={handleUnverified}
								/>
							</div>

							<form onSubmit={handleUpdate} className="col-span-1 md:col-span-2 flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 1.25)' }}>
								<div className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 bg-(--background)/95 backdrop-blur-md p-1 rounded-2xl border border-(--border)/10">
									{(['profile', 'economy', 'assets', 'bots'] as const).map((tabKey) => (
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
										name={draft.name}
										setName={setters.setName}
										icon={draft.icon}
										setIcon={setters.setIcon}
										email={draft.email}
										setEmail={setters.setEmail}
										stripeCustomerId={draft.stripeCustomerId}
										setStripeCustomerId={setters.setStripeCustomerId}
										selectedRoleIds={draft.selectedRoleIds}
										setSelectedRoleIds={setters.setSelectedRoleIds}
										roles={roles}
										privacy={draft.privacy}
										setPrivacy={setters.setPrivacy}
										persona={draft.persona}
										setPersona={setters.setPersona}
										tourCompleted={draft.tourCompleted}
										setTourCompleted={setters.setTourCompleted}
										verified={draft.verified}
										setVerified={setters.setVerified}
										vanityUnlocked={draft.vanityUnlocked}
										setVanityUnlocked={setters.setVanityUnlocked}
										vanitySlug={draft.vanitySlug}
										setVanitySlug={setters.setVanitySlug}
										widgets={draft.widgets}
										setWidgets={setters.setWidgets}
										blacklisted={draft.blacklisted}
										setBlacklisted={setters.setBlacklisted}
										shadowban={draft.shadowban}
										setShadowban={setters.setShadowban}
										services={draft.services}
										setServices={setters.setServices}
										staffSubscription={draft.staffSubscription}
										subLoading={subLoading}
										onStaffSubscriptionToggle={handleStaffSubscriptionToggle}
										pronouns={draft.pronouns}
										setPronouns={setters.setPronouns}
										gender={draft.gender}
										setGender={setters.setGender}
										birthday={draft.birthday}
										setBirthday={setters.setBirthday}
										timezone={draft.timezone}
										setTimezone={setters.setTimezone}
										description={draft.description}
										setDescription={setters.setDescription}
										info={draft.info}
										setInfo={setters.setInfo}
									/>
								)}

								{activeTab === 'economy' && (
									<UserEconomyPerksTab
										credits={draft.credits}
										setCredits={setters.setCredits}
										streak={draft.streak}
										setStreak={setters.setStreak}
										streakShields={draft.streakShields}
										setStreakShields={setters.setStreakShields}
										totalSpent={draft.totalSpent}
										setTotalSpent={setters.setTotalSpent}
										globalLevel={draft.globalLevel}
										setGlobalLevel={setters.setGlobalLevel}
										globalXp={draft.globalXp}
										setGlobalXp={setters.setGlobalXp}
										extraBotSlots={draft.extraBotSlots}
										setExtraBotSlots={setters.setExtraBotSlots}
										extraCdnSlots={draft.extraCdnSlots}
										setExtraCdnSlots={setters.setExtraCdnSlots}
										extraShowcaseSlots={draft.extraShowcaseSlots}
										setExtraShowcaseSlots={setters.setExtraShowcaseSlots}
										extraVanitySlots={draft.extraVanitySlots}
										setExtraVanitySlots={setters.setExtraVanitySlots}
										referredBy={draft.referredBy}
										setReferredBy={setters.setReferredBy}
										referralBonusClaimed={draft.referralBonusClaimed}
										setReferralBonusClaimed={setters.setReferralBonusClaimed}
										dotMatrixVariant={draft.dotMatrixVariant}
										setDotMatrixVariant={setters.setDotMatrixVariant}
										unlockedBadges={draft.unlockedBadges}
										setUnlockedBadges={setters.setUnlockedBadges}
										activeBadges={draft.activeBadges}
										setActiveBadges={setters.setActiveBadges}
										claimedAchievements={draft.claimedAchievements}
										setClaimedAchievements={setters.setClaimedAchievements}
										transactions={fullUser?.credits?.transactions || []}
									/>
								)}

								{activeTab === 'assets' && (
									<UserAssetsModerationTab
										showcases={draft.showcases}
										setShowcases={setters.setShowcases}
										connections={draft.connections}
										setConnections={setters.setConnections}
										devices={draft.devices}
										setDevices={setters.setDevices}
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

								{activeTab === 'bots' && (
									<UserBotServerProfilesTab
										userId={user.id}
										getEnvUrl={getEnvUrl}
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
									{activeTab !== 'bots' && (
										<Button type="submit" disabled={saving || !isDirty}>
											{saving ? t('admin.roles.saving') : t('admin.roles.saveChanges')}
										</Button>
									)}
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
