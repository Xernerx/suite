/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Settings2, User as UserIcon, Copy, Check, Coins, CheckCircle2, Sparkles, Ban, AlertTriangle, X } from 'lucide-react';
import { Tooltip } from '@xernerx/ui';
import { useDictionary, useToast, useUser } from '@xernerx/providers';
import { DiscordProfile, FullUser, getNormalizedRoles, Role, UserSummary } from './types';
import { UserModal } from './UserModal';

interface UserCardProps {
	user: UserSummary;
	roles: Role[];
	getEnvUrl: (url: string) => string;
	onUserDeleted: (id: string) => void;
	onUserUpdated: (updated: FullUser) => void;
	onDiscordFetched: (id: string, discord: DiscordProfile) => void;
	onViewAuditLogs?: (userId: string) => void;
	onNavigateEntity?: (tab: string, query: string) => void;
}

export function UserCard({ user, roles, getEnvUrl, onUserDeleted, onUserUpdated, onDiscordFetched, onViewAuditLogs, onNavigateEntity }: UserCardProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const { user: currentUser, mutate: mutateCurrentUser } = useUser() as { user: any; mutate: () => Promise<void> };
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalInitialTab, setModalInitialTab] = useState<'profile' | 'economy' | 'assets'>('profile');
	const [copiedId, setCopiedId] = useState(false);
	const [removingRoleId, setRemovingRoleId] = useState<string | null>(null);
	const [discord, setDiscord] = useState<DiscordProfile | null>(user.discord || null);

	// Fetch Discord profile if missing
	useEffect(() => {
		if (!user.id || user.discord) return;
		fetch(getEnvUrl(`https://api.xernerx.com/core/users/${user.id}/discord`))
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data) {
					setDiscord(data);
					onDiscordFetched(user.id, data);
				}
			})
			.catch(() => {});
	}, [user.id, user.discord, getEnvUrl, onDiscordFetched]);

	const avatarUrl =
		discord?.avatarUrl || (discord?.avatar && user.id ? `https://cdn.discordapp.com/avatars/${user.id}/${discord.avatar}.${discord.avatar.startsWith('a_') ? 'gif' : 'png'}` : null) || user.icon;
	const displayName = discord?.globalName || discord?.username || user.name || t('account.account.fallbackName');

	const activeRolesList = getNormalizedRoles(user);
	const existingRoleIdSet = new Set(roles.map((r) => r.id));
	const activeRoles = roles.filter((r) => activeRolesList.includes(r.id));
	const missingRoleIds = activeRolesList.filter((rid) => Boolean(rid) && !existingRoleIdSet.has(rid));
	const hasMissingRoles = missingRoleIds.length > 0;
	const userLevel = user.level?.level ?? 1;
	const userCredits = user.credits?.balance ?? 0;

	const handleRemoveMissingRole = async (e: React.MouseEvent, roleId: string) => {
		e.stopPropagation();
		if (removingRoleId) return;
		setRemovingRoleId(roleId);
		const nextRoles = activeRolesList.filter((rid) => rid !== roleId);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ roles: nextRoles }),
			});
			if (!res.ok) throw new Error('Failed to remove role');
			onUserUpdated({ ...(user as unknown as FullUser), roles: nextRoles });
			if (currentUser?.id === user.id) {
				mutateCurrentUser().catch(() => {});
			}
			toast({ type: 'success', title: t('admin.users.missingRoles.removedToast') });
		} catch {
			toast({ type: 'error', title: t('admin.users.missingRoles.removeErrorToast') });
		} finally {
			setRemovingRoleId(null);
		}
	};

	return (
		<>
			<motion.div
				layout
				initial={{
					opacity: 0,
					y: 10,
				}}
				animate={{
					opacity: 1,
					y: 0,
				}}
				exit={{
					opacity: 0,
					scale: 0.95,
				}}
				onClick={() => {
					setModalInitialTab('profile');
					setIsModalOpen(true);
				}}
				className={`flex items-center justify-between rounded-3xl border bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 group relative ${
					hasMissingRoles ? 'border-(--accent-red)/40 hover:border-(--accent-red)/60' : 'border-(--border)/10 hover:border-(--accent)/30'
				}`}
				style={{
					padding: 'calc(var(--ui-gap) * 0.75)',
				}}
			>
				{/* Subtle background gradient on hover */}
				<div className="absolute inset-0 bg-gradient-to-br from-transparent to-(--border)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

				<div
					className="flex items-center relative z-10 min-w-0"
					style={{
						gap: 'calc(var(--ui-gap) * 0.75)',
					}}
				>
					<div className="relative shrink-0">
						{avatarUrl ? (
							<Image
								src={avatarUrl}
								alt={displayName}
								width={56}
								height={56}
								className="h-14 w-14 rounded-full border border-(--border)/10 object-cover shrink-0"
								unoptimized
								draggable={false}
							/>
						) : (
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--border)/15 shrink-0 text-(--text)">
								<UserIcon size={24} className="text-(--text-muted)" />
							</div>
						)}
						{hasMissingRoles && (
							<span
								title={t('admin.users.missingRoles.warningTooltip', { count: missingRoleIds.length })}
								className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-(--accent-red) text-white border-2 border-(--background) shadow-sm"
							>
								<AlertTriangle size={11} />
							</span>
						)}
					</div>
					<div className="flex flex-col overflow-hidden min-w-0">
						<div className="flex items-center gap-1.5 min-w-0 flex-wrap">
							<h2 className="font-bold text-base text-(--text) truncate group-hover:text-(--accent) transition-colors">{displayName}</h2>
							{user.verified && <CheckCircle2 size={14} className="text-(--accent-green) shrink-0" />}
							{hasMissingRoles && (
								<Tooltip content={t('admin.users.missingRoles.warningTooltip', { count: missingRoleIds.length })}>
									<span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-(--accent-red)/15 text-(--accent-red) border border-(--accent-red)/30 font-bold shrink-0">
										<AlertTriangle size={10} />
										<span>{t('admin.users.missingRoles.badge', { count: missingRoleIds.length })}</span>
									</span>
								</Tooltip>
							)}
							{user.blacklisted && (
								<span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-(--accent-red)/15 text-(--accent-red) border border-(--accent-red)/30 font-bold shrink-0">
									<Ban size={10} />
									{t('admin.users.fields.blacklistedBadge')}
								</span>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
							<span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) font-mono font-bold">
								<Sparkles size={10} />
								{t('admin.users.card.levelShort', { level: userLevel })}
							</span>
							{userCredits > 0 && (
								<span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-(--background)/60 border border-(--border)/10 text-(--text) font-mono font-semibold">
									<Coins size={10} className="text-(--accent)" />
									{userCredits.toLocaleString()}
								</span>
							)}
							{activeRoles.map((r) => (
								<span key={r.id} className="text-xs px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) font-medium truncate">
									{r.name}
								</span>
							))}
							{missingRoleIds.map((rid) => (
								<Tooltip key={rid} content={t('admin.users.missingRoles.pillTooltip', { id: rid })}>
									<span className="inline-flex items-center gap-1 text-xs pl-2 pr-1 py-0.5 rounded-full bg-(--accent-red)/15 text-(--accent-red) border border-(--accent-red)/30 font-medium max-w-full">
										<AlertTriangle size={10} className="shrink-0" />
										<span className="truncate font-mono text-[11px]">{t('admin.users.missingRoles.pillLabel', { id: rid.length > 10 ? `${rid.slice(0, 8)}…` : rid })}</span>
										<button
											type="button"
											disabled={removingRoleId === rid}
											aria-label={t('admin.users.missingRoles.removeOne', { id: rid })}
											onClick={(e) => handleRemoveMissingRole(e, rid)}
											className="inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-(--accent-red)/25 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
										>
											<X size={10} />
										</button>
									</span>
								</Tooltip>
							))}
							{activeRoles.length === 0 && missingRoleIds.length === 0 && (
								<span className="text-xs px-2 py-0.5 rounded-full bg-(--border)/10 text-(--text-muted) font-medium truncate">{t('admin.users.noRoles')}</span>
							)}
							{discord?.username && <span className="text-xs text-(--text-muted) truncate">@{discord.username}</span>}
						</div>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								navigator.clipboard.writeText(user.id);
								setCopiedId(true);
								toast({ type: 'success', title: t('admin.users.idCopied') });
								setTimeout(() => setCopiedId(false), 2000);
							}}
							className="inline-flex items-center gap-1 w-fit text-[10px] text-(--text-muted)/70 hover:text-(--text) font-mono mt-1 px-1.5 py-0.5 rounded-xl bg-(--background)/40 hover:bg-(--background) border border-(--border)/10 transition-colors cursor-pointer"
						>
							<span>
								{t('admin.users.card.idPrefix', {
									id: user.id,
								})}
							</span>
							{copiedId ? <Check size={10} className="text-(--accent-green)" /> : <Copy size={10} />}
						</button>
					</div>
				</div>

				<div className="flex items-center gap-1.5 relative z-10 shrink-0 mr-2">
					<button
						type="button"
						title={t('admin.users.creditsModal.manageButton')}
						onClick={(e) => {
							e.stopPropagation();
							setModalInitialTab('economy');
							setIsModalOpen(true);
						}}
						className="flex items-center justify-center w-8 h-8 rounded-full bg-(--accent)/15 hover:bg-(--accent)/25 text-(--accent) opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
					>
						<Coins size={15} />
					</button>
					<div className="flex items-center justify-center w-8 h-8 rounded-full bg-(--border)/10 opacity-0 group-hover:opacity-100 transition-all text-(--text)">
						<Settings2 size={16} />
					</div>
				</div>
			</motion.div>

			<UserModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				user={user}
				discord={discord}
				roles={roles}
				getEnvUrl={getEnvUrl}
				onUserDeleted={onUserDeleted}
				onUserUpdated={onUserUpdated}
				onViewAuditLogs={onViewAuditLogs}
				onNavigateEntity={onNavigateEntity}
				initialTab={modalInitialTab}
			/>
		</>
	);
}
