/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database, dispatchBotStatusWebhooks, sendWebhook } from '@xernerx/lib/server';
import { authenticateV1BotRequest, fetchDiscordBotIdentity } from '@/lib/v1BotAuth';
import { DISCORD_SHARD_MAX_GUILDS, DISCORD_SHARD_WARNING_GUILDS, type BotShardValidationSuccess, validateAndAnalyzeBotShardStats } from '@/lib/botShardValidation';
import { dispatchBotWebhook } from '@/lib/webhookDispatcher';

async function getBotMeta(BotModel: any, id: string) {
	const botDoc = await BotModel.findOne({ id }).select('name avatar vanitySlug').lean();
	let name = botDoc?.name;
	let avatar = botDoc?.avatar;

	if (!name || name === 'Unknown Bot' || !avatar) {
		const discordIdentity = await fetchDiscordBotIdentity(id);
		if (discordIdentity.name && (!name || name === 'Unknown Bot')) {
			name = discordIdentity.name;
		}
		if (discordIdentity.avatar && !avatar) {
			avatar = discordIdentity.avatar;
		}
		if (name || avatar) {
			await BotModel.updateOne(
				{ id },
				{
					$set: {
						...(name ? { name } : {}),
						...(avatar ? { avatar } : {}),
					},
				}
			);
		}
	}

	let avatarUrl: string | undefined = undefined;
	if (avatar) {
		avatarUrl = avatar.startsWith('http') ? avatar : `https://cdn.discordapp.com/avatars/${id}/${avatar}.${avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`;
	} else {
		try {
			const defaultIndex = Number(BigInt(id) >> BigInt(22)) % 6;
			avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
		} catch {
			avatarUrl = undefined;
		}
	}

	return {
		name: name || 'your bot',
		displayName: name || 'Unknown Bot',
		vanitySlug: botDoc?.vanitySlug || null,
		avatarUrl,
	};
}

