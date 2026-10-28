/** @format */

import { createHmac, randomUUID } from 'crypto';
import { database } from '@xernerx/lib/server';

export interface WebhookDeliveryRecord {
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

export interface DispatchBotWebhookOptions {
	botId: string;
	url: string;
	event: string;
	payload: Record<string, any>;
	secret?: string;
	headers?: Record<string, string>;
	timeoutMs?: number;
}

export async function dispatchBotWebhook({ botId, url, event, payload, secret, headers = {}, timeoutMs = 8000 }: DispatchBotWebhookOptions): Promise<WebhookDeliveryRecord> {
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

		const rawBody = JSON.stringify(payload);
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
	const delivery: WebhookDeliveryRecord = {
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

export function collectBotDeliveries(hooks: any[]): WebhookDeliveryRecord[] {
	const all: WebhookDeliveryRecord[] = [];
	for (const hook of hooks || []) {
		if (Array.isArray(hook.deliveries)) {
			for (const d of hook.deliveries) {
				all.push({
					id: d.id,
					event: d.event || 'webhook',
					url: d.url || hook.url,
					status: typeof d.status === 'number' ? d.status : 0,
					ok: Boolean(d.ok),
					latencyMs: typeof d.latencyMs === 'number' ? d.latencyMs : 0,
					payload: d.payload || {},
					responseSnippet: d.responseSnippet || '',
					timestamp: d.timestamp ? new Date(d.timestamp) : new Date(),
				});
			}
		}
	}
	return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 25);
}

export async function dispatchBotReleaseWebhooks(bot: any, newRelease: any): Promise<WebhookDeliveryRecord[]> {
	const deliveries: WebhookDeliveryRecord[] = [];
	if (!bot?.id || !newRelease) return deliveries;

	try {
		const db = await database('xernerx');
		const HookModel = (db.models.bots as any).Hook;
		if (!HookModel) return deliveries;

		const hooks = await HookModel.find({ botId: bot.id }).lean();
		const matchingHooks = (hooks || []).filter((hook: any) => hook?.url && Array.isArray(hook.events) && (hook.events.includes('POST release') || hook.events.includes('POST releases')));

		if (matchingHooks.length === 0) return deliveries;

		let discordBot: any = null;
		try {
			const res = await fetch(`https://discord.com/api/v10/users/${bot.id}`, {
				headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
				next: { revalidate: 3600 },
			});
			if (res.ok) discordBot = await res.json();
		} catch {}

		const finalBotName = discordBot?.global_name || discordBot?.username || bot?.name || 'Unknown Bot';
		const rawAvatar = discordBot?.avatar || bot?.avatar;
		const finalBotAvatar = rawAvatar ? (String(rawAvatar).startsWith('http') ? String(rawAvatar) : `https://cdn.discordapp.com/avatars/${bot.id}/${rawAvatar}.png`) : undefined;

		const rawVersion = String(newRelease.version || '1.0.0').trim();
		const formattedVersion = rawVersion.toLowerCase().startsWith('v') ? rawVersion : `v${rawVersion}`;
		const profileSlug = bot.vanitySlug || bot.id;
		const releasesUrl = `https://app.xernerx.com/bots/${profileSlug}?tab=releases`;
		const releaseIso = new Date(newRelease.createdAt || Date.now()).toISOString();

		const releaseEmbed = {
			author: {
				name: `${finalBotName} • New Release`,
				...(finalBotAvatar ? { icon_url: finalBotAvatar } : {}),
				url: `https://app.xernerx.com/bots/${profileSlug}`,
			},
			title: `🚀 ${formattedVersion} — ${newRelease.title}`,
			url: releasesUrl,
			description: newRelease.body ? String(newRelease.body).slice(0, 3800) : '*No release notes provided.*',
			fields: [
				{
					name: 'Version',
					value: `\`${formattedVersion}\``,
					inline: true,
				},
				{
					name: 'Changelog',
					value: `[View on Xernerx](${releasesUrl})`,
					inline: true,
				},
			],
			color: 0xff00a0,
			footer: {
				text: `${finalBotName} • Xernerx Releases`,
				...(finalBotAvatar ? { icon_url: finalBotAvatar } : {}),
			},
			timestamp: releaseIso,
		};

		const releasePayloadObj = {
			id: newRelease.id,
			version: newRelease.version,
			title: newRelease.title,
			body: newRelease.body || '',
			authorId: newRelease.authorId,
			createdAt: releaseIso,
		};

		for (const hook of matchingHooks) {
			try {
				const isDiscordWebhook = hook.url.includes('discord.com/api/webhooks/') || hook.url.includes('discordapp.com/api/webhooks/');
				const payload = isDiscordWebhook
					? {
							username: 'Xernerx App',
							avatar_url: 'https://xernerx.com/logo.png',
							embeds: [releaseEmbed],
						}
					: {
							event: 'POST release',
							botId: bot.id,
							timestamp: releaseIso,
							bot: {
								id: bot.id,
								name: finalBotName,
								vanitySlug: bot.vanitySlug || null,
								avatar: finalBotAvatar || null,
								url: releasesUrl,
							},
							release: releasePayloadObj,
							data: {
								release: releasePayloadObj,
							},
							embeds: [releaseEmbed],
						};

				const delivery = await dispatchBotWebhook({
					botId: bot.id,
					url: hook.url,
					event: 'POST release',
					payload,
					secret: hook.secret,
				});
				deliveries.push(delivery);
			} catch (err) {
				console.error('Failed to trigger bot webhook for release:', err);
			}
		}
	} catch (err) {
		console.error('Failed to process bot release webhooks:', err);
	}

	return deliveries;
}
