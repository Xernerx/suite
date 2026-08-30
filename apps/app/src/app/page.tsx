/** @format */
'use client';

import { Command, Flame, LayoutDashboard, Search, Server, Sparkles, TerminalSquare, Trophy, Users, ChevronUp } from 'lucide-react';
import { Loading } from '@xernerx/feedback';
import { useEffect, useRef, useState } from 'react';
import { useDictionary, useEnvironment, usePlatform, useSidebar } from '@xernerx/providers';

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

function BotCard({ bot }: { bot: BotProfile }) {
	console.log('BotCard rendering:', bot?.id);
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

function ServerCard({ server }: { server: GuildProfile }) {
	const name = server.name || 'Unknown Server';
	const avatar = server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png` : null;
	const banner = server.banner ? `https://cdn.discordapp.com/banners/${server.id}/${server.banner}.png?size=1024` : null;

	return (
		<Link
			href={`/servers/${server.id}`}
			className="group relative flex flex-col bg-(--foreground) border border-(--border)/10 rounded-2xl overflow-hidden hover:border-(--accent) transition-colors shadow-sm hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
		>
			<div className="h-24 w-full relative bg-gradient-to-br from-(--border) to-(--background) overflow-hidden shrink-0 flex items-center justify-center">
				{banner ? <Image src={banner} alt={`${name} banner`} fill className="object-cover" unoptimized /> : <Server className="w-8 h-8 text-(--text-muted)/30" />}
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
							<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-(--background) border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
								<Users className="w-3.5 h-3.5 text-(--accent)" />
								{server.memberCount >= 1000000
									? `${(server.memberCount / 1000000).toFixed(1)}M`
									: server.memberCount >= 1000
										? `${(server.memberCount / 1000).toFixed(1)}k`
										: server.memberCount}
							</div>
						)}
						<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-(--background) border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
							<ChevronUp className="w-3.5 h-3.5 text-(--accent)" />
							{server.voteCount && server.voteCount >= 1000 ? `${(server.voteCount / 1000).toFixed(1)}k` : server.voteCount || 0}
						</div>
					</div>
				</div>

				<div className="mt-4 flex flex-col flex-1">
					<h4 className="text-xl font-bold text-(--text) group-hover:text-(--accent) transition-colors line-clamp-1">{name}</h4>
					<p className="text-sm text-(--text-muted) mt-2 line-clamp-2 leading-relaxed flex-1">{server.description || 'No description provided.'}</p>
				</div>
			</div>
		</Link>
	);
}

