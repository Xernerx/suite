/** @format */

import { FALLBACK_DOCS_ITEMS, FALLBACK_FAQ_ITEMS } from './catalogFallbacks.js';

export interface FaqQuickLink {
	label: string;
	href: string;
	vanity?: string;
	external?: boolean;
}

export interface FaqItem {
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
	url: string;
	quickLinks: FaqQuickLink[];
	discordEmbed?: {
		title: string;
		url: string;
		description: string;
		fields: { name: string; value: string; inline?: boolean }[];
		footer: { text: string };
	};
}

export interface DocsQuickLink {
	label: string;
	href: string;
	vanity?: string;
	external?: boolean;
}

export interface DocsItem {
	id: string;
	slug: string;
	category: string;
	categoryTitle: string;
	sectionTitle: string;
	title: string;
	description: string;
	markdown: string;
	url: string;
	method?: string;
	path?: string;
	quickLinks: DocsQuickLink[];
	keywords: string[];
	discordEmbed?: {
		title: string;
		url: string;
		description: string;
		fields: { name: string; value: string; inline?: boolean }[];
		footer: { text: string };
	};
}

interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

let faqCache: CacheEntry<FaqItem[]> | null = null;
let docsCache: CacheEntry<DocsItem[]> | null = null;

export function getApiBaseUrl(): string {
	if (process.env.API_URL) return process.env.API_URL.replace(/\/$/, '');
	if (process.env.ENVIRONMENT?.toUpperCase() === 'DEVELOPMENT') {
		return process.env.DEV_API_URL || 'http://localhost:4001';
	}
	const domain = process.env.DOMAIN || 'xernerx.com';
	if (process.env.ENVIRONMENT?.toUpperCase() === 'CANARY') {
		return `https://api.canary.${domain}`;
	}
	return `https://api.${domain}`;
}

async function fetchWithFallback<T>(path: string): Promise<T | null> {
	const primaryUrl = `${getApiBaseUrl()}${path}`;
	try {
		const res = await fetch(primaryUrl, {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(3500),
		});
		if (res.ok) {
			return (await res.json()) as T;
		}
	} catch (err) {
		// If local dev API fails or is unreachable, fallback to production API
		if (getApiBaseUrl().includes('localhost') || getApiBaseUrl().includes('127.0.0.1')) {
			try {
				const fallbackUrl = `https://api.xernerx.com${path}`;
				const fallbackRes = await fetch(fallbackUrl, {
					headers: { Accept: 'application/json' },
					signal: AbortSignal.timeout(3500),
				});
				if (fallbackRes.ok) {
					return (await fallbackRes.json()) as T;
				}
			} catch {}
		}
	}
	return null;
}

export async function fetchFaqItems(forceRefresh = false): Promise<FaqItem[]> {
	const now = Date.now();
	if (!forceRefresh && faqCache && now - faqCache.timestamp < CACHE_TTL_MS) {
		return faqCache.data;
	}

	const res = await fetchWithFallback<{ items: FaqItem[] }>('/core/faq?flat=true');
	if (res && Array.isArray(res.items) && res.items.length > 0) {
		faqCache = { data: res.items, timestamp: now };
		return res.items;
	}

	if (faqCache) {
		return faqCache.data;
	}

	return FALLBACK_FAQ_ITEMS;
}

export async function fetchDocsItems(forceRefresh = false): Promise<DocsItem[]> {
	const now = Date.now();
	if (!forceRefresh && docsCache && now - docsCache.timestamp < CACHE_TTL_MS) {
		return docsCache.data;
	}

	const res = await fetchWithFallback<{ items: DocsItem[] }>('/core/docs?flat=true');
	if (res && Array.isArray(res.items) && res.items.length > 0) {
		docsCache = { data: res.items, timestamp: now };
		return res.items;
	}

	if (docsCache) {
		return docsCache.data;
	}

	return FALLBACK_DOCS_ITEMS;
}

export async function searchFaq(query: string): Promise<FaqItem[]> {
	const items = await fetchFaqItems();
	const q = query.trim().toLowerCase();
	if (!q) return items.slice(0, 25);

	return items
		.filter((item) => {
			const matchQuestion = item.question.toLowerCase().includes(q);
			const matchCategory = item.categoryTitle.toLowerCase().includes(q);
			const matchSection = item.sectionTitle.toLowerCase().includes(q);
			const matchId = item.id.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
			const matchAnswer = item.answer.toLowerCase().includes(q);
			return matchQuestion || matchCategory || matchSection || matchId || matchAnswer;
		})
		.slice(0, 25);
}

export async function searchDocs(query: string): Promise<DocsItem[]> {
	const items = await fetchDocsItems();
	const q = query.trim().toLowerCase();
	if (!q) return items.slice(0, 25);

	return items
		.filter((item) => {
			const matchTitle = item.title.toLowerCase().includes(q);
			const matchId = item.id.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
			const matchCategory = item.categoryTitle.toLowerCase().includes(q);
			const matchPath = item.path ? item.path.toLowerCase().includes(q) : false;
			const matchKeywords = item.keywords ? item.keywords.some((k) => k.toLowerCase().includes(q)) : false;
			const matchDesc = item.description.toLowerCase().includes(q);
			return matchTitle || matchId || matchCategory || matchPath || matchKeywords || matchDesc;
		})
		.slice(0, 25);
}

export async function findFaqItem(idOrSlug: string): Promise<FaqItem | null> {
	const items = await fetchFaqItems();
	const target = idOrSlug.trim().toLowerCase();
	return items.find((i) => i.id.toLowerCase() === target || i.slug.toLowerCase() === target || i.fullId?.toLowerCase() === target || i.question.toLowerCase() === target) || null;
}

export async function findDocsItem(idOrSlug: string): Promise<DocsItem | null> {
	const items = await fetchDocsItems();
	const target = idOrSlug.trim().toLowerCase();
	return items.find((i) => i.id.toLowerCase() === target || i.slug.toLowerCase() === target || (i.path && i.path.toLowerCase() === target) || i.title.toLowerCase() === target) || null;
}
