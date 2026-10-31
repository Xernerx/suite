/** @format */
'use client';

import { ArrowUpRight, ChevronUp, ExternalLink, Flame, Hash, Server, ShieldCheck, Star, Terminal, Users } from 'lucide-react';
import { Loading } from '@xernerx/feedback';
import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import Image from 'next/image';
import Link from 'next/link';

export interface BotProfile {
	id: string;
	name?: string;
	avatar?: string;
	banner?: string;
	vanitySlug?: string;
	verified?: boolean;
	description?: string;
	tags?: string[];
	links?: {
		invite?: string;
		website?: string;
		support?: string;
	};
	commandsCount?: number;
	promotedUntil?: string | Date;
	boostedUntil?: string | Date;
	reviewCount?: number;
	reviewAverage?: number;
	stats?: {
		guildCount: number;
		userCount: number;
	} | null;
	voteCount?: number;
}

export interface DiscordProfile {
	global_name?: string;
	username?: string;
	avatarUrl?: string | null;
	bannerUrl?: string | null;
}

export interface GuildProfile {
	id: string;
	name: string;
	icon?: string;
	banner?: string;
	description?: string;
	voteCount?: number;
	memberCount?: number;
	bot?: boolean;
}

function formatCompactCount(num: number | undefined | null): string {
	const val = Number(num) || 0;
	if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
	if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
	return val.toLocaleString();
}

