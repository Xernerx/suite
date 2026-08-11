/** @format */
'use client';

import { Command, Flame, LayoutDashboard, Search, Server, Sparkles, TerminalSquare, Trophy, Users, ChevronUp } from 'lucide-react';
import { Loading } from '@xernerx/feedback';
import { useEffect, useRef, useState } from 'react';
import { useEnvironment, usePlatform, useSidebar } from '@xernerx/providers';

import { Button, Input } from '@xernerx/ui';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BotProfile {
	id: string;
	description?: string;
	stats?: {
		guildCount: number;
		userCount: number;
	};
	voteCount?: number;
}

interface DiscordProfile {
	global_name?: string;
	username?: string;
	avatarUrl?: string | null;
	bannerUrl?: string | null;
}

function BotCard({ bot }: { bot: BotProfile }) {
	const { getEnvUrl } = useEnvironment();
	const [discord, setDiscord] = useState<DiscordProfile | null>(null);
	const [stats, setStats] = useState<{ guildCount: number; userCount: number } | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [discordRes, statsRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/core/users/${bot.id}/discord`)),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${bot.id}/stats?limit=1`)),
				]);

				if (discordRes.ok) {
					const data = await discordRes.json();
					setDiscord(data);
				}

				if (statsRes.ok) {
					const data = await statsRes.json();
					// API returns an array sorted by timestamp, grab the most recent snapshot
					if (data && data.length > 0) {
						setStats({ guildCount: data[0].guildCount, userCount: data[0].userCount });
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
			{/* Banner Section */}
			<div className="h-24 w-full relative bg-gradient-to-br from-(--border) to-(--background) overflow-hidden shrink-0">
				{banner && <Image src={banner} alt={`${name} banner`} fill className="object-cover" unoptimized />}
				<div className="absolute inset-0 bg-(--accent)/20 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
			</div>

			{/* Avatar & Info Section */}
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

					{/* Stats Badges */}
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

export default function Home() {
	const { hide } = useSidebar();
	const { getEnvUrl } = useEnvironment();
	const { type } = usePlatform();
	const router = useRouter();

	// Redirect to dashboard only on app start if running within the desktop application wrapper
	useEffect(() => {
		if (type === 'application' && !sessionStorage.getItem('hasRedirectedToDashboard')) {
			sessionStorage.setItem('hasRedirectedToDashboard', 'true');
			router.replace('/dashboard');
		}
	}, [type, router]);

	// Complex state for categorized bots
	const [categorizedBots, setCategorizedBots] = useState<{
		promoted: BotProfile[];
		biggest: BotProfile[];
		newcomers: BotProfile[];
		topVoted: BotProfile[];
	} | null>(null);

	const [loading, setLoading] = useState(true);

	// State for context switcher
	const [context, setContext] = useState<'bots' | 'servers'>('bots');
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Hide sidebar
	useEffect(() => {
		hide();
	}, [hide]);

	// Load context from localStorage on mount
	useEffect(() => {
		const savedContext = localStorage.getItem('explore-context');
		if (savedContext === 'bots' || savedContext === 'servers') {
			setContext(savedContext);
		}
	}, []);

	// Save context to localStorage when it changes
	useEffect(() => {
		localStorage.setItem('explore-context', context);
	}, [context]);

	// Fetch Bots from Secure Route
	useEffect(() => {
		if (context === 'bots') {
			const fetchBots = async () => {
				setLoading(true);
				try {
					const [promotedRes, biggestRes, newcomersRes, topVotedRes] = await Promise.all([
						fetch(getEnvUrl('https://api.xernerx.com/secure/bots?category=promoted')),
						fetch(getEnvUrl('https://api.xernerx.com/secure/bots?category=biggest')),
						fetch(getEnvUrl('https://api.xernerx.com/secure/bots?category=newcomers')),
						fetch(getEnvUrl('https://api.xernerx.com/secure/bots?category=top_voted')),
					]);

					if (promotedRes.ok && biggestRes.ok && newcomersRes.ok && topVotedRes.ok) {
						setCategorizedBots({
							promoted: await promotedRes.json(),
							biggest: await biggestRes.json(),
							newcomers: await newcomersRes.json(),
							topVoted: await topVotedRes.json(),
						});
					}
				} catch (error) {
					console.error('Failed to fetch bot categories', error);
				} finally {
					setLoading(false);
				}
			};
			fetchBots();
		}
	}, [getEnvUrl, context]);

	// Helper to render a category grid
	const renderCategoryGrid = (title: string, icon: React.ReactNode, botsArray: BotProfile[], categoryId: string) => (
		<div className="mb-20 last:mb-0">
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center gap-3">
					{icon}
					<h3 className="text-3xl font-bold capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{title}
					</h3>
				</div>
				<Link href={`/bots?view=${categoryId}`}>
					<Button variant="outline" size="sm" className="rounded-full border-(--border)/10 hover:border-(--accent)/50">
						View All
					</Button>
				</Link>
			</div>
			{botsArray.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{botsArray.map((bot) => (
						<BotCard key={bot.id} bot={bot} />
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-20 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">
					<p className="text-(--text-muted)/70">No bots currently in this category.</p>
				</div>
			)}
		</div>
	);

	return (
		<div className="flex flex-col w-full h-full relative">
			{/* Hero Section */}
			<section className="flex flex-col items-center justify-center text-center mt-16 mb-24 relative z-10 w-full">
				<h2 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6 drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					Discover the Best <br className="hidden md:block" />
					<span className="text-(--accent) drop-shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_30%,transparent)]">Discord {context === 'bots' ? 'Bots' : 'Servers'}</span>
				</h2>
				<p className="max-w-2xl text-xl text-(--text-muted) mb-12 font-medium">Explore thousands of unique bots and vibrant communities. Power up your server or find your next home.</p>

				{/* Search & Navigation Card */}
				<div className="flex justify-center w-full mb-16 z-20 relative px-4">
					<div className="w-full max-w-2xl p-6 rounded-[2rem] bg-(--foreground)/40 border border-(--border)/10 backdrop-blur-md shadow-2xl flex flex-col gap-4 text-left">
						<div className="relative group">
							<Input
								variant="search"
								shortcut="/"
								placeholder={`Search for ${context}...`}
								onSearch={(val) => {
									if (val.trim()) router.push(`/${context}?search=${encodeURIComponent(val.trim())}`);
								}}
							/>
						</div>

						<div className="flex items-center gap-3 w-full">
							<Link
								href="/dashboard"
								className="flex flex-1 justify-center items-center gap-2 h-12 rounded-2xl bg-(--background) border border-(--border)/10 text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/50 hover:bg-(--accent)/10 transition-all shadow-sm group"
							>
								<LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
								<span className="text-sm font-bold tracking-wide">Dashboard</span>
							</Link>
							<Link
								href="/portal"
								className="flex flex-1 justify-center items-center gap-2 h-12 rounded-2xl bg-(--background) border border-(--border)/10 text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/50 hover:bg-(--accent)/10 transition-all shadow-sm group"
							>
								<TerminalSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
								<span className="text-sm font-bold tracking-wide">Portal</span>
							</Link>
						</div>
					</div>
				</div>

				{/* Context Switcher Toggle */}
				<div className="flex items-center p-1 bg-(--foreground) rounded-full border border-(--border)/10 shadow-inner">
					<button
						onClick={() => setContext('bots')}
						className={`px-8 py-3 rounded-full text-lg font-bold transition-all ${
							context === 'bots' ? 'bg-(--accent) text-white shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_40%,transparent)]' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						Browse Bots
					</button>
					<button
						onClick={() => setContext('servers')}
						className={`px-8 py-3 rounded-full text-lg font-bold transition-all ${
							context === 'servers' ? 'bg-(--accent) text-white shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_40%,transparent)]' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						Browse Servers
					</button>
				</div>
			</section>

			{/* Grid Section */}
			<section className="flex flex-col w-full max-w-6xl mx-auto mb-24 relative z-10">
				{context === 'servers' ? (
					<div className="flex flex-col items-center justify-center py-32 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/50">
						<h4 className="text-2xl font-bold text-(--text-muted) mb-2">Servers coming soon</h4>
						<p className="text-(--text-muted)/70">We are currently building out the server discovery platform.</p>
					</div>
				) : loading ? (
					<div className="flex items-center justify-center py-20">
						<Loading />
					</div>
				) : categorizedBots ? (
					<div className="flex flex-col">
						{/* Promoted Section (Only renders if there are promoted bots) */}
						{categorizedBots.promoted?.length > 0 && renderCategoryGrid('Promoted', <Flame className="w-8 h-8 text-(--accent)" />, categorizedBots.promoted, 'promoted')}

						{/* Top Voted Section */}
						{renderCategoryGrid('Top Voted', <ChevronUp className="w-8 h-8 text-(--accent)" />, categorizedBots.topVoted || [], 'top_voted')}

						{/* Biggest Bots Section */}
						{renderCategoryGrid('Biggest on Platform', <Trophy className="w-8 h-8 text-(--accent)" />, categorizedBots.biggest || [], 'biggest')}

						{/* Newcomers Section */}
						{renderCategoryGrid('Newcomers', <Sparkles className="w-8 h-8 text-(--accent)" />, categorizedBots.newcomers || [], 'newcomers')}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-32 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/50">
						<h4 className="text-2xl font-bold text-(--text-muted) mb-2">Failed to load bots</h4>
						<p className="text-(--text-muted)/70">Please check your network connection and try again.</p>
					</div>
				)}
			</section>
		</div>
	);
}
