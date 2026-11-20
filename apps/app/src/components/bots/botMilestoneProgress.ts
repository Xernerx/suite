/** @format */

import { evaluateBotMilestones, type BotStatSnapshot, type EvaluatedMilestone } from '@xernerx/lib';

export interface UnifiedBotMilestoneSummary {
	currentCount: number;
	maxHistoricalCount: number;
	peakCount: number;
	milestones: EvaluatedMilestone[];
	highestUnlocked: EvaluatedMilestone | null;
	nextMilestone: EvaluatedMilestone | null;
	progressPercent: number;
	remaining: number;
	fallbackBadgeSvg: string;
}

export function computeBotMilestoneSummary(bot: any, statsHistory: BotStatSnapshot[] = [], type: 'servers' | 'members'): UnifiedBotMilestoneSummary {
	const safeHistory = Array.isArray(statsHistory) ? statsHistory : [];
	const latestFromHistory = safeHistory.length > 0 ? safeHistory[safeHistory.length - 1] : null;

	const currentCount =
		type === 'servers'
			? Math.max(
					0,
					Number(bot?.stats?.guildCount ?? bot?.guildCount ?? 0) || 0,
					Number(bot?.latestStat?.guildCount ?? bot?.latestStat?.servers ?? 0) || 0,
					Number(latestFromHistory?.guildCount ?? latestFromHistory?.servers ?? 0) || 0
				)
			: Math.max(
					0,
					Number(bot?.stats?.userCount ?? bot?.userCount ?? 0) || 0,
					Number(bot?.latestStat?.userCount ?? bot?.latestStat?.users ?? 0) || 0,
					Number(latestFromHistory?.userCount ?? latestFromHistory?.users ?? 0) || 0
				);

	const peakFromBot =
		type === 'servers'
			? Math.max(0, Number(bot?.peakStats?.guildCount ?? (bot?.peakStats as any)?.servers ?? 0) || 0)
			: Math.max(0, Number(bot?.peakStats?.userCount ?? (bot?.peakStats as any)?.users ?? 0) || 0);

	const maxFromHistory = safeHistory.reduce((max, s) => {
		const val = type === 'servers' ? Number(s?.guildCount ?? s?.servers ?? 0) || 0 : Number(s?.userCount ?? s?.users ?? 0) || 0;
		return Math.max(max, val);
	}, 0);

	const maxHistoricalCount = Math.max(peakFromBot, maxFromHistory);
	const peakCount = Math.max(currentCount, maxHistoricalCount);

	const effectiveHistory = safeHistory.length > 0 ? safeHistory : bot?.latestStat ? [bot.latestStat] : [];
	const baseEval = evaluateBotMilestones(peakCount, effectiveHistory, type);

	const target = baseEval.nextMilestone ? baseEval.nextMilestone.threshold : null;
	const progressPercent = target ? Math.min(100, Math.round((peakCount / target) * 1000) / 10) : 100;
	const remaining = target ? Math.max(0, target - peakCount) : 0;

	return {
		currentCount,
		maxHistoricalCount,
		peakCount,
		milestones: baseEval.milestones,
		highestUnlocked: baseEval.highestUnlocked,
		nextMilestone: baseEval.nextMilestone,
		progressPercent,
		remaining,
		fallbackBadgeSvg: baseEval.fallbackBadgeSvg,
	};
}
