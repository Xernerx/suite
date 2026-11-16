/** @format */

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

export function normalizeHeadings(headings: any[]): { tag: string; text: string }[] {
	if (!Array.isArray(headings)) return [];
	return headings.map((h) => (typeof h === 'string' ? { tag: 'H2', text: h } : { tag: String(h?.tag || 'H2').toUpperCase(), text: String(h?.text || '') }));
}

export function countKeywordHits(text: string, terms: string[]): number {
	const haystack = String(text || '').toLowerCase();
	return terms.filter((term) => haystack.includes(String(term).toLowerCase())).length;
}

export function computeGeoSignalsAndScore(pages: any[]): { geoScore: number; geoSignals: McpGeoSignal[] } {
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

export function buildRoadmap(issues: McpSeoIssue[]) {
	const week1 = issues.filter((i) => i.severity === 'high' || ['metadata', 'structure'].includes(i.category)).slice(0, 6);
	const week2_3 = issues.filter((i) => !week1.includes(i) && ['content', 'technical', 'accessibility', 'readability'].includes(i.category)).slice(0, 6);
	const month2 = issues.filter((i) => !week1.includes(i) && !week2_3.includes(i)).slice(0, 6);
	return { week1, week2_3, month2 };
}

export function buildContentAgent(home: any, targetUrl: string): McpContentAgent {
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
				: 'Configure Discord bots (To-Do List Bot, Virtue, Metamorphosis, Zodiac), open-source TypeScript SDKs, and developer telemetry from 1 unified Xernerx Suite account.',
		h1Suggestion: h1 || 'Empowering Developers. Connecting Communities.',
		faqSuggestion:
			'1. What is Xernerx Studios and how does 1 Account, 1 Place, 1 Setup work?\n2. Which Discord bots and open-source SDKs are included in the Xernerx Suite?\n3. How can developers publish bots and track live telemetry via the v1 API?',
	};
}
