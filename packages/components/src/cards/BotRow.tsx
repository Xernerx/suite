/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import Link from 'next/link';
import { Bot } from 'lucide-react';
import Image from 'next/image';

interface DiscordProfile {
	global_name?: string;
	username?: string;
	avatar?: string | null;
	avatarUrl?: string | null;
}

interface BotProfile {
	id: string;
	name?: string;
	description?: string | null;
	voteCount?: number;
	discord?: DiscordProfile | null;
}

export function BotRow({ bot, hrefPrefix = '/bots' }: { bot: BotProfile; hrefPrefix?: string }) {
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const [discord, setDiscord] = useState<DiscordProfile | null>(bot.discord || null);
	const [stats, setStats] = useState<{ guildCount: number; userCount: number } | null>(null);
	const [loading, setLoading] = useState(!bot.discord);

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
	const avatar = discord?.avatarUrl || (discord?.avatar ? `https://cdn.discordapp.com/avatars/${bot.id}/${discord.avatar}.png?size=128` : null);

	return (
		<Link
			href={`${hrefPrefix}/${bot.id}`}
			className="group flex items-center justify-between p-4 hover:bg-(--foreground)/50 transition-colors border-b border-(--border)/5 last:border-b-0 w-full cursor-pointer"
		>
			<div className="flex items-center gap-4">
				<div className="w-12 h-12 rounded-xl border border-(--border)/10 bg-(--foreground)/30 overflow-hidden flex items-center justify-center shrink-0">
					{loading ? (
						<Loading variant="small" />
					) : avatar ? (
						<Image src={avatar} alt={name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
					) : (
						<Bot className="w-5 h-5 text-(--text-muted)" />
					)}
				</div>
				<div className="flex flex-col">
					<span className="font-bold text-(--text) group-hover:text-(--accent) transition-colors">{name}</span>
					<span className="text-xs text-(--text-muted) truncate max-w-xs">{bot.description || bot.id}</span>
				</div>
			</div>

			{stats && (
				<div className="hidden sm:flex items-center gap-4">
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
