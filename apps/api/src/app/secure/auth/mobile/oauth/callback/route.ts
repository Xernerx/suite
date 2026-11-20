/** @format */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { encryptMobileOAuthPayload } from '@/lib/mobileAuth';

function appendQuery(baseUri: string, params: Record<string, string>): string {
	const sep = baseUri.includes('?') ? '&' : '?';
	const qs = Object.entries(params)
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
		.join('&');
	return `${baseUri}${sep}${qs}`;
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const code = searchParams.get('code');
		const state = searchParams.get('state');
		const oauthError = searchParams.get('error');

		if (!state) {
			return NextResponse.json({ error: 'Missing OAuth state' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const stateDoc = (await models.core.Setting.findOne({ id: `mobile_oauth_state_${state}` }).lean()) as any;
		await models.core.Setting.deleteOne({ id: `mobile_oauth_state_${state}` }).catch(() => {});

		if (!stateDoc?.value) {
			return NextResponse.json({ error: 'OAuth state expired or invalid' }, { status: 400 });
		}

		const stateData = JSON.parse(stateDoc.value);
		const redirectUri: string = stateData.redirectUri || 'xernerx://auth/callback';

		if (Date.now() > Number(stateData.expiresAt || 0)) {
			return NextResponse.redirect(appendQuery(redirectUri, { error: 'state_expired' }));
		}

		if (oauthError || !code) {
			return NextResponse.redirect(appendQuery(redirectUri, { error: oauthError || 'missing_code' }));
		}

		const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: process.env.DISCORD_CLIENT_ID!,
				client_secret: process.env.DISCORD_CLIENT_SECRET!,
				grant_type: 'authorization_code',
				code,
				redirect_uri: stateData.callbackUrl || `${req.nextUrl.origin}/secure/auth/mobile/oauth/callback`,
			}),
		});

		if (!tokenRes.ok) {
			return NextResponse.redirect(appendQuery(redirectUri, { error: 'token_exchange_failed' }));
		}

		const tokenData = await tokenRes.json();
		const userRes = await fetch('https://discord.com/api/v10/users/@me', {
			headers: { Authorization: `Bearer ${tokenData.access_token}` },
		});

		if (!userRes.ok) {
			return NextResponse.redirect(appendQuery(redirectUri, { error: 'discord_profile_failed' }));
		}

		const discordUser = await userRes.json();
		const userId = String(discordUser.id);
		const avatarUrl = discordUser.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${discordUser.avatar}.${String(discordUser.avatar).startsWith('a_') ? 'gif' : 'png'}?size=256` : null;
		const displayName = discordUser.global_name || discordUser.username || 'User';

		// Ensure Xernerx user document exists & cache latest Discord metadata
		await models.users.User.findOneAndUpdate(
			{ id: userId },
			{
				$setOnInsert: {
					id: userId,
					name: displayName,
					email: discordUser.email || undefined,
					privacy: 'private',
					services: true,
				},
				$set: {
					discordCache: {
						username: discordUser.username,
						globalName: discordUser.global_name || discordUser.username,
						avatar: discordUser.avatar || null,
						banner: discordUser.banner || null,
						avatarUrl,
						updatedAt: new Date(),
					},
				},
			},
			{ upsert: true }
		);

		// Create short-lived 1-time exchange code for the mobile app to swap for a persistent Bearer session
		const exchangeCode = crypto.randomBytes(24).toString('hex');
		const encryptedOAuth = encryptMobileOAuthPayload({
			sub: userId,
			name: displayName,
			email: discordUser.email || null,
			picture: avatarUrl,
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token,
			accessTokenExpires: tokenData.expires_in ? Date.now() + Number(tokenData.expires_in) * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000,
		});

		await models.core.Setting.findOneAndUpdate(
			{ id: `mobile_oauth_exchange_${exchangeCode}` },
			{
				$set: {
					id: `mobile_oauth_exchange_${exchangeCode}`,
					value: JSON.stringify({
						userId,
						encryptedOAuth,
						deviceId: stateData.deviceId,
						deviceName: stateData.deviceName,
						platform: stateData.platform,
						osVersion: stateData.osVersion,
						appVersion: stateData.appVersion,
						expiresAt: Date.now() + 2 * 60 * 1000,
					}),
				},
			},
			{ upsert: true }
		);

		return NextResponse.redirect(appendQuery(redirectUri, { code: exchangeCode }));
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
