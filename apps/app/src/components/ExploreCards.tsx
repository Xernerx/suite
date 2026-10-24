/** @format */
'use client';

import { ChevronUp, Server, Users } from 'lucide-react';
import { Loading } from '@xernerx/feedback';
import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import Image from 'next/image';
import Link from 'next/link';

export interface BotProfile {
	id: string;
	description?: string;
	stats?: {
		guildCount: number;
		userCount: number;
	};
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

export function BotCard({ bot }: { bot: BotProfile }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [discord, setDiscord] = useState<DiscordProfile | null>(null);
	const [stats, setStats] = useState<{ guildCount: number; userCount: number } | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [discordRes, statsRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/core/users/${bot.id}/discord`)),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${bot.id}/stats?limit=1`)),
				]);

				if (discordRes.ok) {
					const data = await discordRes.json();
					setDiscord(data);
				}

				if (statsRes.ok) {
					const data = await statsRes.json();
					if (data && data.length > 0) {
						setStats({ guildCount: data[0].guildCount, userCount: data[0].userCount });
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

	const name = discord?.global_name || discord?.username || t('common.unknownBot');
	const avatar = discord?.avatarUrl;
	const banner = discord?.bannerUrl;

	return (
		<Link
			href={`/bots/${bot.id}`}
			className="group relative flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-2xl overflow-hidden hover:border-(--accent) transition-colors shadow-sm hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
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
							<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background) border border-(--border)/15 text-xs font-semibold text-(--text-muted)">
								<Server className="w-3.5 h-3.5 text-(--accent)" />
								{stats.guildCount >= 1000 ? `${(stats.guildCount / 1000).toFixed(1)}k` : stats.guildCount}
							</div>
							<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background) border border-(--border)/15 text-xs font-semibold text-(--text-muted)">
								<Users className="w-3.5 h-3.5 text-(--accent)" />
								{stats.userCount >= 1000000 ? `${(stats.userCount / 1000000).toFixed(1)}M` : stats.userCount >= 1000 ? `${(stats.userCount / 1000).toFixed(1)}k` : stats.userCount}
							</div>
							<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background) border border-(--border)/15 text-xs font-semibold text-(--text-muted)">
								<ChevronUp className="w-3.5 h-3.5 text-(--accent)" />
								{bot.voteCount && bot.voteCount >= 1000 ? `${(bot.voteCount / 1000).toFixed(1)}k` : bot.voteCount || 0}
							</div>
						</div>
					)}
				</div>

				<div className="mt-4 flex flex-col flex-1">
					<h3 className="text-xl font-bold text-(--text) group-hover:text-(--accent) transition-colors line-clamp-1">{loading ? t('common.loading') : name}</h3>
					<p className="text-sm text-(--text-muted) mt-2 line-clamp-2 leading-relaxed flex-1">{bot.description || t('common.noDescription')}</p>
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
			className="group relative flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-2xl overflow-hidden hover:border-(--accent) transition-colors shadow-sm hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
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
