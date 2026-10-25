/** @format */

import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

function getLogoDataUri(): string | undefined {
	try {
		const localCandidates = [path.join(process.cwd(), 'public', 'logo.png'), path.join(process.cwd(), '..', '..', 'packages', 'public', 'logo.png')];
		for (const candidate of localCandidates) {
			if (fs.existsSync(candidate)) {
				const buf = fs.readFileSync(candidate);
				return `data:image/png;base64,${buf.toString('base64')}`;
			}
		}
	} catch {}
	return undefined;
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { channelId, name } = body;

		if (!channelId) {
			return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
		}

		const candidateTokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];
		if (candidateTokens.length === 0) {
			return NextResponse.json({ error: 'DISCORD_BOT_TOKEN / DISCORD_CLIENT_TOKEN is not configured' }, { status: 500 });
		}

		let avatarBase64 = getLogoDataUri();
		if (!avatarBase64) {
			try {
				const logoRes = await fetch('https://www.xernerx.com/logo.png');
				const contentType = logoRes.headers.get('content-type') || '';
				if (logoRes.ok && contentType.startsWith('image/')) {
					const arrayBuffer = await logoRes.arrayBuffer();
					const base64 = Buffer.from(arrayBuffer).toString('base64');
					avatarBase64 = `data:image/png;base64,${base64}`;
				}
			} catch (e) {
				console.error('Failed to fetch Xernerx logo', e);
			}
		}

		const targetName = String(name || 'Xernerx Announcements')
			.trim()
			.slice(0, 80);
		let lastStatus = 500;
		let lastErrorDetails = 'Failed to create webhook';

		for (const token of candidateTokens) {
			let targetChannelId = String(channelId).trim();
			let threadQuery = '';

			// Inspect channel first so threads or invalid category selections are handled gracefully
			try {
				const chanRes = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}`, {
					headers: { Authorization: `Bot ${token}` },
				});
				if (chanRes.ok) {
					const chanData = await chanRes.json();
					if (chanData.type === 4) {
						return NextResponse.json({ error: 'Cannot create a webhook on a category. Please select a text or announcement channel.' }, { status: 400 });
					}
					if ([10, 11, 12].includes(chanData.type) && chanData.parent_id) {
						threadQuery = `?thread_id=${targetChannelId}`;
						targetChannelId = chanData.parent_id;
					}
				}
			} catch {}

			let fallbackOwnedWebhook: any = null;

			// 1. Check for existing webhooks in the channel matching our target name
			try {
				const existingRes = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/webhooks`, {
					method: 'GET',
					headers: {
						Authorization: `Bot ${token}`,
					},
				});

				if (existingRes.ok) {
					const webhooks = await existingRes.json();
					if (Array.isArray(webhooks)) {
						const exactMatch = webhooks.find((w: any) => w.token && w.name === targetName);
						if (exactMatch) {
							const webhookUrl = `https://discord.com/api/webhooks/${exactMatch.id}/${exactMatch.token}${threadQuery}`;
							return NextResponse.json({ url: webhookUrl, id: exactMatch.id, channel_id: exactMatch.channel_id });
						}
						fallbackOwnedWebhook = webhooks.find((w: any) => w.token) || null;
					}
				}
			} catch {}

			// 2. Create a new webhook in the specified channel
			const response = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/webhooks`, {
				method: 'POST',
				headers: {
					Authorization: `Bot ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: targetName,
					...(avatarBase64 ? { avatar: avatarBase64 } : {}),
				}),
			});

			if (response.ok) {
				const data = await response.json();
				const webhookUrl = `https://discord.com/api/webhooks/${data.id}/${data.token}${threadQuery}`;
				return NextResponse.json({ url: webhookUrl, id: data.id, channel_id: data.channel_id });
			}

			// If creation failed because the channel already reached the 15-webhook limit, reuse any token-bearing webhook we can read
			if (fallbackOwnedWebhook) {
				const webhookUrl = `https://discord.com/api/webhooks/${fallbackOwnedWebhook.id}/${fallbackOwnedWebhook.token}${threadQuery}`;
				return NextResponse.json({ url: webhookUrl, id: fallbackOwnedWebhook.id, channel_id: fallbackOwnedWebhook.channel_id });
			}

			lastStatus = response.status;
			const errorText = await response.text().catch(() => '');
			try {
				const parsed = JSON.parse(errorText);
				if (parsed?.code === 50013) {
					lastErrorDetails = 'Bot is missing the "Manage Webhooks" permission in that Discord channel.';
				} else if (parsed?.code === 50024) {
					lastErrorDetails = 'Webhooks cannot be created in this channel type. Select a text or announcement channel.';
				} else if (parsed?.code === 30007) {
					lastErrorDetails = 'Maximum number of webhooks (15) reached in that Discord channel.';
				} else if (parsed?.code === 10003 || parsed?.code === 50001) {
					lastErrorDetails = 'Bot cannot access that Discord channel. Check channel permissions or invite the bot to the server.';
				} else if (parsed?.message) {
					lastErrorDetails = `${parsed.message}${parsed.code ? ` (Discord code ${parsed.code})` : ''}`;
				} else {
					lastErrorDetails = errorText || `HTTP ${response.status}`;
				}
			} catch {
				lastErrorDetails = errorText || `HTTP ${response.status}`;
			}
		}

		return NextResponse.json({ error: lastErrorDetails, details: lastErrorDetails }, { status: lastStatus });
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Failed to create webhook' }, { status: 500 });
	}
}
