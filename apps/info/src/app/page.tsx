/** @format */
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Input } from '@xernerx/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowRight, Bug, Code, Compass, History, LifeBuoy, Map, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SearchCategory = 'faq' | 'issues' | 'suggestions' | 'roadmap' | 'docs' | 'changelog' | 'status';

type SearchResultItem = {
	id: string;
	category: SearchCategory;
	title: string;
	description?: string;
	keywords?: string;
	subLabel?: string;
	href: string;
	external?: boolean;
};

function matchesTokens(haystack: string, rawQuery: string): boolean {
	const tokens = rawQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return false;
	const lower = haystack.toLowerCase();
	return tokens.every((tok) => lower.includes(tok));
}

export default function InfoHomePage() {
	const { t } = useDictionary();
	const { hide } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState('');
	const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | SearchCategory>('all');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [roadmapItems, setRoadmapItems] = useState<any[]>([]);
	const [issueItems, setIssueItems] = useState<any[]>([]);
	const [suggestionItems, setSuggestionItems] = useState<any[]>([]);
	const [faqCatalogItems, setFaqCatalogItems] = useState<any[]>([]);
	const [docsCatalogItems, setDocsCatalogItems] = useState<any[]>([]);
	const [changelogItems, setChangelogItems] = useState<any[]>([]);

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		if (!isReady) return;
		Promise.all([
			fetch(getEnvUrl('https://api.xernerx.com/info/roadmap'))
				.then((res) => (res.ok ? res.json() : { data: [] }))
				.catch(() => ({ data: [] })),
			fetch(getEnvUrl('https://api.xernerx.com/info/issues'))
				.then((res) => (res.ok ? res.json() : { data: [] }))
				.catch(() => ({ data: [] })),
			fetch(getEnvUrl('https://api.xernerx.com/info/suggestions'))
				.then((res) => (res.ok ? res.json() : { data: [] }))
				.catch(() => ({ data: [] })),
			fetch(getEnvUrl('https://api.xernerx.com/core/faq?flat=true'))
				.then((res) => (res.ok ? res.json() : { items: [] }))
				.catch(() => ({ items: [] })),
			fetch(getEnvUrl('https://api.xernerx.com/core/docs?flat=true'))
				.then((res) => (res.ok ? res.json() : { items: [] }))
				.catch(() => ({ items: [] })),
			fetch('/api/changelog')
				.then((res) => (res.ok ? res.json() : []))
				.catch(() => []),
		]).then(([rData, iData, sData, faqData, docsData, clData]) => {
			setRoadmapItems(Array.isArray(rData?.data) ? rData.data : []);
			setIssueItems(Array.isArray(iData?.data) ? iData.data : []);
			setSuggestionItems(Array.isArray(sData?.data) ? sData.data : []);
			setFaqCatalogItems(Array.isArray(faqData?.items) ? faqData.items : []);
			setDocsCatalogItems(Array.isArray(docsData?.items) ? docsData.items : []);
			setChangelogItems(Array.isArray(clData) ? clData : Array.isArray(clData?.releases) ? clData.releases : []);
		});
	}, [isReady, getEnvUrl]);

	const searchableItems: SearchResultItem[] = useMemo(() => {
		const trimmedQ = searchQuery.trim();
		const qParam = trimmedQ ? `&q=${encodeURIComponent(trimmedQ)}` : '';

		const faqEntries: SearchResultItem[] =
			faqCatalogItems.length > 0
				? faqCatalogItems.map((item: any, idx: number) => ({
						id: `faq-${item.fullId || item.id || idx}`,
						category: 'faq' as const,
						title: item.question || item.id || '',
						description: item.answer || '',
						subLabel: item.categoryTitle || '',
						keywords: `${item.slug || ''} ${item.categoryTitle || ''} ${item.sectionTitle || ''} ${Array.isArray(item.bullets) ? item.bullets.join(' ') : ''}`,
						href: `/faq?category=${encodeURIComponent(item.categoryId || 'overview')}${qParam}`,
					}))
				: [
						{ id: 'faq-ov-1', category: 'faq', title: t('faq.overview.card1.title'), description: t('faq.overview.card1.description'), href: `/faq?category=overview${qParam}` },
						{ id: 'faq-ov-2', category: 'faq', title: t('faq.overview.card2.title'), description: t('faq.overview.card2.description'), href: `/faq?category=overview${qParam}` },
						{ id: 'faq-ov-3', category: 'faq', title: t('faq.overview.card3.title'), description: t('faq.overview.card3.description'), href: `/faq?category=overview${qParam}` },
						{ id: 'faq-ov-4', category: 'faq', title: t('faq.overview.card4.title'), description: t('faq.overview.card4.description'), href: `/faq?category=overview${qParam}` },
						{ id: 'faq-ov-5', category: 'faq', title: t('faq.overview.card5.title'), description: t('faq.overview.card5.description'), href: `/faq?category=overview${qParam}` },
						{ id: 'faq-env-1', category: 'faq', title: t('faq.environments.card.title'), description: t('faq.environments.card.description'), href: `/faq?category=environments${qParam}` },
						{ id: 'faq-desk-1', category: 'faq', title: t('faq.desktop.card1.title'), description: t('faq.desktop.card1.description'), href: `/faq?category=desktop${qParam}` },
						{ id: 'faq-bots-1', category: 'faq', title: t('faq.bots.card8.title'), description: t('faq.bots.card8.description'), href: `/faq?category=bots${qParam}` },
						{ id: 'faq-srv-1', category: 'faq', title: t('faq.servers.card1.title'), description: t('faq.servers.card1.description'), href: `/faq?category=servers${qParam}` },
						{ id: 'faq-acc-1', category: 'faq', title: t('faq.account.card1.title'), description: t('faq.account.card1.description'), href: `/faq?category=account${qParam}` },
						{ id: 'faq-bill-1', category: 'faq', title: t('faq.billing.card1.title'), description: t('faq.billing.card1.description'), href: `/faq?category=billing${qParam}` },
						{ id: 'faq-dev-1', category: 'faq', title: t('faq.developers.card1.title'), description: t('faq.developers.card1.description'), href: `/faq?category=developers${qParam}` },
						{ id: 'faq-tr-1', category: 'faq', title: t('faq.translations.card1.title'), description: t('faq.translations.card1.p1'), href: `/faq?category=translations${qParam}` },
					];

		const issues: SearchResultItem[] = issueItems.map((item, idx) => ({
			id: `issue-${item._id || idx}`,
			category: 'issues',
			title: item.title || '',
			description: item.description || '',
			subLabel: item.product || item.status || '',
			keywords: `${item.product || ''} ${item.status || ''}`,
			href: item.title ? `/issues?q=${encodeURIComponent(item.title)}` : '/issues',
		}));

		const suggestions: SearchResultItem[] = suggestionItems.map((item, idx) => ({
			id: `suggestion-${item._id || idx}`,
			category: 'suggestions',
			title: item.title || '',
			description: item.description || '',
			subLabel: item.product || '',
			keywords: `${item.product || ''} ${item.status || ''}`,
			href: item.title ? `/suggestions?q=${encodeURIComponent(item.title)}` : '/suggestions',
		}));

		const roadmap: SearchResultItem[] = roadmapItems.map((item, idx) => ({
			id: `roadmap-${item._id || idx}`,
			category: 'roadmap',
			title: item.title || '',
			description: item.description || '',
			subLabel: item.product || item.status || '',
			keywords: `${item.product || ''} ${item.status || ''} ${item.version || ''}`,
			href: item.title ? `/roadmap?q=${encodeURIComponent(item.title)}` : '/roadmap',
		}));

		const docsEntries: SearchResultItem[] = docsCatalogItems.map((doc: any, idx: number) => {
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

		const changelogEntries: SearchResultItem[] = changelogItems.slice(0, 40).map((rel: any, idx: number) => ({
			id: `changelog-${rel.version || rel.tag || idx}`,
			category: 'changelog',
			title: `${rel.app || 'Xernerx'} ${rel.version || rel.tag || ''}`.trim(),
			description: rel.summary || rel.body || rel.changes?.join(' • ') || t('info.home.portals.changelog.description'),
			subLabel: rel.date || '',
			keywords: `changelog release update version ${rel.version || ''} ${rel.app || ''}`,
			href: '/changelog',
		}));

		const statusEntries: SearchResultItem[] = [
			{
				id: 'status-matrix',
				category: 'status',
				title: t('info.home.portals.status.title'),
				description: t('info.home.portals.status.description'),
				subLabel: 'info.xernerx.com/status',
				keywords: 'status uptime latency ping outage operational websites applications bots services api cdn websocket',
				href: '/status',
			},
		];

		return [...faqEntries, ...roadmap, ...suggestions, ...issues, ...docsEntries, ...changelogEntries, ...statusEntries];
	}, [t, faqCatalogItems, issueItems, suggestionItems, roadmapItems, docsCatalogItems, changelogItems, searchQuery, getEnvUrl]);

	const matchedAllCategories = useMemo(() => {
		const q = searchQuery.trim();
		if (!q) return [];
		return searchableItems.filter((item) => matchesTokens(`${item.title} ${item.description || ''} ${item.subLabel || ''} ${item.keywords || ''}`, q));
	}, [searchableItems, searchQuery]);

	const filteredResults = useMemo(() => {
		const base = activeCategoryFilter === 'all' ? matchedAllCategories : matchedAllCategories.filter((item) => item.category === activeCategoryFilter);
		return base.slice(0, 20);
	}, [matchedAllCategories, activeCategoryFilter]);

	useEffect(() => {
		setSelectedIndex(0);
	}, [searchQuery, activeCategoryFilter]);

	const handleSearchKeyDown = (e: React.KeyboardEvent) => {
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
			setSearchQuery('');
		}
	};

	const categoryBadge = (category: SearchCategory) => {
		switch (category) {
			case 'faq':
				return {
					label: t('info.home.searchCategories.faq'),
					icon: <LifeBuoy className="w-3.5 h-3.5 text-(--accent-green)" />,
					cls: 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/20',
				};
			case 'issues':
				return {
					label: t('info.home.searchCategories.issues'),
					icon: <Bug className="w-3.5 h-3.5 text-(--accent-red)" />,
					cls: 'bg-(--accent-red)/10 text-(--accent-red) border-(--accent-red)/20',
				};
			case 'suggestions':
				return {
					label: t('info.home.searchCategories.suggestions'),
					icon: <MessageSquare className="w-3.5 h-3.5 text-(--accent)" />,
					cls: 'bg-(--accent)/10 text-(--accent) border-(--accent)/20',
				};
			case 'roadmap':
				return {
					label: t('info.home.searchCategories.roadmap'),
					icon: <Map className="w-3.5 h-3.5 text-(--accent)" />,
					cls: 'bg-(--accent)/10 text-(--accent) border-(--accent)/20',
				};
			case 'docs':
				return {
					label: t('info.home.searchCategories.docs'),
					icon: <Code className="w-3.5 h-3.5 text-(--accent)" />,
					cls: 'bg-(--accent)/10 text-(--accent) border-(--accent)/20',
				};
			case 'changelog':
				return {
					label: t('info.home.searchCategories.changelog'),
					icon: <History className="w-3.5 h-3.5 text-(--accent-orange)" />,
					cls: 'bg-(--accent-orange)/10 text-(--accent-orange) border-(--accent-orange)/20',
				};
			case 'status':
				return {
					label: t('info.home.searchCategories.status'),
					icon: <Activity className="w-3.5 h-3.5 text-(--accent-green)" />,
					cls: 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/20',
				};
		}
	};

	const filterPills: Array<{ key: 'all' | SearchCategory; label: string }> = [
		{ key: 'all', label: t('info.home.searchCategories.all') },
		{ key: 'faq', label: t('info.home.searchCategories.faq') },
		{ key: 'roadmap', label: t('info.home.searchCategories.roadmap') },
		{ key: 'suggestions', label: t('info.home.searchCategories.suggestions') },
		{ key: 'issues', label: t('info.home.searchCategories.issues') },
		{ key: 'docs', label: t('info.home.searchCategories.docs') },
	];

	const portals = [
		{
			title: t('info.home.portals.roadmap.title'),
			description: t('info.home.portals.roadmap.description'),
			icon: <Map className="w-8 h-8 text-(--accent)" />,
			href: '/roadmap',
			color: 'bg-(--accent)/10 border-(--accent)/20',
		},
		{
			title: t('info.home.portals.suggestions.title'),
			description: t('info.home.portals.suggestions.description'),
			icon: <MessageSquare className="w-8 h-8 text-(--accent)" />,
			href: '/suggestions',
			color: 'bg-(--accent)/10 border-(--accent)/20',
		},
		{
			title: t('info.home.portals.bugs.title'),
			description: t('info.home.portals.bugs.description'),
			icon: <Bug className="w-8 h-8 text-(--accent-red)" />,
			href: '/issues',
			color: 'bg-(--accent-red)/10 border-(--accent-red)/20',
		},
		{
			title: t('info.home.portals.changelog.title'),
			description: t('info.home.portals.changelog.description'),
			icon: <History className="w-8 h-8 text-(--accent-orange)" />,
			href: '/changelog',
			color: 'bg-(--accent-orange)/10 border-(--accent-orange)/20',
		},
		{
			title: t('info.home.portals.status.title'),
			description: t('info.home.portals.status.description'),
			icon: <Activity className="w-8 h-8 text-(--accent-green)" />,
			href: '/status',
			color: 'bg-(--accent-green)/10 border-(--accent-green)/20',
		},
		{
			title: t('info.home.portals.faq.title'),
			description: t('info.home.portals.faq.description'),
			icon: <LifeBuoy className="w-8 h-8 text-(--accent-green)" />,
			href: '/faq',
			color: 'bg-(--accent-green)/10 border-(--accent-green)/20',
		},
	];

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full p-8 md:p-12 gap-16 min-h-[80vh] justify-center relative">
			{/* Decorative background glow */}
			<div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-(--accent)/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

			<motion.div
				initial={{ opacity: 1, y: 0 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
				className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto w-full"
			>
				<motion.div
					initial={{ scale: 1, opacity: 1 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.4, delay: 0.1 }}
					className="flex items-center justify-center w-16 h-16 rounded-2xl bg-(--accent)/20 border border-(--accent)/30 mb-2"
				>
					<Compass className="w-8 h-8 text-(--accent)" />
				</motion.div>
				<h1 className="text-5xl md:text-6xl font-black tracking-tight text-(--text)">{t('info.home.title')}</h1>
				<p className="text-xl text-(--text-muted) leading-relaxed">{t('info.home.description')}</p>

				<div className="relative w-full max-w-2xl mt-2 text-left z-30">
					<Input
						variant="search"
						shortcut={true}
						placeholder={t('info.home.searchPlaceholder')}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={handleSearchKeyDown}
					/>

					<AnimatePresence>
						{searchQuery.trim().length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 8 }}
								transition={{ duration: 0.15 }}
								className="absolute left-0 right-0 top-full mt-3 rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl p-3 flex flex-col gap-2 max-h-[440px] overflow-hidden z-40"
							>
								<div className="flex flex-wrap items-center gap-1.5 px-2 pt-1 pb-2 border-b border-(--border)/10 shrink-0">
									{filterPills.map((pill) => {
										const count = pill.key === 'all' ? matchedAllCategories.length : matchedAllCategories.filter((i) => i.category === pill.key).length;
										const isActive = activeCategoryFilter === pill.key;
										return (
											<button
												key={pill.key}
												type="button"
												onClick={() => setActiveCategoryFilter(pill.key)}
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
												<Link
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
												</Link>
											);
										})
									) : (
										<div className="py-8 text-center text-sm text-(--text-muted)">{t('info.home.searchEmpty', { query: searchQuery.trim() })}</div>
									)}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</motion.div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-(--page-width) mx-auto w-full">
				{portals.map((portal, i) => (
					<Link href={portal.href} key={i}>
						<motion.div
							initial={{ opacity: 1, y: 0 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.45, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
							whileHover={{ y: -6, scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className={`flex flex-col items-center text-center p-8 rounded-3xl border ${portal.color} bg-(--foreground)/30 backdrop-blur-md shadow-lg h-full transition-colors hover:bg-(--foreground)/50 hover:shadow-xl cursor-pointer gap-4`}
						>
							<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 shadow-sm">{portal.icon}</div>
							<h2 className="text-xl font-bold text-(--text)">{portal.title}</h2>
							<p className="text-sm text-(--text-muted) leading-relaxed">{portal.description}</p>
						</motion.div>
					</Link>
				))}
			</div>
		</div>
	);
}
