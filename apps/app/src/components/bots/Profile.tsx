/** @format */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Activity, Calendar, Check, ChevronRight, ChevronUp, Copy, Rocket, Server, ShieldCheck, Sparkles, Star, Tag, Terminal, User, Users } from 'lucide-react';
import { UserProfilePopover } from '@xernerx/components';
import { useDictionary, useSidebar, useToast } from '@xernerx/providers';
import { Button, Markdown } from '@xernerx/ui';
import { BotVitalsSidebar } from './BotVitalsSidebar';
import { BotDiscoveryRow } from './BotDiscoveryRow';

function formatUptime(onlineSince?: number, unknownLabel = '—', justNowLabel = 'Just now'): string {
	if (!onlineSince || onlineSince <= 0) return unknownLabel;
	const diff = Date.now() - onlineSince;
	if (diff < 0) return justNowLabel;
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
	const minutes = Math.floor((diff / 1000 / 60) % 60);
	if (days > 0) return `${days}d ${hours}h`;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

export default function Profile({ bot }: { bot: any }) {
	const { t } = useDictionary();
	const { setView } = useSidebar();
	const { toast } = useToast();
	const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

	const resolvedId = bot.id || '';
	const botDisplayName = bot.discord?.global_name || bot.discord?.username || bot.name || t('common.unknownBot');

	const guildCount = Number(bot.guildCount ?? bot.latestStat?.guildCount ?? bot.latestStat?.servers ?? 0);
	const userCount = Number(bot.userCount ?? bot.latestStat?.userCount ?? bot.latestStat?.users ?? 0);
	const voteCount = Number(bot.voteCount ?? bot.latestStat?.voteCount ?? 0);
	const shardCount = Number(bot.shardCount ?? bot.latestStat?.shardCount ?? (Array.isArray(bot.latestStat?.shards) ? bot.latestStat.shards.length : 1)) || 1;
	const onlineSince = Number(bot.onlineSince ?? bot.latestStat?.onlineSince ?? 0);

	const reviewCount = Number(bot.reviewSummary?.count ?? 0);
	const avgRating = Number(bot.reviewSummary?.average ?? 0);
	const recentReviews = Array.isArray(bot.reviewSummary?.recent) ? bot.reviewSummary.recent : [];

	const allCommands = Array.isArray(bot.commands) ? bot.commands : [];
	const featuredCommands = allCommands.slice(0, 5);

	const sortedReleases = Array.isArray(bot.releases) ? [...bot.releases].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) : [];
	const latestRelease = sortedReleases[0] || null;

	const handleCopyCommand = (cmdName: string) => {
		const text = `/${cmdName}`;
		navigator.clipboard.writeText(text).then(() => {
			setCopiedCmd(cmdName);
			toast({ type: 'success', title: t('app.bots.id.commandCopied', { name: cmdName }), description: text });
			setTimeout(() => setCopiedCmd((prev) => (prev === cmdName ? null : prev)), 2000);
		});
	};

	const kpiCards = [
		{
			id: 'servers',
			label: t('app.bots.overview.kpiServers'),
			value: guildCount.toLocaleString(),
			sub: t('app.bots.stats.servers'),
			icon: Server,
			targetView: 'stats',
		},
		{
			id: 'users',
			label: t('app.bots.overview.kpiUsers'),
			value: userCount.toLocaleString(),
			sub: t('app.bots.stats.users'),
			icon: Users,
			targetView: 'stats',
		},
		{
			id: 'votes',
			label: t('app.bots.overview.kpiVotes'),
			value: voteCount.toLocaleString(),
			sub: t('app.bots.stats.votes'),
			icon: ChevronUp,
			targetView: 'stats',
		},
		{
			id: 'rating',
			label: t('app.bots.overview.kpiRating'),
			value: reviewCount > 0 ? `${avgRating.toFixed(1)} ★` : '—',
			sub: reviewCount > 0 ? t('app.bots.overview.reviewsCount', { count: reviewCount }) : t('app.bots.overview.noRatingsYet'),
			icon: Star,
			targetView: 'reviews',
		},
		{
			id: 'commands',
			label: t('app.bots.tabs.commands'),
			value: allCommands.length.toLocaleString(),
			sub: t('app.bots.overview.shardsCount', { count: shardCount }),
			icon: Terminal,
			targetView: 'commands',
		},
	];

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* Top At-a-Glance KPI Strip */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" style={{ gap: 'var(--ui-gap)' }}>
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
				{/* Left Column: About + Featured Commands + Latest Release + Recent Reviews */}
				<div className="lg:col-span-2 flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					{/* 1. About Bot Card */}
					<div
						className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
						style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
					>
						<div className="flex items-center justify-between pb-3 border-b border-(--border)/10">
							<h2 className="text-xl font-extrabold text-(--text) flex items-center gap-2.5" style={{ fontFamily: 'var(--font-fredoka)' }}>
								<User className="w-5 h-5 text-(--accent)" />
								{t('app.bots.overview.aboutBot', { name: botDisplayName })}
							</h2>
						</div>
						<Markdown emptyText={<div className="text-center text-(--text-muted) py-10 not-italic">{t('app.bots.id.text7')}</div>}>{bot.info}</Markdown>
					</div>

					{/* 2. Featured Slash Commands Preview */}
					{featuredCommands.length > 0 && (
						<div
							className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
							style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
						>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
										<Terminal className="w-5 h-5" />
									</div>
									<div>
										<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{t('app.bots.overview.featuredCommandsTitle')}
										</h3>
										<p className="text-xs text-(--text-muted)">{t('app.bots.overview.featuredCommandsSubtitle')}</p>
									</div>
								</div>
								<Button variant="outline" onClick={() => setView('commands')} className="text-xs">
									{t('app.bots.overview.viewAllCommands', { count: allCommands.length })}
									<ChevronRight className="w-3.5 h-3.5 ml-1" />
								</Button>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{featuredCommands.map((cmd: any, idx: number) => {
									const rawOpts = Array.isArray(cmd.options) ? cmd.options : Array.isArray(cmd.body?.options) ? cmd.body.options : [];
									return (
										<div
											key={cmd.name || idx}
											role="button"
											tabIndex={0}
											onClick={() => handleCopyCommand(cmd.name)}
											onKeyDown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													handleCopyCommand(cmd.name);
												}
											}}
											title={t('app.bots.id.copyCommand', { name: cmd.name })}
											className="flex flex-col justify-between gap-2.5 p-3.5 rounded-2xl bg-(--background)/50 hover:bg-(--background)/80 border border-(--border)/10 hover:border-(--accent)/35 transition-all cursor-pointer group"
										>
											<div className="flex items-start justify-between gap-3">
												<div className="min-w-0 flex-1">
													<div className="flex flex-wrap items-center gap-2">
														<span className="font-mono text-sm font-extrabold text-(--accent) truncate">/{cmd.name}</span>
														{rawOpts.length > 0 && (
															<span className="px-2 py-0.5 rounded-full bg-(--foreground)/70 border border-(--border)/10 text-[10px] font-bold text-(--text-muted)">
																{t('app.bots.commands.optionsCount', { count: rawOpts.length })}
															</span>
														)}
													</div>
													<p className="text-xs text-(--text-muted) line-clamp-1 mt-1">{cmd.description || t('common.noDescription')}</p>
												</div>
												<div className="p-2 rounded-xl bg-(--foreground)/60 group-hover:bg-(--accent)/15 border border-(--border)/10 group-hover:border-(--accent)/30 text-(--text-muted) group-hover:text-(--accent) transition-colors shrink-0">
													{copiedCmd === cmd.name ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} className="text-(--accent)" />}
												</div>
											</div>
											{rawOpts.length > 0 && (
												<div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-(--border)/10">
													{rawOpts.slice(0, 4).map((opt: any, optIdx: number) => {
														const optName = opt?.name || `arg${optIdx + 1}`;
														const isSub = opt?.type === 1 || opt?.type === 2 || opt?.type === 'SUB_COMMAND' || opt?.type === 'SUB_COMMAND_GROUP';
														const isReq = Boolean(opt?.required);
														return (
															<span
																key={`${optName}-${optIdx}`}
																className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
																	isSub
																		? 'bg-(--accent)/15 text-(--accent) border-(--accent)/30'
																		: isReq
																			? 'bg-(--foreground)/80 text-(--text) border-(--border)/20'
																			: 'bg-(--foreground)/40 text-(--text-muted) border-(--border)/10'
																}`}
															>
																{isSub ? optName : isReq ? `<${optName}>` : `[${optName}]`}
															</span>
														);
													})}
													{rawOpts.length > 4 && <span className="text-[10px] font-mono font-bold text-(--text-muted)">+{rawOpts.length - 4}</span>}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* 3. Latest Release Spotlight */}
					{latestRelease && (
						<div
							className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
							style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
						>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
										<Rocket className="w-5 h-5" />
									</div>
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
												{t('app.bots.overview.latestReleaseTitle')}
											</h3>
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-mono font-extrabold text-(--accent)">
												<Tag size={11} />
												{String(latestRelease.version || '').startsWith('v') ? latestRelease.version : `v${latestRelease.version}`}
											</span>
											<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--accent) text-white text-[10px] font-extrabold uppercase tracking-wider">
												<Sparkles size={10} />
												{t('app.bots.releases.latestBadge')}
											</span>
										</div>
										<p className="text-xs text-(--text-muted) mt-0.5">{latestRelease.title}</p>
									</div>
								</div>

								<div className="flex items-center gap-2">
									{latestRelease.createdAt && (
										<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs text-(--text-muted)">
											<Calendar size={12} className="text-(--accent)" />
											{new Date(latestRelease.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
										</span>
									)}
									<Button variant="outline" onClick={() => setView('releases')} className="text-xs">
										{t('app.bots.overview.viewAllReleases', { count: sortedReleases.length })}
										<ChevronRight className="w-3.5 h-3.5 ml-1" />
									</Button>
								</div>
							</div>

							{latestRelease.body && (
								<div className="rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4 text-sm text-(--text-muted) prose max-w-none prose-headings:font-fredoka prose-headings:text-(--text) prose-strong:text-(--text) prose-code:text-(--accent) line-clamp-6 overflow-hidden">
									<ReactMarkdown>{latestRelease.body}</ReactMarkdown>
								</div>
							)}
						</div>
					)}

					{/* 4. Recent Community Reviews Preview */}
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
										{t('app.bots.overview.recentReviewsTitle')}
									</h3>
									<p className="text-xs text-(--text-muted)">{t('app.bots.overview.recentReviewsSubtitle', { name: botDisplayName })}</p>
								</div>
							</div>

							<Button variant="outline" onClick={() => setView('reviews')} className="text-xs">
								{reviewCount > 0 ? t('app.bots.overview.viewAllReviews') : t('app.bots.overview.writeFirstReview')}
								<ChevronRight className="w-3.5 h-3.5 ml-1" />
							</Button>
						</div>

						{recentReviews.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-2xl bg-(--background)/40 border border-dashed border-(--border)/15">
								<p className="text-sm text-(--text-muted) mb-3">{t('app.bots.reviews.noReviews')}</p>
								<Button variant="primary" onClick={() => setView('reviews')} className="text-xs">
									{t('app.bots.reviews.writeReview')}
								</Button>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								{recentReviews.map((review: any) => {
									const reviewerAvatar = review.user?.avatarUrl
										? review.user.avatarUrl
										: review.user?.avatar
											? `https://cdn.discordapp.com/avatars/${review.userId}/${review.user.avatar}.png?size=64`
											: `https://cdn.discordapp.com/embed/avatars/0.png`;
									const reviewerName = review.user?.global_name || review.user?.username || t('common.unknownUser');

									return (
										<div key={review._id || review.userId} className="flex flex-col justify-between gap-3 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
											<div className="flex flex-col gap-2">
												<div className="flex items-center justify-between gap-2">
													<UserProfilePopover userId={review.userId} initialUser={review.user}>
														<div className="flex items-center gap-2.5 cursor-pointer group">
															<Image src={reviewerAvatar} alt={reviewerName} width={28} height={28} unoptimized className="w-7 h-7 rounded-full object-cover" />
															<div className="flex flex-col text-left">
																<span className="text-xs font-bold text-(--text) group-hover:text-(--accent) transition-colors truncate max-w-[140px]">
																	{reviewerName}
																</span>
																{review.createdAt && <span className="text-[10px] text-(--text-muted)">{new Date(review.createdAt).toLocaleDateString()}</span>}
															</div>
														</div>
													</UserProfilePopover>
													<div className="flex items-center text-(--accent)">
														{[...Array(5)].map((_, i) => (
															<Star key={i} className={`w-3.5 h-3.5 ${i < (review.rating || 5) ? 'fill-current' : 'text-(--border)/30'}`} />
														))}
													</div>
												</div>
												{review.content && <p className="text-xs text-(--text-muted) line-clamp-3">{review.content}</p>}
											</div>

											{review.devResponse && (
												<div className="p-2.5 rounded-xl bg-(--foreground)/50 border-l-2 border-(--accent) text-[11px] text-(--text-muted)">
													<span className="font-bold text-(--accent) flex items-center gap-1 mb-0.5">
														<ShieldCheck size={11} />
														{t('app.bots.reviews.developerResponse')}
													</span>
													<p className="line-clamp-2">{review.devResponse}</p>
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>

				{/* Right Column: Bot Vitals, Milestones & Embed Widget */}
				<BotVitalsSidebar bot={bot} id={resolvedId} onSelectView={setView} />
			</div>

			{/* Bottom Discovery Row: More from Developer & Similar Bots */}
			<BotDiscoveryRow bot={bot} />
		</div>
	);
}
