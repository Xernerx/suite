/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { EmptyState } from '@xernerx/ui';
import { Activity, Server, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { MetricsChart, TimeframeKey } from '../MetricsChart';

export default function Stats({ bot, id }: { bot: any; id: string }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();

	const [stats, setStats] = useState<any[]>([]);
	const [statsLoading, setStatsLoading] = useState(true);
	const [timeframe, setTimeframe] = useState<TimeframeKey>('24h');
	const [activeMetric, setActiveMetric] = useState<'guildCount' | 'userCount' | 'shardCount' | 'voteCount' | 'uptime' | 'valuation'>('guildCount');
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
		return <EmptyState title={t('app.bots.id.text8')} />;
	}

	const currentStats = stats[stats.length - 1];

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

		return {
			...s,
			uptime: s.onlineSince ? Math.max(0, (s.timestamp - s.onlineSince) / (1000 * 60 * 60)) : 0,
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

	return (
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
	);
}
