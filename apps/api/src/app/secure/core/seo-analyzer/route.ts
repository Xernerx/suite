/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';
import {
	buildContentAgent,
	buildRoadmap,
	computeGeoSignalsAndScore,
	type McpContentAgent,
	type McpGeoSignal,
	type McpSeoIssue,
	type McpSeoPageReport,
	type McpSeoScoreRecord,
} from '@/lib/seoAnalyzerChecks';
import { mapRawPageToReport, runFallbackDirectAudit } from '@/lib/seoAnalyzerAudit';

export type { McpSeoIssue, McpGeoSignal, McpSeoPageReport, McpContentAgent, McpSeoScoreRecord };

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'mcp_seo_scores';
const MCP_ANALYZE_ENDPOINT = 'https://mycreativeplan.com/wp-content/themes/mycreativeplan-temp-tool-theme-v27-compact/my-creative-tools-app/api/analyze.php';

async function readStoredScores(): Promise<Record<string, McpSeoScoreRecord>> {
	try {
		const { models } = await database('xernerx');
		const doc = await models.core.Setting.findOne({ id: SETTING_KEY }).lean();
		if (doc && typeof (doc as any).value === 'string') {
			const parsed = JSON.parse((doc as any).value);
			if (parsed && typeof parsed === 'object') return parsed;
		}
	} catch {}
	return {};
}

async function writeStoredScores(scores: Record<string, McpSeoScoreRecord>): Promise<void> {
	try {
		const { models } = await database('xernerx');
		await models.core.Setting.findOneAndUpdate(
			{ id: SETTING_KEY },
			{
				id: SETTING_KEY,
				value: JSON.stringify(scores),
				valueType: 'json',
				description: 'Cached My Creative Tools SEO / AEO / GEO multi-page visibility reports across Suite subdomains and environments.',
			},
			{ upsert: true, returnDocument: 'after' }
		);
	} catch {}
}

export async function GET(req: NextRequest) {
	try {
		const caller = await resolveCallerAuth(req, ['settings', 'overview']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: caller.authenticated ? 403 : 401 });
		}

		const targetUrl = req.nextUrl.searchParams.get('url');
		const envKey = req.nextUrl.searchParams.get('key');
		const maxPages = Math.max(1, Math.min(25, Number(req.nextUrl.searchParams.get('maxPages') || 8)));

		if (!targetUrl) {
			const map = await readStoredScores();
			return NextResponse.json({ data: map });
		}

		let rawData: any = null;
		const parsedTarget = new URL(targetUrl);
		const isLocalTarget =
			parsedTarget.hostname === 'localhost' || parsedTarget.hostname === '127.0.0.1' || parsedTarget.hostname.includes('.dev.') || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(parsedTarget.hostname);

		if (!isLocalTarget) {
			try {
				const mcpRes = await fetch(MCP_ANALYZE_ENDPOINT, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						url: targetUrl,
						max_pages: maxPages,
						brand_name: 'Xernerx Studios',
						region: '',
						competitors: '',
					}),
					cache: 'no-store',
					signal: AbortSignal.timeout(35000),
				});
				if (mcpRes.ok) {
					const json = await mcpRes.json().catch(() => null);
					if (json?.homepage) {
						rawData = json;
					}
				}
			} catch {}
		}

		if (!rawData) {
			rawData = await runFallbackDirectAudit(targetUrl, maxPages);
		}

		const rawHome = rawData?.homepage || {};
		const rawPages = [rawHome, ...(Array.isArray(rawData?.top_pages) ? rawData.top_pages : [])].filter(Boolean);
		const pageReports = rawPages.map((p) => mapRawPageToReport(p, rawHome));
		const homeReport = pageReports[0] || mapRawPageToReport(rawHome, rawHome);

		const enrichedRawPages = rawPages.map((p, idx) => ({
			...p,
			has_faq_schema: pageReports[idx]?.hasFaqSchema ?? Boolean(p?.has_faq_schema),
			has_faq_block: pageReports[idx]?.hasFaqBlock ?? Boolean(p?.has_faq_block),
			aeo_ready: pageReports[idx]?.aeoReady ?? Boolean(p?.aeo_ready),
		}));

		const avgScore = pageReports.length > 0 ? Math.max(0, Math.min(10, Number((pageReports.reduce((sum, p) => sum + p.score, 0) / pageReports.length).toFixed(1)))) : homeReport.score;
		const { geoScore, geoSignals } = computeGeoSignalsAndScore(enrichedRawPages);
		const allIssues = pageReports.flatMap((p) => p.issues);
		const rank = { high: 0, medium: 1, low: 2 };
		allIssues.sort((a, b) => rank[a.severity] - rank[b.severity]);

		const highPriorityCount = allIssues.filter((i) => i.severity === 'high').length;
		const candidatesFound = Number(rawData?.crawl_summary?.candidates_found || pageReports.length);
		const roadmap = buildRoadmap(allIssues);
		const contentAgent = buildContentAgent(rawHome, targetUrl);

		const executiveSummary =
			allIssues.length === 0
				? `All ${pageReports.length} analyzed pages on ${parsedTarget.hostname} passed every technical SEO, readability, and AEO/GEO readiness check (${avgScore}/10 SEO • ${geoScore}/10 GEO).`
				: `Analyzed ${pageReports.length} page(s) on ${parsedTarget.hostname} (${candidatesFound} internal URLs discovered): average SEO score ${avgScore}/10 and GEO readiness ${geoScore}/10 with ${allIssues.length} open optimization item(s) (${highPriorityCount} high priority).`;

		const currentMap = await readStoredScores();
		const storageKey = envKey || targetUrl;
		const previous = currentMap[storageKey];

		const entry: McpSeoScoreRecord = {
			score: avgScore,
			geoScore,
			checksPassed: homeReport.checksPassed,
			checksTotal: homeReport.checksTotal,
			aeoReady: pageReports.every((p) => p.aeoReady),
			wordCount: homeReport.wordCount,
			loadTimeMs: homeReport.loadTimeMs,
			titleLen: homeReport.titleLen,
			descriptionLen: homeReport.descriptionLen,
			internalLinks: homeReport.internalLinks,
			externalLinks: homeReport.externalLinks,
			pagesCount: pageReports.length,
			candidatesFound,
			highPriorityCount,
			executiveSummary,
			scoreBreakdown: homeReport.scoreBreakdown,
			recommendations: homeReport.recommendations,
			issues: allIssues.slice(0, 30),
			geoSignals,
			pages: pageReports,
			roadmap,
			contentAgent,
			...(previous
				? {
						prevScore: previous.score,
						prevGeoScore: previous.geoScore,
					}
				: {}),
			updatedAt: Date.now(),
		};

		currentMap[storageKey] = entry;
		await writeStoredScores(currentMap);

		return NextResponse.json({
			data: entry,
			map: currentMap,
		});
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
	}
}
