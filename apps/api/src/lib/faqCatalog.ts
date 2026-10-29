/** @format */

import { dictionary, type Locale, locales } from '@xernerx/lib/server';
import { FAQ_BLUEPRINTS } from './faqBlueprints';

export interface FaqQuickLinkItem {
	label: string;
	href: string;
	vanity?: string;
	external?: boolean;
}

export interface FaqTableData {
	headers: string[];
	rows: string[][];
}

export interface FaqCardItem {
	id: string;
	slug: string;
	fullId: string;
	categoryId: string;
	categoryTitle: string;
	sectionId: string;
	sectionTitle: string;
	question: string;
	answer: string;
	markdown: string;
	paragraphs: string[];
	bullets?: string[];
	table?: FaqTableData;
	quickLinks: FaqQuickLinkItem[];
	url: string;
	discordEmbed: {
		title: string;
		url: string;
		description: string;
		fields: { name: string; value: string; inline?: boolean }[];
		footer: { text: string };
	};
}

export interface FaqCategoryItem {
	id: string;
	title: string;
	navTitle: string;
	sectionId: string;
	sectionTitle: string;
	url: string;
	itemCount: number;
	items: FaqCardItem[];
}

export interface FaqSectionItem {
	id: string;
	title: string;
	categories: { id: string; title: string; navTitle: string; itemCount: number; url: string }[];
}

function getNestedValue(obj: any, path: string): string | undefined {
	const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
	return typeof value === 'string' ? value : undefined;
}

function htmlToMarkdown(text: string): string {
	return text
		.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
		.replace(/<b>(.*?)<\/b>/gi, '**$1**')
		.replace(/<code>(.*?)<\/code>/gi, '`$1`')
		.replace(/<em>(.*?)<\/em>/gi, '*$1*')
		.replace(/<[^>]+>/g, '');
}

function stripHtml(text: string): string {
	return text.replace(/<[^>]+>/g, '');
}

function resolveEnvHref(href: string, reqUrl?: string): string {
	const baseInfo = reqUrl && reqUrl.includes('.canary.') ? 'https://info.canary.xernerx.com' : 'https://info.xernerx.com';
	if (href.startsWith('/')) {
		return `${baseInfo}${href}`;
	}
	if (reqUrl && reqUrl.includes('.canary.')) {
		return href.replace(/https:\/\/([a-z0-9-]+)\.xernerx\.com/i, (_, sub) => (sub === 'canary' ? 'https://canary.xernerx.com' : `https://${sub}.canary.xernerx.com`));
	}
	return href;
}

