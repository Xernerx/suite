/** @format */
'use client';

import React, { useMemo, useState } from 'react';
import { useDictionary } from '@xernerx/providers';

export interface StatusBucketPoint {
	timestamp: number;
	status: 'operational' | 'degraded' | 'down' | 'online' | 'idle' | 'dnd' | 'offline' | 'empty';
	ping: number | null;
}

interface Status24hBarProps {
	points?: StatusBucketPoint[];
	currentStatus?: 'operational' | 'degraded' | 'down' | 'checking' | 'online' | 'idle' | 'dnd' | 'offline';
	currentPing?: number | null;
}

const BUCKET_MS = 30 * 60 * 1000;
const BUCKET_COUNT = 48;

function formatHHMM(timestamp: number): string {
	const d = new Date(timestamp);
	const hh = String(d.getHours()).padStart(2, '0');
	const mm = String(d.getMinutes()).padStart(2, '0');
	return `${hh}:${mm}`;
}

export function Status24hBar({ points, currentStatus, currentPing }: Status24hBarProps) {
	const { t } = useDictionary();
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const normalizedPoints = useMemo<StatusBucketPoint[]>(() => {
		const nowBucket = Math.floor(Date.now() / BUCKET_MS) * BUCKET_MS;
		const base: StatusBucketPoint[] =
			points && points.length === BUCKET_COUNT
				? points.map((p) => ({ ...p }))
				: Array.from({ length: BUCKET_COUNT }, (_, i) => ({
						timestamp: nowBucket - (BUCKET_COUNT - 1 - i) * BUCKET_MS,
						status: 'empty',
						ping: null,
					}));

		// Ensure latest bucket reflects live check immediately
		if (currentStatus && currentStatus !== 'checking' && base.length > 0) {
			const last = base[base.length - 1];
			if (last.status === 'empty' || typeof currentPing === 'number') {
				base[base.length - 1] = {
					timestamp: last.timestamp,
					status: currentStatus,
					ping: currentPing ?? last.ping ?? null,
				};
			}
		}

		return base;
	}, [points, currentStatus, currentPing]);

	const uptimePercent = useMemo(() => {
		const recorded = normalizedPoints.filter((p) => p.status !== 'empty');
		if (recorded.length === 0) return null;
		const upCount = recorded.filter((p) => p.status !== 'down' && p.status !== 'offline').length;
		return Math.round((upCount / recorded.length) * 1000) / 10;
	}, [normalizedPoints]);

	// Compute SVG latency sparkline path across buckets that have ping data
	const sparklineData = useMemo(() => {
		const pingPoints = normalizedPoints.map((pt, idx) => (typeof pt.ping === 'number' && pt.ping > 0 ? { idx, ping: pt.ping } : null)).filter(Boolean) as Array<{ idx: number; ping: number }>;

		if (pingPoints.length === 0) return null;

		const pings = pingPoints.map((p) => p.ping);
		const minPing = Math.min(...pings);
		const maxPing = Math.max(...pings);
		const avgPing = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
		const range = Math.max(20, maxPing - minPing);

		const width = 240;
		const height = 22;
		const coords = pingPoints.map((p) => {
			const x = (p.idx / (BUCKET_COUNT - 1)) * width;
			const y = height - 3 - ((p.ping - minPing) / range) * (height - 6);
			return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
		});

		if (coords.length === 1) {
			coords.unshift({ x: 0, y: coords[0].y });
		}

		const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
		const areaPath = `${linePath} L${coords[coords.length - 1].x},${height} L${coords[0].x},${height} Z`;

		return { linePath, areaPath, minPing, maxPing, avgPing };
	}, [normalizedPoints]);

	const getBarColorClass = (point: StatusBucketPoint) => {
		if (point.status === 'down' || point.status === 'offline') {
			return 'bg-(--accent-red) hover:brightness-110';
		}
		if (point.status === 'degraded' || point.status === 'idle' || point.status === 'dnd' || (typeof point.ping === 'number' && point.ping > 600)) {
			return 'bg-(--accent-orange) hover:brightness-110';
		}
		if (point.status === 'operational' || point.status === 'online') {
			if (typeof point.ping === 'number' && point.ping > 300) {
				return 'bg-(--accent-green)/75 hover:bg-(--accent-green)';
			}
			return 'bg-(--accent-green) hover:brightness-110';
		}
		return 'bg-(--border)/20 hover:bg-(--border)/40';
	};

	const getStatusLabel = (point: StatusBucketPoint) => {
		switch (point.status) {
			case 'operational':
				return t('info.status.states.operational');
			case 'degraded':
				return t('info.status.states.degraded');
			case 'down':
				return t('info.status.states.down');
			case 'online':
				return t('info.status.botStates.online');
			case 'idle':
				return t('info.status.botStates.idle');
			case 'dnd':
				return t('info.status.botStates.dnd');
			case 'offline':
				return t('info.status.botStates.offline');
			default:
				return t('info.status.history.noData');
		}
	};

	const hoveredPoint = hoveredIndex !== null ? normalizedPoints[hoveredIndex] : null;

	return (
		<div className="flex flex-col gap-1.5 pt-1">
			{/* 48 vertical response lines (24h @ 30m intervals) */}
			<div className="relative flex items-center gap-[3px] h-7 px-2 py-1.5 rounded-2xl bg-(--background)/50 border border-(--border)/10" onMouseLeave={() => setHoveredIndex(null)}>
				{normalizedPoints.map((point, idx) => {
					const isHovered = hoveredIndex === idx;
					return (
						<div
							key={point.timestamp || idx}
							onMouseEnter={() => setHoveredIndex(idx)}
							className={`flex-1 h-full rounded-full transition-all duration-150 cursor-pointer ${getBarColorClass(point)} ${isHovered ? 'scale-y-125 opacity-100' : 'opacity-90'}`}
						/>
					);
				})}
			</div>

			{/* Latency Sparkline Curve (when ping telemetry is available) */}
			{sparklineData && (
				<div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl bg-(--background)/35 border border-(--border)/10">
					<svg viewBox="0 0 240 22" className="w-full h-5 overflow-visible" preserveAspectRatio="none">
						<path d={sparklineData.areaPath} fill="var(--accent)" fillOpacity="0.12" />
						<path d={sparklineData.linePath} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					<span className="text-[10px] font-mono text-(--text-muted) shrink-0">{t('info.status.history.sparklineAvg', { ms: sparklineData.avgPing })}</span>
				</div>
			)}

			{/* Footer legend or live hover inspector */}
			<div className="flex items-center justify-between text-[11px] font-mono text-(--text-muted) min-h-[16px]">
				{hoveredPoint ? (
					<div className="flex items-center justify-between w-full text-(--text) animate-in fade-in duration-100">
						<span className="font-bold text-(--accent)">{formatHHMM(hoveredPoint.timestamp)}</span>
						<span className="inline-flex items-center gap-1.5">
							<span>{getStatusLabel(hoveredPoint)}</span>
							{typeof hoveredPoint.ping === 'number' && <span className="text-(--text-muted)">· {hoveredPoint.ping} ms</span>}
						</span>
					</div>
				) : (
					<>
						<span>{t('info.status.history.ago24h')}</span>
						<span className="text-(--text) font-semibold">{uptimePercent !== null ? t('info.status.history.uptime', { percent: uptimePercent }) : '—'}</span>
						<span>{t('info.status.history.now')}</span>
					</>
				)}
			</div>
		</div>
	);
}
