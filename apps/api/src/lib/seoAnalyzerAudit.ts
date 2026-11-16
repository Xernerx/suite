/** @format */

import { type McpSeoIssue, type McpSeoPageReport, normalizeHeadings } from './seoAnalyzerChecks';

export function buildPageIssues(page: any): McpSeoIssue[] {
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

export async function analyzeSingleHtmlPage(pageUrl: string, robotsOk: boolean, sitemapOk: boolean): Promise<any> {
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

export async function runFallbackDirectAudit(targetUrl: string, maxPages: number): Promise<any> {
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

export function mapRawPageToReport(rawPage: any, rawHome?: any): McpSeoPageReport {
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