export async function buildFaqCatalog(requestedLocale?: string | null, reqUrl?: string) {
	const normalizedLocale = (requestedLocale || 'en-GB') as Locale;
	const dictBundle = await dictionary(normalizedLocale, { includeDefault: true });
	const t = (key: string): string => getNestedValue(dictBundle.dictionary, key) ?? getNestedValue(dictBundle.fallbackDictionary, key) ?? key;

	const infoBase = resolveEnvHref('https://info.xernerx.com', reqUrl);

	const categories: FaqCategoryItem[] = FAQ_BLUEPRINTS.map((cat) => {
		const categoryTitle = t(cat.titleKey);
		const navTitle = t(cat.navTitleKey);
		const sectionTitle = t(cat.sectionTitleKey);
		const categoryUrl = `${infoBase}/faq?category=${cat.id}`;

		const items: FaqCardItem[] = cat.cards.map((card) => {
			const question = t(card.titleKey);
			const rawParagraphs = card.paragraphKeys.map((k) => t(k));
			const paragraphs = rawParagraphs.map(stripHtml);
			const mdParagraphs = rawParagraphs.map(htmlToMarkdown);
			const bullets = card.bulletKeys ? card.bulletKeys.map((k) => stripHtml(t(k))) : undefined;
			const mdBullets = card.bulletKeys ? card.bulletKeys.map((k) => `- ${htmlToMarkdown(t(k))}`) : [];

			let table: FaqTableData | undefined;
			if (card.tableType === 'subdomains') {
				const subs = ['www', 'app', 'account', 'store', 'cdn', 'docs', 'info', 'api', 'admin'] as const;
				table = {
					headers: [t('faq.overview.table.subdomain'), t('faq.overview.table.purpose')],
					rows: subs.map((s) => [s === 'www' ? 'xernerx.com' : `${s}.xernerx.com`, t(`faq.overview.subdomains.${s}`)]),
				};
			} else if (card.tableType === 'environments') {
				table = {
					headers: [t('faq.environments.table.header.environment'), t('faq.environments.table.header.domain'), t('faq.environments.table.header.description')],
					rows: [
						[t('faq.environments.table.release.label'), '*.xernerx.com', t('faq.environments.table.release.description')],
						[t('faq.environments.table.canary.label'), '*.canary.xernerx.com', t('faq.environments.table.canary.description')],
						[t('faq.environments.table.dev.label'), '*.dev.xernerx.com', t('faq.environments.table.dev.description')],
					],
				};
			}

			const quickLinks: FaqQuickLinkItem[] = card.links.map((l) => ({
				label: t(l.labelKey),
				href: resolveEnvHref(l.href, reqUrl),
				vanity: l.vanity,
				external: l.external,
			}));

			const answer = [...paragraphs, ...(bullets || [])].join('\n\n');
			const markdown = [...mdParagraphs, ...mdBullets].join('\n\n');
			const cardUrl = `${categoryUrl}&card=${card.id}`;

			return {
				id: card.id,
				slug: card.slug,
				fullId: `${cat.id}.${card.id}`,
				categoryId: cat.id,
				categoryTitle,
				sectionId: cat.sectionId,
				sectionTitle,
				question,
				answer,
				markdown,
				paragraphs,
				...(bullets ? { bullets } : {}),
				...(table ? { table } : {}),
				quickLinks,
				url: cardUrl,
				discordEmbed: {
					title: question,
					url: cardUrl,
					description: markdown,
					fields:
						quickLinks.length > 0
							? [
									{
										name: t('faq.quickLinks.label'),
										value: quickLinks.map((ql) => `• [${ql.label}](${ql.href})${ql.vanity ? ` (\`${ql.vanity}\`)` : ''}`).join('\n'),
									},
								]
							: [],
					footer: { text: `Xernerx FAQ • ${sectionTitle} › ${categoryTitle}` },
				},
			};
		});

		return {
			id: cat.id,
			title: categoryTitle,
			navTitle,
			sectionId: cat.sectionId,
			sectionTitle,
			url: categoryUrl,
			itemCount: items.length,
			items,
		};
	});

	const sectionIds = ['platform', 'community', 'accountAndDevs'] as const;
	const sections: FaqSectionItem[] = sectionIds.map((secId) => {
		const secCats = categories.filter((c) => c.sectionId === secId);
		return {
			id: secId,
			title: secCats[0]?.sectionTitle || secId,
			categories: secCats.map((c) => ({
				id: c.id,
				title: c.title,
				navTitle: c.navTitle,
				itemCount: c.itemCount,
				url: c.url,
			})),
		};
	});

	const allItems = categories.flatMap((c) => c.items);

	return {
		locale: dictBundle.currentLocale,
		supportedLocales: locales,
		totalSections: sections.length,
		totalCategories: categories.length,
		totalItems: allItems.length,
		sections,
		categories,
		items: allItems,
	};
}

export function filterFaqItems(items: FaqCardItem[], query: string): FaqCardItem[] {
	const q = query.trim().toLowerCase();
	if (!q) return items;
	return items.filter(
		(item) =>
			item.question.toLowerCase().includes(q) ||
			item.answer.toLowerCase().includes(q) ||
			item.slug.toLowerCase().includes(q) ||
			item.fullId.toLowerCase().includes(q) ||
			item.categoryTitle.toLowerCase().includes(q) ||
			item.quickLinks.some((ql) => ql.label.toLowerCase().includes(q) || (ql.vanity && ql.vanity.toLowerCase().includes(q)))
	);
}
