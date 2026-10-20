/** @format */
'use client';

import { MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDictionary } from '@xernerx/providers';

interface ServerStatsViewProps {
	server: any;
	activeMetric: string;
	handleMetricSwitch: (newMetric: string) => void;
	timeframe: '24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all';
	setTimeframe: (tf: '24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all') => void;
	isUndrawing: boolean;
}

export function ServerStatsView({ server, activeMetric, handleMetricSwitch, timeframe, setTimeframe, isUndrawing }: ServerStatsViewProps) {
	const { t } = useDictionary();

	const stats = (server.stats || []).map((s: any) => ({
		...s,
		timestamp: new Date(s.timestamp).getTime(),
	}));

	if (stats.length === 0) return <div className="text-center text-(--text-muted) py-12 border border-(--border)/10 rounded-3xl">{t('app.servers.noStatsRecorded')}</div>;

	const currentStats = stats[stats.length - 1];

	let chartData = stats;

	if (timeframe !== 'all') {
		const now = Date.now();
		const day = 24 * 60 * 60 * 1000;
		const limits = {
			'24h': now - day,
			'7d': now - 7 * day,
			'30d': now - 30 * day,
			'3m': now - 90 * day,
			'6m': now - 180 * day,
			'1y': now - 365 * day,
		};
		chartData = stats.filter((s: any) => s.timestamp >= limits[timeframe]);
	}

	const highestValue = Math.max(...stats.map((s: any) => s[activeMetric] || 0));
	const firstPoint = chartData[0]?.[activeMetric] || 0;
	const lastPoint = chartData[chartData.length - 1]?.[activeMetric] || 0;
	const gainLoss = lastPoint - firstPoint;
	const gainPercentage = firstPoint > 0 ? ((gainLoss / firstPoint) * 100).toFixed(1) : '0';

	return (
		<div className="flex flex-col gap-6">
			{/* Metrics Row */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{[
					{ id: 'members', label: t('app.dashboard.stats.members'), value: currentStats.members, icon: Users },
					{ id: 'messages', label: t('app.dashboard.stats.messages'), value: currentStats.messages, icon: MessageSquare },
					{ id: 'voteCount', label: t('app.bots.stats.votes'), value: currentStats.voteCount || server.voteCount, icon: ShieldCheck },
				].map((metric) => (
					<button
						key={metric.id}
						onClick={() => handleMetricSwitch(metric.id)}
						className={`bg-(--foreground)/50 border p-6 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md transition-all ${
							activeMetric === metric.id
								? 'border-(--accent) shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_20%,transparent)] scale-105 z-10'
								: 'border-(--border)/10 hover:border-(--accent)/50'
						}`}
					>
						<metric.icon className={`w-8 h-8 ${activeMetric === metric.id ? 'text-(--accent)' : 'text-(--text-muted)'}`} />
						<div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{metric.value?.toLocaleString() || '0'}
						</div>
						<div className={`text-sm font-semibold uppercase tracking-wider ${activeMetric === metric.id ? 'text-(--accent)' : 'text-(--text-muted)'}`}>{metric.label}</div>
					</button>
				))}
			</div>

			{/* Chart Section */}
			<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 md:p-8 rounded-3xl backdrop-blur-md">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
					<div>
						<h3 className="text-2xl font-bold mb-1 capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{activeMetric === 'voteCount' ? t('app.bots.stats.votes') : activeMetric === 'members' ? t('app.dashboard.stats.members') : t('app.dashboard.stats.messages')}{' '}
							{t('app.servers.overTime')}
						</h3>
						<div className="flex flex-wrap items-center gap-4 text-sm font-medium">
							<span className={`${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-md`}>
								{gainLoss > 0 ? '+' : ''}
								{gainLoss.toLocaleString()} ({gainPercentage}%)
							</span>
							<span className="text-(--text-muted) bg-(--background) px-2 py-1 rounded-md border border-(--border)/10">
								{t('app.bots.id.text12')} {highestValue.toLocaleString()}
							</span>
						</div>
					</div>

					{/* Timeframe Toggles */}
					<div className="flex bg-(--background) p-2 rounded-xl border border-(--border)/10 gap-1 w-full md:w-auto overflow-x-auto shadow-inner hide-scrollbar">
						{(['24h', '7d', '30d', '3m', '6m', '1y', 'all'] as const).map((tf) => (
							<button
								key={tf}
								onClick={() => setTimeframe(tf)}
								className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex-none ${
									timeframe === tf ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)'
								}`}
							>
								{tf === '24h' ? '24h' : tf === '7d' ? '7d' : tf === '30d' ? '1m' : tf === '3m' ? '3m' : tf === '6m' ? '6m' : tf === '1y' ? '1y' : t('app.bots.stats.all')}
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
							/>

							<Line
								type="monotone"
								dataKey={activeMetric}
								name={activeMetric === 'voteCount' ? t('app.bots.stats.votes') : activeMetric === 'members' ? t('app.dashboard.stats.members') : t('app.dashboard.stats.messages')}
								stroke="var(--accent)"
								strokeWidth={4}
								dot={chartData.length <= 1 ? { r: 6, fill: 'var(--accent)', strokeWidth: 0 } : false}
								activeDot={{ r: 8, fill: 'var(--accent)', strokeWidth: 0, stroke: 'var(--background)', strokeOpacity: 0.5 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}
