/** @format */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

const ALLOWED_REDIRECT_SCHEMES = ['xernerx://', 'exp://', 'exps://'];

function isSafeMobileRedirect(uri: string): boolean {
	const trimmed = uri.trim();
	return ALLOWED_REDIRECT_SCHEMES.some((prefix) => trimmed.startsWith(prefix));
}

function resolvePublicOrigin(req: NextRequest): string {
	const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
	const forwardedProto = req.headers.get('x-forwarded-proto') || (forwardedHost?.includes('xernerx.com') ? 'https' : req.nextUrl.protocol.replace(':', ''));
	if (forwardedHost) {
		return `${forwardedProto}://${forwardedHost}`;
	}
	return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
	try {
		const clientId = process.env.DISCORD_CLIENT_ID;
		if (!clientId) {
			return NextResponse.json({ error: 'Discord OAuth is not configured on this server.' }, { status: 500 });
		}

		const { searchParams } = new URL(req.url);
		const rawRedirectUri = searchParams.get('redirectUri') || 'xernerx://auth/callback';
		const redirectUri = isSafeMobileRedirect(rawRedirectUri) ? rawRedirectUri : 'xernerx://auth/callback';
		const deviceId = (searchParams.get('deviceId') || crypto.randomUUID()).slice(0, 80);
		const deviceName = (searchParams.get('deviceName') || 'Xernerx Mobile').slice(0, 80);
		const platform = searchParams.get('platform') === 'ios' ? 'ios' : 'android';
		const osVersion = (searchParams.get('osVersion') || '').slice(0, 32);
		const appVersion = (searchParams.get('appVersion') || '1.0.0').slice(0, 32);

		const state = crypto.randomBytes(24).toString('hex');
		const callbackUrl = `${resolvePublicOrigin(req)}/secure/auth/mobile/oauth/callback`;

		const { models } = await database('xernerx');
		await models.core.Setting.findOneAndUpdate(
			{ id: `mobile_oauth_state_${state}` },
			{
				$set: {
					id: `mobile_oauth_state_${state}`,
					value: JSON.stringify({
						redirectUri,
						callbackUrl,
						deviceId,
						deviceName,
						platform,
						osVersion,
						appVersion,
						expiresAt: Date.now() + 10 * 60 * 1000,
					}),
				},
			},
			{ upsert: true }
		);

		const discordAuthUrl = new URL('https://discord.com/oauth2/authorize');
		discordAuthUrl.searchParams.set('client_id', clientId);
		discordAuthUrl.searchParams.set('redirect_uri', callbackUrl);
		discordAuthUrl.searchParams.set('response_type', 'code');
		discordAuthUrl.searchParams.set('scope', 'identify guilds guilds.join email connections guilds.members.read');
		discordAuthUrl.searchParams.set('state', state);

		return NextResponse.redirect(discordAuthUrl.toString());
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
