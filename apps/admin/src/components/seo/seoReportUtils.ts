/** @format */

import type { McpSeoScoreData } from '../OverviewSummaryCards';

export const CHECK_KEYS = [
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

export type ReportTab = 'overview' | 'geo' | 'pages' | 'roadmap';

export function getTenPointBadgeStyle(score: number) {
	if (score >= 8) return 'border-(--accent-green)/50 bg-(--accent-green)/10 text-(--accent-green)';
	if (score >= 5) return 'border-(--accent-orange)/50 bg-(--accent-orange)/10 text-(--accent-orange)';
	return 'border-(--accent-red)/50 bg-(--accent-red)/10 text-(--accent-red)';
}

export function getSeverityBadgeStyle(severity: 'high' | 'medium' | 'low') {
	if (severity === 'high') return 'border-(--accent-red)/40 bg-(--accent-red)/10 text-(--accent-red)';
	if (severity === 'medium') return 'border-(--accent-orange)/40 bg-(--accent-orange)/10 text-(--accent-orange)';
	return 'border-(--accent)/40 bg-(--accent)/10 text-(--accent)';
}

export function exportSeoReportJson(params: { targetUrl: string; appName: string; envLabel: string; data: McpSeoScoreData }) {
	const { targetUrl, appName, envLabel, data } = params;
	const blob = new Blob([JSON.stringify({ targetUrl, appName, envLabel, exportedAt: new Date().toISOString(), report: data }, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `xernerx-visibility-report-${appName.toLowerCase().replace(/\s+/g, '-')}-${envLabel.toLowerCase()}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export function printSeoReport(params: { targetUrl: string; appName: string; envLabel: string; data: McpSeoScoreData }) {
	const { targetUrl, appName, envLabel, data } = params;
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
}
