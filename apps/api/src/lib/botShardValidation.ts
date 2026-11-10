/** @format */

export const DISCORD_SHARD_MAX_GUILDS = 2500;
export const DISCORD_SHARD_WARNING_GUILDS = 2000;
export const DISCORD_SHARD_CRITICAL_GUILDS = 2400;

export interface ShardCapacityWarning {
	shardId: string;
	guildCount: number;
	maxGuilds: number;
	utilizationPercent: number;
	severity: 'warning' | 'critical';
	message: string;
}

export interface BotShardValidationSuccess {
	valid: true;
	effectiveShardCount: number;
	maxGuildCapacity: number;
	recommendedShards: number;
	highestUtilizationPercent: number;
	hasCritical: boolean;
	warnings: ShardCapacityWarning[];
}

export interface BotShardValidationFailure {
	valid: false;
	error: string;
}

export type BotShardValidationResult = BotShardValidationSuccess | BotShardValidationFailure;

export function validateAndAnalyzeBotShardStats(input: { guildCount: number; userCount?: number; shardCount?: number; shards?: any[] }): BotShardValidationResult {
	const { guildCount, userCount = 0, shardCount = 0, shards = [] } = input;

	if (!Number.isFinite(guildCount) || guildCount < 0) {
		return { valid: false, error: 'Invalid guildCount: must be a non-negative number.' };
	}
	if (!Number.isFinite(userCount) || userCount < 0) {
		return { valid: false, error: 'Invalid userCount: must be a non-negative number.' };
	}
	if (!Number.isFinite(shardCount) || shardCount < 0) {
		return { valid: false, error: 'Invalid shardCount: must be a non-negative number.' };
	}

	const reportedShards = shardCount > 0 ? Math.floor(shardCount) : 0;
	const instanceCount = Array.isArray(shards) ? shards.length : 0;
	const effectiveShardCount = Math.max(1, reportedShards, instanceCount);
	const maxGuildCapacity = effectiveShardCount * DISCORD_SHARD_MAX_GUILDS;

	if (guildCount > maxGuildCapacity) {
		return {
			valid: false,
			error: `Guild count (${guildCount.toLocaleString()}) exceeds Discord's ${DISCORD_SHARD_MAX_GUILDS.toLocaleString()}-guild shard maximum across ${effectiveShardCount} shard(s) (max ${maxGuildCapacity.toLocaleString()}).`,
		};
	}

	const warnings: ShardCapacityWarning[] = [];
	let highestUtilizationPercent = maxGuildCapacity > 0 ? Math.min(100, Math.round((guildCount / maxGuildCapacity) * 100)) : 0;
	let inspectedInstanceGuilds = false;

	if (Array.isArray(shards) && shards.length > 0) {
		for (let idx = 0; idx < shards.length; idx++) {
			const sh = shards[idx];
			if (!sh || typeof sh !== 'object') continue;

			const rawInstanceGuilds = sh.guildCount ?? sh.guilds ?? sh.servers;
			if (rawInstanceGuilds === undefined || rawInstanceGuilds === null) continue;

			const instanceGuilds = Number(rawInstanceGuilds);
			const shardLabel = String(sh.shardId ?? sh.id ?? idx);

			if (!Number.isFinite(instanceGuilds) || instanceGuilds < 0) {
				return {
					valid: false,
					error: `Shard #${shardLabel} reported an invalid guild count.`,
				};
			}

			inspectedInstanceGuilds = true;

			let shardSpan = 1;
			if (Array.isArray(sh.shardIds) && sh.shardIds.length > 0) {
				shardSpan = sh.shardIds.length;
			} else if (typeof sh.shardCount === 'number' && sh.shardCount > 0) {
				shardSpan = Math.floor(sh.shardCount);
			} else if (effectiveShardCount > shards.length) {
				shardSpan = Math.ceil(effectiveShardCount / shards.length);
			}

			const instanceMaxGuilds = shardSpan * DISCORD_SHARD_MAX_GUILDS;
			if (instanceGuilds > instanceMaxGuilds) {
				return {
					valid: false,
					error: `Shard #${shardLabel} reported ${instanceGuilds.toLocaleString()} guilds, exceeding Discord's ${instanceMaxGuilds.toLocaleString()}-guild limit (${DISCORD_SHARD_MAX_GUILDS.toLocaleString()} max per shard).`,
				};
			}

			const perShardGuilds = instanceGuilds / shardSpan;
			const utilPct = Math.min(100, Math.round((instanceGuilds / instanceMaxGuilds) * 100));
			if (utilPct > highestUtilizationPercent) {
				highestUtilizationPercent = utilPct;
			}

			if (perShardGuilds >= DISCORD_SHARD_WARNING_GUILDS) {
				const severity: 'warning' | 'critical' = perShardGuilds >= DISCORD_SHARD_CRITICAL_GUILDS ? 'critical' : 'warning';
				warnings.push({
					shardId: shardLabel,
					guildCount: instanceGuilds,
					maxGuilds: instanceMaxGuilds,
					utilizationPercent: utilPct,
					severity,
					message: `Shard #${shardLabel}: ${instanceGuilds.toLocaleString()} / ${instanceMaxGuilds.toLocaleString()} guilds (${utilPct}%)`,
				});
			}
		}
	}

	if (!inspectedInstanceGuilds && guildCount > 0) {
		const avgPerShard = guildCount / effectiveShardCount;
		if (avgPerShard >= DISCORD_SHARD_WARNING_GUILDS) {
			const severity: 'warning' | 'critical' = avgPerShard >= DISCORD_SHARD_CRITICAL_GUILDS ? 'critical' : 'warning';
			const utilPct = Math.min(100, Math.round((guildCount / maxGuildCapacity) * 100));
			warnings.push({
				shardId: effectiveShardCount === 1 ? '0' : 'avg',
				guildCount: Math.round(avgPerShard),
				maxGuilds: DISCORD_SHARD_MAX_GUILDS,
				utilizationPercent: utilPct,
				severity,
				message:
					effectiveShardCount === 1
						? `Shard #0: ${guildCount.toLocaleString()} / ${DISCORD_SHARD_MAX_GUILDS.toLocaleString()} guilds (${utilPct}%)`
						: `Average load: ${Math.round(avgPerShard).toLocaleString()} / ${DISCORD_SHARD_MAX_GUILDS.toLocaleString()} guilds per shard (${utilPct}%)`,
			});
		}
	}

	const hasCritical = warnings.some((w) => w.severity === 'critical');
	const recommendedShards = Math.max(1, Math.ceil((guildCount + 1) / DISCORD_SHARD_WARNING_GUILDS));

	return {
		valid: true,
		effectiveShardCount,
		maxGuildCapacity,
		recommendedShards,
		highestUtilizationPercent,
		hasCritical,
		warnings,
	};
}
