/** @format */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Button, Input } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import Link from 'next/link';
import { Flame, Trophy, Sparkles, Server, Users, Search, ArrowLeft, Hash, ChevronUp } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BotCard, type BotProfile } from '@/components/ExploreCards';

function BotsListContent() {
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { view, setView, setNavItems, show, hide } = useSidebar();
	const searchParams = useSearchParams();
	const router = useRouter();
	const [bots, setBots] = useState<BotProfile[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
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

	// Setup Sidebar Navigation
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

		// Set base items initially so the sidebar isn't empty while tags load
		setNavItems(baseNavItems);

		// Fetch tags to populate the 'Categories' section
		const fetchTags = async () => {
			if (!isReady) return;
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/bots/tags'), { next: { revalidate: 300 } });
				if (res.ok) {
					const tags: string[] = await res.json();
					const tagNavItems = tags.map((tag) => ({
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

	// Fetch Bots based on Sidebar View or Search Query
	useEffect(() => {
		if (!isReady) return;
		const timer = setTimeout(async () => {
			const activeSearch = searchInput.trim() || searchParams.get('search') || '';
			let query = '';

			if (activeSearch) {
				query = `?search=${encodeURIComponent(activeSearch)}&limit=50`;
			} else {
				const currentCategory = searchParams.get('category') || view || 'biggest';

				if (currentCategory.startsWith('tag-')) {
					const tag = currentCategory.replace('tag-', '');
					query = `?tag=${tag}&limit=50`;
				} else {
					query = currentCategory === 'all' ? '?limit=50' : `?category=${currentCategory}&limit=50`;
				}
			}

			setLoading(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots${query}`), { next: { revalidate: 60 } });
				if (res.ok) {
					const data = await res.json();
					setBots(data);
				}
			} catch (error) {
				console.error('Failed to fetch bots list', error);
			} finally {
				setLoading(false);
			}
		}, 180);

		return () => clearTimeout(timer);
	}, [view, getEnvUrl, searchParams, searchInput, isReady]);

	const activeSearchLabel = searchInput.trim() || searchParams.get('search');
	const effectiveView = searchParams.get('category') || view;

	return (
		<div className="flex flex-col w-full max-w-(--page-width) mx-auto min-h-screen">
			{/* Header Navigation */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 relative z-10 pt-8">
				<div className="flex items-center gap-4">
					<h1 className="text-4xl font-extrabold tracking-tight capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{activeSearchLabel
							? `${t('common.search')}: ${activeSearchLabel}`
							: effectiveView?.startsWith('tag-')
								? `#${effectiveView.replace('tag-', '')}`
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
				</div>

				<div className="relative max-w-sm w-full">
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
			</div>

			{/* Grid Section */}
			{loading ? (
				<div className="flex-1 flex items-center justify-center py-32">
					<Loading />
				</div>
			) : bots.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
					{bots.map((bot) => (
						<BotCard key={bot.id} bot={bot} />
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
		<Suspense
			fallback={
				<div className="flex flex-col w-full min-h-screen">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 relative z-10 pt-8">
						<div className="flex items-center gap-4">
							<h1 className="text-4xl font-extrabold tracking-tight capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.categories.biggestBots')}
							</h1>
						</div>
					</div>
					<div className="flex-1 flex items-center justify-center py-32">
						<Loading />
					</div>
				</div>
			}
		>
			<BotsListContent />
		</Suspense>
	);
}
