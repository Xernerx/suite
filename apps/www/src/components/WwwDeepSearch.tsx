/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Bot, Boxes, Briefcase, Compass, LifeBuoy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Input } from '@xernerx/ui';
import type { ShowcasePackage } from './HomeClient';

type WwwSearchCategory = 'pages' | 'bots' | 'docs' | 'faq' | 'careers';

interface WwwSearchResult {
	id: string;
	category: WwwSearchCategory;
	title: string;
	description: string;
	subLabel?: string;
	keywords?: string;
	href: string;
	external?: boolean;
}

function matchesTokens(haystack: string, rawQuery: string): boolean {
	const tokens = rawQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return false;
	const lower = haystack.toLowerCase();
	return tokens.every((tok) => lower.includes(tok));
}

export function WwwDeepSearch({ packages = [] }: { packages?: ShowcasePackage[] }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const router = useRouter();

	const [query, setQuery] = useState('');
	const [activeCategory, setActiveCategory] = useState<'all' | WwwSearchCategory>('all');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [faqItems, setFaqItems] = useState<any[]>([]);
	const [docsItems, setDocsItems] = useState<any[]>([]);
	const [careerItems, setCareerItems] = useState<any[]>([]);
	const [liveBots, setLiveBots] = useState<any[]>([]);
	const [liveServers, setLiveServers] = useState<any[]>([]);

	useEffect(() => {
		if (!isReady) return;
		Promise.all([
			fetch(getEnvUrl('https://api.xernerx.com/core/faq?flat=true'))
				.then((r) => (r.ok ? r.json() : { items: [] }))
				.catch(() => ({ items: [] })),
			fetch(getEnvUrl('https://api.xernerx.com/core/docs?flat=true'))
				.then((r) => (r.ok ? r.json() : { items: [] }))
				.catch(() => ({ items: [] })),
			fetch(getEnvUrl('https://api.xernerx.com/secure/dispatch/applications'))
				.then((r) => (r.ok ? r.json() : []))
				.catch(() => []),
		]).then(([faqRes, docsRes, appsRes]) => {
			setFaqItems(Array.isArray(faqRes?.items) ? faqRes.items : []);
			setDocsItems(Array.isArray(docsRes?.items) ? docsRes.items : []);
			setCareerItems(Array.isArray(appsRes) ? appsRes.filter((a: any) => a.enabled !== false && a.open !== false) : []);
		});
	}, [isReady, getEnvUrl]);

	useEffect(() => {
		const trimmed = query.trim();
		if (!isReady || trimmed.length < 2) {
			setLiveBots([]);
			setLiveServers([]);
			return;
		}
		const timer = setTimeout(() => {
			Promise.all([
				fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?search=${encodeURIComponent(trimmed)}&limit=5`))
					.then((r) => (r.ok ? r.json() : []))
					.catch(() => []),
				fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds?search=${encodeURIComponent(trimmed)}&limit=5`))
					.then((r) => (r.ok ? r.json() : []))
					.catch(() => []),
			]).then(([botsRes, guildsRes]) => {
				setLiveBots(Array.isArray(botsRes) ? botsRes : []);
				setLiveServers(Array.isArray(guildsRes) ? guildsRes : []);
			});
		}, 180);
		return () => clearTimeout(timer);
	}, [query, isReady, getEnvUrl]);

	const allSearchableItems: WwwSearchResult[] = useMemo(() => {
		const trimmedQ = query.trim();
		const qParam = trimmedQ ? `&q=${encodeURIComponent(trimmedQ)}` : '';

		const pageEntries: WwwSearchResult[] = [
			{
				id: 'page-download',
				category: 'pages',
				title: t('www.cta.download'),
				description: t('www.services.dashboard.desc'),
				subLabel: 'xernerx.com/download',
				keywords: 'download desktop app electron windows macos linux companion overlay',
				href: '/download',
			},
			{
				id: 'page-invites',
				category: 'pages',
				title: t('www.hero.links.invites'),
				description: 'Official Discord invite links for Virtue, Zodiac, Metamorphosis, To-Do, and community servers.',
				subLabel: 'xernerx.com/invites',
				keywords: 'invites discord bots servers join add virtue zodiac metamorphosis todo',
				href: '/invites',
			},
			{
				id: 'page-careers',
				category: 'careers',
				title: t('www.hero.links.careers'),
				description: 'Apply for open developer, moderator, and translator positions at Xernerx Studios.',
				subLabel: 'xernerx.com/applications',
				keywords: 'careers jobs applications roles staff developer moderator translator',
				href: '/applications',
			},
			{
				id: 'page-contact',
				category: 'pages',
				title: t('www.hero.links.contact'),
				description: 'Get in touch with our engineering and community support teams.',
				subLabel: 'xernerx.com/contact',
				keywords: 'contact support email discord help',
				href: '/contact',
			},
			{
				id: 'page-terms',
				category: 'pages',
				title: 'Terms of Service',
				description: 'Platform rules, acceptable use, and legal terms of service.',
				subLabel: 'xernerx.com/terms',
				keywords: 'terms of service tos legal policy rules',
				href: '/terms',
			},
			{
				id: 'page-privacy',
				category: 'pages',
				title: 'Privacy Policy & Cookies',
				description: 'Data protection, 3-tier privacy truth, GDPR data export, and cookie policy.',
				subLabel: 'xernerx.com/privacy',
				keywords: 'privacy policy cookies gdpr data protection public limited private',
				href: '/privacy',
			},
			{
				id: 'page-app-dashboard',
				category: 'pages',
				title: t('www.services.dashboard.title'),
				description: t('www.services.dashboard.desc'),
				subLabel: 'app.xernerx.com',
				keywords: 'dashboard explore bots servers leaderboard portal virtue',
				href: getEnvUrl('https://app.xernerx.com'),
				external: true,
			},
			{
				id: 'page-account',
				category: 'pages',
				title: t('www.highlights.personalization.title'),
				description: t('www.highlights.personalization.description'),
				subLabel: 'account.xernerx.com',
				keywords: 'account profile appearance theme accent dot matrix showcases badges credits tokens media',
				href: getEnvUrl('https://account.xernerx.com'),
				external: true,
			},
			{
				id: 'page-store',
				category: 'pages',
				title: 'Xernerx Store & Credit Perks',
				description: 'Ultra Ecosystem bundle, individual bot passes, Developer Pro API, and Credit Store perks.',
				subLabel: 'store.xernerx.com',
				keywords: 'store billing subscriptions ultra credits perks cdn slots showcases vanity url badges',
				href: getEnvUrl('https://store.xernerx.com'),
				external: true,
			},
			{
				id: 'page-info',
				category: 'faq',
				title: 'Support, Roadmap, Issues & Status Hub',
				description: t('www.highlights.roadmap.description'),
				subLabel: 'info.xernerx.com',
				keywords: 'info support status roadmap suggestions issues bugs faq changelog',
				href: getEnvUrl('https://info.xernerx.com'),
				external: true,
			},
		];

		const officialBots: WwwSearchResult[] = [
			{
				id: 'bot-virtue',
				category: 'bots',
				title: t('www.applications.virtue.title'),
				description: t('www.applications.virtue.desc'),
				subLabel: t('www.tags.discordBot'),
				keywords: 'virtue leveling xp voice progression roles leaderboard discord bot',
				href: getEnvUrl('https://app.xernerx.com/dashboard?tab=virtue'),
				external: true,
			},
			{
				id: 'bot-todo',
				category: 'bots',
				title: t('www.applications.todo.title'),
				description: t('www.applications.todo.desc'),
				subLabel: t('www.tags.discordBot'),
				keywords: 'todo list bot tasks boards productivity discord',
				href: getEnvUrl('https://app.xernerx.com/bots/782105629572464652'),
				external: true,
			},
			{
				id: 'bot-zodiac',
				category: 'bots',
				title: t('www.applications.zodiac.title'),
				description: t('www.applications.zodiac.desc'),
				subLabel: t('www.tags.discordBot'),
				keywords: 'zodiac astrology horoscopes discord bot',
				href: getEnvUrl('https://app.xernerx.com/bots/950251264095162418'),
				external: true,
			},
			{
				id: 'bot-metamorphosis',
				category: 'bots',
				title: t('www.applications.metamorphosis.title'),
				description: t('www.applications.metamorphosis.desc'),
				subLabel: t('www.tags.discordBot'),
				keywords: 'metamorphosis logging moderation discord bot',
				href: getEnvUrl('https://app.xernerx.com/bots/881678826906730547'),
				external: true,
			},
		];

		const dynamicBotResults: WwwSearchResult[] = liveBots.map((b: any) => ({
			id: `live-bot-${b.id}`,
			category: 'bots',
			title: b.name || b.username || b.id,
			description: b.description || `#${b.id}`,
			subLabel: 'Bot',
			keywords: `${b.name || ''} ${b.id || ''} ${(b.tags || []).join(' ')}`,
			href: `${getEnvUrl('https://app.xernerx.com')}/bots/${b.id}`,
			external: true,
		}));

		const dynamicServerResults: WwwSearchResult[] = liveServers.map((s: any) => ({
			id: `live-srv-${s.id}`,
			category: 'bots',
			title: s.name || s.id,
			description: s.description || `#${s.id}`,
			subLabel: 'Server',
			keywords: `${s.name || ''} ${s.id || ''} ${(s.tags || []).join(' ')}`,
			href: `${getEnvUrl('https://app.xernerx.com')}/servers/${s.id}`,
			external: true,
		}));

		const packageEntries: WwwSearchResult[] = packages.map((pkg) => ({
			id: `pkg-${pkg.name}`,
			category: 'docs',
			title: pkg.name,
			description: pkg.desc || t('www.software.packageDesc', { name: pkg.name }),
			subLabel: t('www.software.npmPackageTag'),
			keywords: `npm package sdk library ${pkg.name}`,
			href: getEnvUrl(pkg.link),
			external: true,
		}));

		const docsEntries: WwwSearchResult[] = docsItems.map((doc: any, idx: number) => {
			const prefix = doc.method && doc.path ? `${doc.method} ${doc.path} — ` : '';
			return {
				id: `doc-${doc.id || idx}`,
				category: 'docs',
				title: `${prefix}${doc.title || doc.id || ''}`,
				description: doc.description || '',
				subLabel: doc.categoryTitle || 'Docs',
				keywords: `${doc.method || ''} ${doc.path || ''} ${doc.categoryTitle || ''} ${doc.sectionTitle || ''} ${Array.isArray(doc.keywords) ? doc.keywords.join(' ') : ''}`,
				href: getEnvUrl(doc.url || 'https://docs.xernerx.com'),
				external: true,
			};
		});

		const faqEntries: WwwSearchResult[] = faqItems.map((faq: any, idx: number) => ({
			id: `faq-${faq.fullId || faq.id || idx}`,
			category: 'faq',
			title: faq.question || faq.id || '',
			description: faq.answer || '',
			subLabel: faq.categoryTitle || 'FAQ',
			keywords: `${faq.slug || ''} ${faq.categoryTitle || ''} ${faq.sectionTitle || ''} ${Array.isArray(faq.bullets) ? faq.bullets.join(' ') : ''}`,
			href: `${getEnvUrl('https://info.xernerx.com')}/faq?category=${encodeURIComponent(faq.categoryId || 'overview')}${qParam}`,
			external: true,
		}));

		const careerEntries: WwwSearchResult[] = careerItems.map((role: any, idx: number) => ({
			id: `career-${role.id || idx}`,
			category: 'careers',
			title: role.name || role.title || role.id || 'Open Role',
			description: role.description || 'Open position at Xernerx Studios.',
			subLabel: 'Open Position',
			keywords: `career job application role ${role.name || ''} ${role.id || ''}`,
			href: `/applications/${role.id}`,
		}));

		return [...pageEntries, ...officialBots, ...dynamicBotResults, ...dynamicServerResults, ...packageEntries, ...docsEntries, ...faqEntries, ...careerEntries];
	}, [t, getEnvUrl, packages, docsItems, faqItems, careerItems, liveBots, liveServers, query]);

	const matchedAll = useMemo(() => {
		const trimmed = query.trim();
		if (!trimmed) return [];
		return allSearchableItems.filter((item) => matchesTokens(`${item.title} ${item.description} ${item.subLabel || ''} ${item.keywords || ''}`, trimmed));
	}, [allSearchableItems, query]);

	const filteredResults = useMemo(() => {
		const base = activeCategory === 'all' ? matchedAll : matchedAll.filter((i) => i.category === activeCategory);
		return base.slice(0, 16);
	}, [matchedAll, activeCategory]);

	useEffect(() => {
		setSelectedIndex(0);
	}, [query, activeCategory]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (filteredResults.length === 0) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const selected = filteredResults[selectedIndex];
			if (selected) {
				if (selected.external) window.location.href = selected.href;
				else router.push(selected.href);
			}
		} else if (e.key === 'Escape') {
			setQuery('');
		}
	};

	const categoryBadge = (category: WwwSearchCategory) => {
		switch (category) {
			case 'pages':
				return { label: t('www.hero.search.categories.pages'), icon: <Compass className="w-3.5 h-3.5 text-(--accent)" />, cls: 'bg-(--accent)/10 text-(--accent) border-(--accent)/20' };
			case 'bots':
				return { label: t('www.hero.search.categories.bots'), icon: <Bot className="w-3.5 h-3.5 text-(--accent)" />, cls: 'bg-(--accent)/10 text-(--accent) border-(--accent)/20' };
			case 'docs':
				return { label: t('www.hero.search.categories.docs'), icon: <Boxes className="w-3.5 h-3.5 text-(--accent)" />, cls: 'bg-(--accent)/10 text-(--accent) border-(--accent)/20' };
			case 'faq':
				return {
					label: t('www.hero.search.categories.faq'),
					icon: <LifeBuoy className="w-3.5 h-3.5 text-(--accent-green)" />,
					cls: 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/20',
				};
			case 'careers':
				return {
					label: t('www.hero.search.categories.careers'),
					icon: <Briefcase className="w-3.5 h-3.5 text-(--accent-orange)" />,
					cls: 'bg-(--accent-orange)/10 text-(--accent-orange) border-(--accent-orange)/20',
				};
		}
	};

	const pills: Array<{ key: 'all' | WwwSearchCategory; label: string }> = [
		{ key: 'all', label: t('www.hero.search.categories.all') },
		{ key: 'pages', label: t('www.hero.search.categories.pages') },
		{ key: 'bots', label: t('www.hero.search.categories.bots') },
		{ key: 'docs', label: t('www.hero.search.categories.docs') },
		{ key: 'faq', label: t('www.hero.search.categories.faq') },
		{ key: 'careers', label: t('www.hero.search.categories.careers') },
	];

	return (
		<div className="relative w-full max-w-2xl mx-auto mt-6 text-left z-30">
			<Input variant="search" shortcut={true} placeholder={t('www.hero.search.placeholder')} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} />

			<AnimatePresence>
				{query.trim().length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 8 }}
						transition={{ duration: 0.15 }}
						className="absolute left-0 right-0 top-full mt-3 rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl p-3 flex flex-col gap-2 max-h-[420px] overflow-hidden z-50"
					>
						<div className="flex flex-wrap items-center gap-1.5 px-2 pt-1 pb-2 border-b border-(--border)/10 shrink-0">
							{pills.map((pill) => {
								const count = pill.key === 'all' ? matchedAll.length : matchedAll.filter((i) => i.category === pill.key).length;
								const isActive = activeCategory === pill.key;
								return (
									<button
										key={pill.key}
										type="button"
										onClick={() => setActiveCategory(pill.key)}
										className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
											isActive ? 'bg-(--accent) text-white' : 'bg-(--background)/60 text-(--text-muted) hover:text-(--text)'
										}`}
									>
										{pill.label} ({count})
									</button>
								);
							})}
						</div>

						<div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1">
							{filteredResults.length > 0 ? (
								filteredResults.map((result, idx) => {
									const badge = categoryBadge(result.category);
									const isSelected = idx === selectedIndex;
									return (
										<a
											key={result.id}
											href={result.href}
											onMouseEnter={() => setSelectedIndex(idx)}
											className={`flex items-center justify-between gap-4 px-4 py-3 rounded-2xl transition-colors ${
												isSelected ? 'bg-(--accent)/15 text-(--text)' : 'hover:bg-(--background)/60 text-(--text)'
											}`}
										>
											<div className="flex flex-col gap-1 min-w-0">
												<div className="flex items-center gap-2">
													<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${badge.cls}`}>
														{badge.icon}
														{badge.label}
													</span>
													{result.subLabel && <span className="text-[11px] font-bold text-(--text-muted) shrink-0">{result.subLabel} •</span>}
													<span className="font-semibold text-sm truncate">{result.title}</span>
												</div>
												{result.description && <p className="text-xs text-(--text-muted) line-clamp-1">{result.description}</p>}
											</div>
											<ArrowRight className={`w-4 h-4 shrink-0 transition-opacity ${isSelected ? 'opacity-100 text-(--accent)' : 'opacity-40'}`} />
										</a>
									);
								})
							) : (
								<div className="py-8 text-center text-sm text-(--text-muted)">{t('www.hero.search.empty', { query: query.trim() })}</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
