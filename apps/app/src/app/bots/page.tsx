/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useEnvironment, useSidebar } from '@xernerx/providers';
import { Button, Input } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import Link from 'next/link';
import { Flame, Trophy, Sparkles, Server, Users, Search, ArrowLeft, Hash, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

interface BotProfile {
	id: string;
	description?: string;
	voteCount?: number;
}

interface DiscordProfile {
	global_name?: string;
	username?: string;
	avatarUrl?: string | null;
	bannerUrl?: string | null;
}

// BotCard component extracted to keep it consistent
function BotCard({ bot }: { bot: BotProfile }) {
	const { getEnvUrl } = useEnvironment();
	const [discord, setDiscord] = useState<DiscordProfile | null>(null);
	const [stats, setStats] = useState<{ guildCount: number; userCount: number } | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [discordRes, statsRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/core/users/${bot.id}/discord`), { next: { revalidate: 300 } }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${bot.id}/stats?limit=1`), { next: { revalidate: 300 } }),
				]);

				if (discordRes.ok) {
					const data = await discordRes.json();
					setDiscord(data);
				}

				if (statsRes.ok) {
					const data = await statsRes.json();
					if (data && data.length > 0) {
						const statsData = { guildCount: data[0].guildCount, userCount: data[0].userCount };
						setStats(statsData);
					}
				}
			} catch (error) {
				console.error(`Failed to fetch data for ${bot.id}:`, error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [bot.id, getEnvUrl]);

	const name = discord?.global_name || discord?.username || 'Unknown Bot';
	const avatar = discord?.avatarUrl;
	const banner = discord?.bannerUrl;

	return (
		<Link
			href={`/bots/${bot.id}`}
			className="group relative flex flex-col bg-(--foreground) border border-(--border)/10 rounded-2xl overflow-hidden hover:border-(--accent) transition-colors shadow-sm hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
		>
			<div className="h-24 w-full relative bg-gradient-to-br from-(--border) to-(--background) overflow-hidden shrink-0">
				{banner && <Image src={banner} alt={`${name} banner`} fill className="object-cover" unoptimized />}
				<div className="absolute inset-0 bg-(--accent)/20 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
			</div>

			<div className="flex flex-col px-6 pb-6 -mt-10 relative z-10 flex-1">
				<div className="flex justify-between items-end">
					<div className="w-20 h-20 rounded-2xl border-4 border-(--foreground) bg-(--background) overflow-hidden shadow-md flex items-center justify-center shrink-0">
						{loading ? (
							<Loading variant="small" />
						) : avatar ? (
							<Image src={avatar} alt={name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
						) : (
							<div className="text-2xl font-bold text-(--text-muted)">{name.charAt(0)}</div>
						)}
					</div>

					{stats && (
						<div className="flex items-center gap-2 mb-2">
							<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-(--background) border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
								<Server className="w-3.5 h-3.5 text-(--accent)" />
								{stats.guildCount >= 1000 ? `${(stats.guildCount / 1000).toFixed(1)}k` : stats.guildCount}
							</div>
							<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-(--background) border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
								<Users className="w-3.5 h-3.5 text-(--accent)" />
								{stats.userCount >= 1000000 ? `${(stats.userCount / 1000000).toFixed(1)}M` : stats.userCount >= 1000 ? `${(stats.userCount / 1000).toFixed(1)}k` : stats.userCount}
							</div>
							<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-(--background) border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
								<ChevronUp className="w-3.5 h-3.5 text-(--accent)" />
								{bot.voteCount && bot.voteCount >= 1000 ? `${(bot.voteCount / 1000).toFixed(1)}k` : bot.voteCount || 0}
							</div>
						</div>
					)}
				</div>

				<div className="mt-4 flex flex-col flex-1">
					<h4 className="text-xl font-bold text-(--text) group-hover:text-(--accent) transition-colors line-clamp-1">{loading ? 'Loading...' : name}</h4>
					<p className="text-sm text-(--text-muted) mt-2 line-clamp-2 leading-relaxed flex-1">{bot.description || 'No description provided.'}</p>
				</div>
			</div>
		</Link>
	);
}

export default function BotsList() {
	const { getEnvUrl } = useEnvironment();
	const { view, setNavItems, show, hide } = useSidebar();
	const searchParams = useSearchParams();
	const router = useRouter();
	const [bots, setBots] = useState<BotProfile[]>([]);
	const [loading, setLoading] = useState(true);

	// Setup Sidebar Navigation
	useEffect(() => {
		show();

		const baseNavItems = [
			{ label: 'All Bots', view: 'all', icon: Server, category: 'Algorithms' },
			{ label: 'Top Voted', view: 'top_voted', icon: ChevronUp, category: 'Algorithms' },
			{ label: 'Biggest on Platform', view: 'biggest', icon: Trophy, category: 'Algorithms' },
			{ label: 'Promoted', view: 'promoted', icon: Flame, category: 'Algorithms' },
			{ label: 'Newcomers', view: 'newcomers', icon: Sparkles, category: 'Algorithms' },
		];

		// Set base items initially so the sidebar isn't empty while tags load
		setNavItems(baseNavItems);

		// Fetch tags to populate the 'Categories' section
		const fetchTags = async () => {
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/bots/tags'), { next: { revalidate: 300 } });
				if (res.ok) {
					const tags: string[] = await res.json();
					const tagNavItems = tags.map((tag) => ({
						label: tag,
						view: `tag-${tag}`,
						icon: Hash,
						category: 'Categories',
					}));
					setNavItems([...baseNavItems, ...tagNavItems]);
				}
			} catch (error) {
				console.error('Failed to fetch tags for sidebar:', error);
			}
		};
		fetchTags();

		return () => hide();
	}, [setNavItems, show, hide, getEnvUrl]);

	// Fetch Bots based on Sidebar View or Search Query
	useEffect(() => {
		const fetchBots = async () => {
			const searchQuery = searchParams.get('search');
			let query = '';

			if (searchQuery) {
				query = `?search=${encodeURIComponent(searchQuery)}&limit=50`;
			} else {
				const currentCategory = view || 'biggest';

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
		};
		fetchBots();
	}, [view, getEnvUrl, searchParams]);

	return (
		<div className="flex flex-col w-full min-h-screen">
			{/* Header Navigation */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 relative z-10 pt-8">
				<div className="flex items-center gap-4">
					<Link href="/" className="p-3 rounded-full bg-(--foreground) border border-(--border)/10 text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/50 transition-colors">
						<ArrowLeft className="w-5 h-5" />
					</Link>
					<h1 className="text-4xl font-extrabold tracking-tight capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{searchParams.get('search')
							? `Search: ${searchParams.get('search')}`
							: view?.startsWith('tag-')
								? `#${view.replace('tag-', '')}`
								: view === 'all'
									? 'All Bots'
									: view === 'top_voted'
										? 'Top Voted'
										: view === 'newcomers'
											? 'Newcomers'
											: view === 'promoted'
												? 'Promoted'
												: 'Biggest on Platform'}
					</h1>
				</div>

				<div className="relative max-w-sm w-full">
					<Input
						variant="search"
						shortcut="/"
						placeholder="Search for a specific bot..."
						defaultValue={searchParams.get('search') || ''}
						onSearch={(val) => {
							if (val.trim()) {
								router.push(`/bots?search=${encodeURIComponent(val.trim())}`);
							} else {
								router.push(`/bots?view=${view || 'biggest'}`);
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
					<h4 className="text-2xl font-bold text-(--text-muted) mb-2">No bots found</h4>
					<p className="text-(--text-muted)/70">There are currently no bots available in this category.</p>
				</div>
			)}
		</div>
	);
}
