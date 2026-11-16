/** @format */
'use client';

import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Copy, Sparkles, XCircle } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import type { McpGeoSignal, McpSeoIssue, McpSeoPageReport, McpSeoScoreData } from '../OverviewSummaryCards';
import { CHECK_KEYS, getSeverityBadgeStyle, getTenPointBadgeStyle } from './seoReportUtils';

export function SeoIssueList({ issues }: { issues: McpSeoIssue[] }) {
	const { t } = useDictionary();

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
}

export function SeoOverviewTab({ data, pages }: { data: McpSeoScoreData; pages: McpSeoPageReport[] }) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col gap-4">
			{data.executiveSummary && <div className="p-3.5 rounded-2xl bg-(--accent)/10 border border-(--accent)/30 text-xs text-(--text) leading-relaxed font-medium">{data.executiveSummary}</div>}

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
				<SeoIssueList issues={data.issues} />
			</div>
		</div>
	);
}

export function SeoGeoTab({ geoSignals }: { geoSignals: McpGeoSignal[] }) {
	return (
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
								sig.ok ? 'border-(--accent-green)/40 bg-(--accent-green)/10 text-(--accent-green)' : 'border-(--accent-orange)/40 bg-(--accent-orange)/10 text-(--accent-orange)'
							}`}
						>
							{sig.earnedPoints}/{sig.maxPoints} pt
						</span>
					</div>
					<p className="text-xs text-(--text-muted) leading-relaxed">{sig.detail}</p>
				</div>
			))}
		</div>
	);
}

interface SeoPagesTabProps {
	data: McpSeoScoreData;
	pages: McpSeoPageReport[];
	targetUrl: string;
	appName: string;
	expandedPageUrl: string | null;
	setExpandedPageUrl: (url: string | null) => void;
}

export function SeoPagesTab({ data, pages, targetUrl, appName, expandedPageUrl, setExpandedPageUrl }: SeoPagesTabProps) {
	const { t } = useDictionary();

	const pageItems: McpSeoPageReport[] =
		pages.length > 0
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
				];

	return (
		<div className="flex flex-col gap-2.5">
			{pageItems.map((page) => {
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

								{page.issues.length > 0 && <SeoIssueList issues={page.issues} />}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

export function SeoRoadmapTab({ data, onCopyText }: { data: McpSeoScoreData; onCopyText: (text: string) => void }) {
	const { t } = useDictionary();

	return (
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
										onClick={() => onCopyText(box.val)}
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
	);
}
