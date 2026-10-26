/** @format */
'use client';

import { AlertCircle, CheckCircle2, Clock, Server } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export interface SuiteAppVersionInfo {
	id: string;
	name: string;
	domain: string;
	localVersion: string | null;
	devVersion: string | null;
	canaryVersion: string | null;
	prodVersion: string | null;
	devLatencyMs: number | null;
	canaryLatencyMs: number | null;
	prodLatencyMs: number | null;
	versions: string[];
}

export interface LighthouseScoreData {
	seo: number;
	perf: number;
	a11y: number;
	bp: number;
	prevSeo?: number;
	prevPerf?: number;
	prevA11y?: number;
	prevBp?: number;
	updatedAt: number;
}

export const LIGHTHOUSE_STORAGE_KEY = 'xernerx_lighthouse_scores_v1';

const SUITE_APP_DEFS = [
	['www', 'Website', 'www.xernerx.com'],
	['app', 'App', 'app.xernerx.com'],
	['portal', 'Portal', 'portal.xernerx.com'],
	['account', 'Account', 'account.xernerx.com'],
	['store', 'Store', 'store.xernerx.com'],
	['info', 'Info & Support', 'info.xernerx.com'],
	['docs', 'Docs', 'docs.xernerx.com'],
	['admin', 'Admin', 'admin.xernerx.com'],
	['hosting', 'Hosting', 'hosting.xernerx.com'],
	['api', 'API', 'api.xernerx.com'],
	['cdn', 'CDN', 'cdn.xernerx.com'],
] as const;

export const FALLBACK_APPS: SuiteAppVersionInfo[] = SUITE_APP_DEFS.map(([id, name, domain]) => ({
	id,
	name,
	domain,
	localVersion: null,
	devVersion: null,
	canaryVersion: null,
	prodVersion: null,
	devLatencyMs: null,
	canaryLatencyMs: null,
	prodLatencyMs: null,
	versions: [],
}));

interface OverviewSummaryCardsProps {
	appsCount: number;
	syncedCount: number;
	canaryAheadCount: number;
	openIssuesCount: number;
	pendingReviewCount: number;
	resolvedIssuesCount: number;
	avgHours: string | null;
}

export default function OverviewSummaryCards({ appsCount, syncedCount, canaryAheadCount, openIssuesCount, pendingReviewCount, resolvedIssuesCount, avgHours }: OverviewSummaryCardsProps) {
	const { t } = useDictionary();

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<div className="p-5 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col gap-2">
				<div className="flex items-center justify-between text-(--text-muted)">
					<span className="text-xs font-bold uppercase tracking-wider">{t('admin.dashboard.overview.cards.services')}</span>
					<Server size={18} className="text-(--accent)" />
				</div>
				<div className="text-3xl font-black text-(--text)">{appsCount}</div>
				<div className="text-xs text-(--text-muted)">{t('admin.dashboard.overview.cards.synced', { count: syncedCount, ahead: canaryAheadCount })}</div>
			</div>

			<div className="p-5 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col gap-2">
				<div className="flex items-center justify-between text-(--text-muted)">
					<span className="text-xs font-bold uppercase tracking-wider">{t('admin.dashboard.overview.cards.openIssues')}</span>
					<AlertCircle size={18} className="text-(--accent-red)" />
				</div>
				<div className="text-3xl font-black text-(--text)">{openIssuesCount}</div>
				<div className="text-xs text-(--accent-orange)">{t('admin.dashboard.overview.cards.pendingReview', { count: pendingReviewCount })}</div>
			</div>

			<div className="p-5 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col gap-2">
				<div className="flex items-center justify-between text-(--text-muted)">
					<span className="text-xs font-bold uppercase tracking-wider">{t('admin.dashboard.overview.cards.resolvedIssues')}</span>
					<CheckCircle2 size={18} className="text-(--accent-green)" />
				</div>
				<div className="text-3xl font-black text-(--text)">{resolvedIssuesCount}</div>
				<div className="text-xs text-(--text-muted)">{t('info.roadmap.metrics.recentResolutions')}</div>
			</div>

			<div className="p-5 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col gap-2">
				<div className="flex items-center justify-between text-(--text-muted)">
					<span className="text-xs font-bold uppercase tracking-wider">{t('admin.dashboard.overview.cards.avgResolution')}</span>
					<Clock size={18} className="text-(--accent)" />
				</div>
				<div className="text-3xl font-black text-(--text)">{avgHours ? t('admin.dashboard.overview.cards.hours', { count: avgHours }) : t('info.roadmap.metrics.na')}</div>
				<div className="text-xs text-(--text-muted)">{t('info.roadmap.metrics.avgResolutionTime')}</div>
			</div>
		</div>
	);
}
