/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Server, Users, Flame, Coins, ShieldCheck, ChevronUp, Lock, ArrowLeft, Bot, Crown, Medal, Award, ArrowUpDown } from 'lucide-react';
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

	const [activeTab, setActiveTab] = useState<LeaderboardTab>('bots');
	const [sortBy, setSortBy] = useState<string>('votes');
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [discordMap, setDiscordMap] = useState<Record<string, DiscordProfile>>({});
	const [data, setData] = useState<{
		bots: any[];
		servers: any[];
		streaks: any[];
	}>({
		bots: [],
		servers: [],
		streaks: [],
	});

	useEffect(() => {
		hide();
	}, [hide]);

	// Reset default sort metric when switching tabs
	useEffect(() => {
		if (activeTab === 'bots') setSortBy('votes');
		else if (activeTab === 'servers') setSortBy('votes');
		else if (activeTab === 'streaks') setSortBy('streak');
	}, [activeTab]);

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
		if (activeTab === 'bots') {
			return [
				{ id: 'votes', label: t('app.leaderboard.metrics.votes') },
				{ id: 'servers', label: t('app.leaderboard.tabs.servers') },
				{ id: 'users', label: t('app.leaderboard.metrics.users') },
			];
		}
		if (activeTab === 'servers') {
			return [
				{ id: 'votes', label: t('app.leaderboard.metrics.votes') },
				{ id: 'members', label: t('app.leaderboard.metrics.members') },
			];
		}
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
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-(--background)/80 border border-(--border)/10 text-xs font-bold text-(--text)">
						<Server size={13} className="text-(--accent)" />
						{(entry.guildCount || 0).toLocaleString()}
					</span>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-(--background)/80 border border-(--border)/10 text-xs font-bold text-(--text)">
						<Users size={13} className="text-(--accent)" />
						{(entry.userCount || 0).toLocaleString()}
					</span>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-(--accent)/15 border border-(--accent)/30 text-xs font-bold text-(--accent)">
						<ChevronUp size={14} />
						{(entry.voteCount || 0).toLocaleString()} {t('app.leaderboard.metrics.votes')}
					</span>
				</>
			)}

			{activeTab === 'servers' && (
				<>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-(--background)/80 border border-(--border)/10 text-xs font-bold text-(--text)">
						<Users size={13} className="text-(--accent)" />
						{(entry.memberCount || 0).toLocaleString()}
					</span>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-(--accent)/15 border border-(--accent)/30 text-xs font-bold text-(--accent)">
						<ChevronUp size={14} />
						{(entry.voteCount || 0).toLocaleString()} {t('app.leaderboard.metrics.votes')}
					</span>
				</>
			)}

			{activeTab === 'streaks' && (
				<>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/15 border border-orange-500/30 text-xs font-bold text-orange-400">
						<Flame size={13} />
						{t('app.users.profile.days', { count: entry.streak || 0 })}
					</span>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-(--background)/80 border border-(--border)/10 text-xs font-bold text-(--text)">
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
		<div className="flex flex-col max-w-6xl mx-auto w-full py-10 px-4" style={{ gap: 'var(--ui-gap)' }}>
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--text-muted) hover:text-(--text) mb-3 transition-colors">
						<ArrowLeft size={14} />
						{t('app.leaderboard.backToExplore')}
					</Link>
					<h1 className="text-4xl font-extrabold text-(--text) flex items-center gap-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<Trophy className="text-(--accent)" size={34} />
						{t('app.leaderboard.title')}
					</h1>
					<p className="text-sm text-(--text-muted) mt-1">{t('app.leaderboard.description')}</p>
				</div>

				<div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-(--foreground)/40 border border-(--border)/10 text-xs text-(--text-muted)">
					<Lock size={13} className="text-(--accent) shrink-0" />
					<span>{t('app.leaderboard.privacyNotice')}</span>
				</div>
			</div>

			{/* Unified Control Bar (Category Switcher + Search + Sort Selector) */}
			<div className="w-full p-2 rounded-2xl border border-(--border)/10 bg-(--foreground)/40 backdrop-blur-md shadow-lg flex flex-col lg:flex-row items-center gap-2 relative z-30">
				<div className="flex items-center p-1 bg-(--background) rounded-xl border border-(--border)/10 h-12 w-full lg:w-auto shrink-0 shadow-inner">
					{tabs.map((tab) => {
						const IconComp = tab.icon;
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 h-full rounded-lg text-sm font-bold transition-all cursor-pointer ${
									isActive ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)/50'
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
					<Selector
						items={true}
						value={sortBy}
						onChange={setSortBy}
						options={sortOptions.map((opt) => ({
							value: opt.id,
							label: `${t('app.leaderboard.sortBy')}: ${opt.label}`,
						}))}
					/>
				</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-24">
					<Loading />
				</div>
			) : processedList.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 text-center">
					<Trophy size={36} className="text-(--text-muted) mb-3 opacity-50" />
					<p className="text-sm text-(--text-muted)">{t('app.leaderboard.empty')}</p>
				</div>
			) : (
				<div className="flex flex-col gap-6">
					{/* Top 3 Podium Showcase (2 - 1 - 3 Olympic Podium Layout on Desktop) */}
					{podiumEntries.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-3 items-end gap-5 pt-4 pb-2">
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
									? 'border-amber-500/50 hover:border-amber-400 shadow-[0_10px_40px_rgba(245,158,11,0.18)] ring-1 ring-amber-500/20'
									: isSecond
										? 'border-zinc-400/40 hover:border-zinc-300 shadow-[0_6px_25px_rgba(161,161,170,0.1)]'
										: 'border-orange-600/40 hover:border-orange-400 shadow-[0_6px_25px_rgba(234,88,12,0.1)]';

								const badgeTone = isFirst ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)]' : isSecond ? 'bg-zinc-300 text-black' : 'bg-orange-500 text-black';

								const pedestalTone = isFirst
									? 'from-amber-500/25 via-amber-500/10 to-transparent border-t border-amber-500/30 text-amber-400'
									: isSecond
										? 'from-zinc-400/20 via-zinc-400/5 to-transparent border-t border-zinc-400/25 text-zinc-300'
										: 'from-orange-500/20 via-orange-500/5 to-transparent border-t border-orange-500/25 text-orange-400';

								return (
									<Link
										key={entry.id}
										href={getHref(entry)}
										className={`group relative flex flex-col rounded-3xl border bg-(--foreground)/40 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 ${orderAndElevation} ${borderAccent}`}
									>
										{/* Banner */}
										<div
											className={`${isFirst ? 'h-36' : 'h-28'} w-full relative bg-gradient-to-br from-(--border)/60 via-(--foreground) to-(--background) overflow-hidden shrink-0`}
										>
											{bannerUrl && <Image src={bannerUrl} alt={name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />}
											<div className="absolute inset-0 bg-gradient-to-t from-(--foreground) via-transparent to-black/35" />
											<div className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${badgeTone}`}>
												<RankIcon size={14} />
												<span>#{index + 1}</span>
											</div>
										</div>

										{/* Body */}
										<div className="flex flex-col items-center text-center px-6 pb-5 -mt-11 relative z-10 flex-1">
											<div
												className={`${
													isFirst ? 'h-24 w-24 ring-2 ring-amber-500/40' : 'h-20 w-20'
												} rounded-2xl border-4 border-(--foreground) bg-(--background) overflow-hidden shadow-xl flex items-center justify-center shrink-0`}
											>
												{avatarUrl ? (
													<Image src={avatarUrl} alt={name} width={isFirst ? 96 : 80} height={isFirst ? 96 : 80} unoptimized className="h-full w-full object-cover" />
												) : (
													<span className="text-2xl font-bold text-(--text-muted)">{name.charAt(0).toUpperCase()}</span>
												)}
											</div>

											<div className="mt-3 flex flex-col items-center flex-1 w-full">
												<div className="flex items-center justify-center gap-1.5 max-w-full">
													<h3 className={`${isFirst ? 'text-xl' : 'text-lg'} font-extrabold text-(--text) group-hover:text-(--accent) transition-colors truncate`}>{name}</h3>
													{entry.verified && <ShieldCheck size={16} className="text-emerald-400 shrink-0" />}
												</div>
												{handle && <span className="text-xs font-mono text-(--text-muted)">{handle}</span>}
												<p className="text-xs text-(--text-muted) mt-2 line-clamp-2 leading-relaxed flex-1">{entry.description || t('common.noDescription')}</p>
												<div className="mt-4 pt-3 border-t border-(--border)/10 w-full flex justify-center">{renderMetricBadges(entry)}</div>
											</div>
										</div>

										{/* Podium Step Base */}
										<div
											className={`flex items-center justify-center gap-1.5 bg-gradient-to-t ${
												isFirst ? 'py-2.5' : isSecond ? 'py-2' : 'py-1.5'
											} text-xs font-black tracking-widest uppercase ${pedestalTone}`}
										>
											<RankIcon size={13} />
											<span>#{index + 1}</span>
										</div>
									</Link>
								);
							})}
						</div>
					)}

					{/* Ranked Rows (#4+ or Search Results) */}
					{listEntries.length > 0 && (
						<div className="flex flex-col gap-3">
							{listEntries.map((entry: any, idx: number) => {
								const rank = showPodium ? idx + 4 : idx + 1;
								const { name, handle, avatarUrl, bannerUrl } = resolveEntryDisplay(entry);

								return (
									<Link
										key={entry.id}
										href={getHref(entry)}
										className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 hover:border-(--accent)/40 hover:bg-(--foreground)/50 overflow-hidden transition-all"
									>
										{bannerUrl && (
											<div
												className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
												style={{ backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
											/>
										)}
										<div className="flex items-center gap-4 min-w-0 relative z-10">
											<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--border)/15 bg-(--background)/80 text-sm font-black text-(--text-muted) shrink-0">
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
													<h3 className="text-base font-bold text-(--text) group-hover:text-(--accent) transition-colors truncate">{name}</h3>
													{handle && <span className="text-xs font-mono text-(--text-muted) hidden sm:inline">{handle}</span>}
													{entry.verified && <ShieldCheck size={15} className="text-emerald-400 shrink-0" />}
												</div>
												{entry.description && <p className="text-xs text-(--text-muted) truncate max-w-lg mt-0.5">{entry.description}</p>}
											</div>
										</div>

										<div className="relative z-10 shrink-0">{renderMetricBadges(entry)}</div>
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
