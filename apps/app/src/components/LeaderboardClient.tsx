/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trophy, Server, Users, Flame, Coins, ShieldCheck, ChevronUp, Lock, ArrowLeft, Bot, Crown, Medal, Award, Sparkles, MessageSquare, Headphones } from 'lucide-react';
import { UserProfilePopover } from '@xernerx/components';
import { useDictionary, useEnvironment, useSession, useSidebar } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Input, Selector } from '@xernerx/ui';
import { AppSeoSection } from '@/components/AppSeoSection';

type LeaderboardTab = 'bots' | 'servers' | 'streaks' | 'levels';

interface DiscordProfile {
	id?: string;
	global_name?: string;
	username?: string;
	avatarUrl?: string | null;
	bannerUrl?: string | null;
}

const PODIUM_STYLES = [
	{
		order: 'order-1 md:order-2 md:mb-6',
		border: 'border-amber-400/50 hover:border-amber-400 shadow-[0_10px_40px_rgba(234,179,8,0.22)] ring-1 ring-amber-400/30',
		badge: 'bg-[color-mix(in_srgb,#eab308_22%,var(--background))] text-amber-400 border border-amber-400/45 shadow-[0_0_20px_rgba(234,179,8,0.35)] backdrop-blur-md',
		banner: 'from-amber-500/25 via-(--foreground) to-(--background)',
		ring: 'h-24 w-24 ring-2 ring-amber-400/50',
		pedestal: 'py-2.5 from-amber-500/25 via-amber-500/10 to-transparent border-t border-amber-400/35 text-amber-400',
	},
	{
		order: 'order-2 md:order-1 md:mb-2',
		border: 'border-slate-300/40 hover:border-slate-300/75 shadow-[0_6px_28px_rgba(203,213,225,0.14)] ring-1 ring-slate-300/20',
		badge: 'bg-[color-mix(in_srgb,#cbd5e1_20%,var(--background))] text-slate-300 border border-slate-300/40 shadow-[0_0_15px_rgba(203,213,225,0.2)] backdrop-blur-md',
		banner: 'from-slate-400/20 via-(--foreground) to-(--background)',
		ring: 'h-20 w-20 ring-2 ring-slate-300/35',
		pedestal: 'py-2 from-slate-300/20 via-slate-300/5 to-transparent border-t border-slate-300/30 text-slate-300',
	},
	{
		order: 'order-3 md:order-3',
		border: 'border-amber-600/40 hover:border-amber-600/75 shadow-[0_6px_28px_rgba(217,119,6,0.15)] ring-1 ring-amber-600/20',
		badge: 'bg-[color-mix(in_srgb,#d97706_22%,var(--background))] text-amber-500 border border-amber-600/40 shadow-[0_0_15px_rgba(217,119,6,0.25)] backdrop-blur-md',
		banner: 'from-amber-700/25 via-(--foreground) to-(--background)',
		ring: 'h-20 w-20 ring-2 ring-amber-600/35',
		pedestal: 'py-1.5 from-amber-600/20 via-amber-600/5 to-transparent border-t border-amber-600/30 text-amber-500',
	},
] as const;

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
				const idsToFetch = Array.from(new Set(allEntries.map((x) => (x?.id ? String(x.id) : '')).filter(Boolean)));
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
				const nextMap: Record<string, DiscordProfile> = {};
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

	const resolveEntryDisplay = (entry: any) => {
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

	const getHref = (entry: any) => (activeTab === 'bots' ? `/bots/${entry.id}` : activeTab === 'servers' ? `/servers/${entry.id}` : `/users/${entry.id}`);
	const pillBase = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-bold text-(--text)';
	const pillAccent = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-bold text-(--accent)';
	const badge = (icon: React.ReactNode, text: React.ReactNode, accent = false) => (
		<span className={accent ? pillAccent : pillBase}>
			{icon}
			{text}
		</span>
	);

	const renderMetricBadges = (entry: any) => (
		<div className="flex flex-wrap items-center gap-2">
			{activeTab === 'bots' && (
				<>
					{badge(<Server size={13} className="text-(--accent)" />, (entry.guildCount || 0).toLocaleString())}
					{badge(<Users size={13} className="text-(--accent)" />, (entry.userCount || 0).toLocaleString())}
					{badge(<ChevronUp size={14} />, `${(entry.voteCount || 0).toLocaleString()} ${t('app.leaderboard.metrics.votes')}`, true)}
				</>
			)}
			{activeTab === 'servers' && (
				<>
					{badge(<Users size={13} className="text-(--accent)" />, (entry.memberCount || 0).toLocaleString())}
					{badge(<ChevronUp size={14} />, `${(entry.voteCount || 0).toLocaleString()} ${t('app.leaderboard.metrics.votes')}`, true)}
				</>
			)}
			{activeTab === 'streaks' && (
				<>
					{badge(<Flame size={13} />, t('app.users.profile.days', { count: entry.streak || 0 }), true)}
					{badge(<Coins size={13} className="text-(--accent)" />, (entry.balance || 0).toLocaleString())}
				</>
			)}
			{activeTab === 'levels' && (
				<>
					{badge(<Sparkles size={13} />, `Lv. ${(entry.level || 0).toLocaleString()}`, true)}
					{badge(null, `${(entry.xp || 0).toLocaleString()} ${t('app.leaderboard.metrics.xp')}`)}
					{typeof entry.messages === 'number' && badge(<MessageSquare size={12} className="text-(--accent)" />, entry.messages.toLocaleString())}
					{typeof entry.timeSpent === 'number' && entry.timeSpent > 0 && badge(<Headphones size={12} className="text-(--accent)" />, `${Math.max(1, Math.round(entry.timeSpent / 60))}m`)}
				</>
			)}
		</div>
	);

	const wrapEntry = (
		entry: any,
		display: { name: string; avatarUrl: string | null; bannerUrl: string | null },
		wrapperClass: string,
		innerClass: string,
		innerStyle: any,
		content: React.ReactNode
	) =>
		activeTab === 'streaks' || activeTab === 'levels' ? (
			<UserProfilePopover key={entry.id} userId={String(entry.id)} initialUser={{ id: String(entry.id), ...display }} className={wrapperClass}>
				<div className={innerClass} style={innerStyle}>
					{content}
				</div>
			</UserProfilePopover>
		) : (
			<Link key={entry.id} href={getHref(entry)} className={innerClass} style={innerStyle}>
				{content}
			</Link>
		);

	const showPodium = !searchQuery.trim() && processedList.length > 0;
	const podiumEntries = showPodium ? processedList.slice(0, 3) : [];
	const listEntries = showPodium ? processedList.slice(3) : processedList;

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
					{podiumEntries.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-3 items-end pt-4 pb-2" style={{ gap: 'var(--ui-gap)' }}>
							{podiumEntries.map((entry: any, index: number) => {
								const { name, handle, avatarUrl, bannerUrl } = resolveEntryDisplay(entry);
								const RankIcon = index === 0 ? Crown : index === 1 ? Medal : Award;
								const isFirst = index === 0;
								const pStyle = PODIUM_STYLES[index] || PODIUM_STYLES[2];
								const orderAndElevation = `${pStyle.order} ${isFirst && podiumEntries.length === 1 ? 'md:col-start-2' : ''}`;

								const cardContent = (
									<>
										<div className={`${isFirst ? 'h-36' : 'h-28'} w-full relative bg-gradient-to-br ${pStyle.banner} overflow-hidden shrink-0`}>
											{bannerUrl && <Image src={bannerUrl} alt={name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />}
											<div className="absolute inset-0 bg-gradient-to-t from-(--foreground) via-transparent to-black/25" />
											<div className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${pStyle.badge}`}>
												<RankIcon size={14} />
												<span>#{index + 1}</span>
											</div>
										</div>

										<div className="flex flex-col items-center text-center px-6 pb-5 -mt-11 relative z-10 flex-1">
											<div
												className={`${pStyle.ring} rounded-2xl border-4 border-(--foreground) bg-(--background) overflow-hidden shadow-xl flex items-center justify-center shrink-0`}
											>
												{avatarUrl ? (
													<Image src={avatarUrl} alt={name} width={isFirst ? 96 : 80} height={isFirst ? 96 : 80} unoptimized className="h-full w-full object-cover" />
												) : (
													<span className="text-2xl font-bold text-(--text-muted)">{name.charAt(0).toUpperCase()}</span>
												)}
											</div>

											<div className="mt-3 flex flex-col items-center flex-1 w-full">
												<div className="flex items-center justify-center gap-1.5 max-w-full">
													<h2
														className={`${isFirst ? 'text-xl' : 'text-lg'} font-extrabold text-(--text) group-hover:text-(--accent) transition-colors truncate`}
														style={{ fontFamily: 'var(--font-fredoka)' }}
													>
														{name}
													</h2>
													{entry.verified && <ShieldCheck size={16} className="text-(--accent-green) shrink-0" />}
												</div>
												{handle && <span className="text-xs font-mono text-(--text-muted)">{handle}</span>}
												<p className="text-xs text-(--text-muted) mt-2 line-clamp-2 leading-relaxed flex-1">{entry.description || t('common.noDescription')}</p>
												<div className="mt-4 pt-3 border-t border-(--border)/10 w-full flex justify-center">{renderMetricBadges(entry)}</div>
											</div>
										</div>

										<div className={`flex items-center justify-center gap-1.5 bg-gradient-to-t text-xs font-black tracking-widest uppercase ${pStyle.pedestal}`}>
											<RankIcon size={13} />
											<span>#{index + 1}</span>
										</div>
									</>
								);

								const cardClass = `group relative flex flex-col rounded-3xl border bg-(--foreground)/35 backdrop-blur-md overflow-hidden transition-all duration-300 hover:-translate-y-1.5 w-full ${orderAndElevation} ${pStyle.border}`;
								return wrapEntry(entry, { name, avatarUrl, bannerUrl }, `w-full ${orderAndElevation}`, cardClass, undefined, cardContent);
							})}
						</div>
					)}

					{listEntries.length > 0 && (
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
							{listEntries.map((entry: any, idx: number) => {
								const rank = showPodium ? idx + 4 : idx + 1;
								const { name, handle, avatarUrl, bannerUrl } = resolveEntryDisplay(entry);
								const rowClass =
									'group relative flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md hover:border-(--accent)/40 hover:bg-(--foreground)/50 overflow-hidden transition-all shadow-sm w-full';
								const rowInner = (
									<>
										{bannerUrl && (
											<div
												className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
												style={{ backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
											/>
										)}
										<div className="flex items-center gap-4 min-w-0 relative z-10">
											<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-(--border)/15 bg-(--background)/80 text-sm font-black text-(--text-muted) group-hover:text-(--accent) group-hover:border-(--accent)/30 transition-colors shrink-0">
												#{rank}
											</div>
											{avatarUrl ? (
												<Image
													src={avatarUrl}
													alt={name}
													width={48}
													height={48}
													unoptimized
													className="h-12 w-12 rounded-2xl border border-(--border)/15 object-cover shrink-0"
												/>
											) : (
												<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--background) border border-(--border)/15 text-sm font-bold text-(--text-muted) shrink-0">
													{name.charAt(0).toUpperCase()}
												</div>
											)}
											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<h2 className="text-base font-bold text-(--text) group-hover:text-(--accent) transition-colors truncate">{name}</h2>
													{handle && <span className="text-xs font-mono text-(--text-muted) hidden sm:inline">{handle}</span>}
													{entry.verified && <ShieldCheck size={15} className="text-(--accent-green) shrink-0" />}
												</div>
												{entry.description && <p className="text-xs text-(--text-muted) truncate max-w-lg mt-0.5">{entry.description}</p>}
											</div>
										</div>
										<div className="relative z-10 shrink-0">{renderMetricBadges(entry)}</div>
									</>
								);

								return wrapEntry(entry, { name, avatarUrl, bannerUrl }, 'w-full', rowClass, { padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }, rowInner);
							})}
						</div>
					)}
				</div>
			)}

			<AppSeoSection page="leaderboard" />
		</div>
	);
}
