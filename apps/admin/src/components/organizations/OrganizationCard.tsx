/** @format */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Building2, Check, CheckCircle2, Coins, Copy, ExternalLink, Settings2, Users } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';
import { AdminOrganizationSummary } from './types';
import { OrganizationModal } from './OrganizationModal';

interface OrganizationCardProps {
	organization: AdminOrganizationSummary;
	getEnvUrl: (url: string) => string;
	onOrgDeleted: (id: string) => void;
	onOrgUpdated: (updated: AdminOrganizationSummary) => void;
	onViewAuditLogs?: (orgId: string) => void;
	onNavigateEntity?: (tab: string, query: string) => void;
}

export function OrganizationCard({ organization, getEnvUrl, onOrgDeleted, onOrgUpdated, onViewAuditLogs, onNavigateEntity }: OrganizationCardProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [copiedId, setCopiedId] = useState(false);

	const orgId = organization.id || String(organization._id || '');
	const iconUrl = organization.iconUrl || organization.icon || null;
	const displayName = organization.name || t('admin.organizations.unnamedOrg');
	const privacy = organization.privacy || 'private';
	const memberCount = Array.isArray(organization.members) ? organization.members.length : 0;
	const treasuryBalance = organization.treasuryBalance ?? 0;

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
							<Building2 size={24} className="text-(--text-muted)" />
						</div>
					)}

					<div className="flex flex-col overflow-hidden min-w-0">
						<div className="flex items-center gap-1.5 min-w-0">
							<h2 className="font-bold text-base text-(--text) truncate group-hover:text-(--accent) transition-colors">{displayName}</h2>
							{organization.verified && <CheckCircle2 size={14} className="text-(--accent-green) shrink-0" />}
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
								<Coins size={11} className="text-(--accent)" />
								{treasuryBalance.toLocaleString()}
							</span>
							{organization.vanitySlug && <span className="text-xs font-mono text-(--accent) truncate">/{organization.vanitySlug}</span>}
						</div>

						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								navigator.clipboard.writeText(orgId);
								setCopiedId(true);
								toast({ type: 'success', title: t('admin.users.idCopied') });
								setTimeout(() => setCopiedId(false), 2000);
							}}
							className="inline-flex items-center gap-1 w-fit text-[10px] text-(--text-muted)/70 hover:text-(--text) font-mono mt-1 px-1.5 py-0.5 rounded-xl bg-(--background)/40 hover:bg-(--background) border border-(--border)/10 transition-colors cursor-pointer"
						>
							<span>{t('admin.users.card.idPrefix', { id: orgId })}</span>
							{copiedId ? <Check size={10} className="text-(--accent-green)" /> : <Copy size={10} />}
						</button>
					</div>
				</div>

				<div className="flex items-center gap-1.5 relative z-10 shrink-0 mr-2">
					<a
						href={`${getEnvUrl('https://app.xernerx.com')}/organizations/${organization.vanitySlug || orgId}`}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						title={t('admin.organizations.openProfile')}
						className="flex items-center justify-center w-8 h-8 rounded-full bg-(--accent)/15 hover:bg-(--accent)/25 text-(--accent) opacity-0 group-hover:opacity-100 transition-all"
					>
						<ExternalLink size={14} />
					</a>
					<div className="flex items-center justify-center w-8 h-8 rounded-full bg-(--border)/10 opacity-0 group-hover:opacity-100 transition-all text-(--text)">
						<Settings2 size={16} />
					</div>
				</div>
			</motion.div>

			<OrganizationModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				organization={organization}
				getEnvUrl={getEnvUrl}
				onOrgDeleted={onOrgDeleted}
				onOrgUpdated={onOrgUpdated}
				onViewAuditLogs={onViewAuditLogs}
				onNavigateEntity={onNavigateEntity}
			/>
		</>
	);
}
