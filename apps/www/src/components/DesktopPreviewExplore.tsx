/** @format */

'use client';

import { useEffect, useState } from 'react';
import { Bot, ChevronUp, ExternalLink, Gauge, Scale, Server, Trophy, Users } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button, Input } from '@xernerx/ui';
import type { PreviewGuildItem } from './useDesktopPreviewData';

interface ExploreBotItem {
	id: string;
	name: string;
	avatarUrl: string | null;
	bannerUrl: string | null;
	description: string;
	guilds: number;
	votes: number;
	tags: string[];
}

interface ExploreServerItem {
	id: string;
	name: string;
	iconUrl: string | null;
	bannerUrl: string | null;
	description: string;
	members: number;
	votes: number;
	tags: string[];
}

const FALLBACK_EXPLORE_BOTS: ExploreBotItem[] = [
	{
		id: 'virtue',
		name: 'Virtue',
		avatarUrl: '/icon.png',
		bannerUrl: null,
		description: 'Modern Discord leveling bot featuring Text, Voice & Global XP tracks, sleek rendered rank cards, and seasonal resets.',
		guilds: 1240,
		votes: 17,
		tags: ['leveling', 'leaderboard', 'xp'],
	},
	{
		id: 'yourapps',
		name: 'YourApps',
		avatarUrl: '/icon.png',
		bannerUrl: null,
		description: 'Modern Discord forms and applications bot featuring custom multi-step forms, channel Apply panels, and polls.',
		guilds: 827,
		votes: 14,
		tags: ['applications', 'forms', 'staff'],
	},
	{
		id: 'xernerx',
		name: 'Xernerx',
		avatarUrl: '/icon.png',
		bannerUrl: null,
		description: 'Discover Discord bots, servers, organizations, and user profiles across the Xernerx ecosystem.',
		guilds: 420,
		votes: 11,
		tags: ['directory', 'stats', 'community'],
	},
];

function formatCompact(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return String(n);
}

