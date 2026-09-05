'use client';

import { useEffect, useState, useRef } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Server, Users, Activity, ShieldCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Stats({ bot, id }: { bot: any; id: string }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();

	const [stats, setStats] = useState<any[]>([]);
	const [statsLoading, setStatsLoading] = useState(true);
	const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all'>('24h');
	const [activeMetric, setActiveMetric] = useState<'guildCount' | 'userCount' | 'shardCount' | 'voteCount' | 'uptime'>('guildCount');
	const [isUndrawing, setIsUndrawing] = useState(false);
	const statsCache = useRef<Record<string, any[]>>({});

	const handleMetricSwitch = (metricId: any) => {
		if (metricId === activeMetric || isUndrawing) return;
		setIsUndrawing(true);
		setTimeout(() => {
			setActiveMetric(metricId);
			setIsUndrawing(false);
		}, 400);
	};

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
					const after = limits[timeframe];
					url += `?after=${after}`;
				}

				const res = await fetch(getEnvUrl(url));
				if (res.ok) {
					const data = await res.json();
					const normalized = data.map((s: any) => {
						let dateObj;
						if (s.timestamp) dateObj = new Date(s.timestamp);
						else if (s.createdAt) dateObj = new Date(s.createdAt);
						let sc = s.shardCount ?? s.shards ?? 0;
						if (Array.isArray(sc)) sc = sc.length;
						return {
							...s,
							timestamp: dateObj ? dateObj.getTime() : 0,
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

	if (stats.length === 0 && statsLoading)
		return (
			<div className="py-20 flex justify-center">
				<Loading variant="small" />
			</div>
		);

	if (stats.length === 0) return <div className="text-center text-(--text-muted) py-12 border border-(--border)/10 rounded-3xl">{t('app.bots.id.text8')}</div>;

	const currentStats = stats[stats.length - 1];

	let chartData = stats;

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
		chartData = stats.filter((s) => s.timestamp >= limits[timeframe]);
	}

	chartData = chartData.map((s) => ({
		...s,
		uptime: s.onlineSince ? Math.max(0, (s.timestamp - s.onlineSince) / (1000 * 60 * 60)) : 0,
	}));

	const highestValue = Math.max(...stats.map((s) => s[activeMetric] || 0));
	const firstPoint = chartData[0]?.[activeMetric] || 0;
	const lastPoint = chartData[chartData.length - 1]?.[activeMetric] || 0;
	const gainLoss = lastPoint - firstPoint;
	const gainPercentage = firstPoint > 0 ? ((gainLoss / firstPoint) * 100).toFixed(1) : '0';

	const calculateUptime = () => {
		if (!currentStats.onlineSince) return 'Unknown';
		const diff = Date.now() - currentStats.onlineSince;
		if (diff < 0) return 'Just now';

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
		const minutes = Math.floor((diff / 1000 / 60) % 60);

		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
				{[
					{ id: 'guildCount', label: 'Servers', value: currentStats.guildCount, icon: Server },
					{ id: 'userCount', label: 'Users', value: currentStats.userCount, icon: Users },
					{ id: 'shardCount', label: 'Shards', value: currentStats.shardCount, icon: Activity },
					{ id: 'voteCount', label: 'Votes', value: bot.voteCount || currentStats.voteCount || 0, icon: ShieldCheck },
				].map((metric) => (
					<button
						key={metric.label}
						onClick={() => handleMetricSwitch(metric.id)}
						className={`bg-(--foreground)/50 border p-6 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md transition-all ${activeMetric === metric.id ? 'border-(--accent) shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_20%,transparent)] scale-105 z-10' : 'border-(--border)/10 hover:border-(--accent)/50'}`}
					>
						<metric.icon className={`w-8 h-8 ${activeMetric === metric.id ? 'text-(--accent)' : 'text-(--text-muted)'}`} />
						<div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{metric.value?.toLocaleString() || '0'}
						</div>
						<div className={`text-sm font-semibold uppercase tracking-wider ${activeMetric === metric.id ? 'text-(--accent)' : 'text-(--text-muted)'}`}>{metric.label}</div>
					</button>
				))}

				<button
					onClick={() => handleMetricSwitch('uptime')}
					className={`bg-(--foreground)/50 border p-6 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md transition-all ${activeMetric === 'uptime' ? 'border-(--accent) shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_20%,transparent)] scale-105 z-10' : 'border-(--border)/10 hover:border-(--accent)/50'}`}
				>
					<Activity className={`w-8 h-8 ${activeMetric === 'uptime' ? 'text-(--accent)' : 'text-green-400'}`} />
					<div className={`text-3xl font-bold ${activeMetric === 'uptime' ? 'text-white' : 'text-green-400'}`} style={{ fontFamily: 'var(--font-fredoka)' }}>
						{calculateUptime()}
					</div>
					<div className={`text-sm font-semibold uppercase tracking-wider ${activeMetric === 'uptime' ? 'text-(--accent)' : 'text-(--text-muted)'}`}>{t('app.bots.id.text9')}</div>
				</button>
			</div>

			<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 md:p-8 rounded-3xl backdrop-blur-md">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
					<div>
						<h3 className="text-2xl font-bold mb-1 capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{activeMetric.replace('Count', '')}
							{t('app.bots.id.text10')}
						</h3>
						<div className="flex flex-wrap items-center gap-4 text-sm font-medium">
							<span className={`${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-md`}>
								{gainLoss > 0 ? '+' : ''}
								{activeMetric === 'uptime' ? gainLoss.toFixed(1) : gainLoss.toLocaleString()} ({gainPercentage}
								{t('app.bots.id.text11')}
							</span>
							<span className="text-(--text-muted) bg-(--background) px-2 py-1 rounded-md border border-(--border)/10">
								{t('app.bots.id.text12')}
								{activeMetric === 'uptime' ? `${highestValue.toFixed(1)}h` : highestValue.toLocaleString()}
							</span>
						</div>
					</div>

					<div className="flex bg-(--background) p-2 rounded-xl border border-(--border)/10 gap-1 w-full md:w-auto overflow-x-auto shadow-inner hide-scrollbar">
						{(['24h', '7d', '30d', '3m', '6m', '1y', 'all'] as const).map((tf) => (
							<button
								key={tf}
								onClick={() => setTimeframe(tf)}
								className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex-none ${
									timeframe === tf ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)'
								}`}
							>
								{tf === '24h' ? '24h' : tf === '7d' ? '7d' : tf === '30d' ? '1m' : tf === '3m' ? '3m' : tf === '6m' ? '6m' : tf === '1y' ? '1y' : 'All'}
							</button>
						))}
					</div>
				</div>

				<div
					className="h-[400px] w-full mt-4"
					style={{
						clipPath: isUndrawing ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)',
						transition: 'clip-path 400ms ease-in-out',
					}}
				>
					{statsLoading ? (
						<div className="w-full h-full flex items-center justify-center">
							<Loading />
						</div>
					) : (
						<ResponsiveContainer width="100%" height="100%">
							<LineChart key={activeMetric} data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.1} vertical={false} />
								<XAxis
									dataKey="timestamp"
									type="number"
									domain={['dataMin', 'dataMax']}
									tickFormatter={(time) => {
										const date = new Date(time);
										if (timeframe === '24h') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
										if (timeframe === 'all' || timeframe === '1y') return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
										return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
									}}
									stroke="var(--text-muted)"
									fontSize={12}
									tickLine={false}
									axisLine={false}
									dy={10}
									minTickGap={30}
								/>

								<YAxis
									stroke="var(--text-muted)"
									fontSize={12}
									tickLine={false}
									axisLine={false}
									dx={-10}
									domain={['auto', 'auto']}
									tickFormatter={(val) => {
										if (activeMetric === 'uptime') return `${val.toFixed(0)}h`;
										return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val;
									}}
								/>

								<Tooltip
									contentStyle={{
										backgroundColor: 'var(--foreground)',
										border: '1px solid color-mix(in srgb, var(--border) 10%, transparent)',
										borderRadius: '1rem',
										boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
									}}
									itemStyle={{ color: 'var(--text)', fontWeight: 'bold' }}
									labelFormatter={(label) => new Date(label as string | number).toLocaleString()}
									separator=" "
									formatter={(value: any) => value.toLocaleString()}
								/>

								<Line
									type="monotone"
									dataKey={activeMetric}
									name={
										activeMetric === 'guildCount'
											? 'Servers'
											: activeMetric === 'userCount'
												? 'Users'
												: activeMetric === 'shardCount'
													? 'Shards'
													: activeMetric === 'voteCount'
														? 'Votes'
														: 'Uptime'
									}
									stroke="var(--accent)"
									strokeWidth={4}
									dot={chartData.length <= 1 ? { r: 6, fill: 'var(--accent)', strokeWidth: 0 } : false}
									activeDot={{ r: 8, fill: 'var(--accent)', strokeWidth: 0, stroke: 'var(--background)', strokeOpacity: 0.5 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					)}
				</div>
			</div>
		</div>
	);
}
