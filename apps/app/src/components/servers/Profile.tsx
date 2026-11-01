/** @format */
'use client';

import { useEffect, useState } from 'react';
import { Award, ChevronRight, ChevronUp, Crown, Lock, Medal, MessageSquare, Server, Star, Trophy, Users } from 'lucide-react';
import Image from 'next/image';
import { UserProfilePopover } from '@xernerx/components';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Button, Markdown } from '@xernerx/ui';
import { ServerDiscoveryRow, ServerVitalsSidebar } from './ServerVitalsSidebar';

const PODIUM_BADGE_STYLES = [
	{
		rank: 1,
		icon: Crown,
		cardBorder: 'border-amber-400/40 bg-amber-500/5 hover:border-amber-400/70',
		badge: 'bg-amber-500/20 text-amber-400 border-amber-400/40',
		ring: 'ring-2 ring-amber-400/50',
	},
	{
		rank: 2,
		icon: Medal,
		cardBorder: 'border-slate-300/35 bg-slate-400/5 hover:border-slate-300/65',
		badge: 'bg-slate-400/20 text-slate-300 border-slate-300/40',
		ring: 'ring-2 ring-slate-300/40',
	},
	{
		rank: 3,
		icon: Award,
		cardBorder: 'border-amber-600/35 bg-amber-700/5 hover:border-amber-600/65',
		badge: 'bg-amber-600/20 text-amber-500 border-amber-600/40',
		ring: 'ring-2 ring-amber-600/40',
	},
] as const;

