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

export interface McpGeoSignal {
	key: string;
	label: string;
	detail: string;
	ok: boolean;
	weight: number;
	earnedPoints: number;
	maxPoints: number;
}

export interface McpSeoPageReport {
	url: string;
	score: number;
	title: string;
	description: string;
	firstParagraph: string;
	titleLen: number;
	descriptionLen: number;
	wordCount: number;
	readabilityWps: number;
	loadTimeMs: number;
	internalLinks: number;
	externalLinks: number;
	imagesTotal: number;
	imagesMissingAlt: number;
	canonical: string;
	hasNoindex: boolean;
	aeoReady: boolean;
	hasFaqSchema: boolean;
	hasFaqBlock: boolean;
	hasStructuredData: boolean;
	checksPassed: number;
	checksTotal: number;
	scoreBreakdown: Record<string, boolean>;
	headings: { tag: string; text: string }[];
	recommendations: string[];
	issues: McpSeoIssue[];
}

export interface McpContentAgent {
	detectedCategory: string;
	seoTitle: string;
	metaDescription: string;
	h1Suggestion: string;
	faqSuggestion: string;
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
	pagesCount: number;
	candidatesFound: number;
	highPriorityCount: number;
	executiveSummary: string;
	scoreBreakdown: Record<string, boolean>;
	recommendations: string[];
	issues: McpSeoIssue[];
	geoSignals: McpGeoSignal[];
	pages: McpSeoPageReport[];
	roadmap: {
		week1: McpSeoIssue[];
		week2_3: McpSeoIssue[];
		month2: McpSeoIssue[];
	};
	contentAgent: McpContentAgent;
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
				description: 'Cached My Creative Tools SEO / AEO / GEO multi-page visibility reports across Suite subdomains and environments.',
			},
			{ upsert: true, returnDocument: 'after' }
		);
	} catch {}
}

function normalizeHeadings(headings: any[]): { tag: string; text: string }[] {
	if (!Array.isArray(headings)) return [];
	return headings.map((h) => (typeof h === 'string' ? { tag: 'H2', text: h } : { tag: String(h?.tag || 'H2').toUpperCase(), text: String(h?.text || '') }));
}

function countKeywordHits(text: string, terms: string[]): number {
	const haystack = String(text || '').toLowerCase();
	return terms.filter((term) => haystack.includes(String(term).toLowerCase())).length;
}

