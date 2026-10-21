/** @format */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json().catch(() => ({}));
		const url = String(body.url || '').trim();
		const events: string[] = Array.isArray(body.events) && body.events.length > 0 ? body.events : ['POST vote'];

		if (!url.startsWith('https://') && !url.startsWith('http://')) {
			return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 });
		}

		const isDiscordWebhook = url.includes('discord.com/api/webhooks/') || url.includes('discordapp.com/api/webhooks/');
		const payload = isDiscordWebhook
			? {
					username: 'Xernerx Developer Portal',
					embeds: [
						{
							title: '🧪 Xernerx Webhook Test Ping',
							description: `Your bot webhook endpoint received a live test ping from the **Xernerx Developer Portal**.`,
							color: 0x6366f1,
							fields: [
								{ name: 'Bot ID', value: `\`${id}\``, inline: true },
								{ name: 'Subscribed Events', value: events.map((e) => `\`${e}\``).join(', '), inline: true },
							],
							timestamp: new Date().toISOString(),
							footer: { text: 'Xernerx Suite • Bot Webhooks' },
						},
					],
				}
			: {
					event: events[0] || 'POST vote',
					test: true,
					botId: id,
					timestamp: new Date().toISOString(),
					data: {
						userId: '000000000000000000',
						subscribedEvents: events,
						message: 'Test webhook ping from Xernerx Developer Portal',
					},
				};

		const start = Date.now();
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Xernerx-Event': 'test',
				'X-Xernerx-Bot-Id': id,
			},
			body: JSON.stringify(payload),
		});
		const latencyMs = Date.now() - start;

		return NextResponse.json({
			ok: res.ok,
			status: res.status,
			latencyMs,
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Webhook delivery failed' }, { status: 500 });
	}
}
