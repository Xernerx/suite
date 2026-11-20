/** @format */
'use client';

import { Folder, Hash, Megaphone, RefreshCw, Shield } from 'lucide-react';
import { Button, Input, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { DiscordChannelItem, DiscordRoleItem, YourAppsConfigSnapshot } from './types';

interface ApplicationsSettingsPanelProps {
	config: YourAppsConfigSnapshot;
	discordRoles: DiscordRoleItem[];
	discordChannels: DiscordChannelItem[];
	isDirty: boolean;
	syncingPanelNow: boolean;
	onSyncPanelNow: () => void;
	onPatch: (patch: Partial<YourAppsConfigSnapshot>) => void;
}

export default function ApplicationsSettingsPanel({ config, discordRoles, discordChannels, isDirty, syncingPanelNow, onSyncPanelNow, onPatch }: ApplicationsSettingsPanelProps) {
	const { t } = useDictionary();

	const channelSelectorOptions = [
		{ value: '', label: t('app.dashboard.applications.channels.placeholder') },
		...discordChannels
			.filter((c) => c.type === 0 || c.type === 5)
			.map((c) => ({
				value: c.id,
				label: (
					<span className="inline-flex items-center gap-1.5">
						{c.type === 5 ? <Megaphone size={13} className="text-(--text-muted) shrink-0" /> : <Hash size={13} className="text-(--text-muted) shrink-0" />}
						<span>{c.name}</span>
					</span>
				),
			})),
	];

	const categorySelectorOptions = [
		{ value: '', label: t('app.dashboard.applications.channels.placeholder') },
		...discordChannels
			.filter((c) => c.type === 4)
			.map((c) => ({
				value: c.id,
				label: (
					<span className="inline-flex items-center gap-1.5">
						<Folder size={13} className="text-(--text-muted) shrink-0" />
						<span>{c.name}</span>
					</span>
				),
			})),
	];

	const multiRoleOptions = discordRoles.map((r) => ({
		label: `@${r.name}`,
		value: r.id,
		color: r.color > 0 ? `#${r.color.toString(16).padStart(6, '0')}` : undefined,
	}));

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex items-center gap-2.5 text-(--text) font-extrabold text-sm tracking-widest uppercase">
				<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
					<Shield className="w-4 h-4" />
				</div>
				<span>{t('app.dashboard.applications.title')}</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.channels.logChannel')}</label>
					<Selector value={config.logChannel} onChange={(logChannel: string) => onPatch({ logChannel })} options={channelSelectorOptions} />
					<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.channels.logChannelDesc')}</span>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.channels.archiveChannel')}</label>
					<Selector value={config.archiveChannel} onChange={(archiveChannel: string) => onPatch({ archiveChannel })} options={channelSelectorOptions} />
					<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.channels.archiveChannelDesc')}</span>
				</div>
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between gap-2">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.channels.panelChannel')}</label>
						{config.panelChannel && !isDirty && (
							<Button variant="ghost" size="sm" loading={syncingPanelNow} onClick={onSyncPanelNow} className="h-6 px-2 text-[11px]">
								<RefreshCw className="w-3 h-3" />
								<span>{t('app.dashboard.applications.positions.syncPanelsBtn')}</span>
							</Button>
						)}
					</div>
					<Selector value={config.panelChannel} onChange={(panelChannel: string) => onPatch({ panelChannel })} options={channelSelectorOptions} />
					<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.channels.panelChannelDesc')}</span>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-(--border)/10">
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.roles.submissionPings')}</label>
					<MultiSelector
						value={config.submissionPings}
						onChange={(submissionPings: string[]) => onPatch({ submissionPings })}
						options={multiRoleOptions}
						placeholder={t('app.dashboard.applications.roles.placeholder')}
					/>
					<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.roles.submissionPingsDesc')}</span>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.roles.reviewRoles')}</label>
					<MultiSelector
						value={config.reviewRoles}
						onChange={(reviewRoles: string[]) => onPatch({ reviewRoles })}
						options={multiRoleOptions}
						placeholder={t('app.dashboard.applications.roles.placeholder')}
					/>
					<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.roles.reviewRolesDesc')}</span>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.roles.adminRoles')}</label>
					<MultiSelector
						value={config.adminRoles}
						onChange={(adminRoles: string[]) => onPatch({ adminRoles })}
						options={multiRoleOptions}
						placeholder={t('app.dashboard.applications.roles.placeholder')}
					/>
					<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.roles.adminRolesDesc')}</span>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.roles.blacklistRoles')}</label>
					<MultiSelector
						value={config.blacklistRoles}
						onChange={(blacklistRoles: string[]) => onPatch({ blacklistRoles })}
						options={multiRoleOptions}
						placeholder={t('app.dashboard.applications.roles.placeholder')}
					/>
					<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.roles.blacklistRolesDesc')}</span>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-(--border)/10">
				<div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
					<div className="flex flex-col">
						<span className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.behavior.dmNotifications')}</span>
						<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.behavior.dmNotificationsDesc')}</span>
					</div>
					<Toggle checked={config.dmNotifications} onChange={(e) => onPatch({ dmNotifications: e.target.checked })} size="sm" />
				</div>
				<div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
					<div className="flex flex-col">
						<span className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.behavior.threadPerSubmission')}</span>
						<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.behavior.threadPerSubmissionDesc')}</span>
					</div>
					<Toggle checked={config.threadPerSubmission} onChange={(e) => onPatch({ threadPerSubmission: e.target.checked })} size="sm" />
				</div>
				<div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
					<div className="flex flex-col">
						<span className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.behavior.selfReviewAllowed')}</span>
						<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.behavior.selfReviewAllowedDesc')}</span>
					</div>
					<Toggle checked={config.selfReviewAllowed} onChange={(e) => onPatch({ selfReviewAllowed: e.target.checked })} size="sm" />
				</div>
				<div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
					<div className="flex flex-col">
						<span className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.behavior.pollOnSubmission')}</span>
						<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.behavior.pollOnSubmissionDesc')}</span>
					</div>
					<Toggle checked={config.pollOnSubmission} onChange={(e) => onPatch({ pollOnSubmission: e.target.checked })} size="sm" />
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-(--border)/10">
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.behavior.interviewMode')}</label>
					<Selector
						value={config.interviewMode}
						onChange={(v: string) => onPatch({ interviewMode: v === 'channel' ? 'channel' : 'thread' })}
						options={[
							{ value: 'thread', label: t('app.dashboard.applications.behavior.interviewModeThread') },
							{ value: 'channel', label: t('app.dashboard.applications.behavior.interviewModeChannel') },
						]}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.behavior.interviewCategory')}</label>
					<Selector value={config.interviewCategoryId} onChange={(interviewCategoryId: string) => onPatch({ interviewCategoryId })} options={categorySelectorOptions} />
					<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.behavior.interviewCategoryDesc')}</span>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.behavior.pollDurationHours')}</label>
					<Input
						type="number"
						min={1}
						max={168}
						value={String(config.pollDurationHours)}
						onChange={(e) => onPatch({ pollDurationHours: Math.max(1, Math.min(168, Number(e.target.value) || 48)) })}
					/>
				</div>
			</div>
		</div>
	);
}
