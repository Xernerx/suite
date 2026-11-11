/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { EmptyState } from '@xernerx/ui';
import { Activity, AlertTriangle, Cpu, Flame, Server, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { MetricsChart, TimeframeKey } from '../MetricsChart';

const DISCORD_SHARD_MAX = 2500;
const DISCORD_SHARD_WARN = 2000;
const DISCORD_SHARD_CRITICAL = 2400;

function computeLongestStreakDuration(stats: any[], currentStats: any): string | null {
	let maxMs = 0;
	let currentOnlineSince: number | null = null;
	let currentStart = 0;

	for (const s of stats) {
		const os = Number(s.onlineSince) || 0;
		const ts = Number(s.timestamp) || 0;
		if (os <= 0 || ts <= 0) continue;

		if (currentOnlineSince === null || Math.abs(os - currentOnlineSince) > 60_000) {
			currentOnlineSince = os;
			currentStart = os;
		}
		const span = Math.max(0, ts - currentStart);
		if (span > maxMs) maxMs = span;
	}

	if (maxMs <= 0 && currentStats?.onlineSince) {
		maxMs = Math.max(0, Date.now() - Number(currentStats.onlineSince));
	}
	if (maxMs <= 0) return null;

	const days = Math.floor(maxMs / (1000 * 60 * 60 * 24));
	const hours = Math.floor((maxMs / (1000 * 60 * 60)) % 24);
	const minutes = Math.floor((maxMs / 1000 / 60) % 60);
	if (days > 0) return `${days}d ${hours}h`;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

export default function Stats({ bot, id }: { bot: any; id: string }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();

	const [stats, setStats] = useState<any[]>([]);
	const [statsLoading, setStatsLoading] = useState(true);
	const [timeframe, setTimeframe] = useState<TimeframeKey>('24h');
	const [activeMetric, setActiveMetric] = useState<'guildCount' | 'userCount' | 'shardCount' | 'voteCount' | 'uptime' | 'valuation'>('guildCount');
	const [selectedShardId, setSelectedShardId] = useState<number | null>(null);
	const statsCache = useRef<Record<string, any[]>>({});

	useEffect(() => {
		if (!isReady) return;
		const fetchStats = async () => {
			if (statsCache.current[timeframe]) {
				setStats(statsCache.current[timeframe]);
				return;
			}

			setStatsLoading(true);
			try {
				let url = `https://api.xernerx.com/secure/bots/${id}/stats`;

				if (timeframe !== 'all') {
					const now = Date.now();
					const day = 24 * 60 * 60 * 1000;
					const limits: Record<string, number> = {
						'24h': now - day,
						'7d': now - 7 * day,
						'30d': now - 30 * day,
						'3m': now - 90 * day,
						'6m': now - 180 * day,
						'1y': now - 365 * day,
					};
					url += `?after=${limits[timeframe]}`;
				}

				const res = await fetch(getEnvUrl(url));
				if (res.ok) {
					const data = await res.json();
					const normalized = data.map((s: any) => {
						const ts = s.timestamp ? (typeof s.timestamp === 'string' && /^\d+$/.test(s.timestamp) ? Number(s.timestamp) : new Date(s.timestamp).getTime()) : 0;
						let sc = s.shardCount ?? s.shards ?? 0;
						if (Array.isArray(sc)) sc = sc.length;
						return {
							...s,
							timestamp: Number.isFinite(ts) ? ts : 0,
							guildCount: s.guildCount ?? s.servers ?? 0,
							userCount: s.userCount ?? s.users ?? 0,
							shardCount: typeof sc === 'object' ? 0 : sc,
							voteCount: s.voteCount ?? s.votes ?? 0,
						};
					});
					statsCache.current[timeframe] = normalized;
					setStats(normalized);
				}
			} catch (error) {
				console.error('Failed to fetch bot stats', error);
			} finally {
				setStatsLoading(false);
			}
		};
		fetchStats();
	}, [id, getEnvUrl, timeframe, isReady]);

	if (stats.length === 0 && statsLoading) {
		return (
			<div className="py-20 flex justify-center">
				<Loading variant="small" />
			</div>
		);
	}

	if (stats.length === 0) {
		return (
			<div data-bot-tour="stats" className="rounded-3xl transition-all duration-300">
				<EmptyState title={t('app.bots.id.text8')} />
			</div>
		);
	}

	const currentStats = stats[stats.length - 1];
	const longestStreakDuration = computeLongestStreakDuration(stats, currentStats);

	const mappedStats = stats.map((s) => {
		const baseline = s.guildCount * 0.1 + s.userCount * 0.001;
		const thirtyDaysPrior = s.timestamp - 30 * 24 * 60 * 60 * 1000;
		let pastStat = stats[0];
		for (let i = 0; i < stats.length; i++) {
			if (stats[i].timestamp >= thirtyDaysPrior) {
				pastStat = stats[i];
				break;
			}
		}

		const pastBaseline = pastStat ? pastStat.guildCount * 0.1 + pastStat.userCount * 0.001 : baseline;
		const growthRate = pastBaseline > 0 ? (baseline - pastBaseline) / pastBaseline : 0;
		const multiplier = Math.max(0.5, Math.min(3.0, 1 + growthRate));
		const valuation = baseline * multiplier;

		let uptimeHours = s.onlineSince ? Math.max(0, (s.timestamp - s.onlineSince) / (1000 * 60 * 60)) : 0;
		if (selectedShardId !== null && Array.isArray(s.shards)) {
			const matchedShard = s.shards.find((sh: any, idx: number) => Number(sh?.id ?? sh?.shardId ?? idx) === selectedShardId);
			if (matchedShard?.onlineSince) {
				uptimeHours = Math.max(0, (s.timestamp - Number(matchedShard.onlineSince)) / (1000 * 60 * 60));
			}
		}

		return {
			...s,
			uptime: uptimeHours,
			valuation,
		};
	});

	let chartData = mappedStats;
	if (timeframe !== 'all') {
		const now = Date.now();
		const day = 24 * 60 * 60 * 1000;
		const limits: Record<string, number> = {
			'24h': now - day,
			'7d': now - 7 * day,
			'30d': now - 30 * day,
			'3m': now - 90 * day,
			'6m': now - 180 * day,
			'1y': now - 365 * day,
		};
		chartData = mappedStats.filter((s) => s.timestamp >= limits[timeframe]);
	}

	const calculateUptime = () => {
		if (!currentStats.onlineSince) return t('common.unknown');
		const diff = Date.now() - currentStats.onlineSince;
		if (diff < 0) return t('common.justNow');

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
		const minutes = Math.floor((diff / 1000 / 60) % 60);

		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	};

	const metrics = [
		{ id: 'guildCount', label: t('app.bots.stats.servers'), displayValue: currentStats.guildCount ?? 0, icon: Server },
		{ id: 'userCount', label: t('app.bots.stats.users'), displayValue: currentStats.userCount ?? 0, icon: Users },
		{ id: 'shardCount', label: t('app.bots.stats.shards'), displayValue: currentStats.shardCount ?? 0, icon: Activity },
		{ id: 'voteCount', label: t('app.bots.stats.votes'), displayValue: bot.voteCount || currentStats.voteCount || 0, icon: ShieldCheck },
		{
			id: 'valuation',
			label: t('app.bots.stats.estValue'),
			displayValue: `$${Math.round(mappedStats[mappedStats.length - 1]?.valuation || 0).toLocaleString()}`,
			icon: TrendingUp,
		},
		{
			id: 'uptime',
			label: t('app.bots.id.text9'),
			displayValue: calculateUptime(),
			icon: Activity,
			accentGreenWhenInactive: true,
		},
	];

	const rawShards = Array.isArray(currentStats.shards) ? currentStats.shards : [];
	const totalShardCount = Math.max(1, Number(currentStats.shardCount) || rawShards.length || 1);
	const defaultClusterSpan = rawShards.length > 0 && totalShardCount > rawShards.length ? Math.ceil(totalShardCount / rawShards.length) : 1;

	const shardItems: Array<{
		id: string | number;
		guilds: number;
		maxGuilds: number;
		loadPercent: number;
		severity: 'healthy' | 'warning' | 'critical';
		ping: number | null;
		status: string;
	}> =
		rawShards.length > 0
			? rawShards.map((sh: any, idx: number) => {
					const shardSpan = Array.isArray(sh?.shardIds) && sh.shardIds.length > 0 ? sh.shardIds.length : Number(sh?.shardCount) > 0 ? Math.floor(Number(sh.shardCount)) : defaultClusterSpan;
					const guilds = Number(sh?.guilds ?? sh?.guildCount ?? sh?.servers ?? Math.round((currentStats.guildCount || 0) / rawShards.length));
					const maxGuilds = shardSpan * DISCORD_SHARD_MAX;
					const perShardGuilds = guilds / shardSpan;
					const loadPercent = Math.min(100, Math.round((guilds / maxGuilds) * 100));
					const severity: 'healthy' | 'warning' | 'critical' = perShardGuilds >= DISCORD_SHARD_CRITICAL ? 'critical' : perShardGuilds >= DISCORD_SHARD_WARN ? 'warning' : 'healthy';

					return {
						id: sh?.id ?? sh?.shardId ?? idx,
						guilds,
						maxGuilds,
						loadPercent,
						severity,
						ping: sh?.ping ?? sh?.latency ?? sh?.wsPing ?? null,
						status: String(sh?.status ?? 'online').toLowerCase(),
					};
				})
			: Array.from({ length: Math.min(16, totalShardCount) }, (_, idx) => {
					const guilds = Math.round((currentStats.guildCount || 0) / totalShardCount);
					const loadPercent = Math.min(100, Math.round((guilds / DISCORD_SHARD_MAX) * 100));
					const severity: 'healthy' | 'warning' | 'critical' = guilds >= DISCORD_SHARD_CRITICAL ? 'critical' : guilds >= DISCORD_SHARD_WARN ? 'warning' : 'healthy';

					return {
						id: idx,
						guilds,
						maxGuilds: DISCORD_SHARD_MAX,
						loadPercent,
						severity,
						ping: null,
						status: 'online',
					};
				});

	const alertShardsCount = shardItems.filter((sh) => sh.severity !== 'healthy').length;
	const hasCriticalShard = shardItems.some((sh) => sh.severity === 'critical');

	const customTelemetryEntries =
		currentStats.data && typeof currentStats.data === 'object' && !Array.isArray(currentStats.data)
			? Object.entries(currentStats.data).filter(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
			: [];

	return (
		<div data-bot-tour="stats" className="flex flex-col rounded-3xl transition-all duration-300" style={{ gap: 'var(--ui-gap)' }}>
			<MetricsChart
				metrics={metrics}
				activeMetric={activeMetric}
				onMetricChange={(m) => setActiveMetric(m as typeof activeMetric)}
				timeframe={timeframe}
				onTimeframeChange={setTimeframe}
				data={chartData}
				allTimeData={mappedStats}
				loading={statsLoading}
				titleSuffix={t('app.bots.id.text10')}
				gridColsClass="grid-cols-1 sm:grid-cols-3 lg:grid-cols-6"
				formatGain={(gain, m) => (m === 'uptime' ? gain.toFixed(1) : m === 'valuation' ? `$${Math.round(gain).toLocaleString()}` : Math.round(gain).toLocaleString())}
				formatPeak={(peak, m) => (m === 'uptime' ? `${peak.toFixed(1)}h` : m === 'valuation' ? `$${Math.round(peak).toLocaleString()}` : Math.round(peak).toLocaleString())}
				formatYAxis={(val, m) => {
					if (m === 'uptime') return `${val.toFixed(0)}h`;
					if (m === 'valuation') return val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val.toFixed(0)}`;
					return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val);
				}}
				formatTooltip={(val, m) => (m === 'valuation' ? `$${Math.round(val).toLocaleString()}` : Math.round(val).toLocaleString())}
			/>

			{/* Shard Health & Telemetry Matrix */}
			<div
				className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
			>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
							<Cpu className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.bots.overview.shardMatrixTitle')}
							</h3>
							<p className="text-xs text-(--text-muted)">{t('app.bots.overview.shardMatrixSubtitle')}</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{selectedShardId !== null && (
							<button
								type="button"
								onClick={() => setSelectedShardId(null)}
								className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--accent) text-(--accent-contrast) text-xs font-extrabold cursor-pointer transition-all"
							>
								{t('app.bots.overview.shardUptimeFilter', { id: selectedShardId })} · {t('app.bots.overview.allShardsUptime')}
							</button>
						)}
						{alertShardsCount > 0 ? (
							<span
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold ${
									hasCriticalShard
										? 'bg-(--accent-red)/15 border-(--accent-red)/30 text-(--accent-red)'
										: 'bg-(--accent-orange)/15 border-(--accent-orange)/30 text-(--accent-orange)'
								}`}
							>
								<AlertTriangle size={12} />
								{t('app.bots.overview.shardAlertsPill', { count: alertShardsCount })}
							</span>
						) : (
							<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-mono font-bold text-(--text-muted)">
								{t('app.bots.overview.shardMaxCapPill')}
							</span>
						)}
						{longestStreakDuration && (
							<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-extrabold text-(--accent)">
								<Flame size={12} />
								{t('app.bots.overview.longestStreakLabel', { duration: longestStreakDuration })}
							</span>
						)}
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-extrabold text-(--accent)">
							<Activity size={12} />
							{t('app.bots.overview.shardsCount', { count: totalShardCount })}
						</span>
					</div>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
					{shardItems.map((sh: any) => {
						const isOnline = sh.status === 'online' || sh.status === 'ready' || sh.status === '0';
						const shardNum = Number(sh.id);
						const isShardSelected = selectedShardId === shardNum;
						const borderClass = isShardSelected
							? 'bg-(--accent)/15 border-(--accent) shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
							: sh.severity === 'critical'
								? 'bg-(--accent-red)/10 border-(--accent-red)/35 hover:border-(--accent-red)'
								: sh.severity === 'warning'
									? 'bg-(--accent-orange)/10 border-(--accent-orange)/35 hover:border-(--accent-orange)'
									: 'bg-(--background)/55 border-(--border)/10 hover:border-(--accent)/30';

						const barColorClass = sh.severity === 'critical' ? 'bg-(--accent-red)' : sh.severity === 'warning' ? 'bg-(--accent-orange)' : 'bg-(--accent)';

						return (
							<button
								key={sh.id}
								type="button"
								onClick={() => {
									if (isShardSelected) {
										setSelectedShardId(null);
									} else {
										setSelectedShardId(shardNum);
										setActiveMetric('uptime');
									}
								}}
								className={`flex flex-col justify-between gap-2 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${borderClass}`}
							>
								<div className="flex items-center justify-between gap-2 w-full">
									<span className="text-xs font-mono font-extrabold text-(--text)">{t('app.bots.overview.shardLabel', { id: sh.id })}</span>
									<span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-(--accent-green) shadow-[0_0_8px_var(--accent-green)]' : 'bg-(--accent-orange)'}`} />
								</div>

								<div className="flex flex-col gap-1 w-full">
									<div className="flex items-center justify-between text-[11px] font-mono text-(--text-muted) w-full">
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
										<div className={`h-full rounded-full transition-all ${barColorClass}`} style={{ width: `${Math.max(2, sh.loadPercent)}%` }} />
									</div>
								</div>

								<div className="flex items-center justify-between text-[10px] font-mono text-(--text-muted) w-full">
									{sh.severity === 'critical' ? (
										<span className="text-(--accent-red) font-bold">{t('app.bots.overview.shardCriticalBadge')}</span>
									) : sh.severity === 'warning' ? (
										<span className="text-(--accent-orange) font-bold">{t('app.bots.overview.shardWarningBadge')}</span>
									) : (
										<span>{t('app.bots.overview.shardHealthy')}</span>
									)}
									{sh.ping !== null && sh.ping !== undefined && <span className="text-(--accent) font-bold">{t('app.bots.overview.shardPing', { ping: sh.ping })}</span>}
								</div>
							</button>
						);
					})}
				</div>

				{customTelemetryEntries.length > 0 && (
					<div className="flex flex-col gap-2.5 pt-3 border-t border-(--border)/10">
						<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('app.bots.overview.customTelemetryTitle')}</span>
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
							{customTelemetryEntries.map(([key, val]) => (
								<div key={key} className="flex flex-col gap-0.5 p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
									<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted) truncate">{key}</span>
									<span className="text-sm font-mono font-extrabold text-(--accent) truncate">{String(val)}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
