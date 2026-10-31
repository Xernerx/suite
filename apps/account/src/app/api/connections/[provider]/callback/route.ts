/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { AuthOptions } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

interface ConnectedAccount {
	provider: string;
	id: string;
	username: string;
	displayName?: string;
	avatar?: string;
	url?: string;
	secret?: string;
	token?: string;
	showOnProfile: boolean;
	connectedAt: Date;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
	const { provider: rawProvider } = await params;
	const provider = rawProvider.toLowerCase();
	const origin = req.nextUrl.origin;
	const redirectUri = `${origin}/api/connections/${provider}/callback`;

	const session = await getServerSession(auth as AuthOptions);
	const userId = (session?.user as any)?.id;
	if (!userId) {
		return NextResponse.redirect(`${origin}/login`);
	}

	const cookieRaw = req.cookies.get('__xernerx_conn_oauth')?.value;
	if (!cookieRaw) {
		return NextResponse.redirect(`${origin}/?view=connections&error=invalid_state`);
	}

	let oauthState: { state: string; verifier: string; userId: string; provider: string; returnTo?: string };
	try {
		oauthState = JSON.parse(cookieRaw);
	} catch {
		return NextResponse.redirect(`${origin}/?view=connections&error=invalid_state`);
	}

	const incomingState = req.nextUrl.searchParams.get('state');
	if (!incomingState || incomingState !== oauthState.state || oauthState.userId !== userId || oauthState.provider !== provider) {
		return NextResponse.redirect(`${origin}/?view=connections&error=invalid_state`);
	}

	if (req.nextUrl.searchParams.get('error')) {
		return NextResponse.redirect(`${origin}/?view=connections&error=oauth_denied`);
	}

	try {
		let connectedProfile: Omit<ConnectedAccount, 'showOnProfile' | 'connectedAt'> | null = null;

		switch (provider) {
			case 'vercel': {
				const code = req.nextUrl.searchParams.get('code');
				if (!code) throw new Error('Missing code');
				const callbackTeamId = req.nextUrl.searchParams.get('teamId') || '';

				const tokenRes = await fetch('https://api.vercel.com/v2/oauth/access_token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Accept: 'application/json',
					},
					body: new URLSearchParams({
						client_id: process.env.VERCEL_CLIENT_ID || '',
						client_secret: process.env.VERCEL_CLIENT_SECRET || '',
						code,
						redirect_uri: redirectUri,
					}),
				});
				const tokenData = await tokenRes.json().catch(() => ({}));
				if (!tokenData.access_token) throw new Error('Vercel OAuth token exchange failed');

				const resolvedTeamId = String(tokenData.team_id || callbackTeamId || '').trim();

				const [userRes, teamRes] = await Promise.all([
					fetch('https://api.vercel.com/v2/user', {
						headers: { Authorization: `Bearer ${tokenData.access_token}` },
					}).catch(() => null),
					resolvedTeamId
						? fetch(`https://api.vercel.com/v2/teams/${encodeURIComponent(resolvedTeamId)}`, {
								headers: { Authorization: `Bearer ${tokenData.access_token}` },
							}).catch(() => null)
						: Promise.resolve(null),
				]);

				const userData = userRes && userRes.ok ? await userRes.json().catch(() => null) : null;
				const teamData = teamRes && teamRes.ok ? await teamRes.json().catch(() => null) : null;
				const vUser = userData?.user || null;

				const slugOrUsername = String(teamData?.slug || vUser?.username || vUser?.email || 'vercel').trim();
				const displayName = String(teamData?.name || vUser?.name || slugOrUsername).trim();

				connectedProfile = {
					provider: 'vercel',
					id: String(vUser?.id || vUser?.uid || tokenData.user_id || slugOrUsername),
					username: slugOrUsername,
					displayName,
					avatar: vUser?.avatar ? `https://vercel.com/api/www/avatar/${vUser.avatar}?s=120` : '',
					url: teamData?.slug ? `https://vercel.com/${teamData.slug}` : 'https://vercel.com/dashboard',
					secret: resolvedTeamId,
					token: tokenData.access_token,
				};
				break;
			}

