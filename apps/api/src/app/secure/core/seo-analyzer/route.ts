/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'mcp_seo_scores';
const MCP_ANALYZE_ENDPOINT = 'https://mycreativeplan.com/wp-content/themes/mycreativeplan-temp-tool-theme-v27-compact/my-creative-tools-app/api/analyze.php';

export interface McpSeoIssue {
	severity: 'high' | 'medium' | 'low';
	category: string;
	title: string;
	detail: string;
	action: string;
	url: string;
}

export interface McpSeoScoreRecord {
	score: number;
	geoScore: number;
	checksPassed: number;
	checksTotal: number;
	aeoReady: boolean;
	wordCount: number;
	loadTimeMs: number;
	titleLen: number;
	descriptionLen: number;
	internalLinks: number;
	externalLinks: number;
	scoreBreakdown: Record<string, boolean>;
	recommendations: string[];
	issues: McpSeoIssue[];
	prevScore?: number;
	prevGeoScore?: number;
	updatedAt: number;
}

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
				description: 'Cached My Creative Tools SEO / AEO / GEO analyzer scores across Suite subdomains and environments.',
			},
			{ upsert: true, new: true }
		);
	} catch {}
}

function normalizeHeadings(headings: any[]): { tag: string; text: string }[] {
	if (!Array.isArray(headings)) return [];
	return headings.map((h) => (typeof h === 'string' ? { tag: 'H', text: h } : { tag: String(h?.tag || 'H').toUpperCase(), text: String(h?.text || '') }));
}

function computeGeoReadiness(pages: any[]): number {
	if (!pages.length) return 0;
	const home = pages[0] || {};
	const headingsText = pages.flatMap((p) => normalizeHeadings(p.headings || []).map((h) => h.text.toLowerCase())).join(' ');
	const combined = pages
		.map(
			(p) =>
				`${p.title || ''} ${p.description || ''} ${p.first_paragraph || ''} ${normalizeHeadings(p.headings || [])
					.map((h) => h.text)
					.join(' ')}`
		)
		.join(' ')
		.toLowerCase();

	const hasFaqSchema = pages.some((p) => Boolean(p.has_faq_schema));
	const hasStructuredData = pages.some((p) => Boolean(p.has_structured_data));
	const hasQuestionHeadings =
		pages.some((p) => Boolean(p.has_question_heading)) || /\b(what|how|why|when|who|faq|frequently asked|wat|hoe|waarom|voor wie|wanneer|veelgestelde)\b/i.test(headingsText);
	const enoughContent = pages.some((p) => Number(p.word_count || 0) >= 800) || pages.filter((p) => Number(p.word_count || 0) >= 500).length >= 2;
	const hasServices = /discord|bot|suite|sdk|framework|dashboard|api|cdn|store|hosting|account|virtue|zodiac|metamorphosis|seo|software|platform|service/i.test(combined);
	const hasProof = /verified|community|communities|users|servers|stats|reviews|supporters|open-source|trusted|case|review|testimonial/i.test(combined);
	const hasEntity = Boolean(home.title && home.description) && /xernerx|studio|studios|suite|platform|company|organization/i.test(combined);
	const hasContactTrust = /contact|about|terms|privacy|cookies|support|legal|discord|email/i.test(combined);
	const hasComparisonIntent = /free|tier|pro|ultra|pass|subscription|perks|features|why|benefits|compare|pricing/i.test(combined);
	const hasFaqSignal = hasFaqSchema || /faq|frequently asked|questions|support|help/i.test(combined);

	const signals = [
		{ ok: hasEntity, weight: 2 },
		{ ok: hasServices, weight: 2 },
		{ ok: enoughContent, weight: 2 },
		{ ok: hasQuestionHeadings, weight: 1.5 },
		{ ok: hasFaqSignal, weight: 2 },
		{ ok: hasStructuredData, weight: 1.5 },
		{ ok: hasProof, weight: 1.5 },
		{ ok: hasContactTrust, weight: 1.5 },
		{ ok: hasComparisonIntent, weight: 1 },
	];

	const total = signals.reduce((sum, s) => sum + s.weight, 0);
	const earned = signals.reduce((sum, s) => sum + (s.ok ? s.weight : 0), 0);
	return Math.max(0, Math.min(10, Math.round((earned / total) * 10)));
}

