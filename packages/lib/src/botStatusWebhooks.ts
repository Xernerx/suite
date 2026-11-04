/** @format */

import { createHmac, randomUUID } from 'crypto';
import { database } from './database';

export interface BotWebhookDeliveryRecord {
	id: string;
	event: string;
	url: string;
	status: number;
	ok: boolean;
	latencyMs: number;
	payload: Record<string, any>;
	responseSnippet: string;
	timestamp: Date;
}

export interface DispatchBotWebhookInput {
	botId: string;
	url: string;
	event: string;
	payload: Record<string, any>;
	secret?: string;
	headers?: Record<string, string>;
	timeoutMs?: number;
}

const priceProductCache = new Map<string, string>();
const pendingOfflineTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const OFFLINE_WEBHOOK_COOLDOWN_MS = 60_000;
export const API_TIER_WEBHOOK_EVENTS = ['POST online', 'POST offline'] as const;

export function isBotOnlineStatus(status?: string | null): boolean {
	return status === 'online' || status === 'idle' || status === 'dnd';
}

function formatStateDuration(ms: number): string {
	const totalSeconds = Math.max(1, Math.floor(ms / 1000));
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const parts: string[] = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0 && days === 0) parts.push(`${minutes}m`);
	if (seconds > 0 && days === 0 && hours === 0) parts.push(`${seconds}s`);
	return parts.join(' ') || '1s';
}

async function resolveStripePriceProductId(priceId: string): Promise<string> {
	if (!priceId || !priceId.startsWith('price_')) return '';
	if (priceProductCache.has(priceId)) {
		return priceProductCache.get(priceId) || '';
	}
	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey || secretKey === 'sk_test_placeholder') return '';

	try {
		const res = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
			headers: {
				Authorization: `Bearer ${secretKey}`,
			},
		});
		if (!res.ok) return '';
		const data = (await res.json()) as any;
		const productId = typeof data?.product === 'string' ? data.product : data?.product?.id || '';
		if (productId) {
			priceProductCache.set(priceId, productId);
		}
		return productId;
	} catch {
		return '';
	}
}

/**
 * Checks whether any of the provided user IDs holds an active paid API-tier subscription
 * (Developer Pro `dev-pro` / `categoryId: 'developers'`, Ultra `ultra`, or Staff subscription).
 */
export async function hasUserApiTierSubscription(userIds: string | string[]): Promise<boolean> {
	const ids = Array.from(new Set((Array.isArray(userIds) ? userIds : [userIds]).map((id) => String(id || '').trim()).filter(Boolean)));
	if (ids.length === 0) return false;

	try {
		const db = await database('xernerx');
		const UserModel = (db.models.users as any)?.User;
		const SubscriptionModel = (db.models.users as any)?.Subscription;
		const ItemModel = (db.models.store as any)?.Item;

		const [users, subDocs, storeItems] = await Promise.all([
			UserModel
				? UserModel.find({ id: { $in: ids } })
						.select('id staffSubscription billing')
						.lean()
						.catch(() => [])
				: Promise.resolve([]),
			SubscriptionModel
				? SubscriptionModel.find({
						ownerId: { $in: ids },
						status: { $in: ['active', 'trialing'] },
					})
						.lean()
						.catch(() => [])
				: Promise.resolve([]),
			ItemModel
				? ItemModel.find({
						$or: [{ id: { $in: ['dev-pro', 'ultra'] } }, { categoryId: 'developers' }],
					})
						.select('id skuId categoryId')
						.lean()
						.catch(() => [])
				: Promise.resolve([]),
		]);

		if (Array.isArray(users) && users.some((u: any) => Boolean(u?.staffSubscription))) {
			return true;
		}

		const apiTierIdentifiers = new Set<string>(['dev-pro', 'ultra', 'prod_V0oBbO5pVQMxcC', 'prod_V0pD5uXoTQkrYS', 'credit_trial_ultra', 'credit_trial_dev-pro']);

		for (const item of Array.isArray(storeItems) ? storeItems : []) {
			if (item?.id) apiTierIdentifiers.add(String(item.id));
			if (item?.skuId) apiTierIdentifiers.add(String(item.skuId));
		}

		const billingSubs = (Array.isArray(users) ? users : []).flatMap((u: any) => (Array.isArray(u?.billing?.subscriptions) ? u.billing.subscriptions : []));
		const allSubs = [...(Array.isArray(subDocs) ? subDocs : []), ...billingSubs];
		const now = Date.now();

		const validSubs = allSubs.filter((sub: any) => {
			if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) return false;
			if (!sub.currentPeriodEnd) return true;
			const endMs = new Date(sub.currentPeriodEnd).getTime();
			return Number.isNaN(endMs) || endMs > now;
		});

		for (const sub of validSubs) {
			const subId = String(sub.stripeSubscriptionId || '').trim();
			const subIdLower = subId.toLowerCase();
			const priceId = String(sub.priceId || '').trim();
			const priceIdLower = priceId.toLowerCase();

			if (
				subId === 'staff_infinite_sub' ||
				subIdLower.includes('ultra') ||
				subIdLower.includes('dev-pro') ||
				apiTierIdentifiers.has(priceId) ||
				priceIdLower.includes('dev-pro') ||
				priceIdLower.includes('ultra')
			) {
				return true;
			}

			if (priceId.startsWith('price_')) {
				const productId = await resolveStripePriceProductId(priceId);
				if (productId && apiTierIdentifiers.has(productId)) {
					return true;
				}
			}
		}

		return false;
	} catch (err) {
		console.warn('Failed to evaluate API-tier subscription status:', err);
		return false;
	}
}

