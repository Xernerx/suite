/** @format */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check, CheckCircle2, Copy, ExternalLink, Server as ServerIcon, Settings2, ThumbsUp, Users } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';
import { AdminServerSummary } from './types';
import { ServerModal } from './ServerModal';

interface ServerCardProps {
	server: AdminServerSummary;
	getEnvUrl: (url: string) => string;
	onServerDeleted: (id: string) => void;
	onServerUpdated: (updated: AdminServerSummary) => void;
	onViewAuditLogs?: (serverId: string) => void;
}

export function ServerCard({ server, getEnvUrl, onServerDeleted, onServerUpdated, onViewAuditLogs }: ServerCardProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [copiedId, setCopiedId] = useState(false);

	const iconUrl = server.icon
		? String(server.icon).startsWith('http')
			? String(server.icon)
			: `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.${String(server.icon).startsWith('a_') ? 'gif' : 'png'}`
		: null;

	const displayName = server.name || t('common.unknownServer');
	const privacy = server.privacy || 'private';
	const memberCount = server.memberCount ?? 0;
	const voteCount = server.voteCount ?? 0;

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
					{iconUrl ? (
						<Image
							src={iconUrl}
							alt={displayName}
							width={56}
							height={56}
							className="h-14 w-14 rounded-2xl border border-(--border)/10 object-cover shrink-0"
							unoptimized
							draggable={false}
						/>
					) : (
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--border)/15 shrink-0 text-(--text)">
							<ServerIcon size={24} className="text-(--text-muted)" />
						</div>
					)}

					<div className="flex flex-col overflow-hidden min-w-0">
						<div className="flex items-center gap-1.5 min-w-0">
							<h2 className="font-bold text-base text-(--text) truncate group-hover:text-(--accent) transition-colors">{displayName}</h2>
							{server.verified && <CheckCircle2 size={14} className="text-(--accent-green) shrink-0" />}
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
								<Users size={11} className="text-(--accent)" />
								{memberCount.toLocaleString()}
							</span>
							<span className="inline-flex items-center gap-1 text-xs text-(--text-muted)">
								<ThumbsUp size={11} className="text-(--accent)" />
								{voteCount.toLocaleString()}
							</span>
							{server.vanitySlug && <span className="text-xs font-mono text-(--accent) truncate">/{server.vanitySlug}</span>}
						</div>

						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								navigator.clipboard.writeText(server.id);
								setCopiedId(true);
								toast({ type: 'success', title: t('admin.users.idCopied') });
								setTimeout(() => setCopiedId(false), 2000);
							}}
							className="inline-flex items-center gap-1 w-fit text-[10px] text-(--text-muted)/70 hover:text-(--text) font-mono mt-1 px-1.5 py-0.5 rounded-xl bg-(--background)/40 hover:bg-(--background) border border-(--border)/10 transition-colors cursor-pointer"
						>
							<span>{t('admin.users.card.idPrefix', { id: server.id })}</span>
							{copiedId ? <Check size={10} className="text-(--accent-green)" /> : <Copy size={10} />}
						</button>
					</div>
				</div>

				<div className="flex items-center gap-1.5 relative z-10 shrink-0 mr-2">
					<a
						href={`${getEnvUrl('https://app.xernerx.com')}/servers/${server.vanitySlug || server.id}`}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						title={t('admin.servers.openProfile')}
						className="flex items-center justify-center w-8 h-8 rounded-full bg-(--accent)/15 hover:bg-(--accent)/25 text-(--accent) opacity-0 group-hover:opacity-100 transition-all"
					>
						<ExternalLink size={14} />
					</a>
					<div className="flex items-center justify-center w-8 h-8 rounded-full bg-(--border)/10 opacity-0 group-hover:opacity-100 transition-all text-(--text)">
						<Settings2 size={16} />
					</div>
				</div>
			</motion.div>

			<ServerModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				server={server}
				getEnvUrl={getEnvUrl}
				onServerDeleted={onServerDeleted}
				onServerUpdated={onServerUpdated}
				onViewAuditLogs={onViewAuditLogs}
			/>
		</>
	);
}
