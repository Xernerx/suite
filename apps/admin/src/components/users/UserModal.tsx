/** @format */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button, Confirm, Input, Modal, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { DiscordProfile, FullUser, getNormalizedRoles, Role, UserSummary } from './types';
import { UserProfilePreview } from './UserProfilePreview';

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
}

export function UserModal({ open, onOpenChange, user, discord, roles, getEnvUrl, onUserDeleted, onUserUpdated, onViewAuditLogs }: UserModalProps) {
	const { toast } = useToast();
	const { t } = useDictionary();

	const [fullUser, setFullUser] = useState<FullUser | null>(null);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	// Editable form states
	const [name, setName] = useState(user.name || '');
	const initialRoles = getNormalizedRoles(user);
	const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(initialRoles);
	const [stripeCustomerId, setStripeCustomerId] = useState(user.stripeCustomerId || '');
	const [description, setDescription] = useState('');
	const [privacy, setPrivacy] = useState('private');
	const [staffSubscription, setStaffSubscription] = useState(false);
	const [credits, setCredits] = useState<number>(0);
	const [streak, setStreak] = useState<number>(0);
	const [subLoading, setSubLoading] = useState(false);

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
						setSelectedRoleIds(getNormalizedRoles(data));
						setStripeCustomerId(data.stripeCustomerId || '');
						setDescription(data.description || '');
						setPrivacy(data.privacy || 'private');
						setStaffSubscription(!!data.staffSubscription);
						setCredits(data.credits?.balance || 0);
						setStreak(data.credits?.streak || 0);
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
		const sortedSelectedRoles = [...selectedRoleIds].sort();
		const sortedOriginalRoles = [...getNormalizedRoles(fullUser)].sort();
		const rolesChanged = JSON.stringify(sortedSelectedRoles) !== JSON.stringify(sortedOriginalRoles);
		return (
			name !== (fullUser.name || '') ||
			rolesChanged ||
			stripeCustomerId !== (fullUser.stripeCustomerId || '') ||
			description !== (fullUser.description || '') ||
			privacy !== (fullUser.privacy || 'private') ||
			staffSubscription !== !!fullUser.staffSubscription ||
			credits !== (fullUser.credits?.balance || 0) ||
			streak !== (fullUser.credits?.streak || 0)
		);
	}, [fullUser, name, selectedRoleIds, stripeCustomerId, description, privacy, staffSubscription, credits, streak]);

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
				toast({
					title: checked ? t('admin.users.toast.staffApplied') : t('admin.users.toast.staffCanceled'),
					type: 'success',
				});
			} else {
				throw new Error('Failed to update subscription status');
			}
		} catch (err) {
			console.error(err);
			toast({
				title: t('admin.users.toast.staffError'),
				type: 'error',
			});
		} finally {
			setSubLoading(false);
		}
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			// 1. Update general user profile info including roles array and stripeCustomerId
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					name,
					roles: selectedRoleIds,
					stripeCustomerId: stripeCustomerId.trim() || null,
					description,
					privacy,
					staffSubscription,
					credits: {
						balance: credits,
						streak,
					},
				}),
			});
			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || t('admin.users.updateFailed'));
			}
			const updated = await res.json();

			// 2. Direct Discord Role Sync: Only sync roles that have a linked Discord Role ID and changed assignment.
			const previousRoles = fullUser ? getNormalizedRoles(fullUser) : initialRoles;
			for (const r of roles) {
				const discordRoleId = r.role;
				if (!discordRoleId || !r.sync) continue;
				const wasAssigned = previousRoles.includes(r.id);
				const isAssigned = selectedRoleIds.includes(r.id);
				if (wasAssigned === isAssigned) continue;
				if (isAssigned) {
					await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}/discord/roles`), {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
						body: JSON.stringify({
							roleId: discordRoleId,
						}),
					}).catch((err) => {
						console.error('Failed to assign Discord role:', err);
						toast({
							type: 'error',
							title: t('admin.users.assignRoleFailed'),
							description: err.message,
						});
					});
				} else {
					await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}/discord/roles`), {
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
						body: JSON.stringify({
							roleId: discordRoleId,
						}),
					}).catch((err) => {
						console.error('Failed to remove Discord role:', err);
						toast({
							type: 'error',
							title: t('admin.users.removeRoleFailed'),
							description: err.message,
						});
					});
				}
			}

			// Create a merged user object to guarantee UI state matches what was just saved
			const manuallyUpdatedUser: FullUser = {
				...(fullUser as FullUser),
				...updated,
				name,
				roles: selectedRoleIds,
				stripeCustomerId: stripeCustomerId.trim() || undefined,
				description,
				privacy,
				staffSubscription,
				credits: {
					balance: credits,
					streak,
				},
			};
			setFullUser(manuallyUpdatedUser);
			onUserUpdated(manuallyUpdatedUser);
			toast({
				title: t('admin.users.toast.updateSuccess'),
				type: 'success',
			});
		} catch (err: any) {
			console.error(err);
			toast({
				title: err.message || t('admin.users.toast.updateError'),
				type: 'error',
			});
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
				toast({
					title: t('admin.users.toast.deleteSuccess'),
					type: 'success',
				});
			}
		} catch (err) {
			console.error(err);
			toast({
				title: t('admin.users.toast.deleteError'),
				type: 'error',
			});
		} finally {
			setDeleting(false);
			setConfirmDeleteOpen(false);
		}
	};

	const avatarUrl =
		discord?.avatarUrl || (discord?.avatar && user.id ? `https://cdn.discordapp.com/avatars/${user.id}/${discord.avatar}.${discord.avatar.startsWith('a_') ? 'gif' : 'png'}` : null) || user.icon;
	const discordBanner = discord?.banner ? `https://cdn.discordapp.com/banners/${user.id}/${discord.banner}.${discord.banner.startsWith('a_') ? 'gif' : 'png'}?size=512` : null;
	const displayName = discord?.globalName || discord?.username || user.name || t('account.account.fallbackName');

	return (
		<>
			<Modal open={open} onOpenChange={onOpenChange} title={t('admin.users.manageUser')} description={t('admin.users.manageProfileDesc', { name: displayName })} maxWidth="max-w-4xl">
				<div className="flex flex-col overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
					{loadingDetails ? (
						<div className="flex justify-center py-6">
							<Loading />
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-3 overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
							<UserProfilePreview
								user={user}
								discord={discord}
								fullUser={fullUser}
								displayName={displayName}
								avatarUrl={avatarUrl}
								discordBanner={discordBanner}
								onViewAuditLogs={
									onViewAuditLogs
										? () => {
												onOpenChange(false);
												onViewAuditLogs(user.id);
											}
										: undefined
								}
							/>

							{/* Edit Form */}
							<form onSubmit={handleUpdate} className="col-span-1 md:col-span-2 flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
								<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
									<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
										<label className="block text-xs font-medium text-(--text)">{t('admin.users.displayNameLabel')}</label>
										<Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
									</div>

									<div
										className="flex flex-col"
										style={{
											gap: 'calc(var(--ui-gap) * 0.4)',
										}}
									>
										<label className="block text-xs font-medium text-(--text)">{t('admin.users.stripeCustomerIdLabel')}</label>
										<Input type="text" value={stripeCustomerId} onChange={(e) => setStripeCustomerId(e.target.value)} placeholder={t('admin.users.stripeCustomerPlaceholder')} />
									</div>
								</div>

								<div
									className="flex flex-col overflow-visible"
									style={{
										gap: 'calc(var(--ui-gap) * 0.4)',
									}}
								>
									<label className="block text-xs font-medium text-(--text)">{t('admin.users.rolesLabel')}</label>
									<MultiSelector
										value={selectedRoleIds}
										onChange={setSelectedRoleIds}
										options={roles.map((r) => ({
											value: r.id,
											label: r.name || t('admin.roles.unnamedRole'),
											color: r.permissions?.color || undefined,
										}))}
										placeholder={t('admin.users.addRolePlaceholder')}
									/>
								</div>

								<div
									className="grid grid-cols-1 md:grid-cols-2"
									style={{
										gap: 'var(--ui-gap)',
									}}
								>
									<div
										className="flex flex-col"
										style={{
											gap: 'calc(var(--ui-gap) * 0.4)',
										}}
									>
										<label className="block text-xs font-medium text-(--text)">{t('admin.users.card.creditsLabel')}</label>
										<Input
											variant="number"
											value={credits}
											onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
											className="bg-(--background)/50"
											style={{
												padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
											}}
										/>
									</div>

									<div
										className="flex flex-col"
										style={{
											gap: 'calc(var(--ui-gap) * 0.4)',
										}}
									>
										<label className="block text-xs font-medium text-(--text)">{t('admin.users.card.dailyStreakLabel')}</label>
										<Input
											variant="number"
											value={streak}
											onChange={(e) => setStreak(parseInt(e.target.value) || 0)}
											className="bg-(--background)/50"
											style={{
												padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
											}}
										/>
									</div>
								</div>

								<div
									className="flex flex-col"
									style={{
										gap: 'calc(var(--ui-gap) * 0.4)',
									}}
								>
									<label className="block text-xs font-medium text-(--text)">{t('admin.users.descriptionLabel')}</label>
									<Input variant="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none" />
								</div>

								<div
									className="grid grid-cols-1 md:grid-cols-2"
									style={{
										gap: 'var(--ui-gap)',
									}}
								>
									<div
										className="flex flex-col overflow-visible"
										style={{
											gap: 'calc(var(--ui-gap) * 0.4)',
										}}
									>
										<label className="block text-xs font-medium text-(--text)">{t('admin.users.privacyLevelLabel')}</label>
										<Selector
											value={privacy}
											onChange={(val: string) => setPrivacy(val)}
											options={[
												{
													label: t('account.profile.privacy.public'),
													value: 'public',
												},
												{
													label: t('account.profile.privacy.limited'),
													value: 'limited',
												},
												{
													label: t('account.profile.privacy.private'),
													value: 'private',
												},
											]}
										/>
									</div>

									{/* Staff Subscription Toggle */}
									<div
										className={`flex flex-col justify-center rounded-2xl border border-(--accent)/20 bg-(--accent)/5 px-4 py-2 ${subLoading ? 'opacity-50 pointer-events-none' : ''}`}
									>
										<div className="flex items-center justify-between">
											<div
												className="flex flex-col"
												style={{
													gap: 'calc(var(--ui-gap) * 0.2)',
												}}
											>
												<span className="text-sm font-semibold text-(--accent)">{t('admin.users.staffSubTitle')}</span>
												<span className="text-[10px] text-(--text-muted)">{t('admin.users.staffSubDesc')}</span>
											</div>
											<div className="flex items-center gap-2">
												{subLoading && <Loader2 size={14} className="animate-spin text-(--accent)" />}
												<Toggle checked={staffSubscription} onChange={(e) => handleStaffSubscriptionToggle(e.target.checked)} />
											</div>
										</div>
									</div>
								</div>

								<div className="flex items-center justify-between pt-4 border-t border-(--border)/10 mt-auto">
									<button
										type="button"
										onClick={() => setConfirmDeleteOpen(true)}
										className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-(--accent-red)/10 hover:bg-(--accent-red)/20 text-(--accent-red) text-xs font-medium transition-colors"
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
				description={t('admin.users.deleteUserConfirmDesc', {
					name: displayName,
					id: user.id,
				})}
				confirmKeyword={user.id}
				confirmText={t('admin.roles.confirmDelete')}
				cancelText={t('admin.roles.cancel')}
				onConfirm={handleDelete}
				loading={deleting}
			/>
		</>
	);
}
