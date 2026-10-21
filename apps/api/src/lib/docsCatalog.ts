/** @format */

import { dictionary, type Locale, locales } from '@xernerx/lib/server';
import { DOCS_BLUEPRINTS } from './docsBlueprints';

export interface DocsQuickLinkItem {
	label: string;
	href: string;
	vanity?: string;
	external?: boolean;
}

export interface DocsItem {
	id: string;
	slug: string;
	category: 'api' | 'cdn' | 'websocket' | 'packages';
	categoryTitle: string;
	sectionTitle: string;
	title: string;
	description: string;
	markdown: string;
	url: string;
	method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
	path?: string;
	quickLinks: DocsQuickLinkItem[];
	keywords: string[];
	discordEmbed: {
		title: string;
		url: string;
		description: string;
		fields: { name: string; value: string; inline?: boolean }[];
		footer: { text: string };
	};
}

export interface DocsCategoryGroup {
	id: string;
	title: string;
	description: string;
	url: string;
	itemCount: number;
	items: DocsItem[];
}

function getNestedValue(obj: any, path: string): string | undefined {
	const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
	return typeof value === 'string' ? value : undefined;
}

function resolveEnvHref(href: string, reqUrl?: string): string {
	const baseDocs = reqUrl && reqUrl.includes('.canary.') ? 'https://docs.canary.xernerx.com' : 'https://docs.xernerx.com';
	if (href.startsWith('/')) {
		return `${baseDocs}${href}`;
	}
	if (reqUrl && reqUrl.includes('.canary.')) {
		return href.replace(/https:\/\/([a-z0-9-]+)\.xernerx\.com/i, (_, sub) => (sub === 'canary' ? 'https://canary.xernerx.com' : `https://${sub}.canary.xernerx.com`));
	}
	return href;
}

export async function buildDocsCatalog(requestedLocale?: string | null, reqUrl?: string) {
	const normalizedLocale = (requestedLocale || 'en-GB') as Locale;
	const dictBundle = await dictionary(normalizedLocale);
	const t = (key: string): string => getNestedValue(dictBundle.dictionary, key) ?? getNestedValue(dictBundle.fallbackDictionary, key) ?? key;

	const docsBase = resolveEnvHref('https://docs.xernerx.com', reqUrl);

	const items: DocsItem[] = DOCS_BLUEPRINTS.map((bp) => {
		const categoryTitle = t(bp.categoryTitleKey);
		const sectionTitle = t(bp.sectionTitleKey);
		const title = bp.rawTitle ?? (bp.titleKey ? t(bp.titleKey) : bp.id);
		const description = bp.rawDescription ?? (bp.descKey ? t(bp.descKey) : '');
		const fullUrl = `${docsBase}${bp.docPath.startsWith('/') ? bp.docPath : `/${bp.docPath}`}`;

		const quickLinks: DocsQuickLinkItem[] = (bp.quickLinks || []).map((ql) => ({
			...ql,
			href: resolveEnvHref(ql.href, reqUrl),
		}));

		if (!quickLinks.some((ql) => ql.label.includes('Documentation') || ql.label.includes('Reference'))) {
			quickLinks.unshift({
				label: `${title} Reference`,
				href: fullUrl,
			});
		}

		let markdown = `### ${title}\n${description}`;
		if (bp.method && bp.path) {
			markdown = `\`${bp.method} ${bp.path}\`\n\n${description}`;
		}

		const embedFields: { name: string; value: string; inline?: boolean }[] = [];

		if (bp.method && bp.path) {
			const baseServiceUrl = bp.category === 'cdn' ? 'https://cdn.xernerx.com' : 'https://api.xernerx.com';
			embedFields.push({
				name: 'Endpoint Details',
				value: `• Method: \`${bp.method}\`\n• Path: \`${bp.path}\`\n• Base URL: \`${resolveEnvHref(baseServiceUrl, reqUrl)}\``,
				inline: false,
			});
		}

		if (quickLinks.length > 0) {
			embedFields.push({
				name: 'Quick Links & Source',
				value: quickLinks.map((ql) => `• [${ql.label}](${ql.href})${ql.vanity ? ` (\`${ql.vanity}\`)` : ''}`).join('\n'),
				inline: false,
			});
		}

		const discordEmbed = {
			title: bp.method && bp.path ? `${bp.method} ${bp.path} • ${title}` : title,
			url: fullUrl,
			description: description,
			fields: embedFields,
			footer: { text: `Xernerx Docs • ${categoryTitle} › ${sectionTitle}` },
		};

		return {
			id: bp.id,
			slug: bp.slug,
			category: bp.category,
			categoryTitle,
			sectionTitle,
			title,
			description,
			markdown,
			url: fullUrl,
			method: bp.method,
			path: bp.path,
			quickLinks,
			keywords: bp.keywords,
			discordEmbed,
		};
	});

	const categoryMap = new Map<string, DocsCategoryGroup>();
	for (const item of items) {
		if (!categoryMap.has(item.category)) {
			categoryMap.set(item.category, {
				id: item.category,
				title: item.categoryTitle,
				description: t(`docs.home.categories.${item.category === 'packages' ? 'npm' : item.category}.description`),
				url: `${docsBase}/${item.category === 'packages' ? 'packages' : item.category === 'api' ? 'api/v1' : item.category}`,
				itemCount: 0,
				items: [],
			});
		}
		const group = categoryMap.get(item.category)!;
		group.items.push(item);
		group.itemCount++;
	}

	return {
		locale: normalizedLocale,
		supportedLocales: locales,
		totalItems: items.length,
		totalCategories: categoryMap.size,
		categories: Array.from(categoryMap.values()),
		items,
	};
}

export function filterDocsItems(items: DocsItem[], query: string): DocsItem[] {
	const q = query.trim().toLowerCase();
	if (!q) return items;

	return items.filter((item) => {
		const matchId = item.id.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
		const matchTitle = item.title.toLowerCase().includes(q);
		const matchCategory = item.categoryTitle.toLowerCase().includes(q);
		const matchPath = item.path ? item.path.toLowerCase().includes(q) : false;
		const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()));
		const matchDesc = item.description.toLowerCase().includes(q);
		return matchId || matchTitle || matchCategory || matchPath || matchKeywords || matchDesc;
	});
}
