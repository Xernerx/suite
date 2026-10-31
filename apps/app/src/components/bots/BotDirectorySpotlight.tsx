/** @format */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronUp, ExternalLink, Flame, Hash, Server, ShieldCheck, Sparkles, Star, Terminal, Users } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button } from '@xernerx/ui';
import type { BotProfile, DiscordProfile } from '@/components/ExploreCards';

export function BotDirectorySpotlight({ bot, onSelectTag }: { bot: BotProfile; onSelectTag?: (tag: string) => void }) {
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

	useEffect(() => {
		if (!isReady || !bot.id) return;
		let cancelled = false;
		fetch(getEnvUrl(`https://api.xernerx.com/core/users/${bot.id}/discord`))
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (!cancelled && data) setDiscord(data);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [bot.id, getEnvUrl, isReady]);

	const name = discord?.global_name || discord?.username || bot.name || t('common.unknownBot');
	const avatar = discord?.avatarUrl;
	const banner = discord?.bannerUrl;
	const isBoosted = Boolean((bot.promotedUntil && new Date(bot.promotedUntil).getTime() > Date.now()) || (bot.boostedUntil && new Date(bot.boostedUntil).getTime() > Date.now()));
	const inviteUrl = bot.links?.invite || `https://discord.com/oauth2/authorize?client_id=${bot.id}&permissions=8&scope=bot%20applications.commands`;
	const guildCount = bot.stats?.guildCount ?? 0;
	const userCount = bot.stats?.userCount ?? 0;
	const voteCount = bot.voteCount ?? 0;
	const tags = Array.isArray(bot.tags) ? bot.tags.filter(Boolean).slice(0, 5) : [];

	return (
		<div className="relative w-full rounded-3xl border border-(--accent)/30 bg-(--foreground)/35 backdrop-blur-md overflow-hidden shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_18%,transparent)]">
			{/* Background Banner */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				{banner ? (
					<Image src={banner} alt={`${name} spotlight banner`} fill className="object-cover opacity-20 scale-105 blur-[1px]" unoptimized />
				) : (
					<div className="w-full h-full bg-gradient-to-br from-(--accent)/20 via-transparent to-(--background)" />
				)}
				<div className="absolute inset-0 bg-gradient-to-r from-(--background)/90 via-(--background)/75 to-(--background)/50" />
			</div>

			<div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between" style={{ padding: 'calc(var(--ui-gap) * 1.25)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0 flex-1">
					<Link
						href={`/bots/${bot.vanitySlug || bot.id}`}
						className="w-24 h-24 rounded-3xl border-4 border-(--foreground) bg-(--background) overflow-hidden shadow-lg flex items-center justify-center shrink-0 group"
					>
						{avatar ? (
							<Image src={avatar} alt={name} width={96} height={96} className="w-full h-full object-cover transition-transform group-hover:scale-105" unoptimized />
						) : (
							<div className="text-3xl font-extrabold text-(--accent)">{name.charAt(0)}</div>
						)}
					</Link>

					<div className="flex flex-col min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2 mb-1.5">
							<span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-(--accent) text-white text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
								{isBoosted ? <Flame className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
								{isBoosted ? t('app.bots.explore.spotlightBadge') : t('app.bots.explore.featuredBadge')}
							</span>
							{bot.verified && (
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/30 text-[11px] font-extrabold">
									<ShieldCheck className="w-3.5 h-3.5" />
									{t('app.bots.verifiedBadge')}
								</span>
							)}
						</div>

						<Link href={`/bots/${bot.vanitySlug || bot.id}`} className="group inline-flex items-center gap-2 w-fit max-w-full">
							<h2 className="text-2xl sm:text-3xl font-extrabold text-(--text) group-hover:text-(--accent) transition-colors truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{name}
							</h2>
						</Link>

						<p className="text-sm text-(--text-muted) mt-1 line-clamp-2 max-w-2xl leading-relaxed">{bot.description || t('common.noDescription')}</p>

						{tags.length > 0 && (
							<div className="flex flex-wrap items-center gap-1.5 mt-3">
								{tags.map((tag) => (
									<button
										key={tag}
										type="button"
										onClick={() => onSelectTag?.(tag)}
										className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--background)/70 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/35 text-xs font-semibold text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
									>
										<Hash className="w-3 h-3 text-(--accent)" />
										{tag}
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="flex flex-col sm:items-end justify-between gap-4 shrink-0">
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-(--background)/70 border border-(--border)/10 text-xs font-extrabold text-(--text)">
							<Server className="w-3.5 h-3.5 text-(--accent)" />
							<span>{Number(guildCount).toLocaleString()}</span>
							<span className="text-(--text-muted) font-semibold">{t('app.bots.stats.servers')}</span>
						</div>
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-(--background)/70 border border-(--border)/10 text-xs font-extrabold text-(--text)">
							<Users className="w-3.5 h-3.5 text-(--accent)" />
							<span>{Number(userCount).toLocaleString()}</span>
							<span className="text-(--text-muted) font-semibold">{t('app.bots.stats.users')}</span>
						</div>
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-(--background)/70 border border-(--border)/10 text-xs font-extrabold text-(--text)">
							<ChevronUp className="w-3.5 h-3.5 text-(--accent)" />
							<span>{Number(voteCount).toLocaleString()}</span>
							<span className="text-(--text-muted) font-semibold">{t('app.bots.stats.votes')}</span>
						</div>
						{Boolean(bot.reviewCount && bot.reviewCount > 0 && bot.reviewAverage) && (
							<div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 text-xs font-extrabold text-(--accent)">
								<Star className="w-3.5 h-3.5 fill-(--accent) text-(--accent)" />
								<span>{Number(bot.reviewAverage).toFixed(1)}</span>
							</div>
						)}
						{Boolean(bot.commandsCount && bot.commandsCount > 0) && (
							<div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-(--background)/70 border border-(--border)/10 text-xs font-mono font-bold text-(--accent)">
								<Terminal className="w-3.5 h-3.5" />
								<span>{bot.commandsCount}</span>
							</div>
						)}
					</div>

					<div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
						<Link href={`/bots/${bot.vanitySlug || bot.id}`} className="flex-1 sm:flex-initial">
							<Button variant="primary" className="w-full flex items-center justify-center gap-2">
								<span>{t('app.bots.explore.viewBot')}</span>
								<ArrowRight className="w-4 h-4" />
							</Button>
						</Link>
						<Button variant="secondary" onClick={() => window.open(inviteUrl, '_blank', 'noopener,noreferrer')} className="flex-1 sm:flex-initial flex items-center justify-center gap-2">
							<span>{t('app.bots.explore.quickInvite')}</span>
							<ExternalLink className="w-3.5 h-3.5" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