function computeGeoSignalsAndScore(pages: any[]): { geoScore: number; geoSignals: McpGeoSignal[] } {
	if (!pages.length) return { geoScore: 0, geoSignals: [] };
	const home = pages[0] || {};
	const allHeadings = pages.flatMap((p) => normalizeHeadings(p.headings || []));
	const combined = pages
		.map(
			(p) =>
				`${p.title || ''} ${p.description || ''} ${p.first_paragraph || ''} ${normalizeHeadings(p.headings || [])
					.map((h) => h.text)
					.join(' ')}`
		)
		.join(' ')
		.toLowerCase();

	const homeHeadings = normalizeHeadings(home.headings || []);
	const h1CountHome = homeHeadings.filter((h) => h.tag === 'H1').length;
	const h2CountHome = homeHeadings.filter((h) => h.tag === 'H2').length;

	const pagesWithH1 = pages.filter((p) => normalizeHeadings(p.headings || []).some((h) => h.tag === 'H1')).length;
	const pagesWithH2 = pages.filter((p) => normalizeHeadings(p.headings || []).some((h) => h.tag === 'H2')).length;
	const pagesWithMeta = pages.filter((p) => Number(p.description_len || String(p.description || '').length) >= 110).length;
	const pagesWithStructuredData = pages.filter((p) => Boolean(p.has_structured_data)).length;
	const faqSchemaPages = pages.filter((p) => Boolean(p.has_faq_schema)).length;
	const faqBlockPages = pages.filter((p) => Boolean(p.has_faq_block)).length;

	const questionHeadings = allHeadings.filter(
		(h) => /\?$/.test(String(h.text || '').trim()) || /^(what|how|why|when|who|which|can|is|do|does|wat|hoe|waarom|wanneer|welke|wie|kan|is|zijn|moet|mag)\b/i.test(String(h.text || '').trim())
	);
	const pagesWithQuestions = pages.filter((p) =>
		normalizeHeadings(p.headings || []).some(
			(h) => /\?$/.test(String(h.text || '').trim()) || /^(what|how|why|when|who|which|can|is|do|does|wat|hoe|waarom|wanneer|welke|wie|kan|is|zijn|moet|mag)\b/i.test(String(h.text || '').trim())
		)
	).length;
	const deepContentPages = pages.filter((p) => Number(p.word_count || 0) >= 650).length;

	const concreteServiceTerms = [
		'opstartbegeleiding',
		'fiscaliteit',
		'boekhouding',
		'loonadministratie',
		'accountancy',
		'btw',
		'jaarrekening',
		'webdesign',
		'seo',
		'marketingstrategie',
		'branding',
		'contentstrategie',
		'website onderhoud',
		'audit',
		'digitalisatie',
		'discord',
		'bot',
		'sdk',
		'framework',
		'dashboard',
		'api',
		'cdn',
		'websocket',
	];
	const proofTerms = [
		'case',
		'cases',
		'klant aan het woord',
		'testimonial',
		'review',
		'reviews',
		'referentie',
		'portfolio',
		'resultaat',
		'resultaten',
		'project',
		'projecten',
		'voorbeeld',
		'voorbeelden',
		'verified',
		'changelog',
		'stats',
	];
	const localTerms = ['antwerpen', 'schoten', 'brasschaat', 'belgië', 'belgie', 'vlaanderen', 'kempen', 'mechelen', 'lokaal', 'regio', 'omgeving', 'region', 'global', 'eu', 'gdpr'];
	const trustTerms = [
		'contact',
		'e-mail',
		'email',
		'mailto',
		'tel',
		'telefoon',
		'linkedin',
		'btw',
		'ondernemingsnummer',
		'adres',
		'privacy',
		'cookiebeleid',
		'afspraak',
		'team',
		'over ons',
		'security',
		'legal',
		'support',
		'cookies',
		'terms',
	];
	const comparisonTerms = [
		'waarom kiezen',
		'voordelen',
		'prijs',
		'prijzen',
		'tarief',
		'pakket',
		'vaste prijs',
		'aanpak',
		'werkwijze',
		'voor wie',
		'verschil',
		'vergelijk',
		'alternatief',
		'specialisatie',
		'transparant',
		'why',
		'benefits',
		'pricing',
		'free',
		'pro',
		'ultra',
		'perks',
		'highlights',
	];

	const concreteServiceHits = countKeywordHits(combined, concreteServiceTerms);
	const proofHits = countKeywordHits(combined, proofTerms);
	const localHits = countKeywordHits(combined, localTerms);
	const trustHits = countKeywordHits(combined, trustTerms);
	const comparisonHits = countKeywordHits(combined, comparisonTerms);

	const hasServices = concreteServiceHits >= 2;
	const entityHints = [home.title || '', home.description || '', home.first_paragraph || ''].join(' ');
	const homeTitleLen = Number(home.title_len || String(home.title || '').length);
	const homeDescLen = Number(home.description_len || String(home.description || '').length);
	const hasEntity = Boolean(homeTitleLen >= 18 && homeDescLen >= 110 && entityHints.length > 70 && hasServices);

	const rawSignals = [
		{
			key: 'headings',
			label: 'H1 / H2 Heading Hierarchy',
			ok: h1CountHome === 1 && h2CountHome >= 1,
			weight: 2.0,
			detail:
				h1CountHome === 1 && h2CountHome >= 1
					? `Homepage has 1 H1 and ${h2CountHome} H2 subheadings.`
					: `Homepage currently has ${h1CountHome} H1 and ${h2CountHome} H2 tags. Aim for 1 H1 and multiple H2s.`,
		},
		{
			key: 'headingCoverage',
			label: 'Subpage Heading Coverage',
			ok: pagesWithH1 / pages.length >= 0.8 && pagesWithH2 / pages.length >= 0.8,
			weight: 1.8,
			detail: `${pagesWithH1}/${pages.length} pages have an H1 and ${pagesWithH2}/${pages.length} have H2 subheadings.`,
		},
		{
			key: 'metaCoverage',
			label: 'Meta Description Coverage',
			ok: pagesWithMeta / pages.length >= 0.8,
			weight: 1.7,
			detail: `${pagesWithMeta}/${pages.length} pages have a detailed meta description (110+ chars) for AI & search snippets.`,
		},
		{
			key: 'entity',
			label: 'Clear Brand & Entity Positioning',
			ok: hasEntity,
			weight: 2.2,
			detail: hasEntity
				? 'Homepage clearly defines who you are, what you build, and who you serve.'
				: 'Make your entity, core product offering, and target audience more explicit in the homepage title, meta description, and opening paragraph.',
		},
		{
			key: 'services',
			label: 'Concrete Service & Product Signals',
			ok: hasServices,
			weight: 2.2,
			detail: hasServices ? `Detected ${concreteServiceHits} concrete product/service signals across pages.` : 'Name specific products, services, and technical capabilities explicitly.',
		},
		{
			key: 'depth',
			label: 'Substantive Content Depth',
			ok: deepContentPages >= Math.min(3, Math.max(1, Math.ceil(pages.length * 0.4))),
			weight: 1.6,
			detail: `${deepContentPages}/${pages.length} pages contain 650+ words of indexable content.`,
		},
		{
			key: 'questions',
			label: 'Question-Oriented Headings',
			ok: questionHeadings.length >= 8 && pagesWithQuestions >= Math.min(3, pages.length),
			weight: 1.8,
			detail: `${questionHeadings.length} question headings detected across ${pagesWithQuestions}/${pages.length} pages (target: 8+ across 3+ pages).`,
		},
		{
			key: 'faqSchema',
			label: 'FAQPage JSON-LD Schema',
			ok: faqSchemaPages >= 1,
			weight: 2.2,
			detail: faqSchemaPages >= 1 ? `FAQPage schema detected on ${faqSchemaPages}/${pages.length} pages.` : 'No FAQPage JSON-LD schema found yet. Add FAQPage schema to key landing pages.',
		},
		{
			key: 'faqBlock',
			label: 'Visible FAQ Answer Blocks',
			ok: faqBlockPages >= 1,
			weight: 2.6,
			detail:
				faqBlockPages >= 1
					? `Visible FAQ section with question subheadings detected on ${faqBlockPages}/${pages.length} pages.`
					: 'Add a visible "Frequently Asked Questions" H2 section with 3+ question H3 subheadings and concise answers.',
		},
		{
			key: 'structured',
			label: 'Structured Data (JSON-LD) Coverage',
			ok: pagesWithStructuredData >= Math.min(3, Math.max(1, Math.ceil(pages.length * 0.4))),
			weight: 2.1,
			detail: `${pagesWithStructuredData}/${pages.length} pages include machine-readable JSON-LD structured data.`,
		},
		{
			key: 'proof',
			label: 'Social Proof, Cases & Telemetry',
			ok: proofHits >= 3,
			weight: 1.8,
			detail: proofHits >= 3 ? `Detected ${proofHits} proof/case/telemetry signals across pages.` : 'Add concrete proof points, community metrics, reviews, or project cases.',
		},
		{
			key: 'local',
			label: 'Regional & Jurisdiction Context',
			ok: localHits >= 2,
			weight: 1.2,
			detail: localHits >= 2 ? 'Regional and jurisdiction context is clearly stated.' : 'Specify your regional coverage or jurisdiction context more explicitly.',
		},
		{
			key: 'trust',
			label: 'Trust, Contact & Legal Transparency',
			ok: trustHits >= 6,
			weight: 2.2,
			detail:
				trustHits >= 6 ? `Strong trust & contact transparency (${trustHits} signals found).` : `Only ${trustHits} trust/contact signals found; make contact, team, and legal links clearer.`,
		},
		{
			key: 'choice',
			label: 'Decision & Comparison Context',
			ok: comparisonHits >= 3,
			weight: 1.5,
			detail:
				comparisonHits >= 3
					? 'Clear value proposition, perks, and tier comparison signals found.'
					: 'Explain more explicitly why users and developers should choose your platform, tiers, and approach.',
		},
	];

	const totalWeight = rawSignals.reduce((sum, s) => sum + s.weight, 0) || 1;
	const geoSignals: McpGeoSignal[] = rawSignals.map((s) => {
		const maxPoints = Number(((s.weight / totalWeight) * 10).toFixed(1));
		const earnedPoints = s.ok ? maxPoints : 0;
		return {
			...s,
			earnedPoints,
			maxPoints,
		};
	});

	const earnedWeight = rawSignals.reduce((sum, s) => sum + (s.ok ? s.weight : 0), 0);
	const geoScore = Math.max(0, Math.min(10, Number(((earnedWeight / totalWeight) * 10).toFixed(1))));

	return { geoScore, geoSignals };
}