function buildIssuesFromPages(pages: any[]): McpSeoIssue[] {
	const list: McpSeoIssue[] = [];
	for (const page of pages) {
		const url = String(page?.url || '');
		const push = (severity: 'high' | 'medium' | 'low', category: string, title: string, detail: string, action: string) => {
			list.push({ severity, category, title, detail, action, url });
		};

		const titleLen = Number(page?.title_len ?? (page?.title ? String(page.title).length : 0));
		const descLen = Number(page?.description_len ?? (page?.description ? String(page.description).length : 0));

		if (!page?.title) {
			push('high', 'metadata', 'Missing page title', 'Search engines and AI crawlers lack primary page context.', 'Add a unique <title> between 30 and 60 characters.');
		} else if (titleLen < 30 || titleLen > 60) {
			push('medium', 'metadata', 'Optimize title length', `Current length: ${titleLen} characters.`, 'Aim for 30–60 characters with primary keywords upfront.');
		}

		if (!page?.description) {
			push('high', 'metadata', 'Missing meta description', 'SERP snippet preview is missing explicit summary context.', 'Add a meta description between 90 and 160 characters.');
		} else if (descLen < 90 || descLen > 160) {
			push('medium', 'metadata', 'Optimize meta description length', `Current length: ${descLen} characters.`, 'Keep the meta description concise between 90 and 160 characters.');
		}

		const headings = normalizeHeadings(page?.headings || []);
		const h1Count = headings.filter((h) => h.tag === 'H1').length;
		if (h1Count === 0) {
			push('high', 'structure', 'Missing H1 heading', 'The page has no primary H1 heading.', 'Include exactly one H1 heading summarizing the page topic.');
		} else if (h1Count > 1) {
			push('medium', 'structure', 'Multiple H1 headings', `Found ${h1Count} H1 tags on the page.`, 'Keep a single H1 and use H2/H3 for subsections.');
		}

		if (headings.filter((h) => h.tag === 'H2' || h.tag === 'H3').length < 2) {
			push('medium', 'structure', 'Few subheadings (H2/H3)', 'The page has fewer than 2 H2/H3 subheadings.', 'Add descriptive H2 and H3 headings to structure sections.');
		}

		const wordCount = Number(page?.word_count || 0);
		if (wordCount < 450) {
			push('medium', 'content', 'Thin page content', `Measured ${wordCount} words on this page.`, 'Expand indexable text content to at least 450+ words.');
		}

		if (!page?.canonical) {
			push('medium', 'technical', 'Missing canonical URL', 'Duplicate URL variants could split ranking signals.', 'Add a self-referencing <link rel="canonical"> tag.');
		}

		if (page?.has_noindex) {
			push('high', 'technical', 'Page is marked noindex', 'Crawlers are instructed not to index this URL.', 'Remove noindex if this page should appear in search results.');
		}

		if (!page?.has_structured_data) {
			push(
				'medium',
				'geo',
				'Missing JSON-LD structured data',
				'Search and AI engines receive less machine-readable schema context.',
				'Add Organization, WebSite, SoftwareApplication, or FAQPage JSON-LD.'
			);
		}

		if (!page?.has_viewport) {
			push('high', 'technical', 'Missing viewport meta tag', 'Mobile rendering may not scale properly.', 'Add a responsive viewport meta tag.');
		}

		if (!page?.has_favicon) {
			push('low', 'brand', 'Missing favicon', 'Reduces brand recognition in browser tabs and SERPs.', 'Specify a valid icon/favicon link.');
		}

		const missingAlt = Number(page?.images_missing_alt_count || 0);
		if (missingAlt > 0) {
			push(
				'medium',
				'accessibility',
				'Images missing alt text',
				`${missingAlt} of ${page?.images_total ?? page?.img_total ?? 0} images lack alt attributes.`,
				'Add descriptive alt attributes to all content images.'
			);
		}

		if (Number(page?.internal_links || 0) < 5) {
			push('medium', 'content', 'Low internal link count', `Found ${Number(page?.internal_links || 0)} internal links.`, 'Add contextual internal links to key routes and resources.');
		}

		if (Number(page?.load_time_ms || 0) >= 2000) {
			push('medium', 'performance', 'High HTML response time', `Measured response time: ${page.load_time_ms} ms.`, 'Optimize SSR payload, caching headers, and asset delivery.');
		}

		if (!page?.aeo_ready) {
			push(
				'low',
				'geo',
				'Strengthen AEO / GEO FAQ signals',
				'Page lacks question-oriented headings or FAQ schema.',
				'Add question-style H2/H3 headings or FAQPage structured data where appropriate.'
			);
		}
	}

	const rank = { high: 0, medium: 1, low: 2 };
	return list.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

async function runFallbackDirectAudit(targetUrl: string): Promise<any> {
	const start = Date.now();
	const res = await fetch(targetUrl, {
		headers: { 'User-Agent': 'Xernerx-MCP-SEO-Analyzer/1.0' },
		cache: 'no-store',
	});
	const loadTimeMs = Date.now() - start;
	const html = await res.text();

	const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
	const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
	const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
	const description = descMatch ? descMatch[1].trim() : '';
	const kwMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']*)["']/i) || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']keywords["']/i);
	const keywordsMeta = kwMatch ? kwMatch[1].trim() : '';

	const headings: { tag: string; text: string }[] = [];
	const headingRegex = /<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi;
	let hMatch: RegExpExecArray | null;
	while ((hMatch = headingRegex.exec(html)) !== null) {
		const text = hMatch[2]
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
		if (text) headings.push({ tag: hMatch[1].toUpperCase(), text });
	}

	const textContent = html
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	const words = textContent ? textContent.split(/\s+/).filter(Boolean) : [];
	const wordCount = words.length;

	const imgTags = html.match(/<img\b[^>]*>/gi) || [];
	const imagesMissingAltCount = imgTags.filter((tag) => !/\balt\s*=\s*["'][^"']+["']/i.test(tag)).length;

	const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
	const hasFavicon = /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(html);
	const hasStructuredData = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
	const hasFaqSchema = /FAQPage/i.test(html);
	const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
	const hasNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);

	const origin = new URL(targetUrl).origin;
	const hrefMatches = [...html.matchAll(/<a\b[^>]+href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
	let internalLinks = 0;
	let externalLinks = 0;
	for (const href of hrefMatches) {
		if (href.startsWith('/') || href.startsWith(origin)) internalLinks++;
		else if (/^https?:\/\//i.test(href)) externalLinks++;
	}

	const hasQuestionHeading = headings.some((h) => /\?$/.test(h.text) || /\b(what|how|why|when|who|faq)\b/i.test(h.text));
	const aeoReady = Boolean(hasQuestionHeading || hasFaqSchema);

	const breakdown: Record<string, boolean> = {
		title: Boolean(title),
		title_len: title.length >= 30 && title.length <= 60,
		description: Boolean(description),
		description_len: description.length >= 90 && description.length <= 160,
		headings: headings.length > 0,
		h1: headings.filter((h) => h.tag === 'H1').length === 1,
		h2h3: headings.filter((h) => h.tag === 'H2' || h.tag === 'H3').length >= 2,
		word_count: wordCount >= 450,
		readability: true,
		keywords_meta: Boolean(keywordsMeta),
		keywords_usage: Boolean(title && description),
		viewport: hasViewport,
		favicon: hasFavicon,
		structured_data: hasStructuredData,
		canonical: Boolean(canonicalMatch?.[1]),
		noindex: !hasNoindex,
		load_time: loadTimeMs < 2000,
		alt_text: imagesMissingAltCount === 0,
		links: internalLinks >= 5,
		robots: true,
		sitemap: true,
	};

	const passed = Object.values(breakdown).filter(Boolean).length;
	const total = Object.keys(breakdown).length;
	const score = Math.max(1, Math.min(10, Math.round((passed / total) * 10)));

	return {
		homepage: {
			url: targetUrl,
			title,
			description,
			headings,
			word_count: wordCount,
			images_total: imgTags.length,
			images_missing_alt_count: imagesMissingAltCount,
			has_viewport: hasViewport,
			has_favicon: hasFavicon,
			has_structured_data: hasStructuredData,
			has_faq_schema: hasFaqSchema,
			has_question_heading: hasQuestionHeading,
			canonical: canonicalMatch?.[1] || '',
			has_noindex: hasNoindex,
			internal_links: internalLinks,
			external_links: externalLinks,
			load_time_ms: loadTimeMs,
			title_len: title.length,
			description_len: description.length,
			aeo_ready: aeoReady,
			score,
			score_breakdown: breakdown,
			recommendations: aeoReady ? [] : ['Add question-oriented H2/H3 subheadings and FAQ structured data to strengthen AEO/GEO readiness.'],
		},
		top_pages: [],
	};
}

export async function GET(req: NextRequest) {
	try {
		const targetUrl = req.nextUrl.searchParams.get('url');
		const envKey = req.nextUrl.searchParams.get('key');
		const maxPages = Math.max(1, Math.min(25, Number(req.nextUrl.searchParams.get('maxPages') || 1)));

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
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 20000);
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
					signal: controller.signal,
				});
				clearTimeout(timeout);
				if (mcpRes.ok) {
					const json = await mcpRes.json().catch(() => null);
					if (json?.homepage) {
						rawData = json;
					}
				}
			} catch {}
		}

		if (!rawData) {
			rawData = await runFallbackDirectAudit(targetUrl);
		}

		const home = rawData?.homepage || {};
		const pages = [home, ...(Array.isArray(rawData?.top_pages) ? rawData.top_pages : [])].filter(Boolean);
		const breakdown: Record<string, boolean> = {};
		if (home.score_breakdown && typeof home.score_breakdown === 'object') {
			for (const [k, v] of Object.entries(home.score_breakdown)) {
				breakdown[k] = Boolean(v);
			}
		}

		const checksTotal = Object.keys(breakdown).length || 21;
		const checksPassed = Object.values(breakdown).filter(Boolean).length;
		const score = Math.max(0, Math.min(10, Number(home.score ?? Math.round((checksPassed / checksTotal) * 10))));
		const geoScore = computeGeoReadiness(pages);
		const issues = buildIssuesFromPages(pages);

		const currentMap = await readStoredScores();
		const storageKey = envKey || targetUrl;
		const previous = currentMap[storageKey];

		const entry: McpSeoScoreRecord = {
			score,
			geoScore,
			checksPassed,
			checksTotal,
			aeoReady: Boolean(home.aeo_ready),
			wordCount: Number(home.word_count || 0),
			loadTimeMs: Number(home.load_time_ms || 0),
			titleLen: Number(home.title_len || 0),
			descriptionLen: Number(home.description_len || 0),
			internalLinks: Number(home.internal_links || 0),
			externalLinks: Number(home.external_links || 0),
			scoreBreakdown: breakdown,
			recommendations: Array.isArray(home.recommendations) ? home.recommendations.map(String) : [],
			issues: issues.slice(0, 12),
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
