import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { channelId, name } = body;

		if (!channelId) {
			return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
		}

		const token = process.env.DISCORD_CLIENT_TOKEN;
		if (!token) {
			return NextResponse.json({ error: 'DISCORD_CLIENT_TOKEN is not configured' }, { status: 500 });
		}

		let avatarBase64 = undefined;
		try {
			const logoRes = await fetch('https://www.xernerx.com/logo.png');
			if (logoRes.ok) {
				const arrayBuffer = await logoRes.arrayBuffer();
				const base64 = Buffer.from(arrayBuffer).toString('base64');
				avatarBase64 = `data:image/png;base64,${base64}`;
			}
		} catch (e) {
			console.error('Failed to fetch Xernerx logo', e);
		}

		// Check for existing webhooks in the channel to avoid spamming
		const existingRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/webhooks`, {
			method: 'GET',
			headers: {
				Authorization: `Bot ${token}`,
			},
		});

		if (existingRes.ok) {
			const webhooks = await existingRes.json();
			const targetName = name || 'Xernerx Announcements';
			// Find a webhook we own (must have a token). Prefer one matching our target name.
			const usableWebhook = webhooks.find((w: any) => w.token && w.name === targetName) || webhooks.find((w: any) => w.token);

			if (usableWebhook) {
				const webhookUrl = `https://discord.com/api/webhooks/${usableWebhook.id}/${usableWebhook.token}`;
				return NextResponse.json({ url: webhookUrl, id: usableWebhook.id, channel_id: usableWebhook.channel_id });
			}
		}

		// Create a webhook in the specified channel
		const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/webhooks`, {
			method: 'POST',
			headers: {
				Authorization: `Bot ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				name: name || 'Xernerx Announcements',
				avatar: avatarBase64,
			}),
		});

		if (!response.ok) {
			const errorData = await response.text();
			return NextResponse.json({ error: 'Failed to create webhook', details: errorData }, { status: response.status });
		}

		const data = await response.json();
		const webhookUrl = `https://discord.com/api/webhooks/${data.id}/${data.token}`;

		return NextResponse.json({ url: webhookUrl, id: data.id, channel_id: data.channel_id });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