export function ServerProfile({ server, organizationData }: { server: any; organizationData: any }) {
	const { t } = useDictionary();
	const { setView } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();

	const [topMembers, setTopMembers] = useState<any[]>([]);
	const [reviews, setReviews] = useState<any[]>([]);
	const [similarServers, setSimilarServers] = useState<any[]>([]);
	const [discordMap, setDiscordMap] = useState<Record<string, any>>({});

	const serverId = String(server?.id || '');
	const latestStat = Array.isArray(server?.stats) && server.stats.length > 0 ? server.stats[server.stats.length - 1] : null;
	const memberCount = Number(latestStat?.members ?? server?.memberCount ?? 0);
	const messageCount = Number(latestStat?.messages ?? 0);
	const voteCount = Number(server?.voteCount ?? 0);

	const reviewCount = reviews.length;
	const avgRating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviewCount : 0;
	const recentReviews = [...reviews].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 2);

	useEffect(() => {
		if (!isReady || !serverId) return;
		let cancelled = false;

		const fetchOverviewWidgets = async () => {
			try {
				const [lbRes, revRes, guildsRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${encodeURIComponent(serverId)}/leaderboard`), { credentials: 'include' }).catch(() => null),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${encodeURIComponent(serverId)}/reviews`), { credentials: 'include' }).catch(() => null),
					fetch(getEnvUrl('https://api.xernerx.com/secure/guilds?limit=8')).catch(() => null),
				]);

				let lbList: any[] = [];
				if (lbRes && lbRes.ok) {
					const lbData = await lbRes.json().catch(() => null);
					lbList = Array.isArray(lbData?.levels) && lbData.levels.length > 0 ? lbData.levels : Array.isArray(lbData?.text) ? lbData.text : Array.isArray(lbData) ? lbData : [];
				}
				if (lbList.length === 0) {
					const fallbackLb = await fetch(getEnvUrl(`https://api.xernerx.com/v1/leaderboard?guild=${encodeURIComponent(serverId)}`)).catch(() => null);
					if (fallbackLb && fallbackLb.ok) {
						const fbData = await fallbackLb.json().catch(() => null);
						lbList = Array.isArray(fbData?.guildLevels?.server) ? fbData.guildLevels.server : Array.isArray(fbData?.guildLevels?.text) ? fbData.guildLevels.text : [];
					}
				}

				const top3 = lbList.slice(0, 3);
				let revList: any[] = [];
				if (revRes && revRes.ok) {
					const revData = await revRes.json().catch(() => null);
					revList = Array.isArray(revData) ? revData : Array.isArray(revData?.reviews) ? revData.reviews : [];
				}

				let otherGuilds: any[] = [];
				if (guildsRes && guildsRes.ok) {
					const gData = await guildsRes.json().catch(() => []);
					if (Array.isArray(gData)) {
						otherGuilds = gData.filter((g: any) => g && String(g.id) !== serverId && g.privacy !== 'private' && g.privacy !== 'limited').slice(0, 3);
					}
				}

				if (cancelled) return;
				setTopMembers(top3);
				setReviews(revList);
				setSimilarServers(otherGuilds);

				const userIdsToResolve = new Set<string>();
				for (const item of top3) {
					const uid = String(item?.userId || item?.ownerId || item?.id || '');
					if (uid && !item?.isPrivate && !item?.user?.username && !item?.username) {
						userIdsToResolve.add(uid);
					}
				}
				for (const rev of revList.slice(0, 3)) {
					const uid = String(rev?.userId || '');
					if (uid && !rev?.user?.username) {
						userIdsToResolve.add(uid);
					}
				}

				if (userIdsToResolve.size > 0) {
					const resolvedEntries = await Promise.all(
						Array.from(userIdsToResolve).map(async (uid) => {
							try {
								const dRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${encodeURIComponent(uid)}/discord`));
								if (dRes.ok) return [uid, await dRes.json()] as const;
							} catch {}
							return null;
						})
					);
					if (!cancelled) {
						const nextMap: Record<string, any> = {};
						for (const pair of resolvedEntries) {
							if (pair) nextMap[pair[0]] = pair[1];
						}
						setDiscordMap((prev) => ({ ...prev, ...nextMap }));
					}
				}
			} catch {}
		};

		fetchOverviewWidgets();
		return () => {
			cancelled = true;
		};
	}, [isReady, serverId, getEnvUrl]);

	const kpiCards = [
		{
			id: 'members',
			label: t('app.servers.overview.kpiMembers'),
			value: memberCount.toLocaleString(),
			sub: t('app.servers.overview.kpiMembersSub'),
			icon: Users,
			targetView: 'statistics',
		},
		{
			id: 'messages',
			label: t('app.servers.overview.kpiMessages'),
			value: messageCount.toLocaleString(),
			sub: t('app.servers.overview.kpiMessagesSub'),
			icon: MessageSquare,
			targetView: 'statistics',
		},
		{
			id: 'votes',
			label: t('app.servers.overview.kpiVotes'),
			value: voteCount.toLocaleString(),
			sub: t('app.servers.overview.kpiVotesSub'),
			icon: ChevronUp,
			targetView: 'statistics',
		},
		{
			id: 'rating',
			label: t('app.servers.overview.kpiRating'),
			value: reviewCount > 0 ? `${avgRating.toFixed(1)} ★` : '—',
			sub: reviewCount > 0 ? t('app.servers.overview.reviewsCount', { count: reviewCount }) : t('app.servers.overview.noRatingsYet'),
			icon: Star,
			targetView: 'reviews',
		},
	];

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* Top At-a-Glance KPI Strip */}
			<div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
				{kpiCards.map((card) => {
					const Icon = card.icon;
					return (
						<button
							key={card.id}
							type="button"
							onClick={() => setView(card.targetView)}
							className="flex flex-col justify-between text-left rounded-3xl bg-(--foreground)/30 hover:bg-(--foreground)/45 border border-(--border)/10 hover:border-(--accent)/35 backdrop-blur-md transition-all cursor-pointer group shadow-sm"
							style={{ padding: 'var(--ui-gap)' }}
						>
							<div className="flex items-center justify-between gap-2 mb-3">
								<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) group-hover:text-(--text) transition-colors truncate">{card.label}</span>
								<div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
									<Icon className="w-4 h-4" />
								</div>
							</div>
							<div>
								<div className="text-2xl font-extrabold text-(--text) font-mono tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{card.value}
								</div>
								<div className="text-[11px] font-semibold text-(--text-muted) mt-0.5 flex items-center justify-between">
									<span className="truncate">{card.sub}</span>
									<ChevronRight className="w-3.5 h-3.5 text-(--accent) opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
								</div>
							</div>
						</button>
					);
				})}
			</div>

			{/* 2-Column Main Bento Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 items-start" style={{ gap: 'var(--ui-gap)' }}>
				{/* Left Column: About + Top 3 Leaderboard Podium + Recent Reviews */}
				<div className="lg:col-span-2 flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					{/* 1. About Server Card */}
					<div
						className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
						style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
					>
						<div className="flex items-center justify-between pb-3 border-b border-(--border)/10">
							<h2 className="text-xl font-extrabold text-(--text) flex items-center gap-2.5" style={{ fontFamily: 'var(--font-fredoka)' }}>
								<Server className="w-5 h-5 text-(--accent)" />
								{t('app.servers.about', { name: server.name })}
							</h2>
						</div>
						<Markdown className="flex-1" emptyText={t('app.servers.noDetailedDesc')}>
							{server.info ? String(server.info) : ''}
						</Markdown>
					</div>

					{/* 2. Top 3 Active Members Podium Preview */}
					{topMembers.length > 0 && (
						<div
							className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
							style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
						>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
										<Trophy className="w-5 h-5" />
									</div>
									<div>
										<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{t('app.servers.overview.podiumTitle')}
										</h3>
										<p className="text-xs text-(--text-muted)">{t('app.servers.overview.podiumSubtitle')}</p>
									</div>
								</div>
								<Button variant="outline" onClick={() => setView('leaderboard')} className="text-xs">
									{t('app.servers.overview.viewFullLeaderboard')}
									<ChevronRight className="w-3.5 h-3.5 ml-1" />
								</Button>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								{topMembers.map((member, idx) => {
									const style = PODIUM_BADGE_STYLES[idx] || PODIUM_BADGE_STYLES[2];
									const RankIcon = style.icon;
									const uid = String(member?.userId || member?.ownerId || member?.id || '');
									const resolvedDiscord = member?.user || discordMap[uid] || {};
									const isPrivate = Boolean(member?.isPrivate);
									const displayName = isPrivate
										? t('app.servers.leaderboard.privateMember')
										: resolvedDiscord?.global_name || resolvedDiscord?.username || member?.global_name || member?.username || member?.name || uid;
									const avatarUrl = isPrivate
										? null
										: resolvedDiscord?.avatarUrl ||
											member?.avatarUrl ||
											(resolvedDiscord?.avatar && uid ? `https://cdn.discordapp.com/avatars/${uid}/${resolvedDiscord.avatar}.png?size=128` : null);
									const level = Number(member?.level ?? 1);
									const xp = Number(member?.xp ?? 0);

									const cardContent = (
										<div className={`flex flex-col justify-between gap-3 p-4 rounded-2xl border transition-all ${style.cardBorder}`}>
											<div className="flex items-center justify-between gap-2">
												<span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${style.badge}`}>
													<RankIcon className="w-3.5 h-3.5" /> #{style.rank}
												</span>
												<span className="px-2 py-0.5 rounded-full bg-(--background)/70 border border-(--border)/10 text-[11px] font-mono font-bold text-(--accent)">
													{t('app.servers.leaderboard.levelPill', { level })}
												</span>
											</div>
											<div className="flex items-center gap-3 min-w-0">
												{avatarUrl ? (
													<Image
														src={avatarUrl}
														alt={displayName}
														width={40}
														height={40}
														unoptimized
														className={`w-10 h-10 rounded-full object-cover shrink-0 ${style.ring}`}
													/>
												) : (
													<div className={`w-10 h-10 rounded-full bg-(--background) flex items-center justify-center text-(--text-muted) shrink-0 ${style.ring}`}>
														{isPrivate ? <Lock className="w-4 h-4" /> : <Users className="w-4 h-4" />}
													</div>
												)}
												<div className="min-w-0 flex-1">
													<div className="text-sm font-bold text-(--text) truncate">{displayName}</div>
													<div className="text-xs font-mono text-(--text-muted)">
														{xp.toLocaleString()} {t('app.servers.leaderboard.xpLabel')}
													</div>
												</div>
											</div>
										</div>
									);

									return isPrivate || !uid ? (
										<div key={uid || idx}>{cardContent}</div>
									) : (
										<UserProfilePopover key={uid} userId={uid} initialUser={resolvedDiscord} className="w-full">
											{cardContent}
										</UserProfilePopover>
									);
								})}
							</div>
						</div>
					)}

					{/* 3. Recent Community Reviews Preview */}
					<div
						className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
						style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
					>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
									<Star className="w-5 h-5" />
								</div>
								<div>
									<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
										{t('app.servers.overview.recentReviewsTitle')}
									</h3>
									<p className="text-xs text-(--text-muted)">{t('app.servers.overview.recentReviewsSubtitle')}</p>
								</div>
							</div>
							<Button variant="outline" onClick={() => setView('reviews')} className="text-xs">
								{reviewCount > 0 ? t('app.servers.overview.viewAllReviews', { count: reviewCount }) : t('app.servers.overview.writeFirstReview')}
								<ChevronRight className="w-3.5 h-3.5 ml-1" />
							</Button>
						</div>

						{recentReviews.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{recentReviews.map((rev, idx) => {
									const uid = String(rev.userId || '');
									const author = rev.user || discordMap[uid] || {};
									const authorName = author.global_name || author.username || uid || 'Member';
									const authorAvatar = author.avatarUrl || (author.avatar && uid ? `https://cdn.discordapp.com/avatars/${uid}/${author.avatar}.png?size=64` : null);
									return (
										<div key={rev._id || idx} className="flex flex-col justify-between gap-3 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
											<div className="flex items-center justify-between gap-2">
												<UserProfilePopover userId={uid} initialUser={author}>
													<div className="flex items-center gap-2.5 min-w-0 cursor-pointer group">
														{authorAvatar ? (
															<Image src={authorAvatar} alt={authorName} width={28} height={28} unoptimized className="w-7 h-7 rounded-full object-cover" />
														) : (
															<div className="w-7 h-7 rounded-full bg-(--foreground) flex items-center justify-center text-xs font-bold text-(--text-muted)">
																{authorName.charAt(0).toUpperCase()}
															</div>
														)}
														<span className="text-xs font-bold text-(--text) group-hover:text-(--accent) transition-colors truncate">{authorName}</span>
													</div>
												</UserProfilePopover>
												<div className="flex items-center gap-0.5 text-(--accent)">
													{Array.from({ length: 5 }).map((_, starIdx) => (
														<Star key={starIdx} className={`w-3.5 h-3.5 ${starIdx < Number(rev.rating || 5) ? 'fill-(--accent) text-(--accent)' : 'text-(--border)'}`} />
													))}
												</div>
											</div>
											<p className="text-xs text-(--text-muted) line-clamp-3 leading-relaxed">{rev.content || t('common.noDescription')}</p>
										</div>
									);
								})}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-2xl bg-(--background)/40 border border-(--border)/10 border-dashed">
								<p className="text-xs text-(--text-muted) mb-3">{t('app.servers.reviews.noReviews')}</p>
								<Button variant="secondary" onClick={() => setView('reviews')} className="text-xs">
									{t('app.servers.overview.writeFirstReview')}
								</Button>
							</div>
						)}
					</div>
				</div>

				{/* Right Column: Server Vitals Sidebar */}
				<ServerVitalsSidebar server={server} organizationData={organizationData} />
			</div>

			{/* Discover Similar Public Communities Row */}
			<ServerDiscoveryRow similarServers={similarServers} />
		</div>
	);
}