function buildPageIssues(page: any): McpSeoIssue[] {
	const list: McpSeoIssue[] = [];
	const url = String(page?.url || '');
	const push = (severity: 'high' | 'medium' | 'low', category: string, title: string, detail: string, action: string) => {
		list.push({ severity, category, title, detail, action, url });
	};

	const titleLen = Number(page?.title_len ?? (page?.title ? String(page.title).length : 0));
	const descLen = Number(page?.description_len ?? (page?.description ? String(page.description).length : 0));
	const wps = Number(page?.readability_avg_wps || 0);

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

	if (wps > 20 || page?.score_breakdown?.readability === false) {
		push(
			'low',
			'readability',
			'Long average sentence length',
			`Measured ${wps || '>20'} words per sentence on average.`,
			'Shorten long compound sentences to keep average sentence length below 20 words.'
		);
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
			'Page lacks a visible FAQ section with question subheadings and FAQPage schema.',
			'Add an H2 "Frequently Asked Questions" block with 3+ question H3 subheadings and FAQPage JSON-LD.'
		);
	}

	const rank = { high: 0, medium: 1, low: 2 };
	return list.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

function buildRoadmap(issues: McpSeoIssue[]) {
	const week1 = issues.filter((i) => i.severity === 'high' || ['metadata', 'structure'].includes(i.category)).slice(0, 6);
	const week2_3 = issues.filter((i) => !week1.includes(i) && ['content', 'technical', 'accessibility', 'readability'].includes(i.category)).slice(0, 6);
	const month2 = issues.filter((i) => !week1.includes(i) && !week2_3.includes(i)).slice(0, 6);
	return { week1, week2_3, month2 };
}

