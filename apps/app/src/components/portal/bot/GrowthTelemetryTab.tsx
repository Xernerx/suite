/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Calendar, Server, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Tabs } from '@xernerx/ui';

interface GrowthTelemetryTabProps {
	botConfig: any;
	botId: string;
}

type MetricKey = 'guildCount' | 'userCount' | 'shardCount' | 'voteCount';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function GrowthTelemetryTab({ botConfig, botId }: GrowthTelemetryTabProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();

	const [stats, setStats] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeMetric, setActiveMetric] = useState<MetricKey>('guildCount');
	const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');
	const [hoverPoint, setHoverPoint] = useState<{ timestamp: number; val: number } | null>(null);

	useEffect(() => {
		if (!isReady || !botId) return;
		let active = true;

		const fetchStats = async () => {
			setLoading(true);
			try {
				const thirtyDaysAgo = Date.now() - 30 * DAY_MS;
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/stats?after=${thirtyDaysAgo}`));
				if (res.ok && active) {
					const raw = await res.json();
					if (Array.isArray(raw)) {
						const normalized = raw
							.map((s: any) => ({
								timestamp: s.timestamp ? (typeof s.timestamp === 'string' && /^\d+$/.test(s.timestamp) ? Number(s.timestamp) : new Date(s.timestamp).getTime()) : Date.now(),
								guildCount: Number(s.guildCount ?? s.servers ?? 0) || 0,
								userCount: Number(s.userCount ?? s.users ?? 0) || 0,
								shardCount: Array.isArray(s.shardCount) ? s.shardCount.length : Number(s.shardCount ?? s.shards ?? 0) || 0,
								voteCount: Number(s.voteCount ?? s.votes ?? 0) || 0,
							}))
							.sort((a, b) => a.timestamp - b.timestamp);
						setStats(normalized);
					}
				}
			} catch (err) {
				console.error('Failed to fetch 30d growth stats:', err);
			} finally {
				if (active) setLoading(false);
			}
		};

		fetchStats();
		return () => {
			active = false;
		};
	}, [botId, getEnvUrl, isReady]);

	const fallbackPoint = useMemo(
		() => ({
			timestamp: Date.now(),
			guildCount: Number(botConfig?.stats?.guildCount ?? botConfig?.guildCount ?? 0) || 0,
			userCount: Number(botConfig?.stats?.userCount ?? botConfig?.userCount ?? 0) || 0,
			shardCount: Number(botConfig?.stats?.shardCount ?? botConfig?.shardCount ?? 1) || 1,
			voteCount: Number(botConfig?.voteCount ?? botConfig?.stats?.voteCount ?? 0) || 0,
		}),
		[botConfig]
	);

	// Build 30 daily buckets across the last 30 days so both Area and Bar charts always render a complete 30-day timeline
	const dailyBuckets = useMemo(() => {
		const now = new Date();
		const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
		const sorted = stats.length > 0 ? stats : [fallbackPoint];
		const earliest = sorted[0];

		const buckets: {
			timestamp: number;
			dateLabel: string;
			guildCount: number;
			userCount: number;
			shardCount: number;
			voteCount: number;
		}[] = [];

		let cursorIdx = 0;
		let lastKnown = earliest;

		for (let i = 29; i >= 0; i--) {
			const dayEnd = todayEnd - i * DAY_MS;
			const dayDisplay = new Date(dayEnd - 12 * 60 * 60 * 1000);

			while (cursorIdx < sorted.length && sorted[cursorIdx].timestamp <= dayEnd) {
				lastKnown = sorted[cursorIdx];
				cursorIdx++;
			}

			buckets.push({
				timestamp: dayDisplay.getTime(),
				dateLabel: dayDisplay.toLocaleDateString([], { month: 'short', day: 'numeric' }),
				guildCount: Number(lastKnown.guildCount) || 0,
				userCount: Number(lastKnown.userCount) || 0,
				shardCount: Number(lastKnown.shardCount) || 0,
				voteCount: Number(lastKnown.voteCount) || 0,
			});
		}

		return buckets;
	}, [stats, fallbackPoint]);

	if (loading) {
		return (
			<div className="py-16 flex justify-center">
				<Loading variant="small" />
			</div>
		);
	}

	const firstSnap = stats.length > 0 ? stats[0] : dailyBuckets[0];
	const latestSnap = stats.length > 0 ? stats[stats.length - 1] : dailyBuckets[dailyBuckets.length - 1];

	const metricCards: {
		id: MetricKey;
		label: string;
		icon: any;
		current: number;
		delta: number;
		percent: number;
	}[] = [
		{ id: 'guildCount' as const, label: t('app.portal.bot.growth.metrics.servers'), icon: Server },
		{ id: 'userCount' as const, label: t('app.portal.bot.growth.metrics.users'), icon: Users },
		{ id: 'shardCount' as const, label: t('app.portal.bot.growth.metrics.shards'), icon: Activity },
		{ id: 'voteCount' as const, label: t('app.portal.bot.growth.metrics.votes'), icon: ShieldCheck },
	].map((m) => {
		const startVal = Number(firstSnap[m.id]) || 0;
		const endVal = Number(latestSnap[m.id]) || 0;
		const delta = endVal - startVal;
		const percent = startVal > 0 ? Math.round((delta / startVal) * 100) : endVal > 0 ? 100 : 0;
		return {
			...m,
			current: endVal,
			delta,
			percent,
		};
	});

	const latestBucket = dailyBuckets[dailyBuckets.length - 1];
	const inspectedPoint = hoverPoint || {
		timestamp: latestBucket.timestamp,
		val: Number(latestBucket[activeMetric]) || 0,
	};
	const activeMeta = metricCards.find((m) => m.id === activeMetric) || metricCards[0];

	const modeTabs = [
		{ id: 'area', label: t('app.portal.bot.growth.areaMode'), icon: <TrendingUp size={13} /> },
		{ id: 'bar', label: t('app.portal.bot.growth.barMode'), icon: <BarChart3 size={13} /> },
	];

	const formatYAxis = (val: number) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(Math.round(val)));

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* 30-Day Delta Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{metricCards.map((card) => {
					const Icon = card.icon;
					const isSelected = activeMetric === card.id;
					const isPositive = card.delta >= 0;

					return (
						<button
							key={card.id}
							type="button"
							onClick={() => {
								setActiveMetric(card.id);
								setHoverPoint(null);
							}}
							className={`flex flex-col justify-between rounded-3xl border p-5 text-left transition-all cursor-pointer ${
								isSelected
									? 'bg-(--foreground)/50 border-(--accent) shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
									: 'bg-(--foreground)/30 border-(--border)/10 hover:border-(--accent)/40'
							}`}
						>
							<div className="flex items-center justify-between gap-2 w-full mb-3">
								<span className="text-xs font-extrabold uppercase tracking-wider text-(--text-muted)">{card.label}</span>
								<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
									<Icon size={15} />
								</div>
							</div>

							<div className="text-2xl font-extrabold text-(--text) font-mono" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{card.current.toLocaleString()}
							</div>

							<div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-(--border)/10 text-xs">
								<span className={`inline-flex items-center gap-0.5 font-mono font-bold ${isPositive ? 'text-(--accent-green)' : 'text-(--accent-orange)'}`}>
									{isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
									{isPositive ? `+${card.delta.toLocaleString()}` : card.delta.toLocaleString()} ({isPositive ? `+${card.percent}%` : `${card.percent}%`})
								</span>
								<span className="text-[11px] text-(--text-muted)">{t('app.portal.bot.growth.last30Days')}</span>
							</div>
						</button>
					);
				})}
			</div>

			{/* Interactive 30-Day Growth Chart Card */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-(--border)/10">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
							{chartMode === 'area' ? <TrendingUp size={18} /> : <BarChart3 size={18} />}
						</div>
						<div>
							<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.portal.bot.growth.chartTitle', { metric: activeMeta.label })}
							</h3>
							<p className="text-xs text-(--text-muted)">{t('app.portal.bot.growth.chartSubtitle')}</p>
						</div>
					</div>

					<Tabs size="sm" fullWidth={false} tabs={modeTabs} activeTab={chartMode} onChange={(id) => setChartMode(id as 'area' | 'bar')} />
				</div>

				{/* Inspected Data Point Readout */}
				<div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--background)/50 border border-(--border)/10 px-4 py-2.5 text-xs">
					<div className="flex items-center gap-2 text-(--text-muted)">
						<Calendar size={13} className="text-(--accent)" />
						<span>{new Date(inspectedPoint.timestamp).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-(--text-muted)">{activeMeta.label}:</span>
						<span className="font-mono font-extrabold text-sm text-(--accent)">{inspectedPoint.val.toLocaleString()}</span>
					</div>
				</div>

				{/* Chart Canvas */}
				<div className="w-full h-72 rounded-2xl bg-(--background)/40 border border-(--border)/10 p-4">
					<ResponsiveContainer width="100%" height="100%">
						{chartMode === 'area' ? (
							<AreaChart
								key={`area-${activeMetric}`}
								data={dailyBuckets}
								margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
								onMouseMove={(state: any) => {
									const payload = state?.activePayload?.[0]?.payload;
									if (payload) {
										setHoverPoint({ timestamp: payload.timestamp, val: Number(payload[activeMetric]) || 0 });
									}
								}}
								onMouseLeave={() => setHoverPoint(null)}
							>
								<defs>
									<linearGradient id="growthAreaGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
										<stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.1} vertical={false} />
								<XAxis dataKey="dateLabel" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} minTickGap={24} />
								<YAxis
									stroke="var(--text-muted)"
									fontSize={11}
									tickLine={false}
									axisLine={false}
									dx={-6}
									allowDecimals={false}
									domain={[0, (dataMax: number) => Math.max(Math.ceil((Number(dataMax) || 0) * 1.25), 4)]}
									tickFormatter={formatYAxis}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: 'var(--foreground)',
										border: '1px solid color-mix(in srgb, var(--border) 15%, transparent)',
										borderRadius: '1rem',
										boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
									}}
									itemStyle={{ color: 'var(--text)', fontWeight: 'bold' }}
									labelStyle={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}
									formatter={(value: any) => [Number(value).toLocaleString(), activeMeta.label]}
								/>
								<Area
									type="monotone"
									dataKey={activeMetric}
									name={activeMeta.label}
									stroke="var(--accent)"
									strokeWidth={3}
									fill="url(#growthAreaGrad)"
									activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--background)', strokeWidth: 2 }}
								/>
							</AreaChart>
						) : (
							<BarChart
								key={`bar-${activeMetric}`}
								data={dailyBuckets}
								margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
								onMouseMove={(state: any) => {
									const payload = state?.activePayload?.[0]?.payload;
									if (payload) {
										setHoverPoint({ timestamp: payload.timestamp, val: Number(payload[activeMetric]) || 0 });
									}
								}}
								onMouseLeave={() => setHoverPoint(null)}
							>
								<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.1} vertical={false} />
								<XAxis dataKey="dateLabel" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={8} minTickGap={24} />
								<YAxis
									stroke="var(--text-muted)"
									fontSize={11}
									tickLine={false}
									axisLine={false}
									dx={-6}
									allowDecimals={false}
									domain={[0, (dataMax: number) => Math.max(Math.ceil((Number(dataMax) || 0) * 1.25), 4)]}
									tickFormatter={formatYAxis}
								/>
								<Tooltip
									cursor={{ fill: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
									contentStyle={{
										backgroundColor: 'var(--foreground)',
										border: '1px solid color-mix(in srgb, var(--border) 15%, transparent)',
										borderRadius: '1rem',
										boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
									}}
									itemStyle={{ color: 'var(--text)', fontWeight: 'bold' }}
									labelStyle={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}
									formatter={(value: any) => [Number(value).toLocaleString(), activeMeta.label]}
								/>
								<Bar dataKey={activeMetric} name={activeMeta.label} fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={24} />
							</BarChart>
						)}
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}
