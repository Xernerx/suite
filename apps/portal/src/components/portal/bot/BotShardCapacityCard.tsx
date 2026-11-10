/** @format */
'use client';

import { useMemo } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Cpu } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

const DISCORD_SHARD_MAX = 2500;
const DISCORD_SHARD_WARN = 2000;
const DISCORD_SHARD_CRITICAL = 2400;

interface BotShardCapacityCardProps {
	latestStat: any;
}

interface ShardCapacityItem {
	id: string;
	guilds: number;
	maxGuilds: number;
	loadPercent: number;
	severity: 'healthy' | 'warning' | 'critical';
	ping: number | null;
}

export function BotShardCapacityCard({ latestStat }: BotShardCapacityCardProps) {
	const { t } = useDictionary();

	const { shardItems, totalShardCount, recommendedShards, alertCount, hasCritical } = useMemo(() => {
		const guildCount = Number(latestStat?.guildCount ?? latestStat?.servers ?? 0) || 0;
		const rawShards = Array.isArray(latestStat?.shards) ? latestStat.shards : [];
		const reportedShards = Number(latestStat?.shardCount) || 0;
		const effectiveShards = Math.max(1, reportedShards, rawShards.length);
		const defaultSpan = rawShards.length > 0 && effectiveShards > rawShards.length ? Math.ceil(effectiveShards / rawShards.length) : 1;

		const items: ShardCapacityItem[] =
			rawShards.length > 0
				? rawShards.map((sh: any, idx: number) => {
						const span = Array.isArray(sh?.shardIds) && sh.shardIds.length > 0 ? sh.shardIds.length : Number(sh?.shardCount) > 0 ? Math.floor(Number(sh.shardCount)) : defaultSpan;
						const guilds = Number(sh?.guildCount ?? sh?.guilds ?? sh?.servers ?? Math.round(guildCount / rawShards.length)) || 0;
						const maxGuilds = span * DISCORD_SHARD_MAX;
						const perShardGuilds = guilds / span;
						const loadPercent = Math.min(100, Math.round((guilds / maxGuilds) * 100));
						const severity: 'healthy' | 'warning' | 'critical' = perShardGuilds >= DISCORD_SHARD_CRITICAL ? 'critical' : perShardGuilds >= DISCORD_SHARD_WARN ? 'warning' : 'healthy';

						return {
							id: String(sh?.shardId ?? sh?.id ?? idx),
							guilds,
							maxGuilds,
							loadPercent,
							severity,
							ping: sh?.ping ?? sh?.latency ?? sh?.wsPing ?? null,
						};
					})
				: Array.from({ length: Math.min(16, effectiveShards) }, (_, idx) => {
						const guilds = Math.round(guildCount / effectiveShards);
						const loadPercent = Math.min(100, Math.round((guilds / DISCORD_SHARD_MAX) * 100));
						const severity: 'healthy' | 'warning' | 'critical' = guilds >= DISCORD_SHARD_CRITICAL ? 'critical' : guilds >= DISCORD_SHARD_WARN ? 'warning' : 'healthy';

						return {
							id: String(idx),
							guilds,
							maxGuilds: DISCORD_SHARD_MAX,
							loadPercent,
							severity,
							ping: null,
						};
					});

		const alerts = items.filter((i) => i.severity !== 'healthy');
		return {
			shardItems: items,
			totalShardCount: effectiveShards,
			recommendedShards: Math.max(1, Math.ceil((guildCount + 1) / DISCORD_SHARD_WARN)),
			alertCount: alerts.length,
			hasCritical: alerts.some((i) => i.severity === 'critical'),
		};
	}, [latestStat]);

	return (
		<div className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
			<div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-(--border)/10">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
						<Cpu className="w-5 h-5" />
					</div>
					<div>
						<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('app.bots.overview.shardCapacityTitle')}
						</h3>
						<p className="text-xs text-(--text-muted)">{t('app.bots.overview.shardCapacitySubtitle')}</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{alertCount > 0 ? (
						<>
							<span
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold ${
									hasCritical ? 'bg-(--accent-red)/15 border-(--accent-red)/30 text-(--accent-red)' : 'bg-(--accent-orange)/15 border-(--accent-orange)/30 text-(--accent-orange)'
								}`}
							>
								<AlertTriangle size={13} />
								{hasCritical ? t('app.bots.overview.shardCapacityCriticalPill') : t('app.bots.overview.shardCapacityWarningPill')}
							</span>
							<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-extrabold text-(--accent)">
								<Activity size={12} />
								{t('app.bots.overview.shardRecommendedPill', { count: recommendedShards })}
							</span>
						</>
					) : (
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--accent-green)/15 border border-(--accent-green)/30 text-xs font-extrabold text-(--accent-green)">
							<CheckCircle2 size={13} />
							{t('app.bots.overview.shardCapacityHealthyPill')}
						</span>
					)}
					<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-mono font-bold text-(--text-muted)">
						{t('app.bots.overview.shardsCount', { count: totalShardCount })}
					</span>
				</div>
			</div>

			{alertCount > 0 && (
				<div
					className={`flex items-start gap-2.5 rounded-2xl border p-3.5 text-xs ${
						hasCritical ? 'bg-(--accent-red)/10 border-(--accent-red)/30 text-(--accent-red)' : 'bg-(--accent-orange)/10 border-(--accent-orange)/30 text-(--accent-orange)'
					}`}
				>
					<AlertTriangle size={15} className="shrink-0 mt-0.5" />
					<span className="font-medium leading-relaxed">
						{t('app.bots.overview.shardWarningCallout', {
							count: alertCount,
							recommended: recommendedShards,
						})}
					</span>
				</div>
			)}

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
				{shardItems.map((sh) => {
					const cardTone =
						sh.severity === 'critical'
							? 'bg-(--accent-red)/10 border-(--accent-red)/35'
							: sh.severity === 'warning'
								? 'bg-(--accent-orange)/10 border-(--accent-orange)/35'
								: 'bg-(--background)/55 border-(--border)/10';

					const barTone = sh.severity === 'critical' ? 'bg-(--accent-red)' : sh.severity === 'warning' ? 'bg-(--accent-orange)' : 'bg-(--accent)';

					return (
						<div key={sh.id} className={`flex flex-col justify-between gap-2 p-3.5 rounded-2xl border ${cardTone}`}>
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-mono font-extrabold text-(--text)">{t('app.bots.overview.shardLabel', { id: sh.id })}</span>
								{sh.severity === 'critical' ? (
									<span className="text-[10px] font-bold text-(--accent-red)">{t('app.bots.overview.shardCriticalBadge')}</span>
								) : sh.severity === 'warning' ? (
									<span className="text-[10px] font-bold text-(--accent-orange)">{t('app.bots.overview.shardWarningBadge')}</span>
								) : (
									<span className="text-[10px] font-mono text-(--accent-green)">{t('app.bots.overview.shardHealthy')}</span>
								)}
							</div>

							<div className="flex flex-col gap-1">
								<div className="flex items-center justify-between text-[11px] font-mono text-(--text-muted)">
									<span>
										{t('app.bots.overview.shardCapacityRatio', {
											count: sh.guilds.toLocaleString(),
											max: sh.maxGuilds.toLocaleString(),
										})}
									</span>
									<span className={`font-bold ${sh.severity === 'critical' ? 'text-(--accent-red)' : sh.severity === 'warning' ? 'text-(--accent-orange)' : 'text-(--accent)'}`}>
										{t('app.bots.overview.shardCapacityPercent', { percent: sh.loadPercent })}
									</span>
								</div>
								<div className="h-1.5 w-full rounded-full bg-(--foreground)/40 overflow-hidden">
									<div className={`h-full rounded-full transition-all ${barTone}`} style={{ width: `${Math.max(2, sh.loadPercent)}%` }} />
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
