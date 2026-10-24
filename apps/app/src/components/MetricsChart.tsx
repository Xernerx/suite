/** @format */
'use client';

import React, { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Tabs } from '@xernerx/ui';

export type TimeframeKey = '24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all';

export interface MetricDescriptor {
	id: string;
	label: string;
	displayValue: string | number;
	icon: React.ComponentType<{ className?: string }>;
	accentGreenWhenInactive?: boolean;
}

export interface MetricsChartProps {
	metrics: MetricDescriptor[];
	activeMetric: string;
	onMetricChange: (id: string) => void;
	timeframe: TimeframeKey;
	onTimeframeChange: (tf: TimeframeKey) => void;
	data: any[];
	allTimeData?: any[];
	loading?: boolean;
	titleSuffix?: string;
	gridColsClass?: string;
	formatGain?: (gain: number, metricId: string) => string;
	formatPeak?: (peak: number, metricId: string) => string;
	formatYAxis?: (val: number, metricId: string) => string;
	formatTooltip?: (val: number, metricId: string) => string;
}

export function MetricsChart({
	metrics,
	activeMetric,
	onMetricChange,
	timeframe,
	onTimeframeChange,
	data,
	allTimeData,
	loading = false,
	titleSuffix,
	gridColsClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
	formatGain,
	formatPeak,
	formatYAxis,
	formatTooltip,
}: MetricsChartProps) {
	const { t } = useDictionary();
	const [isUndrawing, setIsUndrawing] = useState(false);

	const handleSwitch = (metricId: string) => {
		if (metricId === activeMetric || isUndrawing) return;
		setIsUndrawing(true);
		setTimeout(() => {
			onMetricChange(metricId);
			setIsUndrawing(false);
		}, 350);
	};

	const activeDescriptor = metrics.find((m) => m.id === activeMetric) || metrics[0];
	const sourceForPeak = allTimeData && allTimeData.length > 0 ? allTimeData : data;
	const highestValue = sourceForPeak.length > 0 ? Math.max(...sourceForPeak.map((s) => Number(s[activeMetric]) || 0)) : 0;
	const firstPoint = Number(data[0]?.[activeMetric]) || 0;
	const lastPoint = Number(data[data.length - 1]?.[activeMetric]) || 0;
	const gainLoss = lastPoint - firstPoint;
	const gainPercentage = firstPoint > 0 ? ((gainLoss / firstPoint) * 100).toFixed(1) : '0';

	const timeframeTabs = [
		{ id: '24h', label: '24h' },
		{ id: '7d', label: '7d' },
		{ id: '30d', label: '1m' },
		{ id: '3m', label: '3m' },
		{ id: '6m', label: '6m' },
		{ id: '1y', label: '1y' },
		{ id: 'all', label: t('app.bots.stats.all') },
	];

	const defaultFormatGain = (g: number) => Math.round(g).toLocaleString();
	const defaultFormatPeak = (p: number) => Math.round(p).toLocaleString();
	const defaultFormatYAxis = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v));
	const defaultFormatTooltip = (v: number) => Math.round(v).toLocaleString();

	return (
		<div className="flex flex-col gap-6">
			{/* Metric Cards Row */}
			<div className={`grid ${gridColsClass} gap-6`}>
				{metrics.map((metric) => {
					const isActive = activeMetric === metric.id;
					const Icon = metric.icon;
					const mFirst = Number(data[0]?.[metric.id]) || 0;
					const mLast = Number(data[data.length - 1]?.[metric.id]) || 0;
					const mDelta = mLast - mFirst;
					const mPct = mFirst > 0 ? ((mDelta / mFirst) * 100).toFixed(1) : '0.0';
					const hasDelta = data.length >= 2 && mDelta !== 0;

					return (
						<button
							key={metric.id}
							type="button"
							onClick={() => handleSwitch(metric.id)}
							className={`relative bg-(--foreground)/40 border p-6 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md transition-all cursor-pointer ${
								isActive ? 'border-(--accent) shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)] scale-105 z-10' : 'border-(--border)/10 hover:border-(--accent)/50'
							}`}
						>
							{hasDelta && (
								<span
									className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
										mDelta > 0 ? 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/25' : 'bg-(--accent-red)/10 text-(--accent-red) border-(--accent-red)/25'
									}`}
								>
									{mDelta > 0 ? '+' : ''}
									{mPct}%
								</span>
							)}
							<Icon className={`w-8 h-8 ${isActive ? 'text-(--accent)' : metric.accentGreenWhenInactive ? 'text-(--accent-green)' : 'text-(--text-muted)'}`} />
							<div
								className={`text-3xl font-bold ${!isActive && metric.accentGreenWhenInactive ? 'text-(--accent-green)' : 'text-(--text)'}`}
								style={{ fontFamily: 'var(--font-fredoka)' }}
							>
								{typeof metric.displayValue === 'number' ? metric.displayValue.toLocaleString() : metric.displayValue || '0'}
							</div>
							<div className={`text-sm font-semibold uppercase tracking-wider ${isActive ? 'text-(--accent)' : 'text-(--text-muted)'}`}>{metric.label}</div>
						</button>
					);
				})}
			</div>

			{/* Chart Panel */}
			<div className="bg-(--foreground)/40 border border-(--border)/10 p-6 md:p-8 rounded-3xl backdrop-blur-md">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
					<div>
						<h3 className="text-2xl font-bold mb-1 capitalize text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{activeDescriptor?.label} {titleSuffix || t('app.servers.overTime')}
						</h3>
						<div className="flex flex-wrap items-center gap-3 text-sm font-medium mt-2">
							<span
								className={`${
									gainLoss >= 0 ? 'text-(--accent-green) bg-(--accent-green)/10' : 'text-(--accent-red) bg-(--accent-red)/10'
								} flex items-center gap-1 px-2.5 py-1 rounded-xl`}
							>
								{gainLoss > 0 ? '+' : ''}
								{formatGain ? formatGain(gainLoss, activeMetric) : defaultFormatGain(gainLoss)} ({gainPercentage}%)
							</span>
							<span className="text-(--text-muted) bg-(--background)/60 px-2.5 py-1 rounded-xl border border-(--border)/10">
								{t('app.bots.id.text12')} {formatPeak ? formatPeak(highestValue, activeMetric) : defaultFormatPeak(highestValue)}
							</span>
						</div>
					</div>

					<Tabs size="sm" fullWidth={false} tabs={timeframeTabs} activeTab={timeframe} onChange={(id) => onTimeframeChange(id as TimeframeKey)} />
				</div>

				<div
					className="h-[400px] w-full mt-4"
					style={{
						clipPath: isUndrawing ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)',
						transition: 'clip-path 350ms ease-in-out',
					}}
				>
					{loading ? (
						<div className="w-full h-full flex items-center justify-center">
							<Loading variant="small" />
						</div>
					) : (
						<ResponsiveContainer width="100%" height="100%">
							<LineChart key={activeMetric} data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
									tickFormatter={(val) => (formatYAxis ? formatYAxis(Number(val), activeMetric) : defaultFormatYAxis(Number(val)))}
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
									formatter={(value: any) => (formatTooltip ? formatTooltip(Number(value), activeMetric) : defaultFormatTooltip(Number(value)))}
								/>
								<Line
									type="monotone"
									dataKey={activeMetric}
									name={activeDescriptor?.label}
									stroke="var(--accent)"
									strokeWidth={4}
									dot={data.length <= 1 ? { r: 6, fill: 'var(--accent)', strokeWidth: 0 } : false}
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
