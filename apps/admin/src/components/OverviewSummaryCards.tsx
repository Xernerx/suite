/** @format */
'use client';

import { AlertCircle, CheckCircle2, Clock, Server } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

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
			<div className="p-5 rounded-2xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col gap-2">
				<div className="flex items-center justify-between text-(--text-muted)">
					<span className="text-xs font-bold uppercase tracking-wider">{t('admin.dashboard.overview.cards.services')}</span>
					<Server size={18} className="text-(--accent)" />
				</div>
				<div className="text-3xl font-black text-(--text)">{appsCount}</div>
				<div className="text-xs text-(--text-muted)">{t('admin.dashboard.overview.cards.synced', { count: syncedCount, ahead: canaryAheadCount })}</div>
			</div>

			<div className="p-5 rounded-2xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col gap-2">
				<div className="flex items-center justify-between text-(--text-muted)">
					<span className="text-xs font-bold uppercase tracking-wider">{t('admin.dashboard.overview.cards.openIssues')}</span>
					<AlertCircle size={18} className="text-red-400" />
				</div>
				<div className="text-3xl font-black text-(--text)">{openIssuesCount}</div>
				<div className="text-xs text-yellow-400">{t('admin.dashboard.overview.cards.pendingReview', { count: pendingReviewCount })}</div>
			</div>

			<div className="p-5 rounded-2xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col gap-2">
				<div className="flex items-center justify-between text-(--text-muted)">
					<span className="text-xs font-bold uppercase tracking-wider">{t('admin.dashboard.overview.cards.resolvedIssues')}</span>
					<CheckCircle2 size={18} className="text-green-400" />
				</div>
				<div className="text-3xl font-black text-(--text)">{resolvedIssuesCount}</div>
				<div className="text-xs text-(--text-muted)">{t('info.roadmap.metrics.recentResolutions')}</div>
			</div>

			<div className="p-5 rounded-2xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col gap-2">
				<div className="flex items-center justify-between text-(--text-muted)">
					<span className="text-xs font-bold uppercase tracking-wider">{t('admin.dashboard.overview.cards.avgResolution')}</span>
					<Clock size={18} className="text-blue-400" />
				</div>
				<div className="text-3xl font-black text-(--text)">{avgHours ? t('admin.dashboard.overview.cards.hours', { count: avgHours }) : t('info.roadmap.metrics.na')}</div>
				<div className="text-xs text-(--text-muted)">{t('info.roadmap.metrics.avgResolutionTime')}</div>
			</div>
		</div>
	);
}