export function DesktopPreviewLeaderboard({ onBackToExplore }: { onBackToExplore: () => void }) {
	const { t } = useDictionary();
	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-5 flex items-center justify-between gap-4 shadow-sm">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-(--accent)">
						<Trophy className="w-5 h-5" />
						<span className="text-xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('app.leaderboard.title')}
						</span>
					</div>
					<p className="text-xs text-(--text-muted)">{t('app.leaderboard.description')}</p>
				</div>
				<Button variant="secondary" size="sm" onClick={onBackToExplore}>
					{t('app.leaderboard.backToExplore')}
				</Button>
			</div>

			<div className="grid grid-cols-3 gap-4">
				{[
					{ rank: '#1', name: 'Virtue', val: '1,240', color: 'border-amber-400/40 text-amber-400' },
					{ rank: '#2', name: 'YourApps', val: '827', color: 'border-slate-300/40 text-slate-300' },
					{ rank: '#3', name: 'Xernerx', val: '420', color: 'border-amber-600/40 text-amber-600' },
				].map((entry) => (
					<div key={entry.rank} className={`rounded-3xl bg-(--foreground)/30 backdrop-blur-md border ${entry.color} p-4 flex flex-col gap-1.5 shadow-sm`}>
						<span className="text-xs font-black">{entry.rank}</span>
						<span className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{entry.name}
						</span>
						<span className="text-xs font-mono text-(--text-muted)">
							{entry.val} {t('app.dashboard.categories.servers')}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

export function DesktopPreviewExplore({
	guilds,
	onOpenDashboard,
	onOpenLeaderboard,
	onSelectServer,
}: {
	guilds: PreviewGuildItem[];
	onOpenDashboard: () => void;
	onOpenLeaderboard: () => void;
	onSelectServer: (id: string) => void;
}) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const [context, setContext] = useState<'bots' | 'servers'>('bots');
	const [query, setQuery] = useState('');
	const [liveBots, setLiveBots] = useState<ExploreBotItem[]>([]);
	const [liveServers, setLiveServers] = useState<ExploreServerItem[]>([]);

	useEffect(() => {
		if (!isReady) return;
		let cancelled = false;
		fetch(getEnvUrl('https://api.xernerx.com/secure/bots?category=top_voted&limit=3'))
			.then((r) => (r.ok ? r.json() : null))
			.then((raw) => {
				if (cancelled || !Array.isArray(raw) || raw.length === 0) return;
				setLiveBots(
					raw.slice(0, 3).map((b: any) => ({
						id: String(b.id),
						name: String(b.discord?.global_name || b.username || b.name || b.id),
						avatarUrl: b.avatarUrl || (b.discord?.avatar && b.id ? `https://cdn.discordapp.com/avatars/${b.id}/${b.discord.avatar}.png?size=128` : null),
						bannerUrl: b.bannerUrl || (b.discord?.banner && b.id ? `https://cdn.discordapp.com/banners/${b.id}/${b.discord.banner}.png?size=600` : null),
						description: String(b.description || 'Verified Discord bot on the Xernerx directory.'),
						guilds: Number(b.guildCount ?? b.stats?.guildCount ?? b.guilds ?? 0) || 0,
						votes: Number(b.voteCount ?? b.votes ?? 0) || 0,
						tags: Array.isArray(b.tags) ? b.tags.slice(0, 3).map(String) : ['utility', 'community'],
					}))
				);
			})
			.catch(() => {});

		fetch(getEnvUrl('https://api.xernerx.com/secure/guilds?category=top_voted&limit=3'))
			.then((r) => (r.ok ? r.json() : null))
			.then((raw) => {
				if (cancelled || !Array.isArray(raw) || raw.length === 0) return;
				setLiveServers(
					raw.slice(0, 3).map((s: any) => ({
						id: String(s.id),
						name: String(s.name || s.id),
						iconUrl: s.iconUrl || (s.icon ? `https://cdn.discordapp.com/icons/${s.id}/${s.icon}.png?size=128` : null),
						bannerUrl: s.bannerUrl || (s.banner ? `https://cdn.discordapp.com/banners/${s.id}/${s.banner}.png?size=600` : null),
						description: String(s.description || 'Public Discord community on the Xernerx directory.'),
						members: Number(s.memberCount ?? s.members ?? 0) || 0,
						votes: Number(s.voteCount ?? s.votes ?? 0) || 0,
						tags: Array.isArray(s.tags) ? s.tags.slice(0, 3).map(String) : ['Community'],
					}))
				);
			})
			.catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [isReady, getEnvUrl]);

	const botsToShow = (liveBots.length > 0 ? liveBots : FALLBACK_EXPLORE_BOTS).filter((b) => !query.trim() || b.name.toLowerCase().includes(query.toLowerCase()));
	const fallbackServers: ExploreServerItem[] = guilds.slice(0, 3).map((g, i) => ({
		id: g.id,
		name: g.name,
		iconUrl: g.iconUrl,
		bannerUrl: g.bannerUrl,
		description: 'Active Discord community synced with Xernerx directory & Virtue progression.',
		members: i === 0 ? 1420 : 384,
		votes: i === 0 ? 22 : 9,
		tags: ['Community', 'Gaming'],
	}));
	const serversToShow = (liveServers.length > 0 ? liveServers : fallbackServers).filter((s) => !query.trim() || s.name.toLowerCase().includes(query.toLowerCase()));

	return (
		<div className="flex flex-col w-full gap-5 pt-2">
			{/* Hero Card (Matches apps/app/src/app/page.tsx) */}
			<section className="rounded-3xl bg-(--foreground)/35 backdrop-blur-md border border-(--accent)/35 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)] py-7 px-6 flex flex-col items-center justify-center text-center gap-2.5">
				<h1 className="text-5xl font-extrabold tracking-tight leading-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.home.text3')}{' '}
					<span className="text-(--accent) drop-shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_35%,transparent)]">
						{t('app.home.text4')} {context === 'bots' ? t('app.home.heroBots') : t('app.home.heroServers')}
					</span>
				</h1>
				<p className="max-w-xl text-sm text-(--text-muted) font-medium">{t('app.home.text5')}</p>
			</section>

			{/* Unified Explore Toolbar (Dashboard | Leaderboards | Compare | Search | Browse Bots/Servers) */}
			<div className="w-full p-2 rounded-2xl bg-(--foreground)/40 border border-(--border)/10 backdrop-blur-md shadow-lg flex items-center gap-2">
				<button
					type="button"
					onClick={onOpenDashboard}
					className="flex items-center gap-2 px-4 h-10 rounded-xl bg-(--background) border border-(--border)/10 text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/50 hover:bg-(--accent)/10 transition-all text-xs font-bold shrink-0 cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
				>
					<Gauge className="w-4 h-4" />
					<span>{t('app.home.text6')}</span>
				</button>
				<button
					type="button"
					onClick={onOpenLeaderboard}
					className="flex items-center gap-2 px-4 h-10 rounded-xl bg-(--background) border border-(--border)/10 text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/50 hover:bg-(--accent)/10 transition-all text-xs font-bold shrink-0 cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
				>
					<Trophy className="w-4 h-4" />
					<span>{t('app.leaderboard.title')}</span>
				</button>
				<span className="flex items-center gap-2 px-4 h-10 rounded-xl bg-(--background) border border-(--border)/10 text-(--text-muted) text-xs font-bold shrink-0">
					<Scale className="w-4 h-4" />
					<span>{t('app.compare.title')}</span>
				</span>

				<div className="flex-1 min-w-0">
					<Input
						variant="search"
						shortcut={false}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={context === 'bots' ? t('app.home.searchBots') : t('app.home.searchServers')}
					/>
				</div>

				<div className="flex items-center p-1 bg-(--background) rounded-xl border border-(--border)/10 h-10 shrink-0">
					<button
						type="button"
						onClick={() => setContext('bots')}
						className={`px-4 h-full rounded-lg text-xs font-bold transition-all cursor-pointer ${
							context === 'bots' ? 'bg-(--accent) text-(--accent-contrast) shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						{t('app.home.text8')}
					</button>
					<button
						type="button"
						onClick={() => setContext('servers')}
						className={`px-4 h-full rounded-lg text-xs font-bold transition-all cursor-pointer ${
							context === 'servers' ? 'bg-(--accent) text-(--accent-contrast) shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						{t('app.home.text9')}
					</button>
				</div>
			</div>

			{/* Top Voted Directory Grid */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-extrabold flex items-center gap-2 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<ChevronUp className="w-6 h-6 text-(--accent)" />
						{t('app.categories.topVoted')}
					</h2>
					<span className="text-xs font-bold text-(--accent)">{t('app.home.text1')} ›</span>
				</div>

				<div className="grid grid-cols-3 gap-4">
					{context === 'bots'
						? botsToShow.map((bot) => (
								<div key={bot.id} className="rounded-3xl bg-(--foreground)/35 backdrop-blur-md border border-(--border)/10 overflow-hidden flex flex-col justify-between shadow-sm">
									<div>
										<div
											className="h-20 w-full bg-gradient-to-br from-(--accent)/30 via-(--foreground) to-(--background) relative"
											style={bot.bannerUrl ? { backgroundImage: `url(${bot.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
										/>
										<div className="px-4 pb-3 flex flex-col gap-2">
											<div className="flex items-end justify-between -mt-6">
												<div className="h-12 w-12 rounded-2xl bg-(--background) border-4 border-(--foreground) flex items-center justify-center overflow-hidden shadow-md">
													{bot.avatarUrl ? (
														<img src={bot.avatarUrl} alt={`${bot.name} Discord bot icon`} className="h-full w-full object-cover" draggable={false} />
													) : (
														<Bot className="w-5 h-5 text-(--accent)" />
													)}
												</div>
												<div className="flex items-center gap-1.5 text-[10px] font-bold">
													<span className="rounded-full bg-(--background)/70 border border-(--border)/15 px-2 py-0.5 text-(--text-muted)">{formatCompact(bot.guilds)}</span>
													<span className="rounded-full bg-(--accent)/12 border border-(--accent)/30 px-2 py-0.5 text-(--accent)">▲ {bot.votes}</span>
												</div>
											</div>
											<span className="text-base font-extrabold text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
												{bot.name}
											</span>
											<p className="text-xs text-(--text-muted) line-clamp-2 leading-relaxed">{bot.description}</p>
											<div className="flex flex-wrap gap-1">
												{bot.tags.map((tag) => (
													<span key={tag} className="rounded-full bg-(--background)/60 border border-(--border)/10 px-2 py-0.5 text-[10px] font-semibold text-(--text-muted)">
														#{tag}
													</span>
												))}
											</div>
										</div>
									</div>
								</div>
							))
						: serversToShow.map((srv) => (
								<button
									key={srv.id}
									type="button"
									onClick={() => onSelectServer(srv.id)}
									className="rounded-3xl bg-(--foreground)/35 hover:bg-(--foreground)/50 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/35 overflow-hidden flex flex-col justify-between text-left transition-all cursor-pointer shadow-sm"
								>
									<div className="w-full">
										<div
											className="h-20 w-full bg-gradient-to-br from-(--accent)/30 via-(--foreground) to-(--background) relative"
											style={srv.bannerUrl ? { backgroundImage: `url(${srv.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
										/>
										<div className="px-4 pb-3 flex flex-col gap-2">
											<div className="flex items-end justify-between -mt-6">
												<div className="h-12 w-12 rounded-2xl bg-(--background) border-4 border-(--foreground) flex items-center justify-center overflow-hidden shadow-md">
													{srv.iconUrl ? (
														<img src={srv.iconUrl} alt={`${srv.name} Discord server icon`} className="h-full w-full object-cover" draggable={false} />
													) : (
														<Server className="w-5 h-5 text-(--accent)" />
													)}
												</div>
												<div className="flex items-center gap-1.5 text-[10px] font-bold">
													<span className="inline-flex items-center gap-1 rounded-full bg-(--background)/70 border border-(--border)/15 px-2 py-0.5 text-(--text-muted)">
														<Users size={10} />
														{formatCompact(srv.members)}
													</span>
													<ExternalLink size={12} className="text-(--accent)" />
												</div>
											</div>
											<span className="text-base font-extrabold text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
												{srv.name}
											</span>
											<p className="text-xs text-(--text-muted) line-clamp-2 leading-relaxed">{srv.description}</p>
										</div>
									</div>
								</button>
							))}
				</div>
			</div>
		</div>
	);
}
