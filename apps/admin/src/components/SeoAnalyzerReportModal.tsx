/** @format */
'use client';

import { useState } from 'react';
import { useDictionary, useToast } from '@xernerx/providers';
import { Button, Modal } from '@xernerx/ui';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Copy, Download, ExternalLink, FileText, Globe, Layers, Printer, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import type { McpSeoIssue, McpSeoPageReport, McpSeoScoreData } from './OverviewSummaryCards';

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

type ReportTab = 'overview' | 'geo' | 'pages' | 'roadmap';

export default function SeoAnalyzerReportModal({ open, onOpenChange, appName, envLabel, targetUrl, data, loading, onRescan }: SeoAnalyzerReportModalProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [activeTab, setActiveTab] = useState<ReportTab>('overview');
	const [expandedPageUrl, setExpandedPageUrl] = useState<string | null>(null);

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

	const handleCopyText = (text: string) => {
		navigator.clipboard?.writeText(text);
		toast({ title: t('common.actions.copied'), type: 'success' });
	};

	const handleExportJson = () => {
		if (!data) return;
		const blob = new Blob([JSON.stringify({ targetUrl, appName, envLabel, exportedAt: new Date().toISOString(), report: data }, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `xernerx-visibility-report-${appName.toLowerCase().replace(/\s+/g, '-')}-${envLabel.toLowerCase()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handlePrintReport = () => {
		if (!data) return;
		const win = window.open('', '_blank', 'width=1100,height=850');
		if (!win) return;
		const pages = data.pages || [];
		const signals = data.geoSignals || [];
		const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>My Creative Tools — Visibility Report (${appName} • ${envLabel})</title>
<style>
	body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 32px; line-height: 1.5; }
	h1, h2, h3 { margin: 0 0 8px; }
	.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
	.card { border: 1px solid #cbd5e1; border-radius: 14px; padding: 14px; margin-bottom: 14px; break-inside: avoid; }
	table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 16px 0; }
	th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; }
	th { background: #f8fafc; font-weight: 700; text-transform: uppercase; font-size: 11px; }
	.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 11px; background: #f1f5f9; }
	.grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
</style>
</head>
<body>
	<h1>SEO, Content & GEO Audit — ${appName} (${envLabel})</h1>
	<p><strong>URL:</strong> ${targetUrl} &nbsp;|&nbsp; <strong>Updated:</strong> ${new Date(data.updatedAt).toLocaleString()}</p>
	<div class="card"><p>${data.executiveSummary || ''}</p></div>
	<div class="kpis">
		<div class="card"><strong>SEO Score</strong><h2>${data.score}/10</h2></div>
		<div class="card"><strong>GEO Readiness</strong><h2>${data.geoScore}/10</h2></div>
		<div class="card"><strong>Pages Analyzed</strong><h2>${data.pagesCount || pages.length || 1}</h2></div>
		<div class="card"><strong>Open Actions</strong><h2>${data.issues.length}</h2></div>
	</div>
	<h2>Multi-Page Overview</h2>
	<table>
		<thead><tr><th>URL</th><th>SEO</th><th>Title</th><th>Meta</th><th>Words</th><th>Checks</th><th>AEO/GEO</th></tr></thead>
		<tbody>
			${pages.map((p) => `<tr><td>${p.url}</td><td><strong>${p.score}/10</strong></td><td>${p.titleLen} chars</td><td>${p.descriptionLen} chars</td><td>${p.wordCount}</td><td>${p.checksPassed}/${p.checksTotal}</td><td>${p.aeoReady ? 'Ready' : 'Attention'}</td></tr>`).join('')}
		</tbody>
	</table>
	<h2>GEO Monitor (14 Weighted Signals)</h2>
	<div class="grid2">
		${signals.map((s) => `<div class="card"><strong>${s.ok ? '✓' : '!'} ${s.label} (${s.earnedPoints}/${s.maxPoints} pt)</strong><p style="margin:4px 0 0;font-size:12px;color:#475569">${s.detail}</p></div>`).join('')}
	</div>
</body>
</html>`;
		win.document.write(html);
		win.document.close();
		win.focus();
		setTimeout(() => win.print(), 250);
	};

	const pages: McpSeoPageReport[] = data?.pages && data.pages.length > 0 ? data.pages : [];
	const geoSignals = data?.geoSignals || [];
	const passedGeoCount = geoSignals.filter((s) => s.ok).length;

	const renderIssueList = (issues: McpSeoIssue[]) => {
		if (issues.length === 0) {
			return (
				<div className="p-3.5 rounded-2xl bg-(--accent-green)/10 border border-(--accent-green)/30 flex items-center gap-2 text-xs text-(--accent-green) font-semibold">
					<CheckCircle2 size={15} />
					<span>{t('admin.dashboard.overview.mcpAllPassed')}</span>
				</div>
			);
		}
		return (
			<div className="flex flex-col gap-2">
				{issues.map((issue, idx) => (
					<div key={`${issue.title}-${issue.url}-${idx}`} className="p-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-1">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<span className="text-xs font-bold text-(--text) inline-flex items-center gap-1.5">
								<AlertTriangle size={12} className="text-(--accent-orange)" />
								<span>{issue.title}</span>
							</span>
							<div className="flex items-center gap-1.5">
								{issue.url && <span className="text-[10px] font-mono text-(--text-muted) truncate max-w-48">{issue.url.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>}
								<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSeverityBadgeStyle(issue.severity)}`}>
									{issue.severity} · {issue.category}
								</span>
							</div>
						</div>
						<p className="text-xs text-(--text-muted)">{issue.detail}</p>
						<p className="text-[11px] text-(--accent) font-medium">{issue.action}</p>
					</div>
				))}
			</div>
		);
	};

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

					{/* TAB 1: OVERVIEW & MULTI-PAGE TABLE */}
					{activeTab === 'overview' && (
						<div className="flex flex-col gap-4">
							{data.executiveSummary && (
								<div className="p-3.5 rounded-2xl bg-(--accent)/10 border border-(--accent)/30 text-xs text-(--text) leading-relaxed font-medium">{data.executiveSummary}</div>
							)}

							{pages.length > 0 && (
								<div className="rounded-2xl bg-(--background)/60 border border-(--border)/10 overflow-x-auto">
									<table className="w-full text-left border-collapse text-xs">
										<thead>
											<tr className="border-b border-(--border)/10 text-[10px] font-extrabold uppercase tracking-wider text-(--text-muted)">
												<th className="py-2.5 px-3">{t('admin.dashboard.overview.mcpTable.url')}</th>
												<th className="py-2.5 px-2.5">SEO</th>
												<th className="py-2.5 px-2.5">{t('admin.dashboard.overview.mcpCheckLabels.title')}</th>
												<th className="py-2.5 px-2.5">{t('admin.dashboard.overview.mcpCheckLabels.description')}</th>
												<th className="py-2.5 px-2.5">{t('admin.dashboard.overview.mcpMetrics.wordCount')}</th>
												<th className="py-2.5 px-2.5">Schema / FAQ</th>
												<th className="py-2.5 px-3">{t('admin.dashboard.overview.mcpTable.status')}</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-(--border)/10">
											{pages.map((p) => (
												<tr key={p.url} className="hover:bg-(--foreground)/30 transition-colors">
													<td className="py-2 px-3 font-mono text-[11px] text-(--text) max-w-56 truncate" title={p.url}>
														{p.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
													</td>
													<td className="py-2 px-2.5">
														<span className={`px-2 py-0.5 rounded-full border text-[11px] font-mono font-bold ${getTenPointBadgeStyle(p.score)}`}>{p.score}/10</span>
													</td>
													<td className="py-2 px-2.5 font-mono text-[11px] text-(--text-muted)">{p.titleLen}c</td>
													<td className="py-2 px-2.5 font-mono text-[11px] text-(--text-muted)">{p.descriptionLen}c</td>
													<td className="py-2 px-2.5 font-mono text-[11px] text-(--text-muted)">{p.wordCount}</td>
													<td className="py-2 px-2.5 text-[11px] text-(--text-muted)">
														{p.hasStructuredData ? 'JSON-LD' : '—'} {p.hasFaqBlock ? '· FAQ' : ''}
													</td>
													<td className="py-2 px-3">
														<span
															className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
																p.aeoReady && p.issues.length === 0
																	? 'border-(--accent-green)/40 bg-(--accent-green)/10 text-(--accent-green)'
																	: 'border-(--accent-orange)/40 bg-(--accent-orange)/10 text-(--accent-orange)'
															}`}
														>
															{p.aeoReady && p.issues.length === 0 ? t('admin.dashboard.overview.mcpTable.optimal') : `${p.issues.length} action(s)`}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							<div className="flex flex-col gap-2">
								<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('admin.dashboard.overview.mcpIssuesTitle')}</span>
								{renderIssueList(data.issues)}
							</div>
						</div>
					)}

					{/* TAB 2: 14-SIGNAL GEO MONITOR */}
					{activeTab === 'geo' && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
							{geoSignals.map((sig) => (
								<div key={sig.key} className="p-3.5 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-1.5">
									<div className="flex items-center justify-between gap-2">
										<span className="text-xs font-extrabold text-(--text) inline-flex items-center gap-1.5">
											{sig.ok ? <CheckCircle2 size={14} className="text-(--accent-green)" /> : <AlertTriangle size={14} className="text-(--accent-orange)" />}
											<span>{sig.label}</span>
										</span>
										<span
											className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
												sig.ok
													? 'border-(--accent-green)/40 bg-(--accent-green)/10 text-(--accent-green)'
													: 'border-(--accent-orange)/40 bg-(--accent-orange)/10 text-(--accent-orange)'
											}`}
										>
											{sig.earnedPoints}/{sig.maxPoints} pt
										</span>
									</div>
									<p className="text-xs text-(--text-muted) leading-relaxed">{sig.detail}</p>
								</div>
							))}
						</div>
					)}

					{/* TAB 3: PER-PAGE CHECKS & SERP SNIPPETS */}
					{activeTab === 'pages' && (
						<div className="flex flex-col gap-2.5">
							{(pages.length > 0
								? pages
								: [
										{
											url: targetUrl,
											score: data.score,
											title: appName,
											description: '',
											firstParagraph: '',
											titleLen: data.titleLen,
											descriptionLen: data.descriptionLen,
											wordCount: data.wordCount,
											readabilityWps: 15,
											loadTimeMs: data.loadTimeMs,
											internalLinks: data.internalLinks,
											externalLinks: data.externalLinks,
											imagesTotal: 0,
											imagesMissingAlt: 0,
											canonical: targetUrl,
											hasNoindex: false,
											aeoReady: data.aeoReady,
											hasFaqSchema: data.aeoReady,
											hasFaqBlock: data.aeoReady,
											hasStructuredData: Boolean(data.scoreBreakdown?.structured_data),
											checksPassed: data.checksPassed,
											checksTotal: data.checksTotal,
											scoreBreakdown: data.scoreBreakdown,
											headings: [],
											recommendations: data.recommendations,
											issues: data.issues,
										},
									]
							).map((page) => {
								const isExpanded = expandedPageUrl === page.url || pages.length <= 1;
								return (
									<div key={page.url} className="rounded-2xl bg-(--background)/60 border border-(--border)/10 overflow-hidden">
										<button
											type="button"
											onClick={() => setExpandedPageUrl(isExpanded ? null : page.url)}
											className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-(--foreground)/30 transition-colors cursor-pointer"
										>
											<div className="flex items-center gap-2.5 min-w-0">
												<span className={`px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold shrink-0 ${getTenPointBadgeStyle(page.score)}`}>{page.score}/10</span>
												<div className="min-w-0">
													<div className="text-xs font-bold text-(--text) truncate">{page.title || page.url}</div>
													<div className="text-[11px] font-mono text-(--text-muted) truncate">{page.url}</div>
												</div>
											</div>
											<div className="flex items-center gap-2 shrink-0">
												<span className="text-[11px] font-mono text-(--text-muted)">
													{page.checksPassed}/{page.checksTotal} checks · {page.wordCount}w
												</span>
												{isExpanded ? <ChevronUp size={15} className="text-(--text-muted)" /> : <ChevronDown size={15} className="text-(--text-muted)" />}
											</div>
										</button>

										{isExpanded && (
											<div className="p-3.5 pt-0 border-t border-(--border)/10 flex flex-col gap-3">
												{page.description && (
													<div className="p-3 rounded-xl bg-(--foreground)/30 border border-(--border)/10 text-xs text-(--text-muted)">
														<div className="font-bold text-(--accent) mb-0.5">{page.title}</div>
														<p className="line-clamp-2">{page.description}</p>
													</div>
												)}

												<div className="flex flex-wrap gap-1.5">
													{CHECK_KEYS.map((key) => {
														const passed = Boolean(page.scoreBreakdown?.[key]);
														return (
															<span
																key={key}
																className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
																	passed
																		? 'border-(--accent-green)/35 bg-(--accent-green)/10 text-(--accent-green)'
																		: 'border-(--accent-red)/35 bg-(--accent-red)/10 text-(--accent-red)'
																}`}
															>
																{passed ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
																<span>{t(`admin.dashboard.overview.mcpCheckLabels.${key}`)}</span>
															</span>
														);
													})}
													<span
														className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
															page.aeoReady
																? 'border-(--accent-green)/35 bg-(--accent-green)/10 text-(--accent-green)'
																: 'border-(--accent-orange)/35 bg-(--accent-orange)/10 text-(--accent-orange)'
														}`}
													>
														<Sparkles size={10} />
														<span>{t('admin.dashboard.overview.mcpCheckLabels.aeo_ready')}</span>
													</span>
												</div>

												{page.issues.length > 0 && renderIssueList(page.issues)}
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}

					{/* TAB 4: ROADMAP & CONTENT AGENT */}
					{activeTab === 'roadmap' && (
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								{(
									[
										{ title: t('admin.dashboard.overview.mcpRoadmap.week1'), items: data.roadmap?.week1 || [] },
										{ title: t('admin.dashboard.overview.mcpRoadmap.week2_3'), items: data.roadmap?.week2_3 || [] },
										{ title: t('admin.dashboard.overview.mcpRoadmap.month2'), items: data.roadmap?.month2 || [] },
									] as const
								).map((col) => (
									<div key={col.title} className="p-3.5 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-2">
										<span className="text-xs font-extrabold uppercase tracking-wider text-(--accent)">{col.title}</span>
										{col.items.length === 0 ? (
											<span className="text-xs text-(--accent-green) font-semibold inline-flex items-center gap-1">
												<CheckCircle2 size={12} /> {t('admin.dashboard.overview.mcpAllPassed')}
											</span>
										) : (
											col.items.map((item, idx) => (
												<div key={idx} className="p-2.5 rounded-xl bg-(--foreground)/30 border border-(--border)/10 text-xs space-y-1">
													<div className="font-bold text-(--text)">{item.title}</div>
													<div className="text-[11px] text-(--text-muted)">{item.action}</div>
												</div>
											))
										)}
									</div>
								))}
							</div>

							{data.contentAgent && (
								<div className="p-4 rounded-2xl bg-(--background)/60 border border-(--border)/10 space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('admin.dashboard.overview.mcpContentAgent.title')}</span>
										<span className="text-[11px] text-(--accent) font-semibold">{data.contentAgent.detectedCategory}</span>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
										{(
											[
												{ label: 'SEO Title', val: data.contentAgent.seoTitle },
												{ label: 'Meta Description', val: data.contentAgent.metaDescription },
												{ label: 'H1 Suggestion', val: data.contentAgent.h1Suggestion },
												{ label: 'FAQ Topics', val: data.contentAgent.faqSuggestion },
											] as const
										).map((box) => (
											<div key={box.label} className="p-3 rounded-xl bg-(--foreground)/30 border border-(--border)/10 flex flex-col gap-1.5">
												<div className="flex items-center justify-between">
													<span className="text-[11px] font-bold uppercase text-(--text-muted)">{box.label}</span>
													<button
														type="button"
														onClick={() => handleCopyText(box.val)}
														className="text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
														title={t('common.actions.copy')}
													>
														<Copy size={12} />
													</button>
												</div>
												<p className="text-xs text-(--text) whitespace-pre-line">{box.val}</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}

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
							<Button variant="secondary" size="sm" onClick={handleExportJson} className="inline-flex items-center gap-1.5">
								<Download size={13} />
								<span>JSON</span>
							</Button>
							<Button variant="secondary" size="sm" onClick={handlePrintReport} className="inline-flex items-center gap-1.5">
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
