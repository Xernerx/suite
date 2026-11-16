/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Server, Users, Flame, Lock, ArrowLeft, Bot, Sparkles } from 'lucide-react';
import { useDictionary, useEnvironment, useSession, useSidebar } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Input, Selector } from '@xernerx/ui';
import { AppSeoSection } from '@/components/AppSeoSection';
import { LeaderboardMetricBadges, LeaderboardPodium, LeaderboardRowList, type DiscordProfile, type EntryDisplay, type LeaderboardTab } from '@/components/leaderboard/LeaderboardEntries';

export default function LeaderboardClient() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { data: session, status: sessionStatus } = useSession();
	const { hide } = useSidebar();
	const router = useRouter();
	const sessionUserId = (session as any)?.user?.id ? String((session as any).user.id) : null;
	const sessionAccessToken = (session as any)?.accessToken ? String((session as any).accessToken) : null;

	const [activeTab, setActiveTab] = useState<LeaderboardTab>('bots');
	const [sortBy, setSortBy] = useState<string>('votes');
	const [guildIdParam, setGuildIdParam] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [discordMap, setDiscordMap] = useState<Record<string, DiscordProfile>>({});
	const [data, setData] = useState<{
		bots: any[];
		servers: any[];
		streaks: any[];
		levels: any[];
		virtueGuilds?: Array<{ id: string; name: string; icon?: string | null }>;
		guildLevels?: { guildId: string; guildName?: string | null; server: any[]; text: any[]; voice: any[] } | null;
	}>({ bots: [], servers: [], streaks: [], levels: [], virtueGuilds: [], guildLevels: null });

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const tabParam = params.get('tab') as LeaderboardTab | null;
		const sortParam = params.get('sort') || params.get('track');
		const guildParam = params.get('guild');
		if (guildParam) setGuildIdParam(guildParam);

		if (tabParam && ['bots', 'servers', 'streaks', 'levels'].includes(tabParam)) {
			setActiveTab(tabParam);
			const defaultSort = tabParam === 'streaks' ? 'streak' : tabParam === 'levels' ? (guildParam ? 'server' : 'global') : 'votes';
			setSortBy(sortParam || defaultSort);
		} else if (guildParam) {
			setActiveTab('levels');
			setSortBy(sortParam || 'server');
		} else if (sortParam) {
			setSortBy(sortParam);
		}
	}, []);

	const handleTabSwitch = (nextTab: LeaderboardTab) => {
		const defaultSort = nextTab === 'streaks' ? 'streak' : nextTab === 'levels' ? (guildIdParam ? 'server' : 'global') : 'votes';
		setActiveTab(nextTab);
		setSortBy(defaultSort);
		const params = new URLSearchParams(window.location.search);
		params.set('tab', nextTab);
		params.set('sort', defaultSort);
		router.replace(`/leaderboard?${params.toString()}`, { scroll: false });
	};

	const handleGuildScopeChange = (nextGuildId: string) => {
		const isGlobal = !nextGuildId || nextGuildId === 'global';
		const resolvedGuild = isGlobal ? null : nextGuildId;
		setGuildIdParam(resolvedGuild);
		const nextTrack = isGlobal ? 'global' : sortBy === 'global' ? 'server' : sortBy;
		setSortBy(nextTrack);
		const params = new URLSearchParams(window.location.search);
		params.set('tab', 'levels');
		params.set('track', nextTrack);
		params.set('sort', nextTrack);
		if (resolvedGuild) params.set('guild', resolvedGuild);
		else params.delete('guild');
		router.replace(`/leaderboard?${params.toString()}`, { scroll: false });
	};

	const handleSortChange = (nextSort: string) => {
		setSortBy(nextSort);
		const params = new URLSearchParams(window.location.search);
		params.set('tab', activeTab);
		params.set('sort', nextSort);
		if (activeTab === 'levels') {
			params.set('track', nextSort);
			if (nextSort === 'global') {
				setGuildIdParam(null);
				params.delete('guild');
			}
		}
		router.replace(`/leaderboard?${params.toString()}`, { scroll: false });
	};

	useEffect(() => {
		if (!isReady || sessionStatus === 'loading') return;
		let cancelled = false;
		setLoading(true);

		const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
		const gParam = guildIdParam || params?.get('guild') || null;
		const queryParts = [gParam && `guild=${encodeURIComponent(gParam)}`, sessionUserId && `user=${encodeURIComponent(sessionUserId)}`].filter(Boolean);
		const apiUrl = queryParts.length > 0 ? `https://api.xernerx.com/v1/leaderboard?${queryParts.join('&')}` : 'https://api.xernerx.com/v1/leaderboard';
		const authHeaders: Record<string, string> | undefined = sessionAccessToken ? { Authorization: `Bearer ${sessionAccessToken}` } : undefined;

		Promise.all([
			fetch(getEnvUrl(apiUrl), { headers: authHeaders })
				.then((res) => (res.ok ? res.json() : null))
				.catch(() => null),
			sessionUserId
				? fetch(getEnvUrl(`https://api.xernerx.com/core/users/${encodeURIComponent(sessionUserId)}/discord/guilds`), { headers: authHeaders })
						.then((res) => (res.ok ? res.json() : null))
						.catch(() => null)
				: Promise.resolve(null),
		])
			.then(async ([d, userGuilds]) => {
				if (!d || cancelled) return;
				let resolvedVirtueGuilds: Array<{ id: string; name: string; icon?: string | null }> = Array.isArray(d.virtueGuilds) ? d.virtueGuilds : [];

				if (Array.isArray(userGuilds) && userGuilds.length > 0) {
					const userGuildMap = new Map<string, any>(userGuilds.filter((ug) => ug?.id).map((ug) => [String(ug.id), ug]));
					const filtered = resolvedVirtueGuilds
						.filter((vg) => userGuildMap.has(String(vg.id)) || (gParam && String(vg.id) === gParam))
						.map((vg) => ({ ...vg, name: userGuildMap.get(String(vg.id))?.name || vg.name, icon: vg.icon || userGuildMap.get(String(vg.id))?.icon || null }));
					if (filtered.length > 0 || resolvedVirtueGuilds.length === 0) resolvedVirtueGuilds = filtered;
				} else if (!sessionUserId) {
					resolvedVirtueGuilds = gParam ? resolvedVirtueGuilds.filter((vg) => String(vg.id) === gParam) : [];
				}

				const nextData = {
					bots: Array.isArray(d.bots) ? d.bots : [],
					servers: Array.isArray(d.servers) ? d.servers : [],
					streaks: Array.isArray(d.streaks) ? d.streaks : [],
					levels: Array.isArray(d.levels) ? d.levels : [],
					virtueGuilds: resolvedVirtueGuilds,
					guildLevels: d.guildLevels || null,
				};
				setData(nextData);

				const allEntries = [
					...nextData.bots,
					...nextData.streaks,
					...nextData.levels,
					...(nextData.guildLevels?.server || []),
					...(nextData.guildLevels?.text || []),
					...(nextData.guildLevels?.voice || []),
				];
				const nextMap: Record<string, DiscordProfile> = {};
				for (const entry of allEntries) {
					const eid = entry?.id ? String(entry.id) : '';
					if (eid && (entry?.discord?.username || entry?.discord?.global_name)) {
						nextMap[eid] = entry.discord;
					}
				}
				const idsToFetch = Array.from(new Set(allEntries.map((x) => (x?.id ? String(x.id) : '')).filter((eid) => Boolean(eid && !nextMap[eid]))));
				const entries = await Promise.all(
					idsToFetch.map(async (id) => {
						try {
							const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${encodeURIComponent(id)}/discord`));
							if (res.ok) return [id, await res.json()] as const;
						} catch {}
						return null;
					})
				);

				if (cancelled) return;
				for (const item of entries) if (item) nextMap[item[0]] = item[1];
				setDiscordMap(nextMap);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isReady, sessionStatus, sessionUserId, sessionAccessToken, getEnvUrl, guildIdParam]);

	const tabs: Array<{ id: LeaderboardTab; label: string; icon: any; count: number }> = [
		{ id: 'bots', label: t('app.leaderboard.tabs.bots'), icon: Bot, count: data.bots.length },
		{ id: 'servers', label: t('app.leaderboard.tabs.servers'), icon: Server, count: data.servers.length },
		{ id: 'streaks', label: t('app.leaderboard.tabs.streaks'), icon: Flame, count: data.streaks.length },
		{ id: 'levels', label: t('app.leaderboard.tabs.levels'), icon: Sparkles, count: data.levels.length },
	];

	const sortOptions = useMemo(() => {
		if (activeTab === 'bots')
			return [
				{ id: 'votes', label: t('app.leaderboard.metrics.votes') },
				{ id: 'servers', label: t('app.leaderboard.tabs.servers') },
				{ id: 'users', label: t('app.leaderboard.metrics.users') },
			];
		if (activeTab === 'servers')
			return [
				{ id: 'votes', label: t('app.leaderboard.metrics.votes') },
				{ id: 'members', label: t('app.leaderboard.metrics.members') },
			];
		if (activeTab === 'levels') {
			if (!guildIdParam || !data.guildLevels) return [{ id: 'global', label: t('app.leaderboard.metrics.globalTrack') }];
			const gName = data.guildLevels.guildName ? `${data.guildLevels.guildName} · ` : '';
			return [
				{ id: 'server', label: `${gName}${t('app.leaderboard.metrics.serverTrack')}` },
				{ id: 'text', label: `${gName}${t('app.leaderboard.metrics.textTrack')}` },
				{ id: 'voice', label: `${gName}${t('app.leaderboard.metrics.voiceTrack')}` },
				{ id: 'global', label: t('app.leaderboard.metrics.globalTrack') },
			];
		}
		return [
			{ id: 'streak', label: t('app.leaderboard.metrics.streak') },
			{ id: 'balance', label: t('app.leaderboard.metrics.credits') },
		];
	}, [activeTab, guildIdParam, data.guildLevels, t]);

	const resolveEntryDisplay = (entry: any): EntryDisplay => {
		if (activeTab === 'servers') {
			const name = entry.name || t('common.unknownServer');
			const avatarUrl = entry.icon ? (entry.icon.startsWith('http') ? entry.icon : `https://cdn.discordapp.com/icons/${entry.id}/${entry.icon}.png?size=256`) : null;
			const bannerUrl = entry.banner ? (entry.banner.startsWith('http') ? entry.banner : `https://cdn.discordapp.com/banners/${entry.id}/${entry.banner}.png?size=1024`) : null;
			return { name, handle: null, avatarUrl, bannerUrl };
		}
		const discord = discordMap[String(entry.id)];
		const name = discord?.global_name || discord?.username || entry.name || (activeTab === 'bots' ? t('common.unknownBot') : `ID: ${entry.id}`);
		const handle = discord?.username && discord?.global_name && discord.username !== discord.global_name ? `@${discord.username}` : null;
		const avatarUrl =
			discord?.avatarUrl ||
			(entry.avatar ? (entry.avatar.startsWith('http') ? entry.avatar : `https://cdn.discordapp.com/avatars/${entry.id}/${entry.avatar}.png?size=256`) : entry.icon || null);
		return { name, handle, avatarUrl, bannerUrl: discord?.bannerUrl || null };
	};

	const processedList = useMemo(() => {
		const rawSource =
			activeTab === 'levels' && guildIdParam && data.guildLevels && ['server', 'text', 'voice'].includes(sortBy)
				? data.guildLevels[sortBy as 'server' | 'text' | 'voice'] || []
				: data[activeTab] || [];
		const q = searchQuery.trim().toLowerCase();
		const filtered = q
			? rawSource.filter((entry) => {
					const { name, handle } = resolveEntryDisplay(entry);
					return (
						name.toLowerCase().includes(q) ||
						Boolean(handle && handle.toLowerCase().includes(q)) ||
						String(entry.id).toLowerCase().includes(q) ||
						Boolean(entry.description && String(entry.description).toLowerCase().includes(q))
					);
				})
			: [...rawSource];

		return filtered.sort((a, b) => {
			if (activeTab === 'bots')
				return sortBy === 'servers'
					? (b.guildCount || 0) - (a.guildCount || 0) || (b.voteCount || 0) - (a.voteCount || 0)
					: sortBy === 'users'
						? (b.userCount || 0) - (a.userCount || 0) || (b.voteCount || 0) - (a.voteCount || 0)
						: (b.voteCount || 0) - (a.voteCount || 0) || (b.guildCount || 0) - (a.guildCount || 0);
			if (activeTab === 'servers')
				return sortBy === 'members'
					? (b.memberCount || 0) - (a.memberCount || 0) || (b.voteCount || 0) - (a.voteCount || 0)
					: (b.voteCount || 0) - (a.voteCount || 0) || (b.memberCount || 0) - (a.memberCount || 0);
			if (activeTab === 'levels') return (b.level || 0) - (a.level || 0) || (b.xp || 0) - (a.xp || 0);
			return sortBy === 'balance' ? (b.balance || 0) - (a.balance || 0) || (b.streak || 0) - (a.streak || 0) : (b.streak || 0) - (a.streak || 0) || (b.balance || 0) - (a.balance || 0);
		});
	}, [data, activeTab, searchQuery, sortBy, discordMap, guildIdParam]);

	const showPodium = !searchQuery.trim() && processedList.length > 0;
	const podiumEntries = showPodium ? processedList.slice(0, 3) : [];
	const listEntries = showPodium ? processedList.slice(3) : processedList;

	const myStanding = useMemo(() => {
		if (!sessionUserId || (activeTab !== 'streaks' && activeTab !== 'levels')) return null;
		const idx = processedList.findIndex((item) => String(item.id) === sessionUserId);
		if (idx === -1) return { rank: null, entry: null };
		return { rank: idx + 1, entry: processedList[idx] };
	}, [sessionUserId, activeTab, processedList]);

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full py-10 px-4" style={{ gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}>
			<div className="flex flex-col md:flex-row md:items-end justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div>
					<Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--text-muted) hover:text-(--text) mb-3 transition-colors">
						<ArrowLeft size={14} />
						{t('app.leaderboard.backToExplore')}
					</Link>
					<h1 className="text-4xl font-extrabold text-(--text) flex items-center gap-3 drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<Trophy className="text-(--accent)" size={34} />
						{t('app.leaderboard.title')}
					</h1>
					<p className="text-sm text-(--text-muted) mt-1">{t('app.leaderboard.description')}</p>
				</div>

				<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 text-xs text-(--text-muted)">
					<Lock size={13} className="text-(--accent) shrink-0" />
					<span>{t('app.leaderboard.privacyNotice')}</span>
				</div>
			</div>

			<div className="w-full p-2 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm flex flex-col lg:flex-row items-center gap-2 relative z-30">
				<div className="flex items-center p-1 bg-(--background)/60 rounded-2xl border border-(--border)/10 h-12 w-full lg:w-auto shrink-0 shadow-inner">
					{tabs.map((tab) => {
						const IconComp = tab.icon;
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => handleTabSwitch(tab.id)}
								className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 h-full rounded-xl text-sm font-bold transition-all cursor-pointer ${
									isActive
										? 'bg-(--accent) text-white shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)]'
										: 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)/50'
								}`}
							>
								<IconComp size={15} />
								<span>{tab.label}</span>
							</button>
						);
					})}
				</div>

				<div className="flex-1 w-full min-w-[200px]">
					<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('app.leaderboard.searchPlaceholder')} />
				</div>

				{activeTab === 'levels' && (data.virtueGuilds?.length || 0) > 0 && (
					<div className="w-full lg:w-56 shrink-0">
						<Selector
							items={true}
							value={guildIdParam || 'global'}
							onChange={handleGuildScopeChange}
							options={[{ value: 'global', label: t('app.leaderboard.metrics.globalTrack') }, ...(data.virtueGuilds || []).map((g) => ({ value: g.id, label: g.name }))]}
						/>
					</div>
				)}

				<div className="w-full lg:w-56 shrink-0">
					<Selector items={true} value={sortBy} onChange={handleSortChange} options={sortOptions.map((opt) => ({ value: opt.id, label: `${t('app.leaderboard.sortBy')}: ${opt.label}` }))} />
				</div>
			</div>

			{myStanding && (
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-3xl border border-(--accent)/30 bg-(--accent)/10 backdrop-blur-md shadow-sm">
					<div className="flex flex-wrap items-center gap-3">
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-(--accent) text-white shadow-xs">
							<Trophy size={13} />
							{myStanding.rank ? t('app.leaderboard.rankedNumber', { rank: myStanding.rank }) : t('app.leaderboard.myStandingTitle')}
						</span>
						<span className="text-xs sm:text-sm font-bold text-(--text)">
							{myStanding.rank ? t('app.leaderboard.myStandingTitle') : t('app.leaderboard.unrankedInTop', { count: processedList.length })}
						</span>
						{myStanding.entry && <LeaderboardMetricBadges entry={myStanding.entry} activeTab={activeTab} />}
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{activeTab === 'streaks' && (
							<a
								href={getEnvUrl('https://store.xernerx.com/?tab=credits')}
								className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold bg-(--background)/70 text-(--accent) border border-(--accent)/30 hover:bg-(--accent) hover:text-white transition-colors"
							>
								<Flame size={13} />
								{t('app.leaderboard.claimDailyGift')}
							</a>
						)}
						<Link
							href={`/users/${sessionUserId}`}
							className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold bg-(--background)/70 text-(--text) border border-(--border)/15 hover:border-(--accent)/40 hover:text-(--accent) transition-colors"
						>
							<Users size={13} />
							{t('app.leaderboard.viewMyProfile')}
						</Link>
					</div>
				</div>
			)}

			{loading ? (
				<div className="flex items-center justify-center py-24">
					<Loading />
				</div>
			) : processedList.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-center">
					<Trophy size={36} className="text-(--text-muted) mb-3 opacity-50" />
					<p className="text-sm text-(--text-muted)">{t('app.leaderboard.empty')}</p>
				</div>
			) : (
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<LeaderboardPodium podiumEntries={podiumEntries} activeTab={activeTab} resolveEntryDisplay={resolveEntryDisplay} />
					<LeaderboardRowList listEntries={listEntries} showPodium={showPodium} activeTab={activeTab} resolveEntryDisplay={resolveEntryDisplay} />
				</div>
			)}

			<AppSeoSection page="leaderboard" />
		</div>
	);
}
