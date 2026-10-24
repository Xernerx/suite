/** @format */

export interface MilestoneTier {
	tier: number;
	threshold: number;
	label: string;
	badgeSvg: string;
	badgePng: string;
}

export interface EvaluatedMilestone extends MilestoneTier {
	unlocked: boolean;
	reachedAt: string | null;
}

export const SERVER_MILESTONE_THRESHOLDS: readonly number[] = [10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

export const MEMBER_MILESTONE_THRESHOLDS: readonly number[] = [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000];

export function formatMilestoneCount(count: number): string {
	if (count >= 1_000_000) {
		const m = count / 1_000_000;
		return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
	}
	if (count >= 1_000) {
		const k = count / 1_000;
		return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
	}
	return count.toLocaleString();
}

export const SERVER_MILESTONES: readonly MilestoneTier[] = SERVER_MILESTONE_THRESHOLDS.map((threshold, index) => {
	const tier = index + 1;
	return {
		tier,
		threshold,
		label: `${formatMilestoneCount(threshold)} Servers`,
		badgeSvg: `/servers/Servers-${tier}.svg`,
		badgePng: `/servers/Servers-${tier}.png`,
	};
});

export const MEMBER_MILESTONES: readonly MilestoneTier[] = MEMBER_MILESTONE_THRESHOLDS.map((threshold, index) => {
	const tier = index + 1;
	return {
		tier,
		threshold,
		label: `${formatMilestoneCount(threshold)} Members`,
		badgeSvg: `/members/Members-${tier}.svg`,
		badgePng: `/members/Members-${tier}.png`,
	};
});

export interface BotStatSnapshot {
	guildCount?: number;
	servers?: number;
	userCount?: number;
	users?: number;
	timestamp?: string | number | Date;
	data?: {
		timestamp?: string | number | Date;
	};
}

export function parseStatTimestamp(s?: BotStatSnapshot | null): number {
	const raw = s?.timestamp ?? s?.data?.timestamp;
	if (raw === undefined || raw === null || raw === '') return 0;
	if (raw instanceof Date) {
		const ms = raw.getTime();
		return Number.isNaN(ms) ? 0 : ms;
	}
	if (typeof raw === 'number') {
		if (!Number.isFinite(raw) || raw <= 0) return 0;
		return raw < 1e12 ? raw * 1000 : raw;
	}
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (/^\d+$/.test(trimmed)) {
			const num = Number(trimmed);
			if (!Number.isFinite(num) || num <= 0) return 0;
			return num < 1e12 ? num * 1000 : num;
		}
		const ms = new Date(trimmed).getTime();
		return Number.isNaN(ms) ? 0 : ms;
	}
	return 0;
}

export function evaluateBotMilestones(
	currentCount: number,
	statsHistory: BotStatSnapshot[] = [],
	type: 'servers' | 'members'
): {
	milestones: EvaluatedMilestone[];
	highestUnlocked: EvaluatedMilestone | null;
	nextMilestone: EvaluatedMilestone | null;
	progressPercent: number;
	fallbackBadgeSvg: string;
} {
	const catalog = type === 'servers' ? SERVER_MILESTONES : MEMBER_MILESTONES;
	const fallbackBadgeSvg = type === 'servers' ? '/servers/Servers.svg' : '/members/Members.svg';

	const sortedStats = [...(Array.isArray(statsHistory) ? statsHistory : [])].filter((s) => parseStatTimestamp(s) > 0).sort((a, b) => parseStatTimestamp(a) - parseStatTimestamp(b));

	const getSnapshotValue = (s: BotStatSnapshot): number => {
		if (type === 'servers') return Number(s?.guildCount ?? s?.servers ?? 0) || 0;
		return Number(s?.userCount ?? s?.users ?? 0) || 0;
	};

	const peakFromHistory = sortedStats.reduce((max, s) => Math.max(max, getSnapshotValue(s)), 0);
	const effectiveCount = Math.max(Number(currentCount) || 0, peakFromHistory);

	const milestones: EvaluatedMilestone[] = catalog.map((item) => {
		const unlocked = effectiveCount >= item.threshold;
		let reachedAt: string | null = null;
		if (unlocked) {
			const firstMatch = sortedStats.find((s) => getSnapshotValue(s) >= item.threshold);
			const ts = parseStatTimestamp(firstMatch);
			if (ts > 0) {
				reachedAt = new Date(ts).toISOString();
			}
		}
		return {
			...item,
			unlocked,
			reachedAt,
		};
	});

	const unlockedList = milestones.filter((m) => m.unlocked);
	const highestUnlocked = unlockedList.length > 0 ? unlockedList[unlockedList.length - 1] : null;
	const nextMilestone = milestones.find((m) => !m.unlocked) || null;

	let progressPercent = 100;
	if (nextMilestone) {
		const prevThreshold = highestUnlocked ? highestUnlocked.threshold : 0;
		const span = Math.max(1, nextMilestone.threshold - prevThreshold);
		const gained = Math.max(0, effectiveCount - prevThreshold);
		progressPercent = Math.min(100, Math.round((gained / span) * 100));
	}

	return {
		milestones,
		highestUnlocked,
		nextMilestone,
		progressPercent,
		fallbackBadgeSvg,
	};
}

export function getHighestMilestoneBadge(
	count: number,
	type: 'servers' | 'members'
): {
	tier: number;
	threshold: number;
	label: string;
	badgeSvg: string;
	badgePng: string;
	unlocked: boolean;
} {
	const catalog = type === 'servers' ? SERVER_MILESTONES : MEMBER_MILESTONES;
	const safeCount = Math.max(0, Number(count) || 0);
	let highest: MilestoneTier | null = null;
	for (const item of catalog) {
		if (safeCount >= item.threshold) {
			highest = item;
		} else {
			break;
		}
	}

	if (highest) {
		return { ...highest, unlocked: true };
	}

	return {
		tier: 0,
		threshold: catalog[0].threshold,
		label: type === 'servers' ? `${safeCount.toLocaleString()} Servers` : `${safeCount.toLocaleString()} Members`,
		badgeSvg: type === 'servers' ? '/servers/Servers.svg' : '/members/Members.svg',
		badgePng: type === 'servers' ? '/servers/Servers.png' : '/members/Members.png',
		unlocked: false,
	};
}
