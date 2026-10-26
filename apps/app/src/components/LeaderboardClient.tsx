/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trophy, Server, Users, Flame, Coins, ShieldCheck, ChevronUp, Lock, ArrowLeft, Bot, Crown, Medal, Award } from 'lucide-react';
import { UserProfilePopover } from '@xernerx/components';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Input, Selector } from '@xernerx/ui';

type LeaderboardTab = 'bots' | 'servers' | 'streaks';

interface DiscordProfile {
	id?: string;
	global_name?: string;
	username?: string;
	avatarUrl?: string | null;
	bannerUrl?: string | null;
}

export default function LeaderboardClient() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { hide } = useSidebar();
	const router = useRouter();

	const [activeTab, setActiveTab] = useState<LeaderboardTab>('bots');
	const [sortBy, setSortBy] = useState<string>('votes');
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [discordMap, setDiscordMap] = useState<Record<string, DiscordProfile>>({});
	const [data, setData] = useState<{ bots: any[]; servers: any[]; streaks: any[] }>({ bots: [], servers: [], streaks: [] });

	useEffect(() => {
		hide();
	}, [hide]);

	// Initialize tab and sort metric from URL query parameters on mount
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const tabParam = params.get('tab') as LeaderboardTab | null;
		const sortParam = params.get('sort');
		if (tabParam && ['bots', 'servers', 'streaks'].includes(tabParam)) {
			setActiveTab(tabParam);
			setSortBy(sortParam || (tabParam === 'streaks' ? 'streak' : 'votes'));
		} else if (sortParam) {
			setSortBy(sortParam);
		}
	}, []);

	const handleTabSwitch = (nextTab: LeaderboardTab) => {
		const defaultSort = nextTab === 'streaks' ? 'streak' : 'votes';
		setActiveTab(nextTab);
		setSortBy(defaultSort);
		const params = new URLSearchParams(window.location.search);
		params.set('tab', nextTab);
		params.set('sort', defaultSort);
		router.replace(`/leaderboard?${params.toString()}`, { scroll: false });
	};

	const handleSortChange = (nextSort: string) => {
		setSortBy(nextSort);
		const params = new URLSearchParams(window.location.search);
		params.set('tab', activeTab);
		params.set('sort', nextSort);
		router.replace(`/leaderboard?${params.toString()}`, { scroll: false });
	};

	useEffect(() => {
		if (!isReady) return;
		let cancelled = false;
		setLoading(true);

		fetch(getEnvUrl('https://api.xernerx.com/v1/leaderboard'))
			.then((res) => (res.ok ? res.json() : null))
			.then(async (d) => {
				if (!d || cancelled) return;
				const nextData = {
					bots: Array.isArray(d.bots) ? d.bots : [],
					servers: Array.isArray(d.servers) ? d.servers : [],
					streaks: Array.isArray(d.streaks) ? d.streaks : [],
				};
				setData(nextData);

				// Collect all unique Discord IDs from bots and streaks to load via /core/users/[id]/discord
				const idsToFetch = new Set<string>();
				for (const b of nextData.bots) if (b?.id) idsToFetch.add(String(b.id));
				for (const s of nextData.streaks) if (s?.id) idsToFetch.add(String(s.id));

				const entries = await Promise.all(
					Array.from(idsToFetch).map(async (id) => {
						try {
							const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${encodeURIComponent(id)}/discord`));
							if (res.ok) {
								const profile = await res.json();
								return [id, profile] as const;
							}
						} catch {
							// Ignore individual Discord lookup failure
						}
						return null;
					})
				);

				if (cancelled) return;
				const nextMap: Record<string, DiscordProfile> = {};
				for (const item of entries) {
					if (item) nextMap[item[0]] = item[1];
				}
				setDiscordMap(nextMap);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isReady, getEnvUrl]);

	const tabs: Array<{ id: LeaderboardTab; label: string; icon: any; count: number }> = [
		{ id: 'bots', label: t('app.leaderboard.tabs.bots'), icon: Bot, count: data.bots.length },
		{ id: 'servers', label: t('app.leaderboard.tabs.servers'), icon: Server, count: data.servers.length },
		{ id: 'streaks', label: t('app.leaderboard.tabs.streaks'), icon: Flame, count: data.streaks.length },
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
		return [
			{ id: 'streak', label: t('app.leaderboard.metrics.streak') },
			{ id: 'balance', label: t('app.leaderboard.metrics.credits') },
		];
	}, [activeTab, t]);

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
		const bannerUrl = discord?.bannerUrl || null;
		return { name, handle, avatarUrl, bannerUrl };
	};

	const processedList = useMemo(() => {
		const raw = [...(data[activeTab] || [])];
		const q = searchQuery.trim().toLowerCase();

		const filtered = q
			? raw.filter((entry) => {
					const { name, handle } = resolveEntryDisplay(entry);
					return (
						name.toLowerCase().includes(q) ||
						(handle && handle.toLowerCase().includes(q)) ||
						String(entry.id).toLowerCase().includes(q) ||
						(entry.description && String(entry.description).toLowerCase().includes(q))
					);
				})
			: raw;

		filtered.sort((a, b) => {
			if (activeTab === 'bots') {
				if (sortBy === 'servers') return (b.guildCount || 0) - (a.guildCount || 0) || (b.voteCount || 0) - (a.voteCount || 0);
				if (sortBy === 'users') return (b.userCount || 0) - (a.userCount || 0) || (b.voteCount || 0) - (a.voteCount || 0);
				return (b.voteCount || 0) - (a.voteCount || 0) || (b.guildCount || 0) - (a.guildCount || 0);
			}
			if (activeTab === 'servers') {
				if (sortBy === 'members') return (b.memberCount || 0) - (a.memberCount || 0) || (b.voteCount || 0) - (a.voteCount || 0);
				return (b.voteCount || 0) - (a.voteCount || 0) || (b.memberCount || 0) - (a.memberCount || 0);
			}
			if (sortBy === 'balance') return (b.balance || 0) - (a.balance || 0) || (b.streak || 0) - (a.streak || 0);
			return (b.streak || 0) - (a.streak || 0) || (b.balance || 0) - (a.balance || 0);
		});

		return filtered;
	}, [data, activeTab, searchQuery, sortBy, discordMap]);

	const getHref = (entry: any) => (activeTab === 'bots' ? `/bots/${entry.id}` : activeTab === 'servers' ? `/servers/${entry.id}` : `/users/${entry.id}`);

	const renderMetricBadges = (entry: any) => (
		<div className="flex flex-wrap items-center gap-2">
			{activeTab === 'bots' && (
				<>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-bold text-(--text)">
						<Server size={13} className="text-(--accent)" />
						{(entry.guildCount || 0).toLocaleString()}
					</span>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-bold text-(--text)">
						<Users size={13} className="text-(--accent)" />
						{(entry.userCount || 0).toLocaleString()}
					</span>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-bold text-(--accent)">
						<ChevronUp size={14} />
						{(entry.voteCount || 0).toLocaleString()} {t('app.leaderboard.metrics.votes')}
					</span>
				</>
			)}

			{activeTab === 'servers' && (
				<>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-bold text-(--text)">
						<Users size={13} className="text-(--accent)" />
						{(entry.memberCount || 0).toLocaleString()}
					</span>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-bold text-(--accent)">
						<ChevronUp size={14} />
						{(entry.voteCount || 0).toLocaleString()} {t('app.leaderboard.metrics.votes')}
					</span>
				</>
			)}

			{activeTab === 'streaks' && (
				<>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-bold text-(--accent)">
						<Flame size={13} />
						{t('app.users.profile.days', { count: entry.streak || 0 })}
					</span>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-bold text-(--text)">
						<Coins size={13} className="text-(--accent)" />
						{(entry.balance || 0).toLocaleString()}
					</span>
				</>
			)}
		</div>
	);

	const showPodium = !searchQuery.trim() && processedList.length > 0;
	const podiumEntries = showPodium ? processedList.slice(0, 3) : [];
	const listEntries = showPodium ? processedList.slice(3) : processedList;

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full py-10 px-4" style={{ gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}>
			{/* Header */}
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

			{/* Unified Control Bar (Category Switcher + Search + Sort Selector) */}
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
					{/* Top 3 Podium Showcase (2 - 1 - 3 Olympic Podium Layout on Desktop) */}
					{podiumEntries.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-3 items-end pt-4 pb-2" style={{ gap: 'var(--ui-gap)' }}>
							{podiumEntries.map((entry: any, index: number) => {
								const { name, handle, avatarUrl, bannerUrl } = resolveEntryDisplay(entry);
								const RankIcon = index === 0 ? Crown : index === 1 ? Medal : Award;
								const isFirst = index === 0;
								const isSecond = index === 1;

								const orderAndElevation = isFirst
									? `order-1 md:order-2 md:mb-6 ${podiumEntries.length === 1 ? 'md:col-start-2' : ''}`
									: isSecond
										? 'order-2 md:order-1 md:mb-2'
										: 'order-3 md:order-3';

								const borderAccent = isFirst
									? 'border-(--accent)/60 hover:border-(--accent) shadow-[0_10px_40px_color-mix(in_srgb,var(--accent)_22%,transparent)] ring-1 ring-(--accent)/30'
									: isSecond
										? 'border-(--accent)/35 hover:border-(--accent)/65 shadow-[0_6px_28px_color-mix(in_srgb,var(--accent)_14%,transparent)] ring-1 ring-(--accent)/20'
										: 'border-(--border)/25 hover:border-(--accent)/50 shadow-sm ring-1 ring-(--border)/15';

								const badgeTone = isFirst
									? 'bg-(--accent)/20 text-(--accent) border border-(--accent)/45 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_35%,transparent)] backdrop-blur-md'
									: isSecond
										? 'bg-(--accent)/15 text-(--accent) border border-(--accent)/30 backdrop-blur-md'
										: 'bg-(--background)/80 text-(--text) border border-(--border)/20 backdrop-blur-md';

								const bannerGradient = isFirst
									? 'from-(--accent)/30 via-(--foreground) to-(--background)'
									: isSecond
										? 'from-(--accent)/20 via-(--foreground) to-(--background)'
										: 'from-(--accent)/12 via-(--foreground) to-(--background)';

								const avatarRing = isFirst ? 'h-24 w-24 ring-2 ring-(--accent)/60' : isSecond ? 'h-20 w-20 ring-2 ring-(--accent)/35' : 'h-20 w-20 ring-2 ring-(--border)/30';

								const pedestalTone = isFirst
									? 'from-(--accent)/25 via-(--accent)/10 to-transparent border-t border-(--accent)/35 text-(--accent)'
									: isSecond
										? 'from-(--accent)/15 via-(--accent)/5 to-transparent border-t border-(--accent)/25 text-(--accent)'
										: 'from-(--foreground)/60 via-(--foreground)/20 to-transparent border-t border-(--border)/20 text-(--text-muted)';

								const cardContent = (
									<>
										{/* Banner */}
										<div className={`${isFirst ? 'h-36' : 'h-28'} w-full relative bg-gradient-to-br ${bannerGradient} overflow-hidden shrink-0`}>
											{bannerUrl && <Image src={bannerUrl} alt={name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />}
											<div className="absolute inset-0 bg-gradient-to-t from-(--foreground) via-transparent to-black/25" />
											<div className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${badgeTone}`}>
												<RankIcon size={14} />
												<span>#{index + 1}</span>
											</div>
										</div>

										{/* Body */}
										<div className="flex flex-col items-center text-center px-6 pb-5 -mt-11 relative z-10 flex-1">
											<div
												className={`${avatarRing} rounded-2xl border-4 border-(--foreground) bg-(--background) overflow-hidden shadow-xl flex items-center justify-center shrink-0`}
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

										{/* Podium Step Base */}
										<div
											className={`flex items-center justify-center gap-1.5 bg-gradient-to-t ${isFirst ? 'py-2.5' : isSecond ? 'py-2' : 'py-1.5'} text-xs font-black tracking-widest uppercase ${pedestalTone}`}
										>
											<RankIcon size={13} />
											<span>#{index + 1}</span>
										</div>
									</>
								);

								const cardClass = `group relative flex flex-col rounded-3xl border bg-(--foreground)/35 backdrop-blur-md overflow-hidden transition-all duration-300 hover:-translate-y-1.5 w-full ${orderAndElevation} ${borderAccent}`;

								return activeTab === 'streaks' ? (
									<UserProfilePopover
										key={entry.id}
										userId={String(entry.id)}
										initialUser={{ id: String(entry.id), name, avatarUrl, bannerUrl }}
										className={`w-full ${orderAndElevation}`}
									>
										<div className={cardClass}>{cardContent}</div>
									</UserProfilePopover>
								) : (
									<Link key={entry.id} href={getHref(entry)} className={cardClass}>
										{cardContent}
									</Link>
								);
							})}
						</div>
					)}

					{/* Ranked Rows (#4+ or Search Results) */}
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

								return activeTab === 'streaks' ? (
									<UserProfilePopover key={entry.id} userId={String(entry.id)} initialUser={{ id: String(entry.id), name, avatarUrl, bannerUrl }} className="w-full">
										<div className={rowClass} style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
											{rowInner}
										</div>
									</UserProfilePopover>
								) : (
									<Link key={entry.id} href={getHref(entry)} className={rowClass} style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
										{rowInner}
									</Link>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