			case 'github': {
				const code = req.nextUrl.searchParams.get('code');
				if (!code) throw new Error('Missing code');
				const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
					body: JSON.stringify({
						client_id: process.env.GITHUB_CLIENT_ID,
						client_secret: process.env.GITHUB_CLIENT_SECRET,
						code,
						redirect_uri: redirectUri,
					}),
				});
				const tokenData = await tokenRes.json();
				if (!tokenData.access_token) throw new Error('GitHub token exchange failed');

				const userRes = await fetch('https://api.github.com/user', {
					headers: {
						Authorization: `Bearer ${tokenData.access_token}`,
						Accept: 'application/vnd.github+json',
					},
				});
				const ghUser = await userRes.json();
				if (!ghUser?.id) throw new Error('Failed to fetch GitHub user');

				connectedProfile = {
					provider: 'github',
					id: String(ghUser.id),
					username: ghUser.login,
					displayName: ghUser.name || ghUser.login,
					avatar: ghUser.avatar_url || '',
					url: ghUser.html_url || `https://github.com/${ghUser.login}`,
				};
				break;
			}

			case 'twitch': {
				const code = req.nextUrl.searchParams.get('code');
				if (!code) throw new Error('Missing code');
				const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						client_id: process.env.TWITCH_CLIENT_ID || '',
						client_secret: process.env.TWITCH_CLIENT_SECRET || '',
						code,
						grant_type: 'authorization_code',
						redirect_uri: redirectUri,
					}),
				});
				const tokenData = await tokenRes.json();
				if (!tokenData.access_token) throw new Error('Twitch token exchange failed');

				const userRes = await fetch('https://api.twitch.tv/helix/users', {
					headers: {
						Authorization: `Bearer ${tokenData.access_token}`,
						'Client-Id': process.env.TWITCH_CLIENT_ID || '',
					},
				});
				const twitchData = await userRes.json();
				const twUser = twitchData?.data?.[0];
				if (!twUser?.id) throw new Error('Failed to fetch Twitch user');

				connectedProfile = {
					provider: 'twitch',
					id: String(twUser.id),
					username: twUser.login,
					displayName: twUser.display_name || twUser.login,
					avatar: twUser.profile_image_url || '',
					url: `https://twitch.tv/${twUser.login}`,
				};
				break;
			}

			case 'youtube': {
				const code = req.nextUrl.searchParams.get('code');
				if (!code) throw new Error('Missing code');
				const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '';
				const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || '';
				const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						client_id: clientId,
						client_secret: clientSecret,
						code,
						grant_type: 'authorization_code',
						redirect_uri: redirectUri,
					}),
				});
				const tokenData = await tokenRes.json();
				if (!tokenData.access_token) throw new Error('YouTube token exchange failed');

				const ytRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
					headers: { Authorization: `Bearer ${tokenData.access_token}` },
				});
				const ytData = await ytRes.json();
				const channel = ytData?.items?.[0];

				if (channel?.id) {
					const handle = channel.snippet?.customUrl || channel.snippet?.title || channel.id;
					connectedProfile = {
						provider: 'youtube',
						id: String(channel.id),
						username: handle,
						displayName: channel.snippet?.title || handle,
						avatar: channel.snippet?.thumbnails?.default?.url || '',
						url: channel.snippet?.customUrl ? `https://youtube.com/${channel.snippet.customUrl}` : `https://youtube.com/channel/${channel.id}`,
					};
				} else {
					const gRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
						headers: { Authorization: `Bearer ${tokenData.access_token}` },
					});
					const gUser = await gRes.json();
					if (!gUser?.id) throw new Error('Failed to fetch Google/YouTube account');
					connectedProfile = {
						provider: 'youtube',
						id: String(gUser.id),
						username: gUser.name || gUser.id,
						displayName: gUser.name || 'YouTube User',
						avatar: gUser.picture || '',
						url: 'https://youtube.com',
					};
				}
				break;
			}

			case 'twitter': {
				const code = req.nextUrl.searchParams.get('code');
				if (!code) throw new Error('Missing code');
				const clientId = process.env.TWITTER_CLIENT_ID || '';
				const clientSecret = process.env.TWITTER_CLIENT_SECRET || '';
				const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

				const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						...(clientSecret ? { Authorization: `Basic ${basicAuth}` } : {}),
					},
					body: new URLSearchParams({
						code,
						grant_type: 'authorization_code',
						client_id: clientId,
						redirect_uri: redirectUri,
						code_verifier: oauthState.verifier,
					}),
				});
				const tokenData = await tokenRes.json();
				if (!tokenData.access_token) throw new Error('X token exchange failed');

				const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name', {
					headers: { Authorization: `Bearer ${tokenData.access_token}` },
				});
				const xData = await userRes.json();
				const xUser = xData?.data;
				if (!xUser?.id) throw new Error('Failed to fetch X user');

				connectedProfile = {
					provider: 'twitter',
					id: String(xUser.id),
					username: xUser.username,
					displayName: xUser.name || xUser.username,
					avatar: xUser.profile_image_url || '',
					url: `https://x.com/${xUser.username}`,
				};
				break;
			}

			case 'spotify': {
				const code = req.nextUrl.searchParams.get('code');
				if (!code) throw new Error('Missing code');
				const clientId = process.env.SPOTIFY_CLIENT_ID || '';
				const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
				const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

				const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Authorization: `Basic ${basicAuth}`,
					},
					body: new URLSearchParams({
						grant_type: 'authorization_code',
						code,
						redirect_uri: redirectUri,
					}),
				});
				const tokenData = await tokenRes.json();
				if (!tokenData.access_token) throw new Error('Spotify token exchange failed');

				const userRes = await fetch('https://api.spotify.com/v1/me', {
					headers: { Authorization: `Bearer ${tokenData.access_token}` },
				});
				const spUser = await userRes.json();
				if (!spUser?.id) throw new Error('Failed to fetch Spotify user');

				connectedProfile = {
					provider: 'spotify',
					id: String(spUser.id),
					username: spUser.display_name || spUser.id,
					displayName: spUser.display_name || spUser.id,
					avatar: spUser.images?.[0]?.url || '',
					url: spUser.external_urls?.spotify || `https://open.spotify.com/user/${spUser.id}`,
				};
				break;
			}

			case 'reddit': {
				const code = req.nextUrl.searchParams.get('code');
				if (!code) throw new Error('Missing code');
				const clientId = process.env.REDDIT_CLIENT_ID || '';
				const clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
				const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

				const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Authorization: `Basic ${basicAuth}`,
						'User-Agent': 'XernerxSuite/1.0',
					},
					body: new URLSearchParams({
						grant_type: 'authorization_code',
						code,
						redirect_uri: redirectUri,
					}),
				});
				const tokenData = await tokenRes.json();
				if (!tokenData.access_token) throw new Error('Reddit token exchange failed');

				const userRes = await fetch('https://oauth.reddit.com/api/v1/me', {
					headers: {
						Authorization: `Bearer ${tokenData.access_token}`,
						'User-Agent': 'XernerxSuite/1.0',
					},
				});
				const rdUser = await userRes.json();
				if (!rdUser?.id) throw new Error('Failed to fetch Reddit user');

				connectedProfile = {
					provider: 'reddit',
					id: String(rdUser.id),
					username: `u/${rdUser.name}`,
					displayName: rdUser.name,
					avatar: rdUser.snoovatar_img || rdUser.icon_img?.split('?')[0] || '',
					url: `https://www.reddit.com/user/${rdUser.name}`,
				};
				break;
			}

			case 'steam': {
				const verifyParams = new URLSearchParams();
				req.nextUrl.searchParams.forEach((value, key) => {
					if (key.startsWith('openid.')) {
						verifyParams.set(key, value);
					}
				});
				verifyParams.set('openid.mode', 'check_authentication');

				const verifyRes = await fetch('https://steamcommunity.com/openid/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: verifyParams,
				});
				const verifyText = await verifyRes.text();
				if (!verifyText.includes('is_valid:true')) {
					throw new Error('Steam OpenID verification failed');
				}

				const claimedId = req.nextUrl.searchParams.get('openid.claimed_id') || '';
				const steamIdMatch = claimedId.match(/\/id\/(\d+)$/) || claimedId.match(/(\d{17})$/);
				const steamId = steamIdMatch?.[1];
				if (!steamId) throw new Error('Invalid Steam ID');

				let username = steamId;
				let avatar = '';
				let profileUrl = `https://steamcommunity.com/profiles/${steamId}`;

				if (process.env.STEAM_API_KEY) {
					const summaryRes = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`).catch(() => null);
					if (summaryRes?.ok) {
						const summaryData = await summaryRes.json();
						const player = summaryData?.response?.players?.[0];
						if (player) {
							username = player.personaname || steamId;
							avatar = player.avatarfull || player.avatarmedium || '';
							profileUrl = player.profileurl || profileUrl;
						}
					}
				}

				connectedProfile = {
					provider: 'steam',
					id: steamId,
					username,
					displayName: username,
					avatar,
					url: profileUrl,
				};
				break;
			}
		}

		if (!connectedProfile) {
			return NextResponse.redirect(`${origin}/?view=connections&error=unsupported_provider`);
		}

		const { models } = await database('xernerx');
		const user = (await models.users.User.findOne({ id: userId }).lean()) as any;
		const existingConnections: ConnectedAccount[] = Array.isArray(user?.connections) ? user.connections : [];
		const existingMatch = existingConnections.find((c) => c.provider === provider);

		const isStaffProvider = provider === 'vercel' || provider === 'easypanel';
		const newEntry: ConnectedAccount = {
			...connectedProfile,
			showOnProfile: isStaffProvider ? false : existingMatch ? existingMatch.showOnProfile !== false : true,
			connectedAt: new Date(),
		};

		const updatedConnections = [newEntry, ...existingConnections.filter((c) => c.provider !== provider)];

		await models.users.User.findOneAndUpdate({ id: userId }, { $set: { connections: updatedConnections } }, { upsert: false });

		let finalRedirect = `${origin}/?view=connections&connected=${provider}`;
		if (oauthState.returnTo) {
			try {
				const parsedReturn = new URL(oauthState.returnTo);
				const baseDomain = process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com';
				if (parsedReturn.hostname.endsWith(baseDomain) || parsedReturn.hostname === 'localhost' || parsedReturn.hostname === '127.0.0.1') {
					parsedReturn.searchParams.set('connected', provider);
					finalRedirect = parsedReturn.toString();
				}
			} catch {}
		}

		const res = NextResponse.redirect(finalRedirect);
		res.cookies.delete('__xernerx_conn_oauth');
		return res;
	} catch (err: any) {
		console.error(`[OAuth Connections Callback Error - ${provider}]`, err);
		const res = NextResponse.redirect(`${origin}/?view=connections&error=exchange_failed&provider=${provider}`);
		res.cookies.delete('__xernerx_conn_oauth');
		return res;
	}
}
