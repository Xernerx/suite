/** @format */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Server, Users, Flame, Coins, ShieldCheck, ChevronUp, Crown, Medal, Award, Sparkles, MessageSquare, Headphones } from 'lucide-react';
import { UserProfilePopover } from '@xernerx/components';
import { useDictionary } from '@xernerx/providers';

export type LeaderboardTab = 'bots' | 'servers' | 'streaks' | 'levels';

export interface DiscordProfile {
	id?: string;
	global_name?: string;
	username?: string;
	avatarUrl?: string | null;
	bannerUrl?: string | null;
}

export interface EntryDisplay {
	name: string;
	handle: string | null;
	avatarUrl: string | null;
	bannerUrl: string | null;
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

const PILL_BASE = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-bold text-(--text)';
const PILL_ACCENT = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-bold text-(--accent)';

function getEntryHref(entry: any, activeTab: LeaderboardTab) {
	const slugOrId = entry.vanitySlug || entry.id;
	return activeTab === 'bots' ? `/bots/${slugOrId}` : activeTab === 'servers' ? `/servers/${slugOrId}` : `/users/${slugOrId}`;
}

function wrapLeaderboardEntry(
	entry: any,
	activeTab: LeaderboardTab,
	display: { name: string; avatarUrl: string | null; bannerUrl: string | null },
	wrapperClass: string,
	innerClass: string,
	innerStyle: React.CSSProperties | undefined,
	content: React.ReactNode
) {
	if (activeTab === 'streaks' || activeTab === 'levels') {
		return (
			<UserProfilePopover key={entry.id} userId={String(entry.id)} initialUser={{ id: String(entry.id), ...display }} className={wrapperClass}>
				<div className={innerClass} style={innerStyle}>
					{content}
				</div>
			</UserProfilePopover>
		);
	}
	return (
		<Link key={entry.id} href={getEntryHref(entry, activeTab)} className={innerClass} style={innerStyle}>
			{content}
		</Link>
	);
}

export function LeaderboardMetricBadges({ entry, activeTab }: { entry: any; activeTab: LeaderboardTab }) {
	const { t } = useDictionary();
	const badge = (icon: React.ReactNode, text: React.ReactNode, accent = false) => (
		<span className={accent ? PILL_ACCENT : PILL_BASE}>
			{icon}
			{text}
		</span>
	);

	return (
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
}

export function LeaderboardPodium({ podiumEntries, activeTab, resolveEntryDisplay }: { podiumEntries: any[]; activeTab: LeaderboardTab; resolveEntryDisplay: (entry: any) => EntryDisplay }) {
	const { t } = useDictionary();

	if (podiumEntries.length === 0) return null;

	return (
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
							<div className={`${pStyle.ring} rounded-2xl border-4 border-(--foreground) bg-(--background) overflow-hidden shadow-xl flex items-center justify-center shrink-0`}>
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
								<div className="mt-4 pt-3 border-t border-(--border)/10 w-full flex justify-center">
									<LeaderboardMetricBadges entry={entry} activeTab={activeTab} />
								</div>
							</div>
						</div>

						<div className={`flex items-center justify-center gap-1.5 bg-gradient-to-t text-xs font-black tracking-widest uppercase ${pStyle.pedestal}`}>
							<RankIcon size={13} />
							<span>#{index + 1}</span>
						</div>
					</>
				);

				const cardClass = `group relative flex flex-col rounded-3xl border bg-(--foreground)/35 backdrop-blur-md overflow-hidden transition-all duration-300 hover:-translate-y-1.5 w-full ${orderAndElevation} ${pStyle.border}`;
				return wrapLeaderboardEntry(entry, activeTab, { name, avatarUrl, bannerUrl }, `w-full ${orderAndElevation}`, cardClass, undefined, cardContent);
			})}
		</div>
	);
}

export function LeaderboardRowList({
	listEntries,
	showPodium,
	activeTab,
	resolveEntryDisplay,
}: {
	listEntries: any[];
	showPodium: boolean;
	activeTab: LeaderboardTab;
	resolveEntryDisplay: (entry: any) => EntryDisplay;
}) {
	if (listEntries.length === 0) return null;

	return (
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
								<Image src={avatarUrl} alt={name} width={48} height={48} unoptimized className="h-12 w-12 rounded-2xl border border-(--border)/15 object-cover shrink-0" />
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
						<div className="relative z-10 shrink-0">
							<LeaderboardMetricBadges entry={entry} activeTab={activeTab} />
						</div>
					</>
				);

				return wrapLeaderboardEntry(entry, activeTab, { name, avatarUrl, bannerUrl }, 'w-full', rowClass, { padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }, rowInner);
			})}
		</div>
	);
}
