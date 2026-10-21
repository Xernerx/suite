/** @format */
'use client';

import React from 'react';
import { Bot, ExternalLink, Server, Users } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Status24hBar, type StatusBucketPoint } from './Status24hBar';

export interface MainOrgBotStatus {
	id: string;
	name: string;
	avatarUrl: string | null;
	verified: boolean;
	status: 'online' | 'idle' | 'dnd' | 'offline';
	activity: string | null;
	statusUpdatedAt: string | null;
	guildCount: number;
	userCount: number;
	shardCount: number;
}

interface StatusBotsSectionProps {
	bots: MainOrgBotStatus[];
	loading: boolean;
	botHistory?: Record<string, StatusBucketPoint[]>;
}

export function StatusBotsSection({ bots, loading, botHistory }: StatusBotsSectionProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	if (!loading && bots.length === 0) return null;

	const onlineCount = bots.filter((b) => b.status === 'online' || b.status === 'idle' || b.status === 'dnd').length;

	return (
		<div className="flex flex-col mt-2" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-xl font-bold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
					<Bot size={20} className="text-(--accent)" />
					{t('info.status.botsHeading')}
				</h2>

				{bots.length > 0 && (
					<span className="inline-flex items-center gap-2 rounded-full border border-(--border)/10 bg-(--foreground)/30 px-3 py-1 text-xs font-bold text-(--text-muted)">
						<span className={`h-2 w-2 rounded-full ${onlineCount === bots.length ? 'bg-(--accent-green)' : onlineCount > 0 ? 'bg-(--accent-orange)' : 'bg-(--accent-red)'}`} />
						{t('info.status.botsOnlineCount', {
							online: onlineCount,
							total: bots.length,
						})}
					</span>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
				{bots.map((bot) => {
					const isOnline = bot.status === 'online';
					const isWarning = bot.status === 'idle' || bot.status === 'dnd';

					const badgeClass = isOnline
						? 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/25'
						: isWarning
							? 'bg-(--accent-orange)/10 text-(--accent-orange) border-(--accent-orange)/25'
							: 'bg-(--accent-red)/10 text-(--accent-red) border-(--accent-red)/25';

					const dotClass = isOnline ? 'bg-(--accent-green)' : isWarning ? 'bg-(--accent-orange)' : 'bg-(--accent-red)';

					const statusLabel =
						bot.status === 'online'
							? t('info.status.botStates.online')
							: bot.status === 'idle'
								? t('info.status.botStates.idle')
								: bot.status === 'dnd'
									? t('info.status.botStates.dnd')
									: t('info.status.botStates.offline');

					return (
						<div
							key={bot.id}
							className="flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm hover:border-(--accent)/35 transition-all"
							style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-3 min-w-0">
									<div className="relative h-11 w-11 shrink-0 rounded-2xl overflow-hidden border border-(--border)/15 bg-(--background)/60 flex items-center justify-center">
										{bot.avatarUrl ? <img src={bot.avatarUrl} alt={bot.name} className="h-full w-full object-cover" /> : <Bot size={20} className="text-(--accent)" />}
									</div>

									<div className="min-w-0">
										<a
											href={getEnvUrl(`https://app.xernerx.com/bots/${bot.id}`)}
											target="_blank"
											rel="noopener noreferrer"
											className="font-bold text-base text-(--text) hover:text-(--accent) transition-colors inline-flex items-center gap-1.5 truncate max-w-full"
										>
											<span className="truncate">{bot.name}</span>
											<ExternalLink size={13} className="opacity-50 shrink-0" />
										</a>
										<p className="text-xs text-(--text-muted) truncate mt-0.5">{bot.activity || `ID: ${bot.id}`}</p>
									</div>
								</div>

								<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${badgeClass}`}>
									<span className={`h-2 w-2 rounded-full ${dotClass}`} />
									{statusLabel}
								</span>
							</div>

							<Status24hBar points={botHistory?.[bot.id]} currentStatus={bot.status} />

							<div className="flex items-center justify-between pt-3 border-t border-(--border)/10 text-xs font-mono text-(--text-muted)">
								<span className="inline-flex items-center gap-1.5">
									<Server size={12} className="text-(--accent)" />
									{bot.guildCount > 0 ? `${bot.guildCount.toLocaleString()} ${t('info.status.botServers')}` : t('info.status.officialBot')}
								</span>
								<span className="inline-flex items-center gap-1.5">
									<Users size={12} className="text-(--accent)" />
									{bot.userCount > 0
										? `${bot.userCount.toLocaleString()}`
										: bot.shardCount > 0
											? `${bot.shardCount} ${t('info.status.botShards')}`
											: t('info.status.monitoredByXernerx')}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