async function dispatchShardCapacityWarningHooks(params: {
	botId: string;
	botMeta: { name: string; displayName: string; vanitySlug: string | null; avatarUrl?: string };
	hooks: any[];
	guildCount: number;
	validation: BotShardValidationSuccess;
}) {
	const { botId, botMeta, hooks, guildCount, validation } = params;
	if (!hooks?.length || validation.warnings.length === 0) return;

	const warnHooks = hooks.filter((h: any) => h?.url && Array.isArray(h.events) && h.events.includes('WARN shard'));
	if (warnHooks.length === 0) return;

	const nowIso = new Date().toISOString();
	const growthUrl = `https://portal.xernerx.com/bots/${botId}?tab=growth`;
	const warnEmbed = {
		title: validation.hasCritical ? '🚨 Critical: Discord 2.5k Shard Limit Reached' : '⚠️ Shard Capacity Warning (2,000+ Guilds)',
		url: growthUrl,
		description: `**${botMeta.displayName}** has **${validation.warnings.length}** shard instance(s) at or above **${DISCORD_SHARD_WARNING_GUILDS.toLocaleString()}** servers (approaching Discord's **${DISCORD_SHARD_MAX_GUILDS.toLocaleString()}**-guild Gateway shard ceiling — Close Code \`4011\`).`,
		color: validation.hasCritical ? 0xff4444 : 0xffaa00,
		fields: [
			{
				name: 'Affected Shards',
				value: validation.warnings
					.slice(0, 8)
					.map((w) => `• ${w.message}`)
					.join('\n'),
			},
			{ name: 'Total Servers', value: guildCount.toLocaleString(), inline: true },
			{ name: 'Active Shards', value: validation.effectiveShardCount.toLocaleString(), inline: true },
			{ name: 'Recommended Shards', value: `**${validation.recommendedShards}+**`, inline: true },
		],
		footer: {
			text: `${botMeta.displayName} • Xernerx Shard Capacity Monitor`,
			...(botMeta.avatarUrl ? { icon_url: botMeta.avatarUrl } : {}),
		},
		timestamp: nowIso,
	};

	const shardData = {
		severity: validation.hasCritical ? 'critical' : 'warning',
		guildCount,
		effectiveShards: validation.effectiveShardCount,
		recommendedShards: validation.recommendedShards,
		warningThreshold: DISCORD_SHARD_WARNING_GUILDS,
		maxGuildsPerShard: DISCORD_SHARD_MAX_GUILDS,
		utilizationPercent: validation.highestUtilizationPercent,
		warnings: validation.warnings,
	};

	for (const hook of warnHooks) {
		try {
			const isDiscordWebhook = /^https:\/\/(ptb\.|canary\.)?discord(app)?\.com\/api\/webhooks\//i.test(hook.url);
			const payload = isDiscordWebhook
				? {
						username: 'Xernerx App',
						avatar_url: 'https://xernerx.com/logo.png',
						embeds: [warnEmbed],
					}
				: {
						event: 'WARN shard',
						botId,
						timestamp: nowIso,
						...shardData,
						bot: {
							id: botId,
							name: botMeta.displayName,
							vanitySlug: botMeta.vanitySlug,
							url: growthUrl,
						},
						data: shardData,
						embeds: [warnEmbed],
					};

			await dispatchBotWebhook({
				botId,
				url: hook.url,
				event: 'WARN shard',
				payload,
				secret: hook.secret,
			});
		} catch (err) {
			console.error('Failed to trigger WARN shard bot webhook:', err);
		}
	}
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const authResult = await authenticateV1BotRequest(req, rawId, { isMutation: true });
		if (authResult.error) {
			return NextResponse.json({ error: authResult.error }, { status: authResult.status });
		}

		const { botId: id, BotModel, StatModel, VoteModel, HookModel } = authResult as Required<typeof authResult>;

		if (!StatModel) {
			return NextResponse.json({ error: 'Database models not found' }, { status: 500 });
		}

		const body = await req.json().catch(() => ({}));

		const serverCount = typeof body.serverCount === 'number' ? body.serverCount : typeof body.guildCount === 'number' ? body.guildCount : 0;
		const shardCount = typeof body.shardCount === 'number' ? body.shardCount : 0;
		const userCount = typeof body.userCount === 'number' ? body.userCount : 0;
		const onlineSince = typeof body.onlineSince === 'number' ? body.onlineSince : 0;
		const shards = Array.isArray(body.shards) ? body.shards : [];

		const validation = validateAndAnalyzeBotShardStats({
			guildCount: serverCount,
			userCount,
			shardCount,
			shards,
		});

		if (!validation.valid) {
			return NextResponse.json(
				{
					error: validation.error,
					code: 'SHARD_LIMIT_EXCEEDED',
					maxGuildsPerShard: DISCORD_SHARD_MAX_GUILDS,
				},
				{ status: 400 }
			);
		}

		const currentVoteCount = VoteModel ? await VoteModel.countDocuments({ botId: id }) : 0;

		await StatModel.create({
			id,
			guildCount: serverCount,
			shardCount: shardCount,
			userCount: userCount,
			voteCount: currentVoteCount,
			onlineSince,
			shards,
			timestamp: new Date(),
		});

		const updateFields: any = {
			status: 'online',
			statusUpdatedAt: new Date(),
		};
		if (typeof body.voteCount === 'number') {
			updateFields.voteCount = body.voteCount;
		}

		const prevBot = await BotModel.findOneAndUpdate({ id }, { $set: updateFields }, { returnDocument: 'before' }).lean();
		if (prevBot?.status === 'offline') {
			await dispatchBotStatusWebhooks(prevBot, 'online', 'offline', prevBot.activity || '').catch((err) => {
				console.error('Failed to trigger bot online webhook on stats post:', err);
			});
		}

		const botMeta = await getBotMeta(BotModel, id);
		const hooks = HookModel ? await HookModel.find({ botId: id }).lean() : [];

		if (hooks?.length) {
			for (const hook of hooks) {
				if (!hook.url || !hook.events?.includes('POST stat')) continue;
				try {
					await sendWebhook({
						url: hook.url,
						embeds: [
							{
								title: 'Bot Stats Posted',
								description: `The stats for **${botMeta.name}** were just posted!\n\n**Servers:** ${serverCount.toLocaleString()}\n**Shards:** ${validation.effectiveShardCount.toLocaleString()}`,
								color: 0x00ff00,
								footer: {
									text: botMeta.displayName,
									...(botMeta.avatarUrl ? { icon_url: botMeta.avatarUrl } : {}),
								},
								timestamp: new Date().toISOString(),
							},
						],
					});
				} catch (e) {
					console.error('Failed to trigger bot webhook for stat post', e);
				}
			}

			await dispatchShardCapacityWarningHooks({
				botId: id,
				botMeta,
				hooks,
				guildCount: serverCount,
				validation,
			});
		}

		return NextResponse.json(
			{
				message: 'Stats updated successfully',
				shardHealth: {
					maxPerShard: DISCORD_SHARD_MAX_GUILDS,
					effectiveShards: validation.effectiveShardCount,
					recommendedShards: validation.recommendedShards,
					utilizationPercent: validation.highestUtilizationPercent,
					warnings: validation.warnings,
				},
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Failed to process bot stats POST:', error);
		return NextResponse.json({ error: 'Internal Server Error', message: error.message, stack: error.stack }, { status: 500 });
	}
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	return POST(req, context);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authHeader = req.headers.get('Authorization');

		if (authHeader) {
			const authResult = await authenticateV1BotRequest(req, id, { isMutation: false });
			if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
			const { bot, botId, hasFullAccess, StatModel } = authResult as Required<typeof authResult>;
			if (!hasFullAccess && bot.privacy === 'private') {
				return NextResponse.json({ error: 'This bot profile is private.' }, { status: 403 });
			}
			const stats = await StatModel.find({ id: botId }).sort({ _id: -1 }).limit(100);
			return NextResponse.json(stats);
		}

		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;
		const StatModel = (db.models.bots as any).Stat;

		if (!StatModel || !BotModel) return NextResponse.json({ error: 'Database model not found' }, { status: 500 });

		const bot = await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		if (bot.privacy === 'private') {
			return NextResponse.json({ error: 'This bot profile is private.' }, { status: 403 });
		}

		const stats = await StatModel.find({ id: bot.id }).sort({ _id: -1 }).limit(100);
		return NextResponse.json(stats);
	} catch (error: any) {
		console.error('Failed to GET bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const authResult = await authenticateV1BotRequest(req, rawId, { isMutation: true });
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { botId: id, hasFullAccess, StatModel, BotModel, HookModel, VoteModel } = authResult as Required<typeof authResult>;
		if (!hasFullAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

		const statId = req.nextUrl.searchParams.get('statId');
		const body = await req.json().catch(() => ({}));

		delete body._id;
		delete body.id;
		delete body.timestamp;

		if (typeof body.serverCount === 'number' && body.guildCount === undefined) {
			body.guildCount = body.serverCount;
		}

		const existingDoc = statId ? await StatModel.findOne({ _id: statId, id }).lean() : await StatModel.findOne({ id }).sort({ _id: -1 }).lean();

		const nextGuildCount = typeof body.guildCount === 'number' ? body.guildCount : Number((existingDoc as any)?.guildCount ?? 0);
		const nextUserCount = typeof body.userCount === 'number' ? body.userCount : Number((existingDoc as any)?.userCount ?? 0);
		const nextShardCount = typeof body.shardCount === 'number' ? body.shardCount : Number((existingDoc as any)?.shardCount ?? 0);
		const nextShards = Array.isArray(body.shards) ? body.shards : Array.isArray((existingDoc as any)?.shards) ? (existingDoc as any).shards : [];

		const validation = validateAndAnalyzeBotShardStats({
			guildCount: nextGuildCount,
			userCount: nextUserCount,
			shardCount: nextShardCount,
			shards: nextShards,
		});

		if (!validation.valid) {
			return NextResponse.json(
				{
					error: validation.error,
					code: 'SHARD_LIMIT_EXCEEDED',
					maxGuildsPerShard: DISCORD_SHARD_MAX_GUILDS,
				},
				{ status: 400 }
			);
		}

		if (statId) {
			await StatModel.updateOne({ _id: statId, id }, { $set: body });
		} else if (existingDoc) {
			await StatModel.updateOne({ _id: (existingDoc as any)._id }, { $set: body });
		} else {
			const currentVoteCount = VoteModel ? await VoteModel.countDocuments({ botId: id }) : 0;
			await StatModel.create({
				id,
				guildCount: nextGuildCount,
				shardCount: nextShardCount,
				userCount: nextUserCount,
				voteCount: currentVoteCount,
				onlineSince: typeof body.onlineSince === 'number' ? body.onlineSince : 0,
				shards: nextShards,
				timestamp: new Date(),
			});
		}

		const botMeta = await getBotMeta(BotModel, id);
		const hooks = HookModel ? await HookModel.find({ botId: id }).lean() : [];

		if (hooks?.length) {
			for (const hook of hooks) {
				if (!hook.url || !hook.events?.includes('PATCH stat')) continue;
				try {
					await sendWebhook({
						url: hook.url,
						embeds: [
							{
								title: 'Bot Stats Updated',
								description: `The stats for **${botMeta.name}** were just updated!`,
								color: 0x00a0ff,
								footer: {
									text: botMeta.displayName,
									...(botMeta.avatarUrl ? { icon_url: botMeta.avatarUrl } : {}),
								},
								timestamp: new Date().toISOString(),
							},
						],
					});
				} catch (e) {
					console.error('Failed to trigger bot webhook for stat update', e);
				}
			}

			await dispatchShardCapacityWarningHooks({
				botId: id,
				botMeta,
				hooks,
				guildCount: nextGuildCount,
				validation,
			});
		}

		return NextResponse.json({
			message: 'Stats updated successfully',
			shardHealth: {
				maxPerShard: DISCORD_SHARD_MAX_GUILDS,
				effectiveShards: validation.effectiveShardCount,
				recommendedShards: validation.recommendedShards,
				utilizationPercent: validation.highestUtilizationPercent,
				warnings: validation.warnings,
			},
		});
	} catch (error: any) {
		console.error('Failed to PATCH bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const authResult = await authenticateV1BotRequest(req, rawId, { isMutation: true });
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { botId: id, hasFullAccess, StatModel, BotModel, HookModel } = authResult as Required<typeof authResult>;
		if (!hasFullAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

		const statId = req.nextUrl.searchParams.get('statId');

		if (statId) {
			await StatModel.deleteOne({ _id: statId, id });
		} else {
			await StatModel.deleteMany({ id });
		}

		const botMeta = await getBotMeta(BotModel, id);
		const hooks = HookModel ? await HookModel.find({ botId: id }).lean() : [];

		if (hooks?.length) {
			for (const hook of hooks) {
				if (!hook.url || !hook.events?.includes('DELETE stat')) continue;
				try {
					await sendWebhook({
						url: hook.url,
						embeds: [
							{
								title: 'Bot Stats Deleted',
								description: statId ? `A stat record was deleted for **${botMeta.name}**.` : `All stat records were deleted for **${botMeta.name}**.`,
								color: 0xff0000,
								footer: {
									text: botMeta.displayName,
									...(botMeta.avatarUrl ? { icon_url: botMeta.avatarUrl } : {}),
								},
								timestamp: new Date().toISOString(),
							},
						],
					});
				} catch (e) {
					console.error('Failed to trigger bot webhook for stat deletion', e);
				}
			}
		}

		return NextResponse.json({ message: 'Stats deleted successfully' });
	} catch (error: any) {
		console.error('Failed to DELETE bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
