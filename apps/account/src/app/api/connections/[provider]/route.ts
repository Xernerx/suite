/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { AuthOptions } from 'next-auth';
import crypto from 'crypto';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

const SUPPORTED_PROVIDERS = ['github', 'twitch', 'youtube', 'twitter', 'spotify', 'reddit', 'steam'] as const;
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

function base64UrlEncode(buf: Buffer) {
	return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
	const { provider: rawProvider } = await params;
	const provider = rawProvider.toLowerCase() as SupportedProvider;
	const origin = req.nextUrl.origin;

	if (!SUPPORTED_PROVIDERS.includes(provider)) {
		return NextResponse.redirect(`${origin}/?view=connections&error=unsupported_provider`);
	}

	const session = await getServerSession(auth as AuthOptions);
	const userId = (session?.user as any)?.id;
	if (!userId) {
		return NextResponse.redirect(`${origin}/login`);
	}

	const state = crypto.randomBytes(24).toString('hex');
	const verifier = base64UrlEncode(crypto.randomBytes(32));
	const codeChallenge = base64UrlEncode(crypto.createHash('sha256').update(verifier).digest());
	const redirectUri = `${origin}/api/connections/${provider}/callback`;

	let authorizeUrl: string | null = null;

	switch (provider) {
		case 'github': {
			const clientId = process.env.GITHUB_CLIENT_ID;
			if (!clientId) {
				return NextResponse.redirect(`${origin}/?view=connections&error=not_configured&provider=github`);
			}
			const url = new URL('https://github.com/login/oauth/authorize');
			url.searchParams.set('client_id', clientId);
			url.searchParams.set('redirect_uri', redirectUri);
			url.searchParams.set('scope', 'read:user');
			url.searchParams.set('state', state);
			authorizeUrl = url.toString();
			break;
		}
		case 'twitch': {
			const clientId = process.env.TWITCH_CLIENT_ID;
			if (!clientId) {
				return NextResponse.redirect(`${origin}/?view=connections&error=not_configured&provider=twitch`);
			}
			const url = new URL('https://id.twitch.tv/oauth2/authorize');
			url.searchParams.set('client_id', clientId);
			url.searchParams.set('redirect_uri', redirectUri);
			url.searchParams.set('response_type', 'code');
			url.searchParams.set('scope', 'user:read:email');
			url.searchParams.set('state', state);
			authorizeUrl = url.toString();
			break;
		}
		case 'youtube': {
			const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
			if (!clientId) {
				return NextResponse.redirect(`${origin}/?view=connections&error=not_configured&provider=youtube`);
			}
			const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
			url.searchParams.set('client_id', clientId);
			url.searchParams.set('redirect_uri', redirectUri);
			url.searchParams.set('response_type', 'code');
			url.searchParams.set('scope', 'openid profile https://www.googleapis.com/auth/youtube.readonly');
			url.searchParams.set('access_type', 'online');
			url.searchParams.set('state', state);
			authorizeUrl = url.toString();
			break;
		}
		case 'twitter': {
			const clientId = process.env.TWITTER_CLIENT_ID;
			if (!clientId) {
				return NextResponse.redirect(`${origin}/?view=connections&error=not_configured&provider=twitter`);
			}
			const url = new URL('https://twitter.com/i/oauth2/authorize');
			url.searchParams.set('response_type', 'code');
			url.searchParams.set('client_id', clientId);
			url.searchParams.set('redirect_uri', redirectUri);
			url.searchParams.set('scope', 'users.read tweet.read');
			url.searchParams.set('state', state);
			url.searchParams.set('code_challenge', codeChallenge);
			url.searchParams.set('code_challenge_method', 'S256');
			authorizeUrl = url.toString();
			break;
		}
		case 'spotify': {
			const clientId = process.env.SPOTIFY_CLIENT_ID;
			if (!clientId) {
				return NextResponse.redirect(`${origin}/?view=connections&error=not_configured&provider=spotify`);
			}
			const url = new URL('https://accounts.spotify.com/authorize');
			url.searchParams.set('response_type', 'code');
			url.searchParams.set('client_id', clientId);
			url.searchParams.set('redirect_uri', redirectUri);
			url.searchParams.set('scope', 'user-read-private');
			url.searchParams.set('state', state);
			authorizeUrl = url.toString();
			break;
		}
		case 'reddit': {
			const clientId = process.env.REDDIT_CLIENT_ID;
			if (!clientId) {
				return NextResponse.redirect(`${origin}/?view=connections&error=not_configured&provider=reddit`);
			}
			const url = new URL('https://www.reddit.com/api/v1/authorize');
			url.searchParams.set('client_id', clientId);
			url.searchParams.set('response_type', 'code');
			url.searchParams.set('state', state);
			url.searchParams.set('redirect_uri', redirectUri);
			url.searchParams.set('duration', 'temporary');
			url.searchParams.set('scope', 'identity');
			authorizeUrl = url.toString();
			break;
		}
		case 'steam': {
			const url = new URL('https://steamcommunity.com/openid/login');
			url.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0');
			url.searchParams.set('openid.mode', 'checkid_setup');
			url.searchParams.set('openid.return_to', `${redirectUri}?state=${state}`);
			url.searchParams.set('openid.realm', origin);
			url.searchParams.set('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select');
			url.searchParams.set('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select');
			authorizeUrl = url.toString();
			break;
		}
	}

	if (!authorizeUrl) {
		return NextResponse.redirect(`${origin}/?view=connections&error=unsupported_provider`);
	}

	const response = NextResponse.redirect(authorizeUrl);
	response.cookies.set(
		'__xernerx_conn_oauth',
		JSON.stringify({
			state,
			verifier,
			userId,
			provider,
		}),
		{
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 600,
			path: '/',
		}
	);

	return response;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
	try {
		const { provider: rawProvider } = await params;
		const provider = rawProvider.toLowerCase();
		const session = await getServerSession(auth as AuthOptions);
		const userId = (session?.user as any)?.id;
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const showOnProfile = Boolean(body.showOnProfile);

		const { models } = await database('xernerx');
		const user = (await models.users.User.findOne({ id: userId }).lean()) as any;
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const updatedConnections = (Array.isArray(user.connections) ? user.connections : []).map((conn: any) => (conn.provider === provider ? { ...conn, showOnProfile } : conn));

		await models.users.User.findOneAndUpdate({ id: userId }, { $set: { connections: updatedConnections } });

		return NextResponse.json({ connections: updatedConnections });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
	try {
		const { provider: rawProvider } = await params;
		const provider = rawProvider.toLowerCase();
		const session = await getServerSession(auth as AuthOptions);
		const userId = (session?.user as any)?.id;
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { models } = await database('xernerx');
		const user = (await models.users.User.findOne({ id: userId }).lean()) as any;
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const updatedConnections = (Array.isArray(user.connections) ? user.connections : []).filter((conn: any) => conn.provider !== provider);

		await models.users.User.findOneAndUpdate({ id: userId }, { $set: { connections: updatedConnections } });

		return NextResponse.json({ connections: updatedConnections });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
