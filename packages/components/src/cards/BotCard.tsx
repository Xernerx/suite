/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import Link from 'next/link';
import { Server, Users, ChevronUp } from 'lucide-react';
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
	bannerUrl?: string | null;
}

export function BotCard({ bot, hrefPrefix = '/bots' }: { bot: BotProfile; hrefPrefix?: string }) {
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
	const banner = discord?.bannerUrl;

	return (
		<Link
			href={`${hrefPrefix}/${bot.id}`}
			className="group relative flex flex-col bg-(--foreground) border border-(--border)/10 rounded-2xl overflow-hidden hover:border-(--accent) transition-colors shadow-sm hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
		>
			<div className="h-24 w-full relative bg-gradient-to-br from-(--border) to-(--background) overflow-hidden shrink-0">
				{banner && <Image src={banner} alt={`${name} banner`} fill className="object-cover" unoptimized />}
				<div className="absolute inset-0 bg-(--accent)/20 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
			</div>

			<div className="flex flex-col px-6 pb-6 -mt-10 relative z-10 flex-1">
				<div className="flex justify-between items-end">
					<div className="w-20 h-20 rounded-2xl border-4 border-(--foreground) bg-(--background) overflow-hidden shadow-md flex items-center justify-center shrink-0">
						{loading ? (
							<Loading variant="small" />
						) : avatar ? (
							<Image src={avatar} alt={name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
						) : (
							<div className="text-2xl font-bold text-(--text-muted)">{name.charAt(0)}</div>
						)}
					</div>

					{stats && (
						<div className="flex items-center gap-2 mb-2">
							<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-(--background) border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
								<Server className="w-3.5 h-3.5 text-(--accent)" />
								{stats.guildCount >= 1000 ? `${(stats.guildCount / 1000).toFixed(1)}k` : stats.guildCount}
							</div>
							<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-(--background) border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
								<Users className="w-3.5 h-3.5 text-(--accent)" />
								{stats.userCount >= 1000000 ? `${(stats.userCount / 1000000).toFixed(1)}M` : stats.userCount >= 1000 ? `${(stats.userCount / 1000).toFixed(1)}k` : stats.userCount}
							</div>
							<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-(--background) border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
								<ChevronUp className="w-3.5 h-3.5 text-(--accent)" />
								{bot.voteCount && bot.voteCount >= 1000 ? `${(bot.voteCount / 1000).toFixed(1)}k` : bot.voteCount || 0}
							</div>
						</div>
					)}
				</div>

				<div className="mt-4">
					<h3 className="font-extrabold text-xl mb-1 truncate text-(--text)">{name}</h3>
					<p className="text-sm text-(--text-muted) line-clamp-2 leading-relaxed">{bot.description || 'No description provided.'}</p>
				</div>
			</div>
		</Link>
	);
}