/**
 * Checks whether a bot (by document or ID) or an optional acting user has an active API-tier subscription
 * across the bot's owners and organization members.
 */
export async function hasBotApiTierSubscription(botOrId: any, extraUserIds: string[] = []): Promise<boolean> {
	try {
		const db = await database('xernerx');
		let bot = typeof botOrId === 'object' && botOrId !== null ? botOrId : null;
		if (!bot && typeof botOrId === 'string' && botOrId.trim()) {
			const BotModel = (db.models.bots as any)?.Bot;
			if (BotModel) {
				bot = await BotModel.findOne({ id: botOrId.trim() })
					.select('id owners organization')
					.lean()
					.catch(() => null);
			}
		}

		const candidateUserIds = new Set<string>(extraUserIds.filter(Boolean));
		if (Array.isArray(bot?.owners)) {
			for (const ownerId of bot.owners) {
				if (ownerId) candidateUserIds.add(String(ownerId));
			}
		}

		if (bot?.organization && bot.organization !== 'null' && bot.organization !== 'undefined') {
			const OrganizationModel = (db.models.organizations as any)?.Organization;
			if (OrganizationModel) {
				const org = await OrganizationModel.findById(bot.organization)
					.select('owner members')
					.lean()
					.catch(() => null);
				if (org?.owner) candidateUserIds.add(String(org.owner));
				if (Array.isArray(org?.members)) {
					for (const memberId of org.members) {
						if (memberId) candidateUserIds.add(String(memberId));
					}
				}
			}
		}

		return hasUserApiTierSubscription(Array.from(candidateUserIds));
	} catch {
		return false;
	}
}

