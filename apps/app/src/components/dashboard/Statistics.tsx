/** @format */
'use client';

import { Server, Users, MessageSquare, Bot, Activity } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { EmptyState } from '@xernerx/ui';
import { MetricsChart, type TimeframeKey } from '@/components/MetricsChart';

interface StatisticsProps {
	guildConfig: any;
	timeframe: TimeframeKey;
	setTimeframe: (tf: TimeframeKey) => void;
	activeMetric: 'members' | 'messages' | 'bots' | 'boosts';
	handleMetricSwitch: (metricId: any) => void;
	isUndrawing?: boolean;
}

export default function Statistics({ guildConfig, timeframe, setTimeframe, activeMetric, handleMetricSwitch }: StatisticsProps) {
	const { t } = useDictionary();

	if (!guildConfig.bot) {
		return <EmptyState icon={<Server className="w-8 h-8" />} title={t('app.dashboard.botNotConnected')} description={t('app.dashboard.text3')} />;
	}

	const allTimeData = (guildConfig.stats || []).map((s: any) => ({
		...s,
		timestamp: new Date(s.timestamp).getTime(),
	}));

	let chartData = allTimeData;
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
		chartData = allTimeData.filter((s: any) => s.timestamp >= limits[timeframe]);
	}

	const currentStats = guildConfig.stats?.[guildConfig.stats.length - 1] || { members: 0, messages: 0, bots: 0, boosts: 0 };

	return (
		<MetricsChart
			metrics={[
				{ id: 'members', label: t('app.dashboard.stats.members'), displayValue: currentStats.members || 0, icon: Users },
				{ id: 'messages', label: t('app.dashboard.stats.messages'), displayValue: currentStats.messages || 0, icon: MessageSquare },
				{ id: 'bots', label: t('app.dashboard.stats.bots'), displayValue: currentStats.bots || 0, icon: Bot },
				{ id: 'boosts', label: t('app.dashboard.stats.boosts'), displayValue: currentStats.boosts || 0, icon: Activity },
			]}
			activeMetric={activeMetric}
			onMetricChange={(id) => handleMetricSwitch(id)}
			timeframe={timeframe}
			onTimeframeChange={setTimeframe}
			data={chartData}
			allTimeData={allTimeData}
			titleSuffix={t('app.bots.id.text10')}
			gridColsClass="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
		/>
	);
}
