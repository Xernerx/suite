/** @format */
'use client';

import React from 'react';
import { Activity, Gauge, Megaphone, RefreshCw } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';
import { Button, Input, Modal, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import type { EnvFilterMode } from '../OverviewSubdomainCard';

export type StatusFilterMode = 'all' | 'synced' | 'ahead';

export interface ChangelogModalState {
	open: boolean;
	title: string;
	loading: boolean;
	entries: { version: string; date?: string; content: string }[];
}

export interface IncidentModalState {
	open: boolean;
	title: string;
	content: string;
	severity: string;
	submitting: boolean;
}

interface OverviewHeaderProps {
	batchAuditState: { active: boolean; current: number; total: number } | null;
	refreshing: boolean;
	onBatchAudit: (targetEnv: 'prod' | 'canary') => void;
	onOpenIncident: () => void;
	onRefresh: () => void;
}

export function OverviewHeader({ batchAuditState, refreshing, onBatchAudit, onOpenIncident, onRefresh }: OverviewHeaderProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-wrap justify-between items-center gap-4">
			<div>
				<h2 className="text-2xl font-bold text-(--text)">{t('admin.dashboard.overview.title')}</h2>
				<p className="text-sm text-(--text-muted) mt-0.5">{t('admin.dashboard.overview.subtitle')}</p>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button variant="secondary" onClick={() => onBatchAudit('prod')} disabled={Boolean(batchAuditState?.active)} className="inline-flex items-center gap-2">
					<Gauge size={15} className={batchAuditState?.active ? 'animate-pulse text-(--accent)' : ''} />
					<span>
						{batchAuditState?.active
							? t('admin.dashboard.overview.auditingProgress', { current: batchAuditState.current, total: batchAuditState.total })
							: t('admin.dashboard.overview.auditAllProd')}
					</span>
				</Button>
				<Button variant="secondary" onClick={() => onBatchAudit('canary')} disabled={Boolean(batchAuditState?.active)} className="inline-flex items-center gap-2">
					<Gauge size={15} />
					<span>{t('admin.dashboard.overview.auditAllCanary')}</span>
				</Button>
				<Button variant="secondary" onClick={onOpenIncident} className="inline-flex items-center gap-2">
					<Megaphone size={15} className="text-(--accent-orange)" />
					<span>{t('admin.dashboard.overview.declareIncident')}</span>
				</Button>
				<Button onClick={onRefresh} disabled={refreshing} className="inline-flex items-center gap-2">
					<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
					<span>{refreshing ? t('admin.dashboard.overview.refreshing') : t('admin.dashboard.overview.refresh')}</span>
				</Button>
			</div>
		</div>
	);
}

interface OverviewFilterBarProps {
	appsCount: number;
	syncedCount: number;
	canaryAheadCount: number;
	statusFilter: StatusFilterMode;
	setStatusFilter: (mode: StatusFilterMode) => void;
	envFilter: EnvFilterMode;
	setEnvFilter: (mode: EnvFilterMode) => void;
	isDev: boolean;
}