function buildContentAgent(home: any, targetUrl: string): McpContentAgent {
	const host = (() => {
		try {
			return new URL(targetUrl).hostname;
		} catch {
			return targetUrl;
		}
	})();
	const currentTitle = String(home?.title || '').trim();
	const currentDesc = String(home?.description || '').trim();
	const h1 = normalizeHeadings(home?.headings || []).find((h) => h.tag === 'H1')?.text || '';

	return {
		detectedCategory: 'Software Studio, Discord Bots & Developer Platform',
		seoTitle: currentTitle.length >= 30 && currentTitle.length <= 60 ? currentTitle : `Xernerx Studios — Discord Bots, SDKs & Suite (${host})`,
		metaDescription:
			currentDesc.length >= 110 && currentDesc.length <= 160
				? currentDesc
				: 'Configure Discord bots (Virtue, Metamorphosis, Zodiac), open-source TypeScript SDKs, and developer telemetry from 1 unified Xernerx Suite account.',
		h1Suggestion: h1 || 'Empowering Developers. Connecting Communities.',
		faqSuggestion:
			'1. What is Xernerx Studios and how does 1 Account, 1 Place, 1 Setup work?\n2. Which Discord bots and open-source SDKs are included in the Xernerx Suite?\n3. How can developers publish bots and track live telemetry via the v1 API?',
	};
}