export default function Home() {
	console.log('Home rendering');
	const { hide } = useSidebar();
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
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

	// Complex state for categorized servers
	const [categorizedServers, setCategorizedServers] = useState<{
		promoted: GuildProfile[];
		biggest: GuildProfile[];
		newcomers: GuildProfile[];
		topVoted: GuildProfile[];
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
		if (!isReady) return;
		if (context === 'bots') {
			const fetchBots = async () => {
				setLoading(true);
				try {
					const [promotedRes, biggestRes, newcomersRes, topVotedRes] = await Promise.all([
						fetch(getEnvUrl('https://api.xernerx.com/secure/bots?category=promoted&limit=6')),
						fetch(getEnvUrl('https://api.xernerx.com/secure/bots?category=biggest&limit=6')),
						fetch(getEnvUrl('https://api.xernerx.com/secure/bots?category=newcomers&limit=6')),
						fetch(getEnvUrl('https://api.xernerx.com/secure/bots?category=top_voted&limit=6')),
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
		} else if (context === 'servers') {
			const fetchServers = async () => {
				setLoading(true);
				try {
					const [promotedRes, biggestRes, newcomersRes, topVotedRes] = await Promise.all([
						fetch(getEnvUrl('https://api.xernerx.com/secure/guilds?category=promoted&limit=6')),
						fetch(getEnvUrl('https://api.xernerx.com/secure/guilds?category=biggest&limit=6')),
						fetch(getEnvUrl('https://api.xernerx.com/secure/guilds?category=newcomers&limit=6')),
						fetch(getEnvUrl('https://api.xernerx.com/secure/guilds?category=top_voted&limit=6')),
					]);

					if (promotedRes.ok && biggestRes.ok && newcomersRes.ok && topVotedRes.ok) {
						setCategorizedServers({
							promoted: await promotedRes.json(),
							biggest: await biggestRes.json(),
							newcomers: await newcomersRes.json(),
							topVoted: await topVotedRes.json(),
						});
					}
				} catch (error) {
					console.error('Failed to fetch server categories', error);
				} finally {
					setLoading(false);
				}
			};
			fetchServers();
		}
	}, [getEnvUrl, context, isReady]);

	// Handle scroll for sticky bar effect
	const [isScrolled, setIsScrolled] = useState(false);
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 150);
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Helper to render a bot category grid
	const renderBotCategoryGrid = (title: string, icon: React.ReactNode, bots: BotProfile[], category: string) => (
		<div className="flex flex-col mb-16">
			<div className="flex items-center justify-between mb-8">
				<h3 className="text-3xl font-extrabold flex items-center gap-3 drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{icon} {title}
				</h3>
				{bots.length > 0 && (
					<Link href={`/bots?category=${category}`} className="text-sm font-bold text-(--accent) hover:text-(--accent)/80 transition-colors flex items-center gap-1 group">
						{t('app.home.text1')} <ChevronUp className="w-4 h-4 rotate-90 group-hover:translate-x-1 transition-transform" />
					</Link>
				)}
			</div>
			{bots.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{bots.map((bot) => (
						<BotCard key={bot.id} bot={bot} />
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-20 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">
					<p className="text-(--text-muted)/70">No bots found for this category.</p>
				</div>
			)}
		</div>
	);

	// Helper to render a server category grid
	const renderServerCategoryGrid = (title: string, icon: React.ReactNode, servers: GuildProfile[], category: string) => (
		<div className="flex flex-col mb-16">
			<div className="flex items-center justify-between mb-8">
				<h3 className="text-3xl font-extrabold flex items-center gap-3 drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{icon} {title}
				</h3>
				{servers.length > 0 && (
					<Link href={`/servers?category=${category}`} className="text-sm font-bold text-(--accent) hover:text-(--accent)/80 transition-colors flex items-center gap-1 group">
						{t('app.home.text1')} <ChevronUp className="w-4 h-4 rotate-90 group-hover:translate-x-1 transition-transform" />
					</Link>
				)}
			</div>
			{servers.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{servers.map((server) => (
						<ServerCard key={server.id} server={server} />
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-20 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">
					<p className="text-(--text-muted)/70">No servers found for this category.</p>
				</div>
			)}
		</div>
	);

	return (
		<div className="flex flex-col w-full h-full relative">
			{/* Hero Section */}
			<section className="flex flex-col items-center justify-center text-center mt-16 mb-8 relative z-10 w-full px-4 transition-all duration-500">
				<h2 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6 drop-shadow-sm transition-all duration-500" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.home.text3')}
					<br />
					<span className="text-(--accent) drop-shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_30%,transparent)]">
						{t('app.home.text4')} {context === 'bots' ? t('app.home.heroBots') : t('app.home.heroServers')}
					</span>
				</h2>
				<p className="max-w-2xl text-xl text-(--text-muted) font-medium transition-all duration-500">{t('app.home.text5')}</p>
			</section>

			{/* Unified Sticky Bar */}
			<section className={`sticky top-4 z-50 flex flex-col md:flex-row items-center justify-center mb-12 w-full px-4 max-w-6xl mx-auto transition-all duration-500 ${isScrolled ? 'top-8' : ''}`}>
				<div
					className={`w-full p-2 rounded-2xl border transition-all duration-500 flex flex-col md:flex-row items-center gap-2 ${
						isScrolled ? 'bg-(--background)/80 border-(--border)/20 backdrop-blur-xl shadow-2xl scale-[1.02]' : 'bg-(--foreground)/40 border-(--border)/10 backdrop-blur-md shadow-lg'
					}`}
				>
					{/* Navigation */}
					<div className="hidden md:flex flex-row items-center gap-2 w-full md:w-auto shrink-0">
						<Link
							href="/dashboard"
							className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-(--background) border border-(--border)/10 text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/50 hover:bg-(--accent)/10 transition-all flex-1 md:flex-none group shadow-sm"
						>
							<LayoutDashboard className="w-4 h-4 group-hover:scale-110 transition-transform" />
							<span className="text-sm font-bold">{t('app.home.text6')}</span>
						</Link>
						<Link
							href="/portal"
							className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-(--background) border border-(--border)/10 text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/50 hover:bg-(--accent)/10 transition-all flex-1 md:flex-none group shadow-sm"
						>
							<TerminalSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
							<span className="text-sm font-bold">{t('app.home.text7')}</span>
						</Link>
					</div>

					{/* Searchbar */}
					<div className="flex-1 w-full min-w-[200px]">
						<Input
							variant="search"
							shortcut="/"
							placeholder={context === 'bots' ? t('app.home.searchBots') : t('app.home.searchServers')}
							onSearch={(val) => {
								if (val.trim()) router.push(`/${context}?search=${encodeURIComponent(val.trim())}`);
							}}
						/>
					</div>

					{/* Context Switcher */}
					<div className="flex items-center p-1 bg-(--background) rounded-xl border border-(--border)/10 h-12 w-full md:w-auto shrink-0 shadow-inner">
						<button
							onClick={() => setContext('bots')}
							className={`flex-1 md:flex-none px-6 h-full rounded-lg text-sm font-bold transition-all ${
								context === 'bots' ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)/50'
							}`}
						>
							{t('app.home.text8')}
						</button>
						<button
							onClick={() => setContext('servers')}
							className={`flex-1 md:flex-none px-6 h-full rounded-lg text-sm font-bold transition-all ${
								context === 'servers' ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)/50'
							}`}
						>
							{t('app.home.text9')}
						</button>
					</div>
				</div>
			</section>

			{/* Grid Section */}
			<section className="flex flex-col w-full max-w-6xl mx-auto mb-24 relative z-10">
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<Loading />
					</div>
				) : context === 'servers' ? (
					categorizedServers ? (
						<div className="flex flex-col">
							{/* Promoted Section (Only renders if there are promoted servers) */}
							{categorizedServers.promoted?.length > 0 &&
								renderServerCategoryGrid(t('app.categories.promoted'), <Flame className="w-8 h-8 text-(--accent)" />, categorizedServers.promoted, 'promoted')}

							{/* Top Voted Section */}
							{renderServerCategoryGrid(t('app.categories.topVoted'), <ChevronUp className="w-8 h-8 text-(--accent)" />, categorizedServers.topVoted || [], 'top_voted')}

							{/* Biggest Servers Section */}
							{renderServerCategoryGrid(t('app.categories.biggestServers'), <Users className="w-8 h-8 text-(--accent)" />, categorizedServers.biggest || [], 'biggest')}

							{/* Newcomers Section */}
							{renderServerCategoryGrid(t('app.categories.newcomers'), <Sparkles className="w-8 h-8 text-(--accent)" />, categorizedServers.newcomers || [], 'newcomers')}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-32 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/50">
							<h4 className="text-2xl font-bold text-(--text-muted) mb-2">{t('app.home.text12')}</h4>
							<p className="text-(--text-muted)/70">{t('app.home.text13')}</p>
						</div>
					)
				) : categorizedBots ? (
					<div className="flex flex-col">
						{/* Promoted Section (Only renders if there are promoted bots) */}
						{categorizedBots.promoted?.length > 0 &&
							renderBotCategoryGrid(t('app.categories.promoted'), <Flame className="w-8 h-8 text-(--accent)" />, categorizedBots.promoted, 'promoted')}

						{/* Top Voted Section */}
						{renderBotCategoryGrid(t('app.categories.topVoted'), <ChevronUp className="w-8 h-8 text-(--accent)" />, categorizedBots.topVoted || [], 'top_voted')}

						{/* Biggest Bots Section */}
						{renderBotCategoryGrid(t('app.categories.biggestBots'), <Trophy className="w-8 h-8 text-(--accent)" />, categorizedBots.biggest || [], 'biggest')}

						{/* Newcomers Section */}
						{renderBotCategoryGrid(t('app.categories.newcomers'), <Sparkles className="w-8 h-8 text-(--accent)" />, categorizedBots.newcomers || [], 'newcomers')}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-32 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/50">
						<h4 className="text-2xl font-bold text-(--text-muted) mb-2">{t('app.home.text12')}</h4>
						<p className="text-(--text-muted)/70">{t('app.home.text13')}</p>
					</div>
				)}
			</section>
		</div>
	);
}
