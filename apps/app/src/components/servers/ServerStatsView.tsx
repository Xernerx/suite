/** @format */
'use client';

import { useState } from 'react';
import { MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { EmptyState } from '@xernerx/ui';
import { MetricsChart, TimeframeKey } from '../MetricsChart';

export interface ServerStatsViewProps {
	server: any;
}

export function ServerStatsView({ server }: ServerStatsViewProps) {
	const { t } = useDictionary();
	const [timeframe, setTimeframe] = useState<TimeframeKey>('24h');
	const [activeMetric, setActiveMetric] = useState<'members' | 'messages' | 'voteCount'>('members');

	const stats = (server.stats || []).map((s: any) => ({
		...s,
		timestamp: new Date(s.timestamp).getTime(),
	}));

	if (stats.length === 0) {
		return <EmptyState title={t('app.servers.noStatsRecorded')} />;
	}

	const currentStats = stats[stats.length - 1];

	let chartData = stats;
	if (timeframe !== 'all') {
		const now = Date.now();
		const day = 24 * 60 * 60 * 1000;
		const limits: Record<Exclude<TimeframeKey, 'all'>, number> = {
			'24h': now - day,
			'7d': now - 7 * day,
			'30d': now - 30 * day,
			'3m': now - 90 * day,
			'6m': now - 180 * day,
			'1y': now - 365 * day,
		};
		chartData = stats.filter((s: any) => s.timestamp >= limits[timeframe]);
	}

	const metrics = [
		{ id: 'members', label: t('app.dashboard.stats.members'), displayValue: currentStats.members ?? 0, icon: Users },
		{ id: 'messages', label: t('app.dashboard.stats.messages'), displayValue: currentStats.messages ?? 0, icon: MessageSquare },
		{ id: 'voteCount', label: t('app.bots.stats.votes'), displayValue: currentStats.voteCount || server.voteCount || 0, icon: ShieldCheck },
	];

	return (
		<MetricsChart
			metrics={metrics}
			activeMetric={activeMetric}
			onMetricChange={(id) => setActiveMetric(id as typeof activeMetric)}
			timeframe={timeframe}
			onTimeframeChange={setTimeframe}
			data={chartData}
			allTimeData={stats}
		/>
	);
}
