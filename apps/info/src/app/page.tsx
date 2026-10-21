/** @format */
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Input } from '@xernerx/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Activity, Bug, Compass, History, LifeBuoy, Map, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SearchResultItem = {
	id: string;
	category: 'faq' | 'issues' | 'suggestions' | 'roadmap';
	title: string;
	description?: string;
	href: string;
};

export default function InfoHomePage() {
	const { t } = useDictionary();
	const { hide } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [roadmapItems, setRoadmapItems] = useState<any[]>([]);
	const [issueItems, setIssueItems] = useState<any[]>([]);
	const [suggestionItems, setSuggestionItems] = useState<any[]>([]);

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
		]).then(([rData, iData, sData]) => {
			setRoadmapItems(Array.isArray(rData?.data) ? rData.data : []);
			setIssueItems(Array.isArray(iData?.data) ? iData.data : []);
			setSuggestionItems(Array.isArray(sData?.data) ? sData.data : []);
		});
	}, [isReady, getEnvUrl]);

	const searchableItems: SearchResultItem[] = useMemo(() => {
		const faqEntries: SearchResultItem[] = [
			{ id: 'faq-ov-1', category: 'faq', title: t('faq.overview.card1.title'), description: t('faq.overview.card1.description'), href: '/faq?view=overview' },
			{ id: 'faq-ov-2', category: 'faq', title: t('faq.overview.card2.title'), description: t('faq.overview.card2.description'), href: '/faq?view=overview' },
			{ id: 'faq-ov-3', category: 'faq', title: t('faq.overview.card3.title'), description: t('faq.overview.card3.description'), href: '/faq?view=overview' },
			{ id: 'faq-ov-4', category: 'faq', title: t('faq.overview.card4.title'), description: t('faq.overview.card4.description'), href: '/faq?view=overview' },
			{ id: 'faq-ov-5', category: 'faq', title: t('faq.overview.card5.title'), description: t('faq.overview.card5.description'), href: '/faq?view=overview' },
			{ id: 'faq-env-1', category: 'faq', title: t('faq.environments.card.title'), description: t('faq.environments.card.description'), href: '/faq?view=environments' },
			{ id: 'faq-env-2', category: 'faq', title: t('faq.environments.card2.title'), description: t('faq.environments.card2.description'), href: '/faq?view=environments' },
			{ id: 'faq-env-3', category: 'faq', title: t('faq.environments.card3.title'), description: t('faq.environments.card3.description'), href: '/faq?view=environments' },
			{ id: 'faq-env-4', category: 'faq', title: t('faq.environments.card4.title'), description: t('faq.environments.card4.description'), href: '/faq?view=environments' },
			{ id: 'faq-env-6', category: 'faq', title: t('faq.environments.card6.title'), description: t('faq.environments.card6.description'), href: '/faq?view=environments' },
			{ id: 'faq-desk-1', category: 'faq', title: t('faq.desktop.card1.title'), description: t('faq.desktop.card1.description'), href: '/faq?view=desktop' },
			{ id: 'faq-desk-2', category: 'faq', title: t('faq.desktop.card2.title'), description: t('faq.desktop.card2.description'), href: '/faq?view=desktop' },
			{ id: 'faq-desk-3', category: 'faq', title: t('faq.desktop.card3.title'), description: t('faq.desktop.card3.description'), href: '/faq?view=desktop' },
			{ id: 'faq-desk-4', category: 'faq', title: t('faq.desktop.card4.title'), description: t('faq.desktop.card4.description'), href: '/faq?view=desktop' },
			{ id: 'faq-desk-5', category: 'faq', title: t('faq.desktop.card5.title'), description: t('faq.desktop.card5.description'), href: '/faq?view=desktop' },
			{ id: 'faq-bots-8', category: 'faq', title: t('faq.bots.card8.title'), description: t('faq.bots.card8.description'), href: '/faq?view=bots' },
			{ id: 'faq-bots-2', category: 'faq', title: t('faq.bots.card2.title'), description: t('faq.bots.card2.description'), href: '/faq?view=bots' },
			{ id: 'faq-bots-9', category: 'faq', title: t('faq.bots.card9.title'), description: t('faq.bots.card9.description'), href: '/faq?view=bots' },
			{ id: 'faq-bots-10', category: 'faq', title: t('faq.bots.card10.title'), description: t('faq.bots.card10.description'), href: '/faq?view=bots' },
			{ id: 'faq-bots-1', category: 'faq', title: t('faq.bots.card.title'), description: t('faq.bots.card.description2'), href: '/faq?view=bots' },
			{ id: 'faq-bots-4', category: 'faq', title: t('faq.bots.card4.title'), description: t('faq.bots.card4.description'), href: '/faq?view=bots' },
			{ id: 'faq-bots-5', category: 'faq', title: t('faq.bots.card5.title'), description: t('faq.bots.card5.description'), href: '/faq?view=bots' },
			{ id: 'faq-bots-3', category: 'faq', title: t('faq.bots.card3.title'), description: t('faq.bots.card3.description'), href: '/faq?view=bots' },
			{ id: 'faq-srv-1', category: 'faq', title: t('faq.servers.card1.title'), description: t('faq.servers.card1.description'), href: '/faq?view=servers' },
			{ id: 'faq-srv-2', category: 'faq', title: t('faq.servers.card2.title'), description: t('faq.servers.card2.description'), href: '/faq?view=servers' },
			{ id: 'faq-srv-3', category: 'faq', title: t('faq.servers.card3.title'), description: t('faq.servers.card3.description'), href: '/faq?view=servers' },
			{ id: 'faq-srv-4', category: 'faq', title: t('faq.servers.card4.title'), description: t('faq.servers.card4.description'), href: '/faq?view=servers' },
			{ id: 'faq-srv-5', category: 'faq', title: t('faq.servers.card5.title'), description: t('faq.servers.card5.description'), href: '/faq?view=servers' },
			{ id: 'faq-srv-6', category: 'faq', title: t('faq.servers.card6.title'), description: t('faq.servers.card6.description'), href: '/faq?view=servers' },
			{ id: 'faq-acc-1', category: 'faq', title: t('faq.account.card1.title'), description: t('faq.account.card1.description'), href: '/faq?view=account' },
			{ id: 'faq-acc-5', category: 'faq', title: t('faq.account.card5.title'), description: t('faq.account.card5.description'), href: '/faq?view=account' },
			{ id: 'faq-acc-6', category: 'faq', title: t('faq.account.card6.title'), description: t('faq.account.card6.description'), href: '/faq?view=account' },
			{ id: 'faq-acc-7', category: 'faq', title: t('faq.account.card7.title'), description: t('faq.account.card7.description'), href: '/faq?view=account' },
			{ id: 'faq-acc-9', category: 'faq', title: t('faq.account.card9.title'), description: t('faq.account.card9.description'), href: '/faq?view=account' },
			{ id: 'faq-acc-8', category: 'faq', title: t('faq.account.card8.title'), description: t('faq.account.card8.description'), href: '/faq?view=account' },
			{ id: 'faq-acc-10', category: 'faq', title: t('faq.account.card10.title'), description: t('faq.account.card10.description'), href: '/faq?view=account' },
			{ id: 'faq-acc-3', category: 'faq', title: t('faq.account.card3.title'), description: t('faq.account.card3.description'), href: '/faq?view=account' },
			{ id: 'faq-bill-1', category: 'faq', title: t('faq.billing.card1.title'), description: t('faq.billing.card1.description'), href: '/faq?view=billing' },
			{ id: 'faq-bill-2', category: 'faq', title: t('faq.billing.card2.title'), description: t('faq.billing.card2.description'), href: '/faq?view=billing' },
			{ id: 'faq-bill-3', category: 'faq', title: t('faq.billing.card3.title'), description: t('faq.billing.card3.description'), href: '/faq?view=billing' },
			{ id: 'faq-bill-4', category: 'faq', title: t('faq.billing.card4.title'), description: t('faq.billing.card4.description'), href: '/faq?view=billing' },
			{ id: 'faq-bill-5', category: 'faq', title: t('faq.billing.card5.title'), description: t('faq.billing.card5.description'), href: '/faq?view=billing' },
			{ id: 'faq-dev-1', category: 'faq', title: t('faq.developers.card1.title'), description: t('faq.developers.card1.description'), href: '/faq?view=developers' },
			{ id: 'faq-dev-7', category: 'faq', title: t('faq.developers.card7.title'), description: t('faq.developers.card7.description'), href: '/faq?view=developers' },
			{ id: 'faq-dev-3', category: 'faq', title: t('faq.developers.card3.title'), description: t('faq.developers.card3.description'), href: '/faq?view=developers' },
			{ id: 'faq-dev-8', category: 'faq', title: t('faq.developers.card8.title'), description: t('faq.developers.card8.description'), href: '/faq?view=developers' },
			{ id: 'faq-dev-4', category: 'faq', title: t('faq.developers.card4.title'), description: t('faq.developers.card4.description'), href: '/faq?view=developers' },
			{ id: 'faq-dev-2', category: 'faq', title: t('faq.developers.card2.title'), description: t('faq.developers.card2.description'), href: '/faq?view=developers' },
			{ id: 'faq-tr-1', category: 'faq', title: t('faq.translations.card1.title'), description: t('faq.translations.card1.p1'), href: '/faq?view=translations' },
			{ id: 'faq-tr-2', category: 'faq', title: t('faq.translations.card2.title'), description: t('faq.translations.card2.description'), href: '/faq?view=translations' },
			{ id: 'faq-tr-3', category: 'faq', title: t('faq.translations.card3.title'), description: t('faq.translations.card3.description'), href: '/faq?view=translations' },
			{ id: 'faq-tr-4', category: 'faq', title: t('faq.translations.card4.title'), description: t('faq.translations.card4.description'), href: '/faq?view=translations' },
			{ id: 'faq-tr-5', category: 'faq', title: t('faq.translations.card5.title'), description: t('faq.translations.card5.description'), href: '/faq?view=translations' },
		];

		const issues: SearchResultItem[] = issueItems.map((item, idx) => ({
			id: `issue-${item._id || idx}`,
			category: 'issues',
			title: item.title || '',
			description: item.description || '',
			href: item.title ? `/issues?q=${encodeURIComponent(item.title)}` : '/issues',
		}));

		const suggestions: SearchResultItem[] = suggestionItems.map((item, idx) => ({
			id: `suggestion-${item._id || idx}`,
			category: 'suggestions',
			title: item.title || '',
			description: item.description || '',
			href: item.title ? `/suggestions?q=${encodeURIComponent(item.title)}` : '/suggestions',
		}));

		const roadmap: SearchResultItem[] = roadmapItems.map((item, idx) => ({
			id: `roadmap-${item._id || idx}`,
			category: 'roadmap',
			title: item.title || '',
			description: item.description || '',
			href: '/roadmap',
		}));

		return [...faqEntries, ...issues, ...suggestions, ...roadmap];
	}, [t, issueItems, suggestionItems, roadmapItems]);

	const filteredResults = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return [];
		return searchableItems.filter((item) => item.title.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q))).slice(0, 8);
	}, [searchableItems, searchQuery]);

	useEffect(() => {
		setSelectedIndex(0);
	}, [searchQuery]);

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
				router.push(selected.href);
			}
		} else if (e.key === 'Escape') {
			setSearchQuery('');
		}
	};

	const categoryBadge = (category: SearchResultItem['category']) => {
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
				return { label: t('info.home.searchCategories.roadmap'), icon: <Map className="w-3.5 h-3.5 text-(--accent)" />, cls: 'bg-(--accent)/10 text-(--accent) border-(--accent)/20' };
		}
	};

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
		<div className="flex flex-col max-w-[1600px] mx-auto w-full p-8 md:p-12 gap-16 min-h-[80vh] justify-center relative">
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
								className="absolute left-0 right-0 top-full mt-3 rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl p-3 flex flex-col gap-1.5 max-h-96 overflow-y-auto z-40"
							>
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
														<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.cls}`}>
															{badge.icon}
															{badge.label}
														</span>
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
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</motion.div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
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
