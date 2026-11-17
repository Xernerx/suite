/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import Link from 'next/link';
import { Bot, Hash } from 'lucide-react';
import Image from 'next/image';

interface DiscordProfile {
	global_name?: string;
	username?: string;
	avatar?: string | null;
	avatarUrl?: string | null;
}

interface BotProfile {
	id: string;
	vanitySlug?: string;
	name?: string;
	avatar?: string | null;
	description?: string | null;
	tags?: string[];
	voteCount?: number;
	discord?: DiscordProfile | null;
}

export function BotRow({ bot, hrefPrefix = '/bots' }: { bot: BotProfile; hrefPrefix?: string }) {
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const [discord, setDiscord] = useState<DiscordProfile | null>(bot.discord || null);
	const [stats, setStats] = useState<{ guildCount: number; userCount: number } | null>(null);
	const [loading, setLoading] = useState(!bot.discord);
	const [avatarFailed, setAvatarFailed] = useState(false);

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

	const name = discord?.global_name || discord?.username || bot.name || t('components.cards.botcard.unknownBot');
	const avatarHash = discord?.avatar || bot.avatar;
	const avatar =
		discord?.avatarUrl ||
		(avatarHash ? (avatarHash.startsWith('http') ? avatarHash : `https://cdn.discordapp.com/avatars/${bot.id}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=128`) : null);

	useEffect(() => {
		setAvatarFailed(false);
	}, [avatar]);

	const normalizedTags = Array.isArray(bot.tags) ? bot.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean) : [];
	const visibleTags = normalizedTags.slice(0, 3);
	const remainingTags = Math.max(0, normalizedTags.length - visibleTags.length);

	return (
		<Link
			href={`${hrefPrefix}/${bot.vanitySlug || bot.id}`}
			className="group flex items-center justify-between gap-4 p-4 hover:bg-(--foreground)/50 transition-colors border-b border-(--border)/5 last:border-b-0 w-full cursor-pointer"
		>
			<div className="flex items-center gap-4 min-w-0 flex-1">
				<div className="w-12 h-12 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 overflow-hidden flex items-center justify-center shrink-0">
					{loading ? (
						<Loading variant="small" />
					) : avatar && !avatarFailed ? (
						<Image src={avatar} alt={name} width={48} height={48} loading="eager" className="w-full h-full object-cover" unoptimized onError={() => setAvatarFailed(true)} />
					) : (
						<Bot className="w-5 h-5 text-(--text-muted)" />
					)}
				</div>
				<div className="flex flex-col min-w-0 flex-1">
					<span className="font-bold text-(--text) group-hover:text-(--accent) transition-colors truncate">{name}</span>
					<span className="text-xs text-(--text-muted) truncate max-w-xs">{bot.description || bot.id}</span>
					{visibleTags.length > 0 && (
						<div className="flex flex-wrap items-center gap-1 mt-1">
							{visibleTags.map((tag) => (
								<span
									key={tag}
									className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-(--background)/60 border border-(--border)/10 text-[10px] font-semibold lowercase text-(--text-muted)"
								>
									<Hash className="w-2.5 h-2.5 text-(--accent) shrink-0" />
									{tag}
								</span>
							))}
							{remainingTags > 0 && (
								<span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-(--accent)/10 border border-(--accent)/25 text-[10px] font-bold text-(--accent)">
									+{remainingTags}
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			{stats && (
				<div className="hidden sm:flex items-center gap-4 shrink-0">
					<div className="flex flex-col items-end">
						<span className="text-xs font-semibold text-(--text)">{stats.guildCount >= 1000 ? `${(stats.guildCount / 1000).toFixed(1)}k` : stats.guildCount}</span>
						<span className="text-[10px] text-(--text-muted) uppercase tracking-widest">{t('components.cards.botrow.text1')}</span>
					</div>
					<div className="flex flex-col items-end">
						<span className="text-xs font-semibold text-(--text)">
							{stats.userCount >= 1000000 ? `${(stats.userCount / 1000000).toFixed(1)}M` : stats.userCount >= 1000 ? `${(stats.userCount / 1000).toFixed(1)}k` : stats.userCount}
						</span>
						<span className="text-[10px] text-(--text-muted) uppercase tracking-widest">{t('components.cards.botrow.text2')}</span>
					</div>
				</div>
			)}
		</Link>
	);
}