export function BotCard({ bot, onSelectTag }: { bot: BotProfile; onSelectTag?: (tag: string) => void }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const [discord, setDiscord] = useState<DiscordProfile | null>(() => {
		if (!bot.name && !bot.avatar) return null;
		return {
			global_name: bot.name,
			username: bot.name,
			avatarUrl: bot.avatar ? (bot.avatar.startsWith('http') ? bot.avatar : `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=512`) : null,
			bannerUrl: bot.banner ? (bot.banner.startsWith('http') ? bot.banner : `https://cdn.discordapp.com/banners/${bot.id}/${bot.banner}.png?size=1024`) : null,
		};
	});
	const [stats, setStats] = useState<{ guildCount: number; userCount: number } | null>(() => (bot.stats ? { guildCount: bot.stats.guildCount ?? 0, userCount: bot.stats.userCount ?? 0 } : null));
	const [loading, setLoading] = useState(() => !bot.name && !bot.avatar);

	useEffect(() => {
		if (!isReady || !bot.id) return;
		let cancelled = false;
		const controller = new AbortController();

		const fetchData = async () => {
			try {
				const discordPromise = fetch(getEnvUrl(`https://api.xernerx.com/core/users/${bot.id}/discord`), {
					signal: controller.signal,
				}).catch(() => null);

				const statsPromise = !bot.stats
					? fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${bot.id}/stats?limit=1`), {
							signal: controller.signal,
						}).catch(() => null)
					: Promise.resolve(null);

				const [discordRes, statsRes] = await Promise.all([discordPromise, statsPromise]);
				if (cancelled) return;

				if (discordRes && discordRes.ok) {
					const data = await discordRes.json().catch(() => null);
					if (!cancelled && data) setDiscord(data);
				}

				if (statsRes && statsRes.ok) {
					const data = await statsRes.json().catch(() => null);
					if (!cancelled && Array.isArray(data) && data.length > 0) {
						setStats({ guildCount: data[0].guildCount ?? 0, userCount: data[0].userCount ?? 0 });
					}
				}
			} catch {
				// Ignore transient/aborted client fetch errors
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		fetchData();

		return () => {
			cancelled = true;
			controller.abort();
		};
	}, [bot.id, bot.stats, getEnvUrl, isReady]);

	const name = discord?.global_name || discord?.username || bot.name || t('common.unknownBot');
	const avatar = discord?.avatarUrl;
	const banner = discord?.bannerUrl;
	const isBoosted = Boolean((bot.promotedUntil && new Date(bot.promotedUntil).getTime() > Date.now()) || (bot.boostedUntil && new Date(bot.boostedUntil).getTime() > Date.now()));
	const inviteUrl = bot.links?.invite || `https://discord.com/oauth2/authorize?client_id=${bot.id}&permissions=8&scope=bot%20applications.commands`;
	const displayTags = Array.isArray(bot.tags) ? bot.tags.filter(Boolean).slice(0, 3) : [];
	const guildCount = stats?.guildCount ?? bot.stats?.guildCount ?? 0;
	const userCount = stats?.userCount ?? bot.stats?.userCount ?? 0;
	const voteCount = bot.voteCount ?? 0;
	const hasRating = Boolean(bot.reviewCount && bot.reviewCount > 0 && bot.reviewAverage && bot.reviewAverage > 0);

	const handleInviteClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		window.open(inviteUrl, '_blank', 'noopener,noreferrer');
	};

	const handleTagClick = (e: React.MouseEvent, tag: string) => {
		if (!onSelectTag) return;
		e.preventDefault();
		e.stopPropagation();
		onSelectTag(tag);
	};

	return (
		<Link
			href={`/bots/${bot.vanitySlug || bot.id}`}
			className="group relative flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl overflow-hidden hover:border-(--accent)/50 transition-all shadow-sm hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
		>
			<div className="h-28 w-full relative bg-gradient-to-br from-(--accent)/25 via-(--foreground) to-(--background) overflow-hidden shrink-0">
				{banner && <Image src={banner} alt={`${name} banner`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />}
				<div className="absolute inset-0 bg-gradient-to-t from-(--background)/80 via-transparent to-transparent z-0" />
				<div className="absolute inset-0 bg-(--accent)/15 opacity-0 group-hover:opacity-100 transition-opacity z-0" />

				{isBoosted && (
					<div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-(--accent) text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
						<Flame className="w-3 h-3" />
						{t('app.categories.promoted')}
					</div>
				)}
			</div>

			<div className="flex flex-col px-5 pb-5 -mt-10 relative z-10 flex-1">
				<div className="flex justify-between items-end gap-2">
					<div className="w-20 h-20 rounded-2xl border-4 border-(--foreground) bg-(--background) overflow-hidden shadow-md flex items-center justify-center shrink-0">
						{loading ? (
							<Loading variant="small" />
						) : avatar ? (
							<Image src={avatar} alt={name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
						) : (
							<div className="text-2xl font-bold text-(--text-muted)">{name.charAt(0)}</div>
						)}
					</div>

					<div className="flex flex-wrap items-center justify-end gap-1.5 mb-1">
						<div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-(--background)/80 backdrop-blur-md border border-(--border)/15 text-[11px] font-bold text-(--text-muted)">
							<Server className="w-3 h-3 text-(--accent)" />
							{formatCompactCount(guildCount)}
						</div>
						<div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-(--background)/80 backdrop-blur-md border border-(--border)/15 text-[11px] font-bold text-(--text-muted)">
							<Users className="w-3 h-3 text-(--accent)" />
							{formatCompactCount(userCount)}
						</div>
						<div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-(--background)/80 backdrop-blur-md border border-(--border)/15 text-[11px] font-bold text-(--text-muted)">
							<ChevronUp className="w-3 h-3 text-(--accent)" />
							{formatCompactCount(voteCount)}
						</div>
						{hasRating && (
							<div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-[11px] font-extrabold text-(--accent)">
								<Star className="w-3 h-3 fill-(--accent) text-(--accent)" />
								{Number(bot.reviewAverage).toFixed(1)}
							</div>
						)}
					</div>
				</div>

				<div className="mt-3.5 flex flex-col flex-1">
					<div className="flex items-center gap-1.5 min-w-0">
						<h3 className="text-lg font-extrabold text-(--text) group-hover:text-(--accent) transition-colors truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{loading ? t('common.loading') : name}
						</h3>
						{bot.verified && (
							<span
								className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0"
								title={t('app.bots.verifiedBadge')}
							>
								<ShieldCheck className="w-3.5 h-3.5" />
							</span>
						)}
					</div>

					<p className="text-xs text-(--text-muted) mt-1.5 line-clamp-2 leading-relaxed flex-1">{bot.description || t('common.noDescription')}</p>

					{displayTags.length > 0 && (
						<div className="flex flex-wrap items-center gap-1.5 mt-3">
							{displayTags.map((tag) => (
								<span
									key={tag}
									onClick={(e) => handleTagClick(e, tag)}
									className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-(--background)/60 border border-(--border)/10 text-[11px] font-semibold text-(--text-muted) ${
										onSelectTag ? 'hover:border-(--accent)/40 hover:text-(--accent) cursor-pointer transition-colors' : ''
									}`}
								>
									<Hash className="w-2.5 h-2.5 text-(--accent)" />
									{tag}
								</span>
							))}
							{bot.commandsCount !== undefined && bot.commandsCount > 0 && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--accent)/10 border border-(--accent)/25 text-[10px] font-mono font-bold text-(--accent) ml-auto">
									<Terminal className="w-2.5 h-2.5" />
									{bot.commandsCount}
								</span>
							)}
						</div>
					)}

					<div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-(--border)/10">
						<span className="inline-flex items-center gap-1 text-xs font-bold text-(--text-muted) group-hover:text-(--accent) transition-colors">
							{t('app.bots.explore.viewBot')}
							<ArrowUpRight className="w-3.5 h-3.5" />
						</span>

						<button
							type="button"
							onClick={handleInviteClick}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 text-xs font-extrabold transition-all cursor-pointer"
						>
							{t('app.bots.explore.quickInvite')}
							<ExternalLink className="w-3 h-3" />
						</button>
					</div>
				</div>
			</div>
		</Link>
	);
}

export function ServerCard({ server }: { server: GuildProfile }) {
	const { t } = useDictionary();
	const name = server.name || t('common.unknownServer');
	const avatar = server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png` : null;
	const banner = server.banner ? `https://cdn.discordapp.com/banners/${server.id}/${server.banner}.png?size=1024` : null;

	return (
		<Link
			href={`/servers/${server.id}`}
			className="group relative flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl overflow-hidden hover:border-(--accent) transition-colors shadow-sm hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
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
							<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background) border border-(--border)/15 text-xs font-semibold text-(--text-muted)">
								<Users className="w-3.5 h-3.5 text-(--accent)" />
								{server.memberCount >= 1000000
									? `${(server.memberCount / 1000000).toFixed(1)}M`
									: server.memberCount >= 1000
										? `${(server.memberCount / 1000).toFixed(1)}k`
										: server.memberCount}
							</div>
						)}
						<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background) border border-(--border)/15 text-xs font-semibold text-(--text-muted)">
							<ChevronUp className="w-3.5 h-3.5 text-(--accent)" />
							{server.voteCount && server.voteCount >= 1000 ? `${(server.voteCount / 1000).toFixed(1)}k` : server.voteCount || 0}
						</div>
					</div>
				</div>

				<div className="mt-4 flex flex-col flex-1">
					<h3 className="text-xl font-bold text-(--text) group-hover:text-(--accent) transition-colors line-clamp-1">{name}</h3>
					<p className="text-sm text-(--text-muted) mt-2 line-clamp-2 leading-relaxed flex-1">{server.description || t('common.noDescription')}</p>
				</div>
			</div>
		</Link>
	);
}
