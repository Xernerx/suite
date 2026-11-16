/** @format */
'use client';

import { useState } from 'react';
import { useDictionary, useToast } from '@xernerx/providers';
import { Button, Modal } from '@xernerx/ui';
import { Download, ExternalLink, FileText, Globe, Layers, Printer, RefreshCw, Sparkles } from 'lucide-react';
import type { McpSeoPageReport, McpSeoScoreData } from './OverviewSummaryCards';
import { exportSeoReportJson, getTenPointBadgeStyle, printSeoReport, type ReportTab } from './seo/seoReportUtils';
import { SeoGeoTab, SeoOverviewTab, SeoPagesTab, SeoRoadmapTab } from './seo/SeoReportTabs';

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

export default function SeoAnalyzerReportModal({ open, onOpenChange, appName, envLabel, targetUrl, data, loading, onRescan }: SeoAnalyzerReportModalProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [activeTab, setActiveTab] = useState<ReportTab>('overview');
	const [expandedPageUrl, setExpandedPageUrl] = useState<string | null>(null);

	const handleCopyText = (text: string) => {
		navigator.clipboard?.writeText(text);
		toast({ title: t('common.actions.copied'), type: 'success' });
	};

	const pages: McpSeoPageReport[] = data?.pages && data.pages.length > 0 ? data.pages : [];
	const geoSignals = data?.geoSignals || [];
	const passedGeoCount = geoSignals.filter((s) => s.ok).length;

	return (
		<Modal open={open} onOpenChange={onOpenChange} title={t('admin.dashboard.overview.mcpModalTitle', { name: appName, env: envLabel })} description={targetUrl} maxWidth="max-w-4xl">
			{!data ? (
				<div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.overview.mcpEmptyDesc')}</p>
					<Button onClick={onRescan} disabled={loading} className="inline-flex items-center gap-2">
						<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
						<span>{loading ? t('admin.dashboard.overview.lighthouseScanning') : t('admin.dashboard.overview.mcpRunScan')}</span>
					</Button>
				</div>
			) : (
				<div className="flex flex-col gap-4 max-h-[74dvh] overflow-y-auto pr-1">
					{/* Top KPI Summary Grid */}
					<div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
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
							<span className="text-[11px] font-bold uppercase text-(--text-muted)">{t('admin.dashboard.overview.mcpMetrics.pagesCount')}</span>
							<span className="text-base font-mono font-bold text-(--text)">
								{data.pagesCount || pages.length || 1} {data.candidatesFound ? <span className="text-[11px] font-normal text-(--text-muted)">/ {data.candidatesFound}</span> : null}
							</span>
						</div>

						<div className="p-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-1">
							<span className="text-[11px] font-bold uppercase text-(--text-muted)">{t('admin.dashboard.overview.mcpCategories.checks')}</span>
							<span className="text-base font-mono font-bold text-(--text)">
								{data.checksPassed}/{data.checksTotal}
							</span>
						</div>

						<div className="p-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-1 col-span-2 sm:col-span-1">
							<span className="text-[11px] font-bold uppercase text-(--text-muted)">{t('admin.dashboard.overview.mcpMetrics.wordCount')}</span>
							<span className="text-base font-mono font-bold text-(--text)">
								{data.wordCount.toLocaleString()} <span className="text-[11px] font-normal text-(--text-muted)">({data.loadTimeMs}ms)</span>
							</span>
						</div>
					</div>

					{/* Navigation Tabs */}
					<div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
						{(
							[
								{ id: 'overview', label: t('admin.dashboard.overview.mcpTabs.overview'), icon: Layers },
								{ id: 'geo', label: `${t('admin.dashboard.overview.mcpTabs.geo')} (${passedGeoCount}/${geoSignals.length || 14})`, icon: Sparkles },
								{ id: 'pages', label: `${t('admin.dashboard.overview.mcpTabs.pages')} (${pages.length || 1})`, icon: Globe },
								{ id: 'roadmap', label: t('admin.dashboard.overview.mcpTabs.roadmap'), icon: FileText },
							] as const
						).map((tab) => {
							const Icon = tab.icon;
							const active = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => setActiveTab(tab.id)}
									className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
										active ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)/40'
									}`}
								>
									<Icon size={13} />
									<span>{tab.label}</span>
								</button>
							);
						})}
					</div>

					{activeTab === 'overview' && <SeoOverviewTab data={data} pages={pages} />}
					{activeTab === 'geo' && <SeoGeoTab geoSignals={geoSignals} />}
					{activeTab === 'pages' && (
						<SeoPagesTab data={data} pages={pages} targetUrl={targetUrl} appName={appName} expandedPageUrl={expandedPageUrl} setExpandedPageUrl={setExpandedPageUrl} />
					)}
					{activeTab === 'roadmap' && <SeoRoadmapTab data={data} onCopyText={handleCopyText} />}

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

						<div className="flex flex-wrap items-center gap-2">
							<Button variant="secondary" size="sm" onClick={() => exportSeoReportJson({ targetUrl, appName, envLabel, data })} className="inline-flex items-center gap-1.5">
								<Download size={13} />
								<span>JSON</span>
							</Button>
							<Button variant="secondary" size="sm" onClick={() => printSeoReport({ targetUrl, appName, envLabel, data })} className="inline-flex items-center gap-1.5">
								<Printer size={13} />
								<span>{t('admin.dashboard.overview.mcpPrintReport')}</span>
							</Button>
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