export function OverviewFilterBar({ appsCount, syncedCount, canaryAheadCount, statusFilter, setStatusFilter, envFilter, setEnvFilter, isDev }: OverviewFilterBarProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-wrap items-center justify-between gap-4">
			<div>
				<h3 className="text-xl font-bold text-(--text) flex items-center gap-2">
					<Activity size={20} className="text-(--accent)" />
					<span>{t('admin.dashboard.overview.seoSectionTitle')}</span>
				</h3>
				<p className="text-xs text-(--text-muted) mt-0.5">{t('admin.dashboard.overview.seoSectionSubtitle')}</p>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<div className="inline-flex items-center p-1 rounded-full bg-(--foreground)/40 backdrop-blur-md border border-(--border)/10 shadow-xs text-xs">
					{(
						[
							{ id: 'all', label: t('admin.dashboard.overview.filterAll', { count: appsCount }) },
							{ id: 'synced', label: t('admin.dashboard.overview.filterSynced', { count: syncedCount }) },
							{ id: 'ahead', label: t('admin.dashboard.overview.filterCanaryAhead', { count: canaryAheadCount }) },
						] as const
					).map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setStatusFilter(tab.id)}
							className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
								statusFilter === tab.id ? 'bg-(--accent) text-white shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				<div className="inline-flex items-center p-1 rounded-full bg-(--foreground)/40 backdrop-blur-md border border-(--border)/10 shadow-xs text-xs">
					{(
						[
							{ id: 'all', label: t('admin.dashboard.overview.envAll') },
							{ id: 'prod', label: t('admin.dashboard.overview.envProdOnly') },
							{ id: 'canary', label: t('admin.dashboard.overview.envCanaryOnly') },
							...(isDev ? [{ id: 'dev' as const, label: t('admin.dashboard.overview.envDevOnly') }] : []),
						] as const
					).map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setEnvFilter(tab.id)}
							className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
								envFilter === tab.id ? 'bg-(--accent) text-white shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

interface OverviewChangelogModalProps {
	changelogModal: ChangelogModalState;
	onOpenChange: (open: boolean) => void;
}

export function OverviewChangelogModal({ changelogModal, onOpenChange }: OverviewChangelogModalProps) {
	const { t } = useDictionary();

	return (
		<Modal open={changelogModal.open} onOpenChange={onOpenChange} title={changelogModal.title}>
			<div className="flex flex-col gap-3 max-h-[60dvh] overflow-y-auto pr-1">
				{changelogModal.loading ? (
					<div className="flex justify-center py-6">
						<Loading variant="small" />
					</div>
				) : changelogModal.entries.length === 0 ? (
					<p className="text-sm text-(--text-muted) py-6 text-center">{t('admin.dashboard.overview.changelogEmpty')}</p>
				) : (
					changelogModal.entries.slice(0, 10).map((entry, idx) => (
						<div key={`${entry.version}-${idx}`} className="p-3.5 rounded-xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-1.5">
							<div className="flex items-center justify-between">
								<span className="font-mono font-bold text-sm text-(--accent)">v{String(entry.version).replace(/^v/i, '')}</span>
								{entry.date && <span className="text-xs text-(--text-muted)">{entry.date}</span>}
							</div>
							<div className="text-xs text-(--text-muted) whitespace-pre-wrap leading-relaxed">{entry.content}</div>
						</div>
					))
				)}
			</div>
		</Modal>
	);
}

interface OverviewIncidentModalProps {
	incidentModal: IncidentModalState;
	setIncidentModal: React.Dispatch<React.SetStateAction<IncidentModalState>>;
	getEnvUrl: (url: string) => string;
}

export function OverviewIncidentModal({ incidentModal, setIncidentModal, getEnvUrl }: OverviewIncidentModalProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	return (
		<Modal open={incidentModal.open} onOpenChange={(open) => setIncidentModal((prev) => ({ ...prev, open }))} title={t('admin.dashboard.overview.incidentModalTitle')}>
			<div className="flex flex-col gap-4">
				<p className="text-xs text-(--text-muted)">{t('admin.dashboard.overview.incidentModalDesc')}</p>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text)">{t('admin.dashboard.overview.incidentSeverity')}</label>
					<Selector
						value={incidentModal.severity}
						onChange={(val: string) => setIncidentModal((prev) => ({ ...prev, severity: val }))}
						options={[
							{ value: 'warning', label: t('admin.dashboard.overview.severityWarning') },
							{ value: 'error', label: t('admin.dashboard.overview.severityError') },
							{ value: 'info', label: t('admin.dashboard.overview.severityInfo') },
							{ value: 'success', label: t('admin.dashboard.overview.severitySuccess') },
						]}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text)">{t('admin.dashboard.overview.incidentTitleLabel')}</label>
					<Input value={incidentModal.title} onChange={(e) => setIncidentModal((prev) => ({ ...prev, title: e.target.value }))} />
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text)">{t('admin.dashboard.overview.incidentMessageLabel')}</label>
					<Input variant="textarea" rows={3} value={incidentModal.content} onChange={(e) => setIncidentModal((prev) => ({ ...prev, content: e.target.value }))} />
				</div>
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={() => setIncidentModal((prev) => ({ ...prev, open: false }))}>
						{t('common.actions.cancel')}
					</Button>
					<Button
						disabled={incidentModal.submitting || !incidentModal.title.trim()}
						onClick={async () => {
							setIncidentModal((prev) => ({ ...prev, submitting: true }));
							try {
								const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/announcements'), {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									credentials: 'include',
									body: JSON.stringify({
										broadcastOnly: true,
										title: incidentModal.title,
										content: incidentModal.content,
										severity: incidentModal.severity,
										link: getEnvUrl('https://info.xernerx.com/status'),
									}),
								});
								if (res.ok) {
									toast({ type: 'success', title: t('admin.dashboard.overview.incidentBroadcastSuccess') });
									setIncidentModal((prev) => ({ ...prev, open: false, submitting: false }));
								} else {
									throw new Error(t('admin.dashboard.overview.incidentBroadcastFailed'));
								}
							} catch (err: any) {
								toast({ type: 'error', title: err.message });
								setIncidentModal((prev) => ({ ...prev, submitting: false }));
							}
						}}
					>
						<Megaphone size={15} />
						<span>{t('admin.dashboard.overview.broadcastAlert')}</span>
					</Button>
				</div>
			</div>
		</Modal>
	);
}