export async function dispatchSignedBotWebhook({ botId, url, event, payload, secret, headers = {}, timeoutMs = 8000 }: DispatchBotWebhookInput): Promise<BotWebhookDeliveryRecord> {
	const deliveryId = randomUUID();
	const start = Date.now();
	let status = 0;
	let ok = false;
	let responseSnippet = '';

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		let resolvedSecret = typeof secret === 'string' && secret.trim() ? secret.trim() : '';
		if (!resolvedSecret) {
			try {
				const db = await database('xernerx');
				const HookModel = (db.models.bots as any).Hook;
				if (HookModel) {
					const matchedHook = await HookModel.findOne({ botId, url }).select('secret').lean();
					if (matchedHook?.secret && typeof matchedHook.secret === 'string' && matchedHook.secret.trim()) {
						resolvedSecret = matchedHook.secret.trim();
					}
				}
			} catch {}
		}

		const isDiscordWebhook = /^https:\/\/(ptb\.|canary\.)?discord(app)?\.com\/api\/webhooks\//i.test(url);
		const outgoingPayload = isDiscordWebhook
			? Object.fromEntries(Object.entries(payload).filter(([key]) => ['content', 'username', 'avatar_url', 'embeds', 'tts', 'allowed_mentions', 'components'].includes(key)))
			: {
					event,
					botId,
					timestamp: payload.timestamp || new Date().toISOString(),
					...payload,
				};

		const rawBody = JSON.stringify(outgoingPayload);
		const signingSecret = resolvedSecret || process.env.WEBHOOK_SIGNING_SECRET || process.env.NEXTAUTH_SECRET || `xnx_whsec_${botId}`;
		const signature = createHmac('sha256', signingSecret).update(rawBody).digest('hex');

		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Xernerx-Event': event,
				'X-Xernerx-Bot-Id': botId,
				'X-Xernerx-Delivery-Id': deliveryId,
				'X-Xernerx-Signature': `sha256=${signature}`,
				...(resolvedSecret ? { 'X-Xernerx-Secret': resolvedSecret } : {}),
				...headers,
			},
			body: rawBody,
			signal: controller.signal,
		});

		status = res.status;
		ok = res.ok;
		const text = await res.text().catch(() => '');
		responseSnippet = text.slice(0, 200);
	} catch (error: any) {
		status = 0;
		ok = false;
		responseSnippet = String(error?.name === 'AbortError' ? 'Request timed out' : error?.message || 'Webhook delivery failed').slice(0, 200);
	} finally {
		clearTimeout(timer);
	}

	const latencyMs = Date.now() - start;
	const delivery: BotWebhookDeliveryRecord = {
		id: deliveryId,
		event,
		url,
		status,
		ok,
		latencyMs,
		payload,
		responseSnippet,
		timestamp: new Date(),
	};

	try {
		const db = await database('xernerx');
		const HookModel = (db.models.bots as any).Hook;
		if (HookModel) {
			const updateRes = await HookModel.updateOne(
				{ botId, url },
				{
					$push: {
						deliveries: {
							$each: [delivery],
							$slice: -25,
						},
					},
				}
			);

			if (!updateRes.matchedCount) {
				const anyHook = await HookModel.findOne({ botId }).select('_id').lean();
				if (anyHook?._id) {
					await HookModel.updateOne(
						{ _id: anyHook._id },
						{
							$push: {
								deliveries: {
									$each: [delivery],
									$slice: -25,
								},
							},
						}
					);
				} else {
					await HookModel.create({
						botId,
						url,
						events: [event],
						deliveries: [delivery],
					});
				}
			}
		}
	} catch (dbErr) {
		console.error('Failed to persist webhook delivery log:', dbErr);
	}

	return delivery;
}

/**
 * Dispatches `POST online` or `POST offline` webhooks when a bot transitions between
 * online (`online` | `idle` | `dnd`) and `offline` states, provided the bot's owner(s)
 * hold an active API-tier subscription.
 */
