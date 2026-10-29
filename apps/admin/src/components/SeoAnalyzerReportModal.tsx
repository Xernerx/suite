/** @format */
'use client';

import { useDictionary } from '@xernerx/providers';
import { Button, Modal } from '@xernerx/ui';
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import type { McpSeoScoreData } from './OverviewSummaryCards';

interface SeoAnalyzerReportModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	appName: string;
	envLabel: string;
	targetUrl: string;
	data: McpSeoScoreData | null;
	loading: boolean;
	onRescan: () => void;
}

const CHECK_KEYS = [
	'title',
	'title_len',
	'description',
	'description_len',
	'headings',
	'h1',
	'h2h3',
	'word_count',
	'readability',
	'keywords_meta',
	'keywords_usage',
	'viewport',
	'favicon',
	'structured_data',
	'canonical',
	'noindex',
	'load_time',
	'alt_text',
	'links',
	'robots',
	'sitemap',
] as const;

export default function SeoAnalyzerReportModal({ open, onOpenChange, appName, envLabel, targetUrl, data, loading, onRescan }: SeoAnalyzerReportModalProps) {
	const { t } = useDictionary();

	const getTenPointBadgeStyle = (score: number) => {
		if (score >= 8) return 'border-(--accent-green)/50 bg-(--accent-green)/10 text-(--accent-green)';
		if (score >= 5) return 'border-(--accent-orange)/50 bg-(--accent-orange)/10 text-(--accent-orange)';
		return 'border-(--accent-red)/50 bg-(--accent-red)/10 text-(--accent-red)';
	};

	const getSeverityBadgeStyle = (severity: 'high' | 'medium' | 'low') => {
		if (severity === 'high') return 'border-(--accent-red)/40 bg-(--accent-red)/10 text-(--accent-red)';
		if (severity === 'medium') return 'border-(--accent-orange)/40 bg-(--accent-orange)/10 text-(--accent-orange)';
		return 'border-(--accent)/40 bg-(--accent)/10 text-(--accent)';
	};

	return (
		<Modal open={open} onOpenChange={onOpenChange} title={t('admin.dashboard.overview.mcpModalTitle', { name: appName, env: envLabel })} description={targetUrl} maxWidth="max-w-2xl">
			{!data ? (
				<div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.overview.mcpEmptyDesc')}</p>
					<Button onClick={onRescan} disabled={loading} className="inline-flex items-center gap-2">
						<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
						<span>{loading ? t('admin.dashboard.overview.lighthouseScanning') : t('admin.dashboard.overview.mcpRunScan')}</span>
					</Button>
				</div>
			) : (
				<div className="flex flex-col gap-4 max-h-[68dvh] overflow-y-auto pr-1">
					{/* Top KPI Summary Grid */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
						<div className="p-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-1">
							<span className="text-[11px] font-bold uppercase text-(--text-muted)">{t('admin.dashboard.overview.mcpCategories.seo')}</span>
							<div className="flex items-baseline gap-1.5">
								<span className={`px-2.5 py-0.5 rounded-full border text-sm font-mono font-bold ${getTenPointBadgeStyle(data.score)}`}>{data.score}/10</span>
							</div>
						</div>

						<div className="p-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-1">
							<span className="text-[11px] font-bold uppercase text-(--text-muted)">{t('admin.dashboard.overview.mcpCategories.geo')}</span>
							<div className="flex items-baseline gap-1.5">
								<span className={`px-2.5 py-0.5 rounded-full border text-sm font-mono font-bold ${getTenPointBadgeStyle(data.geoScore)}`}>{data.geoScore}/10</span>
							</div>
						</div>

						<div className="p-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-1">
							<span className="text-[11px] font-bold uppercase text-(--text-muted)">{t('admin.dashboard.overview.mcpCategories.checks')}</span>
							<span className="text-base font-mono font-bold text-(--text)">
								{data.checksPassed}/{data.checksTotal}
							</span>
						</div>

						<div className="p-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-1">
							<span className="text-[11px] font-bold uppercase text-(--text-muted)">{t('admin.dashboard.overview.mcpMetrics.wordCount')}</span>
							<span className="text-base font-mono font-bold text-(--text)">
								{data.wordCount.toLocaleString()} <span className="text-[11px] font-normal text-(--text-muted)">({data.loadTimeMs}ms)</span>
							</span>
						</div>
					</div>

					{/* 21-Point Technical & On-Page Checklist */}
					<div className="p-3.5 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-2.5">
						<div className="flex items-center justify-between">
							<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('admin.dashboard.overview.mcpChecksTitle')}</span>
							<span className="text-[11px] text-(--text-muted)">{t('admin.dashboard.overview.mcpLinksSummary', { internal: data.internalLinks, external: data.externalLinks })}</span>
						</div>
						<div className="flex flex-wrap gap-1.5">
							{CHECK_KEYS.map((key) => {
								const passed = Boolean(data.scoreBreakdown?.[key]);
								return (
									<span
										key={key}
										className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
											passed ? 'border-(--accent-green)/35 bg-(--accent-green)/10 text-(--accent-green)' : 'border-(--accent-red)/35 bg-(--accent-red)/10 text-(--accent-red)'
										}`}
									>
										{passed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
										<span>{t(`admin.dashboard.overview.mcpCheckLabels.${key}`)}</span>
									</span>
								);
							})}
							<span
								className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
									data.aeoReady
										? 'border-(--accent-green)/35 bg-(--accent-green)/10 text-(--accent-green)'
										: 'border-(--accent-orange)/35 bg-(--accent-orange)/10 text-(--accent-orange)'
								}`}
							>
								<Sparkles size={11} />
								<span>{t('admin.dashboard.overview.mcpCheckLabels.aeo_ready')}</span>
							</span>
						</div>
					</div>

					{/* Actionable Issues & Recommendations */}
					<div className="flex flex-col gap-2">
						<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('admin.dashboard.overview.mcpIssuesTitle')}</span>
						{data.issues.length === 0 && data.recommendations.length === 0 ? (
							<div className="p-3.5 rounded-2xl bg-(--accent-green)/10 border border-(--accent-green)/30 flex items-center gap-2 text-xs text-(--accent-green) font-semibold">
								<CheckCircle2 size={15} />
								<span>{t('admin.dashboard.overview.mcpAllPassed')}</span>
							</div>
						) : (
							<div className="flex flex-col gap-2">
								{data.issues.map((issue, idx) => (
									<div key={`${issue.title}-${idx}`} className="p-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-1">
										<div className="flex items-center justify-between gap-2">
											<span className="text-xs font-bold text-(--text) inline-flex items-center gap-1.5">
												<AlertTriangle size={12} className="text-(--accent-orange)" />
												<span>{issue.title}</span>
											</span>
											<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSeverityBadgeStyle(issue.severity)}`}>
												{issue.severity} · {issue.category}
											</span>
										</div>
										<p className="text-xs text-(--text-muted)">{issue.detail}</p>
										<p className="text-[11px] text-(--accent) font-medium">{issue.action}</p>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Modal Footer Actions */}
					<div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-(--border)/10">
						<a
							href="https://mycreativeplan.com/my-creative-tools-seo-analyzer/"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--accent) hover:underline"
						>
							<span>{t('admin.dashboard.overview.mcpOpenExternal')}</span>
							<ExternalLink size={12} />
						</a>

						<div className="flex items-center gap-2">
							<Button variant="secondary" size="sm" onClick={onRescan} disabled={loading} className="inline-flex items-center gap-1.5">
								<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
								<span>{loading ? t('admin.dashboard.overview.lighthouseScanning') : t('admin.dashboard.overview.mcpRescanBtn')}</span>
							</Button>
							<Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
								{t('common.actions.close')}
							</Button>
						</div>
					</div>
				</div>
			)}
		</Modal>
	);
}
