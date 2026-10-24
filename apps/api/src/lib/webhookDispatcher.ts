/** @format */

import { randomUUID } from 'crypto';
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
	headers?: Record<string, string>;
	timeoutMs?: number;
}

export async function dispatchBotWebhook({ botId, url, event, payload, headers = {}, timeoutMs = 8000 }: DispatchBotWebhookOptions): Promise<WebhookDeliveryRecord> {
	const deliveryId = randomUUID();
	const start = Date.now();
	let status = 0;
	let ok = false;
	let responseSnippet = '';

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Xernerx-Event': event,
				'X-Xernerx-Bot-Id': botId,
				'X-Xernerx-Delivery-Id': deliveryId,
				...headers,
			},
			body: JSON.stringify(payload),
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
