/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import Link from 'next/link';
import { Server, Users, ChevronUp, Bot } from 'lucide-react';
import Image from 'next/image';

interface BotProfile {
	id: string;
	description?: string | null;
	voteCount?: number;
}

interface DiscordProfile {
	global_name?: string;
	username?: string;
	avatarUrl?: string | null;
}

export function BotRow({ bot, hrefPrefix = '/bots' }: { bot: BotProfile; hrefPrefix?: string }) {
	const { getEnvUrl } = useEnvironment();
	const [discord, setDiscord] = useState<DiscordProfile | null>(null);
	const [stats, setStats] = useState<{ guildCount: number; userCount: number } | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [discordRes, statsRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/core/users/${bot.id}/discord`), { next: { revalidate: 300 } }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${bot.id}/stats?limit=1`), { next: { revalidate: 300 } }),
				]);

				if (discordRes.ok) {
					const data = await discordRes.json();
					setDiscord(data);
				}

				if (statsRes.ok) {
					const data = await statsRes.json();
					if (data && data.length > 0) {
						const statsData = { guildCount: data[0].guildCount, userCount: data[0].userCount };
						setStats(statsData);
					}
				}
			} catch (error) {
				console.error(`Failed to fetch data for ${bot.id}:`, error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [bot.id, getEnvUrl]);

	const name = discord?.global_name || discord?.username || 'Unknown Bot';
	const avatar = discord?.avatarUrl;

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
						<span className="text-[10px] text-(--text-muted) uppercase tracking-widest">Servers</span>
					</div>
					<div className="flex flex-col items-end">
						<span className="text-xs font-semibold text-(--text)">
							{stats.userCount >= 1000000 ? `${(stats.userCount / 1000000).toFixed(1)}M` : stats.userCount >= 1000 ? `${(stats.userCount / 1000).toFixed(1)}k` : stats.userCount}
						</span>
						<span className="text-[10px] text-(--text-muted) uppercase tracking-widest">Users</span>
					</div>
				</div>
			)}
		</Link>
	);
}
