/** @format */
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Button, Input, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { Flame, Trophy, Sparkles, Server, ArrowLeft, Hash, ChevronUp, Dices, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BotCard, type BotProfile } from '@/components/ExploreCards';
import { BotDirectorySpotlight } from '@/components/bots/BotDirectorySpotlight';
import { AppSeoSection } from '@/components/AppSeoSection';

function BotsListContent() {
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { view, setView, setNavItems, show, hide } = useSidebar();
	const searchParams = useSearchParams();
	const router = useRouter();
	const [bots, setBots] = useState<BotProfile[]>([]);
	const [availableTags, setAvailableTags] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
	const [sortBy, setSortBy] = useState<string>('');
	const [prevView, setPrevView] = useState<string | null>(view);

	// Sync ?category= query param into active sidebar view
	useEffect(() => {
		const categoryParam = searchParams.get('category');
		if (categoryParam) {
			setView(categoryParam);
		}
	}, [searchParams, setView]);

	// Clear ?search= query when user clicks a sidebar category
	useEffect(() => {
		if (view && view !== prevView) {
			setPrevView(view);
			if (searchParams.get('search')) {
				setSearchInput('');
				router.replace('/bots', { scroll: false });
			}
		}
	}, [view, prevView, searchParams, router]);

	// Setup Sidebar Navigation & Tag Catalog
	useEffect(() => {
		show();

		const baseNavItems = [
			{ label: t('app.bots.nav.backToExplore'), href: '/', icon: ArrowLeft, category: t('app.bots.nav.categoryNavigation') },
			{ label: t('app.leaderboard.title'), href: '/leaderboard', icon: Trophy, category: t('app.bots.nav.categoryNavigation') },
			{ label: t('app.bots.nav.allBots'), view: 'all', icon: Server, category: t('app.bots.nav.categoryAlgorithms') },
			{ label: t('app.categories.topVoted'), view: 'top_voted', icon: ChevronUp, category: t('app.bots.nav.categoryAlgorithms') },
			{ label: t('app.categories.biggestBots'), view: 'biggest', icon: Trophy, category: t('app.bots.nav.categoryAlgorithms') },
			{ label: t('app.categories.promoted'), view: 'promoted', icon: Flame, category: t('app.bots.nav.categoryAlgorithms') },
			{ label: t('app.categories.newcomers'), view: 'newcomers', icon: Sparkles, category: t('app.bots.nav.categoryAlgorithms') },
		];

		setNavItems(baseNavItems);

		const fetchTags = async () => {
			if (!isReady) return;
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/bots/tags'), { next: { revalidate: 300 } });
				if (res.ok) {
					const tags: string[] = await res.json();
					setAvailableTags(Array.isArray(tags) ? tags : []);
					const tagNavItems = (Array.isArray(tags) ? tags : []).map((tag) => ({
						label: tag,
						view: `tag-${tag}`,
						icon: Hash,
						category: t('app.bots.nav.categoryCategories'),
					}));
					setNavItems([...baseNavItems, ...tagNavItems]);
				}
			} catch (error) {
				console.error('Failed to fetch tags for sidebar:', error);
			}
		};
		fetchTags();

		return () => hide();
	}, [setNavItems, show, hide, getEnvUrl, isReady, t]);

	// Fetch Bots based on Sidebar View, Tag, Sort, or Search Query
	useEffect(() => {
		if (!isReady) return;
		const timer = setTimeout(async () => {
			const activeSearch = searchInput.trim() || searchParams.get('search') || '';
			const params = new URLSearchParams();
			params.set('limit', '50');

			if (activeSearch) {
				params.set('search', activeSearch);
			} else {
				const currentCategory = searchParams.get('category') || view || 'biggest';
				if (currentCategory.startsWith('tag-')) {
					params.set('tag', currentCategory.replace('tag-', ''));
				} else if (currentCategory !== 'all') {
					params.set('category', currentCategory);
				}
			}

			if (sortBy) {
				params.set('sort', sortBy);
			}

			setLoading(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?${params.toString()}`), { next: { revalidate: 60 } });
				if (res.ok) {
					const data = await res.json();
					setBots(Array.isArray(data) ? data : []);
				}
			} catch (error) {
				console.error('Failed to fetch bots list', error);
			} finally {
				setLoading(false);
			}
		}, 180);

		return () => clearTimeout(timer);
	}, [view, sortBy, getEnvUrl, searchParams, searchInput, isReady]);

	const activeSearchLabel = searchInput.trim() || searchParams.get('search');
	const effectiveView = searchParams.get('category') || view || 'biggest';
	const activeTag = effectiveView.startsWith('tag-') ? effectiveView.replace('tag-', '') : null;

	const categoryPills = [
		{ id: 'biggest', label: t('app.categories.biggestBots'), icon: Trophy },
		{ id: 'top_voted', label: t('app.categories.topVoted'), icon: ChevronUp },
		{ id: 'promoted', label: t('app.categories.promoted'), icon: Flame },
		{ id: 'newcomers', label: t('app.categories.newcomers'), icon: Sparkles },
		{ id: 'all', label: t('app.bots.nav.allBots'), icon: Server },
	];

	const sortOptions = [
		{ value: '', label: t('app.bots.explore.sortDefault') },
		{ value: 'servers', label: t('app.bots.explore.sortServers') },
		{ value: 'users', label: t('app.bots.explore.sortUsers') },
		{ value: 'votes', label: t('app.bots.explore.sortVotes') },
		{ value: 'rating', label: t('app.bots.explore.sortRating') },
		{ value: 'newest', label: t('app.bots.explore.sortNewest') },
	];

	const spotlightBot = useMemo(() => {
		if (activeSearchLabel || bots.length === 0) return null;
		const boosted = bots.find((b) => (b.promotedUntil && new Date(b.promotedUntil).getTime() > Date.now()) || (b.boostedUntil && new Date(b.boostedUntil).getTime() > Date.now()));
		return boosted || bots[0];
	}, [bots, activeSearchLabel]);

	const handleSelectCategory = (catId: string) => {
		setView(catId);
		if (searchParams.get('search') || searchParams.get('category')) {
			setSearchInput('');
			router.replace('/bots', { scroll: false });
		}
	};

	const handleSelectTag = (tag: string) => {
		if (activeTag === tag) {
			handleSelectCategory('biggest');
		} else {
			setView(`tag-${tag}`);
			if (searchParams.get('search') || searchParams.get('category')) {
				setSearchInput('');
				router.replace('/bots', { scroll: false });
			}
		}
	};

	const handleSurpriseMe = () => {
		if (bots.length === 0) return;
		const randomBot = bots[Math.floor(Math.random() * bots.length)];
		if (randomBot) {
			router.push(`/bots/${randomBot.vanitySlug || randomBot.id}`);
		}
	};

	return (
		<div className="flex flex-col w-full max-w-(--page-width) mx-auto min-h-screen" style={{ gap: 'var(--ui-gap)' }}>
			{/* Header & Search Controls */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-8 relative z-10">
				<div className="flex flex-col gap-1">
					<h1 className="text-4xl font-extrabold tracking-tight capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{activeSearchLabel
							? `${t('common.search')}: ${activeSearchLabel}`
							: activeTag
								? `#${activeTag}`
								: effectiveView === 'all'
									? t('app.bots.nav.allBots')
									: effectiveView === 'top_voted'
										? t('app.categories.topVoted')
										: effectiveView === 'newcomers'
											? t('app.categories.newcomers')
											: effectiveView === 'promoted'
												? t('app.categories.promoted')
												: t('app.categories.biggestBots')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('app.bots.explore.subtitle')}</p>
				</div>

				<div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
					<div className="w-full sm:w-72">
						<Input
							variant="search"
							shortcut="K"
							placeholder={t('app.bots.placeholder1')}
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onSearch={(val) => {
								if (val.trim()) {
									router.push(`/bots?search=${encodeURIComponent(val.trim())}`);
								} else {
									router.push(`/bots?view=${effectiveView || 'biggest'}`);
								}
							}}
						/>
					</div>

					<div className="w-44 shrink-0">
						<Selector value={sortBy} onChange={(val) => setSortBy(val)} options={sortOptions} placeholder={t('app.bots.explore.sortDefault')} />
					</div>

					{bots.length > 1 && (
						<Button variant="secondary" onClick={handleSurpriseMe} className="shrink-0 flex items-center gap-2" title={t('app.bots.explore.surpriseMe')}>
							<Dices className="w-4 h-4 text-(--accent)" />
							<span className="hidden xl:inline">{t('app.bots.explore.surpriseMe')}</span>
						</Button>
					)}
				</div>
			</div>

			{/* Inline Discovery Filter Bar & Tag Ribbon */}
			<div className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md p-4 gap-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex flex-wrap items-center gap-2">
						{categoryPills.map((pill) => {
							const Icon = pill.icon;
							const isActive = !activeSearchLabel && !activeTag && effectiveView === pill.id;
							return (
								<button
									key={pill.id}
									type="button"
									onClick={() => handleSelectCategory(pill.id)}
									className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border ${
										isActive
											? 'bg-(--accent) text-white border-(--accent) shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)]'
											: 'bg-(--background)/60 hover:bg-(--background) text-(--text-muted) hover:text-(--text) border-(--border)/10'
									}`}
								>
									<Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-(--accent)'}`} />
									{pill.label}
								</button>
							);
						})}
					</div>

					{!loading && (
						<span className="text-xs font-mono font-bold text-(--text-muted) px-2.5 py-1 rounded-full bg-(--background)/50 border border-(--border)/10">
							{t('app.bots.explore.showingCount', { count: bots.length })}
						</span>
					)}
				</div>

				{availableTags.length > 0 && (
					<div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-(--border)/10 no-scrollbar">
						<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mr-1 shrink-0">{t('app.bots.nav.categoryCategories')}:</span>
						{availableTags.map((tag) => {
							const isSelected = activeTag === tag;
							return (
								<button
									key={tag}
									type="button"
									onClick={() => handleSelectTag(tag)}
									className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
										isSelected
											? 'bg-(--accent)/20 text-(--accent) border-(--accent)/40 font-extrabold'
											: 'bg-(--background)/50 hover:bg-(--background) text-(--text-muted) hover:text-(--text) border-(--border)/10'
									}`}
								>
									<Hash className="w-3 h-3 text-(--accent)" />
									{tag}
									{isSelected && <X className="w-3 h-3 ml-0.5" />}
								</button>
							);
						})}
					</div>
				)}
			</div>

			{/* Spotlight Hero Banner */}
			{!loading && spotlightBot && <BotDirectorySpotlight bot={spotlightBot} onSelectTag={handleSelectTag} />}

			{/* Grid Section */}
			{loading ? (
				<div className="flex-1 flex items-center justify-center py-32">
					<Loading />
				</div>
			) : bots.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
					{bots.map((bot) => (
						<BotCard key={bot.id} bot={bot} onSelectTag={handleSelectTag} />
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-40 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">
					<h2 className="text-2xl font-bold text-(--text-muted) mb-2">{t('app.bots.text1')}</h2>
					<p className="text-(--text-muted)/70">{t('app.bots.text2')}</p>
				</div>
			)}
		</div>
	);
}

export default function BotsList() {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col w-full">
			<Suspense
				fallback={
					<div className="flex flex-col w-full max-w-(--page-width) mx-auto min-h-[40dvh]">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 relative z-10 pt-8">
							<div className="flex items-center gap-4">
								<div className="text-4xl font-extrabold tracking-tight capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('app.categories.biggestBots')}
								</div>
							</div>
						</div>
						<div className="flex-1 flex items-center justify-center py-20">
							<Loading />
						</div>
					</div>
				}
			>
				<BotsListContent />
			</Suspense>

			<AppSeoSection page="bots" />
		</div>
	);
}