async function analyzeSingleHtmlPage(pageUrl: string, robotsOk: boolean, sitemapOk: boolean): Promise<any> {
	const start = Date.now();
	const res = await fetch(pageUrl, {
		headers: { 'User-Agent': 'Xernerx-MCP-SEO-Analyzer/2.0', Accept: 'text/html,application/xhtml+xml' },
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

	const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
	const firstParagraph = pMatch
		? pMatch[1]
				.replace(/<[^>]+>/g, ' ')
				.replace(/\s+/g, ' ')
				.trim()
		: '';

	const cleanHtml = html
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	const words = cleanHtml ? cleanHtml.split(/\s+/).filter(Boolean) : [];
	const wordCount = words.length;

	const sentences = cleanHtml
		.split(/[.!?]+/)
		.map((s) => s.trim())
		.filter((s) => s.split(/\s+/).length >= 3);
	const readabilityAvgWps = sentences.length > 0 ? Number((wordCount / sentences.length).toFixed(1)) : 14;

	const imgTags = html.match(/<img\b[^>]*>/gi) || [];
	const imagesMissingAltCount = imgTags.filter((tag) => !/\balt\s*=\s*["'][^"']+["']/i.test(tag)).length;

	const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
	const hasFavicon = /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(html);
	const hasStructuredData = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
	const hasFaqSchema = /FAQPage/i.test(html);
	const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
	const hasNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);

	const origin = new URL(pageUrl).origin;
	const hrefMatches = [...html.matchAll(/<a\b[^>]+href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
	let internalLinks = 0;
	let externalLinks = 0;
	const discoveredInternalUrls: string[] = [];
	for (const href of hrefMatches) {
		try {
			const resolved = new URL(href, origin);
			if (resolved.origin === origin) {
				internalLinks++;
				const cleanUrl = `${resolved.origin}${resolved.pathname.replace(/\/$/, '') || '/'}`;
				if (!discoveredInternalUrls.includes(cleanUrl) && !/\.(xml|txt|ico|png|jpg|svg|webmanifest|json)$/i.test(cleanUrl)) {
					discoveredInternalUrls.push(cleanUrl);
				}
			} else if (/^https?:$/i.test(resolved.protocol)) {
				externalLinks++;
			}
		} catch {}
	}

	const questionHeadingCount = headings.filter(
		(h) => /\?$/.test(h.text.trim()) || /^(what|how|why|when|who|which|can|is|do|does|wat|hoe|waarom|wanneer|welke|wie|kan|is|zijn)\b/i.test(h.text.trim())
	).length;
	const hasFaqHeading = headings.some((h) => /^(faq|veelgestelde vragen|vragen en antwoorden|frequently asked questions)$/i.test(h.text.trim()));
	const hasFaqBlock = hasFaqHeading && questionHeadingCount >= 3;
	const hasQuestionHeading = questionHeadingCount > 0;
	const aeoReady = Boolean(hasFaqSchema && hasFaqBlock);

	const breakdown: Record<string, boolean> = {
		title: Boolean(title),
		title_len: title.length >= 30 && title.length <= 60,
		description: Boolean(description),
		description_len: description.length >= 90 && description.length <= 160,
		headings: headings.length > 0,
		h1: headings.filter((h) => h.tag === 'H1').length === 1,
		h2h3: headings.filter((h) => h.tag === 'H2' || h.tag === 'H3').length >= 2,
		word_count: wordCount >= 450,
		readability: readabilityAvgWps <= 20,
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
		robots: robotsOk,
		sitemap: sitemapOk,
	};

	const passed = Object.values(breakdown).filter(Boolean).length;
	const total = Object.keys(breakdown).length;
	const score = Math.max(1, Math.min(10, Math.round((passed / total) * 10)));

	return {
		page: {
			url: pageUrl,
			title,
			description,
			first_paragraph: firstParagraph,
			headings,
			word_count: wordCount,
			readability_avg_wps: readabilityAvgWps,
			images_total: imgTags.length,
			images_missing_alt_count: imagesMissingAltCount,
			has_viewport: hasViewport,
			has_favicon: hasFavicon,
			has_structured_data: hasStructuredData,
			has_faq_schema: hasFaqSchema,
			has_faq_block: hasFaqBlock,
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
			recommendations: aeoReady ? [] : ['Add a visible "Frequently Asked Questions" H2 block with 3+ question H3 subheadings and FAQPage JSON-LD.'],
		},
		discoveredInternalUrls,
	};
}

async function runFallbackDirectAudit(targetUrl: string, maxPages: number): Promise<any> {
	const origin = new URL(targetUrl).origin;
	const [robotsOk, sitemapOk] = await Promise.all([
		fetch(`${origin}/robots.txt`, { cache: 'no-store' })
			.then((r) => r.ok)
			.catch(() => true),
		fetch(`${origin}/sitemap.xml`, { cache: 'no-store' })
			.then((r) => r.ok)
			.catch(() => true),
	]);

	const homeResult = await analyzeSingleHtmlPage(targetUrl, robotsOk, sitemapOk);
	const normalizedHomeUrl = `${origin}${new URL(targetUrl).pathname.replace(/\/$/, '') || '/'}`;
	const candidates = homeResult.discoveredInternalUrls.filter((u: string) => u !== normalizedHomeUrl);
	const subUrls = candidates.slice(0, Math.max(0, maxPages - 1));

	const subPages = await Promise.all(
		subUrls.map((u: string) =>
			analyzeSingleHtmlPage(u, robotsOk, sitemapOk)
				.then((r) => r.page)
				.catch(() => null)
		)
	);

	return {
		homepage: homeResult.page,
		top_pages: subPages.filter(Boolean),
		crawl_summary: {
			candidates_found: candidates.length + 1,
		},
	};
}

function mapRawPageToReport(rawPage: any, rawHome?: any): McpSeoPageReport {
	const breakdown: Record<string, boolean> = {};
	if (rawPage?.score_breakdown && typeof rawPage.score_breakdown === 'object') {
		for (const [k, v] of Object.entries(rawPage.score_breakdown)) {
			breakdown[k] = Boolean(v);
		}
	}
	if (rawHome?.score_breakdown) {
		if (!breakdown.robots && rawHome.score_breakdown.robots) breakdown.robots = true;
		if (!breakdown.sitemap && rawHome.score_breakdown.sitemap) breakdown.sitemap = true;
	}
	const headings = normalizeHeadings(rawPage?.headings || []);
	const questionHeadingCount = headings.filter(
		(h) => /\?$/.test(h.text.trim()) || /^(what|how|why|when|who|which|can|is|do|does|wat|hoe|waarom|wanneer|welke|wie|kan|is|zijn)\b/i.test(h.text.trim())
	).length;
	const hasFaqHeading = headings.some((h) => /^(faq|veelgestelde vragen|vragen en antwoorden|frequently asked questions)$/i.test(h.text.trim()));
	const hasFaqSchema = Boolean(rawPage?.has_faq_schema);
	const hasFaqBlock = Boolean(rawPage?.has_faq_block || (hasFaqHeading && questionHeadingCount >= 3));
	const aeoReady = Boolean(rawPage?.aeo_ready || (hasFaqSchema && hasFaqBlock));

	const enrichedRaw = {
		...rawPage,
		has_faq_schema: hasFaqSchema,
		has_faq_block: hasFaqBlock,
		aeo_ready: aeoReady,
	};

	const checksTotal = Object.keys(breakdown).length || 21;
	const checksPassed = Object.values(breakdown).filter(Boolean).length;
	const score = Math.max(0, Math.min(10, Number(rawPage?.score ?? Math.round((checksPassed / checksTotal) * 10))));
	const issues = buildPageIssues(enrichedRaw);

	return {
		url: String(rawPage?.url || ''),
		score,
		title: String(rawPage?.title || ''),
		description: String(rawPage?.description || ''),
		firstParagraph: String(rawPage?.first_paragraph || ''),
		titleLen: Number(rawPage?.title_len ?? String(rawPage?.title || '').length),
		descriptionLen: Number(rawPage?.description_len ?? String(rawPage?.description || '').length),
		wordCount: Number(rawPage?.word_count || 0),
		readabilityWps: Number(rawPage?.readability_avg_wps || 0),
		loadTimeMs: Number(rawPage?.load_time_ms || 0),
		internalLinks: Number(rawPage?.internal_links || 0),
		externalLinks: Number(rawPage?.external_links || 0),
		imagesTotal: Number(rawPage?.images_total ?? rawPage?.img_total ?? 0),
		imagesMissingAlt: Number(rawPage?.images_missing_alt_count || 0),
		canonical: String(rawPage?.canonical || ''),
		hasNoindex: Boolean(rawPage?.has_noindex),
		aeoReady,
		hasFaqSchema,
		hasFaqBlock,
		hasStructuredData: Boolean(rawPage?.has_structured_data),
		checksPassed,
		checksTotal,
		scoreBreakdown: breakdown,
		headings,
		recommendations: Array.isArray(rawPage?.recommendations) ? rawPage.recommendations.map(String) : [],
		issues,
	};
}

export async function GET(req: NextRequest) {
	try {
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
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 35000);
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
