/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Award, Crown, Headphones, Lock, Medal, MessageSquare, Sparkles, Trophy } from 'lucide-react';
import { UserProfilePopover } from '@xernerx/components';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Input } from '@xernerx/ui';

export interface LeaderboardEntry {
	id?: string;
	userId?: string;
	ownerId?: string;
	username?: string;
	global_name?: string;
	name?: string;
	avatar?: string | null;
	avatarUrl?: string | null;
	level?: number;
	xp?: number;
	nextLevelXp?: number;
	progress?: number;
	progressPercent?: number;
	voiceMinutes?: number;
	messages?: number;
	isPrivate?: boolean;
	user?: {
		id?: string;
		username?: string;
		global_name?: string;
		avatar?: string | null;
		avatarUrl?: string | null;
		discriminator?: string;
	} | null;
}

interface ServerLeaderboardProps {
	server: any;
	id: string;
}

export function ServerLeaderboard({ id }: ServerLeaderboardProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();

	const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [leaderboard, setLeaderboard] = useState<{ text: LeaderboardEntry[]; voice: LeaderboardEntry[] }>({
		text: [],
		voice: [],
	});
	const [discordMap, setDiscordMap] = useState<Record<string, any>>({});

	useEffect(() => {
		if (!isReady || !id) return;
		let cancelled = false;
		setLoading(true);

		const fetchLeaderboard = async () => {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/leaderboard`), {
					credentials: 'include',
				});
				if (!res.ok || cancelled) return;
				const data = await res.json();
				const textList = Array.isArray(data?.text) ? data.text : Array.isArray(data) ? data : [];
				const voiceList = Array.isArray(data?.voice) ? data.voice : [];

				if (cancelled) return;
				setLeaderboard({ text: textList, voice: voiceList });

				const idsToFetch = new Set<string>();
				for (const item of [...textList, ...voiceList]) {
					const uid = String(item?.userId || item?.ownerId || item?.id || '');
					if (uid && !item?.isPrivate && !item?.user?.username && !item?.username && !item?.global_name) {
						idsToFetch.add(uid);
					}
				}

				if (idsToFetch.size > 0) {
					const results = await Promise.all(
						Array.from(idsToFetch).map(async (uid) => {
							try {
								const dRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${encodeURIComponent(uid)}/discord`));
								if (dRes.ok) {
									return [uid, await dRes.json()] as const;
								}
							} catch {
								// Ignore lookup failure
							}
							return null;
						})
					);
					if (!cancelled) {
						const nextMap: Record<string, any> = {};
						for (const pair of results) {
							if (pair) nextMap[pair[0]] = pair[1];
						}
						setDiscordMap(nextMap);
					}
				}
			} catch (err) {
				console.error('Failed to fetch guild leaderboard:', err);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		fetchLeaderboard();
		return () => {
			cancelled = true;
		};
	}, [id, getEnvUrl, isReady]);

	const resolveMemberDisplay = (entry: LeaderboardEntry) => {
		const uid = String(entry.userId || entry.ownerId || entry.id || '');
		if (entry.isPrivate) {
			return {
				uid,
				displayName: t('app.servers.leaderboard.privateMember'),
				handle: null,
				avatarUrl: null,
			};
		}

		const discord = discordMap[uid] || entry.user || {};
		const displayName = discord.global_name || entry.global_name || discord.username || entry.username || entry.name || (uid ? `User ${uid.slice(0, 6)}` : t('common.unknownUser'));
		const username = discord.username || entry.username;
		const handle = username && username !== displayName ? `@${username}` : null;

		const rawAvatar = entry.avatarUrl || discord.avatarUrl || entry.avatar || discord.avatar;
		const avatarUrl = rawAvatar ? (String(rawAvatar).startsWith('http') ? String(rawAvatar) : `https://cdn.discordapp.com/avatars/${uid}/${rawAvatar}.png?size=128`) : null;

		return { uid, displayName, handle, avatarUrl };
	};

	const activeEntries = useMemo(() => {
		const list = activeTab === 'text' ? leaderboard.text : leaderboard.voice;
		const q = searchQuery.trim().toLowerCase();
		if (!q) return list;
		return list.filter((entry) => {
			const { uid, displayName, handle } = resolveMemberDisplay(entry);
			return displayName.toLowerCase().includes(q) || (handle && handle.toLowerCase().includes(q)) || uid.toLowerCase().includes(q);
		});
	}, [activeTab, leaderboard, searchQuery, discordMap]);

	const computeProgress = (entry: LeaderboardEntry) => {
		if (typeof entry.progressPercent === 'number') return Math.min(100, Math.max(0, Math.round(entry.progressPercent)));
		if (typeof entry.progress === 'number') {
			return entry.progress <= 1 && entry.progress > 0 ? Math.round(entry.progress * 100) : Math.min(100, Math.max(0, Math.round(entry.progress)));
		}
		const xp = Number(entry.xp || 0);
		const level = Math.max(1, Number(entry.level || 1));
		const nextXp = Number(entry.nextLevelXp || level * 500);
		if (nextXp <= 0) return 0;
		return Math.min(100, Math.max(4, Math.round(((xp % nextXp) / nextXp) * 100)));
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* Top Header & Tab Switcher */}
			<div
				className="flex flex-col lg:flex-row lg:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex items-center gap-3.5">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)] shrink-0">
						<Trophy className="h-6 w-6" />
					</div>
					<div>
						<h2 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('app.servers.leaderboard.title')}
						</h2>
						<p className="text-xs text-(--text-muted)">{t('app.servers.leaderboard.subtitle')}</p>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
					<div className="w-full sm:w-64">
						<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('app.servers.leaderboard.searchPlaceholder')} />
					</div>

					<div className="flex items-center p-1 rounded-2xl bg-(--background)/60 border border-(--border)/10 shrink-0">
						<button
							type="button"
							onClick={() => setActiveTab('text')}
							className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
								activeTab === 'text' ? 'bg-(--accent) text-white shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)]' : 'text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<MessageSquare size={14} />
							<span>{t('app.servers.leaderboard.textTab')}</span>
							<span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'text' ? 'bg-white/20 text-white' : 'bg-(--foreground) text-(--text-muted)'}`}>
								{leaderboard.text.length}
							</span>
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('voice')}
							className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
								activeTab === 'voice' ? 'bg-(--accent) text-white shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)]' : 'text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<Headphones size={14} />
							<span>{t('app.servers.leaderboard.voiceTab')}</span>
							<span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'voice' ? 'bg-white/20 text-white' : 'bg-(--foreground) text-(--text-muted)'}`}>
								{leaderboard.voice.length}
							</span>
						</button>
					</div>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center py-16 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md">
					<Loading variant="small" />
				</div>
			) : activeEntries.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-3xl border border-dashed border-(--border)/15 bg-(--foreground)/30 backdrop-blur-md">
					<Trophy className="h-10 w-10 text-(--text-muted) opacity-40 mb-3" />
					<p className="text-base font-bold text-(--text)">{t('app.servers.leaderboard.emptyTitle')}</p>
					<p className="text-xs text-(--text-muted) mt-1 max-w-md">{t('app.servers.leaderboard.emptyDesc')}</p>
				</div>
			) : (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{activeEntries.map((entry, idx) => {
						const rank = idx + 1;
						const isTopThree = rank <= 3;
						const RankIcon = rank === 1 ? Crown : rank === 2 ? Medal : Award;
						const { uid, displayName, handle, avatarUrl } = resolveMemberDisplay(entry);
						const level = Number(entry.level ?? 1);
						const xp = Number(entry.xp ?? 0);
						const progressPercent = computeProgress(entry);

						const memberInfoNode = (
							<div className={`flex items-center gap-3.5 min-w-0 ${!entry.isPrivate ? 'group/member cursor-pointer' : ''}`}>
								{entry.isPrivate ? (
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--background)/80 border border-(--border)/15 text-(--text-muted) shrink-0">
										<Lock size={18} />
									</div>
								) : avatarUrl ? (
									<Image
										src={avatarUrl}
										alt={displayName}
										width={48}
										height={48}
										unoptimized
										className="h-12 w-12 rounded-2xl object-cover border border-(--border)/15 group-hover/member:ring-2 group-hover/member:ring-(--accent)/50 transition-all shrink-0"
									/>
								) : (
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--accent)/15 border border-(--accent)/30 text-base font-extrabold text-(--accent) shrink-0">
										{displayName.charAt(0).toUpperCase()}
									</div>
								)}
								<div className="flex flex-col min-w-0">
									<div className="flex items-center gap-2">
										<span
											className={`text-base font-extrabold truncate transition-colors ${
												entry.isPrivate ? 'text-(--text-muted) italic' : 'text-(--text) group-hover/member:text-(--accent)'
											}`}
										>
											{displayName}
										</span>
										{handle && <span className="text-xs font-mono text-(--text-muted) hidden sm:inline">{handle}</span>}
										{entry.isPrivate && (
											<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--background)/80 text-(--text-muted) border border-(--border)/10">
												<Lock size={10} />
												{t('app.servers.leaderboard.privateBadge')}
											</span>
										)}
									</div>
									<div className="flex items-center gap-2 mt-1">
										<span className="text-xs text-(--text-muted) font-mono">
											{xp.toLocaleString()} {t('app.servers.leaderboard.xpLabel')}
										</span>
										{activeTab === 'voice' && typeof entry.voiceMinutes === 'number' && (
											<span className="text-xs text-(--text-muted)">• {t('app.servers.leaderboard.voiceMinutes', { count: entry.voiceMinutes })}</span>
										)}
									</div>
								</div>
							</div>
						);

						return (
							<div
								key={uid || idx}
								className={`flex flex-col md:flex-row md:items-center justify-between rounded-3xl border backdrop-blur-md transition-all ${
									rank === 1
										? 'bg-(--foreground)/45 border-amber-400/50 shadow-[0_0_24px_rgba(234,179,8,0.18)]'
										: rank === 2
											? 'bg-(--foreground)/40 border-slate-300/40 shadow-[0_0_18px_rgba(203,213,225,0.12)]'
											: rank === 3
												? 'bg-(--foreground)/40 border-amber-600/40 shadow-[0_0_18px_rgba(217,119,6,0.14)]'
												: 'bg-(--foreground)/30 border-(--border)/10 hover:border-(--accent)/30'
								}`}
								style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
							>
								<div className="flex items-center gap-4 min-w-0 flex-1">
									{/* Rank Badge */}
									<div
										className={`flex h-11 min-w-11 px-2.5 items-center justify-center gap-1 rounded-2xl text-sm font-black shrink-0 ${
											rank === 1
												? 'bg-[color-mix(in_srgb,#eab308_22%,var(--background))] text-amber-400 border border-amber-400/45 shadow-[0_0_16px_rgba(234,179,8,0.3)]'
												: rank === 2
													? 'bg-[color-mix(in_srgb,#cbd5e1_20%,var(--background))] text-slate-300 border border-slate-300/40'
													: rank === 3
														? 'bg-[color-mix(in_srgb,#d97706_22%,var(--background))] text-amber-500 border border-amber-600/40'
														: 'bg-(--background)/70 text-(--text-muted) border border-(--border)/10'
										}`}
									>
										{isTopThree && <RankIcon size={14} />}
										<span>#{rank}</span>
									</div>

									{/* User Profile Popover (unless private) */}
									{entry.isPrivate || !uid ? (
										memberInfoNode
									) : (
										<UserProfilePopover userId={uid} initialUser={{ id: uid, name: displayName, avatarUrl }}>
											{memberInfoNode}
										</UserProfilePopover>
									)}
								</div>

								{/* Level Pill, XP & Progress Bar */}
								<div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto md:min-w-[320px]">
									<div className="flex-1 flex flex-col gap-1.5 bg-(--background)/50 border border-(--border)/10 rounded-2xl px-4 py-2.5">
										<div className="flex items-center justify-between text-xs">
											<span className="font-bold text-(--text-muted)">{t('app.servers.leaderboard.levelProgress')}</span>
											<span className="font-mono font-extrabold text-(--accent)">{progressPercent}%</span>
										</div>
										<div className="h-2 w-full rounded-full bg-(--foreground)/60 overflow-hidden">
											<div className="h-full rounded-full bg-(--accent) transition-all duration-500 shadow-[0_0_10px_var(--accent)]" style={{ width: `${progressPercent}%` }} />
										</div>
									</div>

									<span className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-extrabold text-(--accent) shrink-0">
										<Sparkles size={13} />
										{t('app.servers.leaderboard.levelPill', { level })}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

export default ServerLeaderboard;
