/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import Link from 'next/link';
import { Bot, ChevronUp, Hash, Server, Users } from 'lucide-react';
import Image from 'next/image';

interface DiscordProfile {
	global_name?: string;
	username?: string;
	avatar?: string | null;
	avatarUrl?: string | null;
	banner?: string | null;
	bannerUrl?: string | null;
}

interface BotProfile {
	id: string;
	vanitySlug?: string;
	name?: string;
	avatar?: string | null;
	banner?: string | null;
	description?: string | null;
	tags?: string[];
	voteCount?: number;
	discord?: DiscordProfile | null;
}

export function BotCard({ bot, hrefPrefix = '/bots' }: { bot: BotProfile; hrefPrefix?: string }) {
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const [discord, setDiscord] = useState<DiscordProfile | null>(bot.discord || null);
	const [stats, setStats] = useState<{ guildCount: number; userCount: number } | null>(null);
	const [loading, setLoading] = useState(!bot.discord);
	const [avatarFailed, setAvatarFailed] = useState(false);
	const [bannerFailed, setBannerFailed] = useState(false);

	useEffect(() => {
		if (!isReady || !bot?.id) return;

		const controller = new AbortController();

		const fetchData = async () => {
			try {
				const [discordRes, statsRes] = await Promise.all([
					bot.discord
						? Promise.resolve(null)
						: fetch(getEnvUrl(`https://api.xernerx.com/core/users/${bot.id}/discord`), {
								signal: controller.signal,
							}).catch(() => null),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${bot.id}/stats?limit=1`), {
						credentials: 'include',
						signal: controller.signal,
					}).catch(() => null),
				]);

				if (discordRes?.ok) {
					const data = await discordRes.json().catch(() => null);
					if (data) setDiscord(data);
				} else if (bot.discord) {
					setDiscord(bot.discord);
				}

				if (statsRes?.ok) {
					const data = await statsRes.json().catch(() => null);
					if (Array.isArray(data) && data.length > 0) {
						setStats({ guildCount: data[0].guildCount, userCount: data[0].userCount });
					}
				}
			} catch {
				// Ignore aborted or offline fetches in dev
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		};

		fetchData();

		return () => controller.abort();
	}, [bot.id, bot.discord, getEnvUrl, isReady]);

	const rawName = discord?.global_name || discord?.username || bot.name;
	const name = rawName || t('components.cards.botcard.unknownBot');
	const avatarHash = discord?.avatar || bot.avatar;
	const avatar =
		discord?.avatarUrl ||
		(avatarHash ? (avatarHash.startsWith('http') ? avatarHash : `https://cdn.discordapp.com/avatars/${bot.id}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=128`) : null);
	const bannerHash = discord?.banner || bot.banner;
	const banner =
		discord?.bannerUrl ||
		(bannerHash ? (bannerHash.startsWith('http') ? bannerHash : `https://cdn.discordapp.com/banners/${bot.id}/${bannerHash}.${bannerHash.startsWith('a_') ? 'gif' : 'png'}?size=600`) : null);

	useEffect(() => {
		setAvatarFailed(false);
	}, [avatar]);

	useEffect(() => {
		setBannerFailed(false);
	}, [banner]);

	const normalizedTags = Array.isArray(bot.tags) ? bot.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean) : [];
	const visibleTags = normalizedTags.slice(0, 3);
	const remainingTags = Math.max(0, normalizedTags.length - visibleTags.length);

	return (
		<Link
			href={`${hrefPrefix}/${bot.vanitySlug || bot.id}`}
			className="group relative flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl overflow-hidden hover:border-(--accent) transition-colors shadow-sm hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
		>
			<div className="h-24 w-full relative bg-gradient-to-br from-(--accent)/25 via-(--foreground) to-(--background) overflow-hidden shrink-0">
				{banner && !bannerFailed && <Image src={banner} alt={`${name} banner`} fill className="object-cover object-[center_24%]" unoptimized onError={() => setBannerFailed(true)} />}
				<div className="absolute inset-0 bg-(--accent)/20 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
			</div>

			<div className="flex flex-col px-6 pb-6 -mt-10 relative z-10 flex-1">
				<div className="flex justify-between items-end gap-2">
					<div className="w-20 h-20 rounded-2xl border-4 border-(--foreground) bg-(--background) overflow-hidden shadow-md flex items-center justify-center shrink-0">
						{loading ? (
							<Loading variant="small" />
						) : avatar && !avatarFailed ? (
							<Image src={avatar} alt={name} width={80} height={80} className="w-full h-full object-cover" unoptimized onError={() => setAvatarFailed(true)} />
						) : rawName ? (
							<div className="text-2xl font-bold text-(--text-muted)">{rawName.charAt(0).toUpperCase()}</div>
						) : (
							<Bot className="w-8 h-8 text-(--text-muted)" />
						)}
					</div>

					{stats && (
						<div className="flex flex-wrap items-center justify-end gap-1.5 mb-2">
							<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
								<Server className="w-3.5 h-3.5 text-(--accent)" />
								{stats.guildCount >= 1000 ? `${(stats.guildCount / 1000).toFixed(1)}k` : stats.guildCount}
							</div>
							<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
								<Users className="w-3.5 h-3.5 text-(--accent)" />
								{stats.userCount >= 1000000 ? `${(stats.userCount / 1000000).toFixed(1)}M` : stats.userCount >= 1000 ? `${(stats.userCount / 1000).toFixed(1)}k` : stats.userCount}
							</div>
							<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
								<ChevronUp className="w-3.5 h-3.5 text-(--accent)" />
								{bot.voteCount && bot.voteCount >= 1000 ? `${(bot.voteCount / 1000).toFixed(1)}k` : bot.voteCount || 0}
							</div>
						</div>
					)}
				</div>

				<div className="mt-4 flex flex-col flex-1">
					<h3 className="font-extrabold text-xl mb-1 truncate text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{name}
					</h3>
					<div className="flex-1">
						<p className="text-sm text-(--text-muted) line-clamp-3 leading-relaxed">{bot.description || t('components.cards.botcard.noDescription')}</p>
					</div>

					{visibleTags.length > 0 && (
						<div className="flex flex-wrap items-center gap-1.5 mt-3">
							{visibleTags.map((tag) => (
								<span
									key={tag}
									className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-(--background)/60 border border-(--border)/10 text-[11px] font-semibold lowercase text-(--text-muted)"
								>
									<Hash className="w-2.5 h-2.5 text-(--accent) shrink-0" />
									{tag}
								</span>
							))}
							{remainingTags > 0 && (
								<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-(--accent)/10 border border-(--accent)/25 text-[10px] font-bold text-(--accent)">
									+{remainingTags}
								</span>
							)}
						</div>
					)}
				</div>
			</div>
		</Link>
	);
}
