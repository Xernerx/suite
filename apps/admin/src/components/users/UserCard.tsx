/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Settings2, User as UserIcon, Copy, Check } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';
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
}

export function UserCard({ user, roles, getEnvUrl, onUserDeleted, onUserUpdated, onDiscordFetched, onViewAuditLogs }: UserCardProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [copiedId, setCopiedId] = useState(false);
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
	const activeRoles = roles.filter((r) => activeRolesList.includes(r.id));

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
				onClick={() => setIsModalOpen(true)}
				className="flex items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-(--accent)/30 group relative"
				style={{
					padding: 'calc(var(--ui-gap) * 0.75)',
				}}
			>
				{/* Subtle background gradient on hover */}
				<div className="absolute inset-0 bg-gradient-to-br from-transparent to-(--border)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

				<div
					className="flex items-center relative z-10"
					style={{
						gap: 'calc(var(--ui-gap) * 0.75)',
					}}
				>
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
					<div className="flex flex-col overflow-hidden">
						<h2 className="font-bold text-base text-(--text) truncate group-hover:text-(--accent) transition-colors">{displayName}</h2>
						<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
							{activeRoles.length > 0 ? (
								activeRoles.map((r) => (
									<span key={r.id} className="text-xs px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) font-medium truncate">
										{r.name}
									</span>
								))
							) : (
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
							className="inline-flex items-center gap-1 w-fit text-[10px] text-(--text-muted)/70 hover:text-(--text) font-mono mt-1 px-1.5 py-0.5 rounded bg-(--background)/40 hover:bg-(--background) border border-(--border)/10 transition-colors cursor-pointer"
						>
							<span>
								{t('admin.users.card.idPrefix', {
									id: user.id,
								})}
							</span>
							{copiedId ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
						</button>
					</div>
				</div>

				<div className="flex items-center justify-center w-8 h-8 rounded-full bg-(--border)/10 opacity-0 group-hover:opacity-100 transition-all text-(--text) relative z-10 shrink-0 mr-2">
					<Settings2 size={16} />
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
			/>
		</>
	);
}
