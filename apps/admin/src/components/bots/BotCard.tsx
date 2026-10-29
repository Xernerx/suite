/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bot as BotIcon, Check, CheckCircle2, Copy, ExternalLink, Server, Settings2, ThumbsUp } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';
import { AdminBotSummary, BotDiscordProfile } from './types';
import { BotModal } from './BotModal';

interface BotCardProps {
	bot: AdminBotSummary;
	getEnvUrl: (url: string) => string;
	onBotDeleted: (id: string) => void;
	onBotUpdated: (updated: AdminBotSummary) => void;
	onDiscordFetched: (id: string, discord: BotDiscordProfile) => void;
	onViewAuditLogs?: (botId: string) => void;
}

export function BotCard({ bot, getEnvUrl, onBotDeleted, onBotUpdated, onDiscordFetched, onViewAuditLogs }: BotCardProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [copiedId, setCopiedId] = useState(false);
	const [discord, setDiscord] = useState<BotDiscordProfile | null>(bot.discord || null);

	useEffect(() => {
		if (!bot.id || bot.discord) return;
		fetch(getEnvUrl(`https://api.xernerx.com/core/users/${bot.id}/discord`))
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data) {
					setDiscord(data);
					onDiscordFetched(bot.id, data);
				}
			})
			.catch(() => {});
	}, [bot.id, bot.discord, getEnvUrl, onDiscordFetched]);

	const avatarHash = discord?.avatar || bot.avatar;
	const avatarUrl =
		discord?.avatarUrl ||
		(avatarHash && String(avatarHash).startsWith('http')
			? String(avatarHash)
			: avatarHash && bot.id
				? `https://cdn.discordapp.com/avatars/${bot.id}/${avatarHash}.${String(avatarHash).startsWith('a_') ? 'gif' : 'png'}`
				: null);

	const displayName = discord?.globalName || discord?.global_name || discord?.username || bot.name || t('common.unknownBot');
	const privacy = bot.privacy || 'private';
	const guildCount = bot.stats?.guildCount ?? 0;
	const voteCount = bot.voteCount ?? bot.stats?.voteCount ?? 0;

	return (
		<>
			<motion.div
				layout
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95 }}
				onClick={() => setIsModalOpen(true)}
				className="flex items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-(--accent)/30 group relative"
				style={{ padding: 'calc(var(--ui-gap) * 0.75)' }}
			>
				<div className="absolute inset-0 bg-gradient-to-br from-transparent to-(--border)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

				<div className="flex items-center relative z-10 min-w-0" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
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
							<BotIcon size={24} className="text-(--text-muted)" />
						</div>
					)}

					<div className="flex flex-col overflow-hidden min-w-0">
						<div className="flex items-center gap-1.5 min-w-0">
							<h2 className="font-bold text-base text-(--text) truncate group-hover:text-(--accent) transition-colors">{displayName}</h2>
							{bot.verified && <CheckCircle2 size={14} className="text-(--accent-green) shrink-0" />}
						</div>

						<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
							<span
								className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
									privacy === 'public'
										? 'bg-(--accent-green)/15 text-(--accent-green)'
										: privacy === 'limited'
											? 'bg-(--accent-orange)/15 text-(--accent-orange)'
											: 'bg-(--border)/15 text-(--text-muted)'
								}`}
							>
								{privacy}
							</span>
							<span className="inline-flex items-center gap-1 text-xs text-(--text-muted)">
								<Server size={11} className="text-(--accent)" />
								{guildCount.toLocaleString()}
							</span>
							<span className="inline-flex items-center gap-1 text-xs text-(--text-muted)">
								<ThumbsUp size={11} className="text-(--accent)" />
								{voteCount.toLocaleString()}
							</span>
							{bot.vanitySlug && <span className="text-xs font-mono text-(--accent) truncate">/{bot.vanitySlug}</span>}
						</div>

						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								navigator.clipboard.writeText(bot.id);
								setCopiedId(true);
								toast({ type: 'success', title: t('admin.users.idCopied') });
								setTimeout(() => setCopiedId(false), 2000);
							}}
							className="inline-flex items-center gap-1 w-fit text-[10px] text-(--text-muted)/70 hover:text-(--text) font-mono mt-1 px-1.5 py-0.5 rounded-xl bg-(--background)/40 hover:bg-(--background) border border-(--border)/10 transition-colors cursor-pointer"
						>
							<span>{t('admin.users.card.idPrefix', { id: bot.id })}</span>
							{copiedId ? <Check size={10} className="text-(--accent-green)" /> : <Copy size={10} />}
						</button>
					</div>
				</div>

				<div className="flex items-center gap-1.5 relative z-10 shrink-0 mr-2">
					<a
						href={`${getEnvUrl('https://app.xernerx.com')}/bots/${bot.vanitySlug || bot.id}`}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						title={t('admin.bots.openProfile')}
						className="flex items-center justify-center w-8 h-8 rounded-full bg-(--accent)/15 hover:bg-(--accent)/25 text-(--accent) opacity-0 group-hover:opacity-100 transition-all"
					>
						<ExternalLink size={14} />
					</a>
					<div className="flex items-center justify-center w-8 h-8 rounded-full bg-(--border)/10 opacity-0 group-hover:opacity-100 transition-all text-(--text)">
						<Settings2 size={16} />
					</div>
				</div>
			</motion.div>

			<BotModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				bot={bot}
				discord={discord}
				getEnvUrl={getEnvUrl}
				onBotDeleted={onBotDeleted}
				onBotUpdated={onBotUpdated}
				onViewAuditLogs={onViewAuditLogs}
			/>
		</>
	);
}