export async function dispatchBotStatusWebhooks(
	botOrId: any,
	newStatus: 'online' | 'idle' | 'dnd' | 'offline',
	previousStatus?: string | null,
	activity?: string
): Promise<BotWebhookDeliveryRecord[]> {
	const deliveries: BotWebhookDeliveryRecord[] = [];
	const isOnline = isBotOnlineStatus(newStatus);
	const targetState: 'online' | 'offline' = isOnline ? 'online' : 'offline';
	const oppositeState: 'online' | 'offline' = isOnline ? 'offline' : 'online';
	const event: 'POST online' | 'POST offline' = isOnline ? 'POST online' : 'POST offline';

	const rawBotId = typeof botOrId === 'string' ? botOrId : botOrId?.id;
	if (!rawBotId) return deliveries;
	const botId = String(rawBotId);
	const nowMs = Date.now();

	if (isOnline) {
		const existingTimer = pendingOfflineTimers.get(botId);
		if (existingTimer) {
			clearTimeout(existingTimer);
			pendingOfflineTimers.delete(botId);
		}
	}

	const hasExplicitTransition = Boolean(previousStatus && isBotOnlineStatus(previousStatus) !== isOnline);
	const botLastWebhookState = typeof botOrId === 'object' && botOrId !== null ? botOrId.lastWebhookStatus : undefined;
	if (botLastWebhookState === targetState) {
		return deliveries;
	}

	try {
		const db = await database('xernerx');
		const HookModel = (db.models.bots as any)?.Hook;
		const BotModel = (db.models.bots as any)?.Bot;
		const StatModel = (db.models.bots as any)?.Stat;
		if (!HookModel || !BotModel) return deliveries;

		if (!hasExplicitTransition && botLastWebhookState !== oppositeState) {
			await BotModel.updateOne(
				{ id: botId, $or: [{ lastWebhookStatus: { $exists: false } }, { lastWebhookStatus: null }] },
				{ $set: { lastWebhookStatus: targetState, statusChangedAt: new Date(nowMs) } }
			).catch(() => null);
			return deliveries;
		}

		const hooks = await HookModel.find({ botId }).lean();
		const matchingHooks = (hooks || []).filter((hook: any) => hook?.url && Array.isArray(hook.events) && hook.events.includes(event));

		let latestOfflineDeliveryMs = 0;
		let latestOnlineDeliveryMs = 0;
		for (const hook of hooks || []) {
			if (!Array.isArray(hook?.deliveries)) continue;
			for (const d of hook.deliveries) {
				if (d?.payload?.test) continue;
				const ts = d?.timestamp ? new Date(d.timestamp).getTime() : 0;
				if (!ts || Number.isNaN(ts)) continue;
				if (d.event === 'POST offline' && ts > latestOfflineDeliveryMs) {
					latestOfflineDeliveryMs = ts;
				} else if (d.event === 'POST online' && ts > latestOnlineDeliveryMs) {
					latestOnlineDeliveryMs = ts;
				}
			}
		}

		const latestStatusActivityMs = Math.max(latestOfflineDeliveryMs, latestOnlineDeliveryMs);

		// 60-second offline cooldown: if a status transition already fired within the last minute,
		// hold back `POST offline` (keeping `lastWebhookStatus: 'online'` so a quick reconnect won't spam `POST online`),
		// and re-check once the 60s window expires in case the bot stays offline.
		if (!isOnline && latestStatusActivityMs > 0 && nowMs - latestStatusActivityMs < OFFLINE_WEBHOOK_COOLDOWN_MS) {
			if (!pendingOfflineTimers.has(botId)) {
				const remainingMs = Math.max(1000, OFFLINE_WEBHOOK_COOLDOWN_MS - (nowMs - latestStatusActivityMs) + 250);
				const timer = setTimeout(async () => {
					pendingOfflineTimers.delete(botId);
					try {
						const latestBot = await BotModel.findOne({ id: botId }).lean();
						if (latestBot && !isBotOnlineStatus(latestBot.status)) {
							await dispatchBotStatusWebhooks(latestBot, 'offline', 'online', latestBot.activity || '');
						}
					} catch {}
				}, remainingMs);
				if (typeof (timer as any)?.unref === 'function') {
					(timer as any).unref();
				}
				pendingOfflineTimers.set(botId, timer);
			}
			return deliveries;
		}

		// Prevent spamming `POST online` if `POST online` already fired within the last 60s without a subsequent `POST offline` delivery
		if (isOnline && latestOnlineDeliveryMs > 0 && nowMs - latestOnlineDeliveryMs < OFFLINE_WEBHOOK_COOLDOWN_MS && latestOfflineDeliveryMs <= latestOnlineDeliveryMs) {
			await BotModel.updateOne({ id: botId, lastWebhookStatus: { $ne: 'online' } }, { $set: { lastWebhookStatus: 'online' } }).catch(() => null);
			return deliveries;
		}

		if (matchingHooks.length === 0) {
			await BotModel.updateOne({ id: botId, lastWebhookStatus: { $ne: targetState } }, { $set: { lastWebhookStatus: targetState, statusChangedAt: new Date(nowMs) } }).catch(() => null);
			return deliveries;
		}

		// Atomically claim this state transition so concurrent multi-guild/multi-daemon events fire once.
		const claimedBot = await BotModel.findOneAndUpdate(
			{
				id: botId,
				lastWebhookStatus: { $ne: targetState },
			},
			{
				$set: {
					lastWebhookStatus: targetState,
					statusChangedAt: new Date(nowMs),
				},
			},
			{ returnDocument: 'before' }
		).lean();

		if (!claimedBot) return deliveries;

		const [bot, latestStat] = await Promise.all([
			Promise.resolve(claimedBot),
			StatModel
				? StatModel.findOne({ id: botId })
						.sort({ timestamp: -1 })
						.lean()
						.catch(() => null)
				: Promise.resolve(null),
		]);
		if (!bot) return deliveries;

		const hasApiTier = await hasBotApiTierSubscription(bot);
		if (!hasApiTier) return deliveries;

		let discordBot: any = null;
		const discordToken = process.env.DISCORD_CLIENT_TOKEN || process.env.XERNERX_BOT_TOKEN || process.env.XERNERX_APP_TOKEN;
		if (discordToken) {
			try {
				const res = await fetch(`https://discord.com/api/v10/users/${botId}`, {
					headers: { Authorization: `Bot ${discordToken}` },
				});
				if (res.ok) discordBot = await res.json();
			} catch {}
		}

		const finalBotName = discordBot?.global_name || discordBot?.username || bot?.name || 'Unknown Bot';
		const rawAvatar = discordBot?.avatar || bot?.avatar;
		const finalBotAvatar = rawAvatar ? (String(rawAvatar).startsWith('http') ? String(rawAvatar) : `https://cdn.discordapp.com/avatars/${botId}/${rawAvatar}.png`) : undefined;
		const profileSlug = bot.vanitySlug || botId;
		const profileUrl = `https://app.xernerx.com/bots/${profileSlug}`;
		const portalUrl = `https://portal.xernerx.com/bots/${botId}`;
		const statusIso = new Date(nowMs).toISOString();
		const unixNow = Math.floor(nowMs / 1000);
		const resolvedActivity = typeof activity === 'string' ? activity : bot.activity || '';

		const prevStateStartedMs = bot.statusChangedAt ? new Date(bot.statusChangedAt).getTime() : bot.statusUpdatedAt ? new Date(bot.statusUpdatedAt).getTime() : 0;
		const onlineSinceMs =
			!isOnline && typeof latestStat?.onlineSince === 'number' && latestStat.onlineSince > 0 ? (latestStat.onlineSince < 1e12 ? latestStat.onlineSince * 1000 : latestStat.onlineSince) : 0;
		const referenceStartMs = !isOnline && onlineSinceMs > 0 && onlineSinceMs < nowMs ? onlineSinceMs : prevStateStartedMs;
		const stateDurationMs = referenceStartMs > 0 && nowMs > referenceStartMs ? nowMs - referenceStartMs : null;
		const stateDurationFormatted = stateDurationMs ? formatStateDuration(stateDurationMs) : null;

		const guildCount = typeof latestStat?.guildCount === 'number' ? latestStat.guildCount : null;
		const userCount = typeof latestStat?.userCount === 'number' ? latestStat.userCount : null;
		const shardCount = typeof latestStat?.shardCount === 'number' && latestStat.shardCount > 0 ? latestStat.shardCount : 1;
		const footprintText =
			guildCount !== null
				? `\`${guildCount.toLocaleString()} Servers\` • \`${shardCount} ${shardCount === 1 ? 'Shard' : 'Shards'}\`${userCount ? ` • \`${userCount.toLocaleString()} Users\`` : ''}`
				: null;

		const embedFields: { name: string; value: string; inline?: boolean }[] = isOnline
			? [
					{
						name: '⚡ Outage Recovery',
						value: stateDurationFormatted ? `Back after \`${stateDurationFormatted}\`` : '`Fresh Gateway Session`',
						inline: true,
					},
					{
						name: '🕒 Connected',
						value: `<t:${unixNow}:T> (<t:${unixNow}:R>)`,
						inline: true,
					},
					...(resolvedActivity
						? [
								{
									name: '🎮 Presence Activity',
									value: `\`${String(resolvedActivity).slice(0, 120)}\``,
									inline: true,
								},
							]
						: []),
					...(footprintText
						? [
								{
									name: '🌐 Active Footprint',
									value: footprintText,
									inline: false,
								},
							]
						: []),
					{
						name: '🔗 Quick Links',
						value: `[Bot Profile](${profileUrl}) • [Developer Portal](${portalUrl}) • [System Status](https://info.xernerx.com/status)`,
						inline: false,
					},
				]
			: [
					{
						name: '⏱️ Session Uptime',
						value: stateDurationFormatted ? `Online for \`${stateDurationFormatted}\` before disconnect` : '`Unknown session length`',
						inline: true,
					},
					{
						name: '🕒 Disconnected',
						value: `<t:${unixNow}:T> (<t:${unixNow}:R>)`,
						inline: true,
					},
					...(footprintText
						? [
								{
									name: '🌐 Last Known Footprint',
									value: footprintText,
									inline: false,
								},
							]
						: []),
					{
						name: '🔗 Diagnostics & Links',
						value: `[Inspect in Portal](${portalUrl}) • [Public Listing](${profileUrl}) • [System Status](https://info.xernerx.com/status)`,
						inline: false,
					},
				];

		const statusEmbed = {
			author: {
				name: `${finalBotName} • Live Telemetry Monitor`,
				...(finalBotAvatar ? { icon_url: finalBotAvatar } : {}),
				url: profileUrl,
			},
			title: isOnline ? `🟢 ${finalBotName} Connected & Operational` : `🔴 ${finalBotName} Disconnected from Gateway`,
			url: profileUrl,
			...(finalBotAvatar ? { thumbnail: { url: finalBotAvatar } } : {}),
			description: isOnline
				? `**${finalBotName}** has established a live Discord Gateway session and is actively responding${newStatus !== 'online' ? ` (\`${newStatus.toUpperCase()}\`)` : ''}.`
				: `**${finalBotName}** lost its Discord Gateway connection and is no longer responding to events. Check your host logs or shard manager if this was unexpected.`,
			fields: embedFields,
			color: isOnline ? 0x22c55e : 0xef4444,
			footer: {
				text: `${finalBotName} • Xernerx Status Webhook`,
				...(finalBotAvatar ? { icon_url: finalBotAvatar } : {}),
			},
			timestamp: statusIso,
		};

		for (const hook of matchingHooks) {
			try {
				const isDiscordWebhook = hook.url.includes('discord.com/api/webhooks/') || hook.url.includes('discordapp.com/api/webhooks/');
				const payload = isDiscordWebhook
					? {
							username: 'Xernerx App',
							avatar_url: 'https://xernerx.com/logo.png',
							embeds: [statusEmbed],
						}
					: {
							event,
							botId,
							timestamp: statusIso,
							status: newStatus,
							previousStatus: String(previousStatus),
							online: isOnline,
							durationMs: stateDurationMs,
							durationFormatted: stateDurationFormatted,
							activity: resolvedActivity || null,
							stats: {
								guildCount,
								userCount,
								shardCount,
							},
							bot: {
								id: botId,
								name: finalBotName,
								vanitySlug: bot.vanitySlug || null,
								avatar: finalBotAvatar || null,
								url: profileUrl,
							},
							data: {
								status: newStatus,
								previousStatus: String(previousStatus),
								online: isOnline,
								durationMs: stateDurationMs,
								durationFormatted: stateDurationFormatted,
								activity: resolvedActivity || null,
								stats: {
									guildCount,
									userCount,
									shardCount,
								},
								timestamp: statusIso,
							},
							embeds: [statusEmbed],
						};

				const delivery = await dispatchSignedBotWebhook({
					botId,
					url: hook.url,
					event,
					payload,
					secret: hook.secret,
				});
				deliveries.push(delivery);
			} catch (err) {
				console.error(`Failed to trigger bot ${event} webhook:`, err);
			}
		}
	} catch (err) {
		console.error('Failed to process bot status webhooks:', err);
	}

	return deliveries;
}
