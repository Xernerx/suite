/** @format */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Button, Input } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import Link from 'next/link';
import { Server, Users, ArrowLeft, ChevronUp, Image as ImageIcon, Trophy, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

interface GuildProfile {
	id: string;
	name: string;
	icon?: string;
	banner?: string;
	description?: string;
	voteCount?: number;
	memberCount?: number;
	bot?: boolean;
}

function ServerCard({ server }: { server: GuildProfile }) {
	const { t } = useDictionary();
	const name = server.name || t('common.unknownServer');
	const avatar = server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png` : null;
	const banner = server.banner ? `https://cdn.discordapp.com/banners/${server.id}/${server.banner}.png?size=1024` : null;

	return (
		<Link
			href={`/servers/${server.id}`}
			className="group relative flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-2xl overflow-hidden hover:border-(--accent) transition-colors shadow-sm hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
		>
			<div className="h-24 w-full relative bg-gradient-to-br from-(--border) to-(--background) overflow-hidden shrink-0 flex items-center justify-center">
				{banner ? <Image src={banner} alt={`${name} banner`} fill className="object-cover" unoptimized /> : <ImageIcon className="w-8 h-8 text-(--text-muted)/30" />}
				<div className="absolute inset-0 bg-(--accent)/20 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
			</div>

			<div className="flex flex-col px-6 pb-6 -mt-10 relative z-10 flex-1">
				<div className="flex justify-between items-end">
					<div className="w-20 h-20 rounded-2xl border-4 border-(--foreground) bg-(--background) overflow-hidden shadow-md flex items-center justify-center shrink-0">
						{avatar ? (
							<Image src={avatar} alt={name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
						) : (
							<div className="text-2xl font-bold text-(--text-muted)">{name.charAt(0)}</div>
						)}
					</div>

					<div className="flex items-center gap-2 mb-2">
						{server.memberCount !== undefined && server.bot !== false && (
							<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background) border border-(--border)/15 text-xs font-semibold text-(--text-muted)">
								<Users className="w-3.5 h-3.5 text-(--accent)" />
								{server.memberCount >= 1000000
									? `${(server.memberCount / 1000000).toFixed(1)}M`
									: server.memberCount >= 1000
										? `${(server.memberCount / 1000).toFixed(1)}k`
										: server.memberCount}
							</div>
						)}
						<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background) border border-(--border)/15 text-xs font-semibold text-(--text-muted)">
							<ChevronUp className="w-3.5 h-3.5 text-(--accent)" />
							{server.voteCount && server.voteCount >= 1000 ? `${(server.voteCount / 1000).toFixed(1)}k` : server.voteCount || 0}
						</div>
					</div>
				</div>

				<div className="mt-4 flex flex-col flex-1">
					<h2 className="text-xl font-bold text-(--text) group-hover:text-(--accent) transition-colors line-clamp-1">{name}</h2>
					<p className="text-sm text-(--text-muted) mt-2 line-clamp-2 leading-relaxed flex-1">{server.description || t('common.noDescription')}</p>
				</div>
			</div>
		</Link>
	);
}

function ServersListContent() {
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { view, setView, setNavItems, show, hide } = useSidebar();
	const searchParams = useSearchParams();
	const router = useRouter();
	const [servers, setServers] = useState<GuildProfile[]>([]);
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
				router.replace('/servers', { scroll: false });
			}
		}
	}, [view, prevView, searchParams, router]);

	// Setup Sidebar Navigation
	useEffect(() => {
		show();

		const baseNavItems = [
			{ label: t('app.servers.nav.backToExplore'), href: '/', icon: ArrowLeft, category: t('app.bots.nav.categoryNavigation') },
			{ label: t('app.leaderboard.title'), href: '/leaderboard?tab=servers', icon: Trophy, category: t('app.bots.nav.categoryNavigation') },
			{ label: t('app.servers.nav.allServers'), view: 'all', icon: Server, category: t('app.bots.nav.categoryAlgorithms') },
			{ label: t('app.categories.topVoted'), view: 'top_voted', icon: ChevronUp, category: t('app.bots.nav.categoryAlgorithms') },
			{ label: t('app.categories.biggestServers'), view: 'biggest', icon: Trophy, category: t('app.bots.nav.categoryAlgorithms') },
			{ label: t('app.categories.newcomers'), view: 'newcomers', icon: Sparkles, category: t('app.bots.nav.categoryAlgorithms') },
		];

		setNavItems(baseNavItems);

		return () => hide();
	}, [setNavItems, show, hide, t]);

	// Fetch Servers based on Sidebar View or Search Query
	useEffect(() => {
		if (!isReady) return;

		const timer = setTimeout(async () => {
			const activeSearch = searchInput.trim() || searchParams.get('search') || '';
			let query = '';

			if (activeSearch) {
				query = `?search=${encodeURIComponent(activeSearch)}&limit=50&privacy=public`;
			} else {
				const currentCategory = searchParams.get('category') || view || 'biggest';
				query = currentCategory === 'all' ? '?limit=50&privacy=public' : `?category=${currentCategory}&limit=50&privacy=public`;
			}

			setLoading(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds${query}`), { next: { revalidate: 60 } });
				if (res.ok) {
					const data = await res.json();
					setServers(data);
				}
			} catch (error) {
				console.error('Failed to fetch servers list', error);
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
							: effectiveView === 'all'
								? t('app.servers.nav.allServers')
								: effectiveView === 'top_voted'
									? t('app.categories.topVoted')
									: effectiveView === 'newcomers'
										? t('app.categories.newcomers')
										: t('app.categories.biggestServers')}
					</h1>
				</div>

				<div className="relative max-w-sm w-full">
					<Input
						variant="search"
						shortcut="K"
						placeholder={t('app.servers.placeholder')}
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						onSearch={(val) => {
							if (val.trim()) {
								router.push(`/servers?search=${encodeURIComponent(val.trim())}`);
							} else {
								router.push(`/servers?view=${effectiveView || 'biggest'}`);
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
			) : servers.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
					{servers.map((server) => (
						<ServerCard key={server.id} server={server} />
					))}
				</div>
			) : (
				<div className="flex-1 flex flex-col items-center justify-center py-32 text-center px-4">
					<div className="w-20 h-20 bg-(--foreground) border border-(--border)/10 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
						<Server className="w-10 h-10 text-(--text-muted)/50" />
					</div>
					<h2 className="text-2xl font-bold text-(--text) mb-2">{t('app.servers.noServersFound')}</h2>
					<p className="text-(--text-muted) max-w-md">{t('app.servers.noServersDesc')}</p>
				</div>
			)}
		</div>
	);
}

export default function ServersList() {
	const { t } = useDictionary();

	return (
		<Suspense
			fallback={
				<div className="flex flex-col w-full min-h-screen">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 relative z-10 pt-8">
						<div className="flex items-center gap-4">
							<h1 className="text-4xl font-extrabold tracking-tight capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.categories.biggestServers')}
							</h1>
						</div>
					</div>
					<div className="flex-1 flex items-center justify-center py-32">
						<Loading />
					</div>
				</div>
			}
		>
			<ServersListContent />
		</Suspense>
	);
}
