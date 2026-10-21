/** @format */

import crypto from 'crypto';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import { NextAuthOptions, DefaultSession } from 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: {
			id: string;
		} & DefaultSession['user'];
		accessToken?: string;
		qrHandoffToken?: string;
		error?: string;
	}
}

function getHandoffKey(): Buffer {
	const rawSecret = process.env.NEXTAUTH_SECRET || process.env.DISCORD_CLIENT_SECRET || 'xernerx-suite-qr-handoff-key';
	return crypto.createHash('sha256').update(rawSecret).digest();
}

export function encryptQrHandoffTicket(payload: Record<string, any>): string {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv('aes-256-gcm', getHandoffKey(), iv);
	const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
	const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	const tag = cipher.getAuthTag();
	return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptQrHandoffTicket(ticket: string): Record<string, any> | null {
	try {
		const parts = ticket.split('.');
		if (parts.length !== 3) return null;
		const iv = Buffer.from(parts[0], 'base64url');
		const tag = Buffer.from(parts[1], 'base64url');
		const encrypted = Buffer.from(parts[2], 'base64url');
		const decipher = crypto.createDecipheriv('aes-256-gcm', getHandoffKey(), iv);
		decipher.setAuthTag(tag);
		const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
		const data = JSON.parse(decrypted);
		if (!data || typeof data !== 'object' || !data.sub || !data.exp || Date.now() > data.exp) {
			return null;
		}
		return data;
	} catch {
		return null;
	}
}

const inFlightRefreshes = new Map<string, Promise<any>>();
const recentRefreshes = new Map<string, { token: any; expiresAt: number }>();

async function performRefreshAccessToken(token: any) {
	try {
		const url = 'https://discord.com/api/oauth2/token';
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: process.env.DISCORD_CLIENT_ID!,
				client_secret: process.env.DISCORD_CLIENT_SECRET!,
				grant_type: 'refresh_token',
				refresh_token: token.refreshToken,
			}),
		});

		const refreshedTokens = await response.json();

		if (!response.ok) throw refreshedTokens;

		const updated = {
			...token,
			accessToken: refreshedTokens.access_token,
			accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
			refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
			error: undefined,
		};

		if (token.refreshToken) {
			recentRefreshes.set(token.refreshToken, {
				token: updated,
				expiresAt: Date.now() + 60_000,
			});
		}

		return updated;
	} catch (error) {
		console.error('Error refreshing Discord access token', error);
		return {
			...token,
			accessToken: undefined,
			error: 'RefreshAccessTokenError',
		};
	}
}

async function refreshAccessToken(token: any) {
	const key = token?.refreshToken;
	if (!key) {
		return {
			...token,
			accessToken: undefined,
			error: 'RefreshAccessTokenError',
		};
	}

	const cached = recentRefreshes.get(key);
	if (cached && Date.now() < cached.expiresAt) {
		return { ...token, ...cached.token };
	}

	const existing = inFlightRefreshes.get(key);
	if (existing) {
		return await existing;
	}

	const promise = performRefreshAccessToken(token).finally(() => {
		inFlightRefreshes.delete(key);
	});
	inFlightRefreshes.set(key, promise);
	return await promise;
}

export const auth: NextAuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	pages: {
		signIn: '/login',
		error: '/login',
		signOut: '/logout',
	},
	providers: [
		DiscordProvider({
			clientId: process.env.DISCORD_CLIENT_ID!,
			clientSecret: process.env.DISCORD_CLIENT_SECRET!,
			issuer: 'https://discord.com',
			authorization: {
				params: {
					scope: 'identify guilds guilds.join email connections guilds.members.read',
				},
			},
		}),
		CredentialsProvider({
			id: 'qr-login',
			name: 'QR Login',
			credentials: {
				ticket: { label: 'Ticket', type: 'text' },
			},
			async authorize(credentials) {
				if (!credentials?.ticket) return null;
				const data = decryptQrHandoffTicket(credentials.ticket);
				if (!data || !data.sub) return null;
				return {
					id: String(data.sub),
					name: data.name || null,
					email: data.email || null,
					image: data.picture || null,
					accessToken: data.accessToken,
					refreshToken: data.refreshToken,
					accessTokenExpires: data.accessTokenExpires,
				} as any;
			},
		}),
	],
	session: {
		strategy: 'jwt',
	},
	useSecureCookies: true,
	cookies: {
		sessionToken: {
			name: '__Secure-next-auth.session-token',
			options: {
				domain: '.xernerx.com',
				path: '/',
				httpOnly: true,
				sameSite: 'none',
				secure: true,
			},
		},
		callbackUrl: {
			name: '__Secure-xernerx-auth.callback-url',
			options: {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
			},
		},
		csrfToken: {
			name: '__Secure-xernerx-auth.csrf-token',
			options: {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
			},
		},
		state: {
			name: '__Secure-xernerx-auth.state',
			options: {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
				maxAge: 60 * 15,
			},
		},
	},
	callbacks: {
		async redirect({ url, baseUrl }) {
			if (url.startsWith('/')) return `${baseUrl}${url}`;
			try {
				const parsedUrl = new URL(url);
				const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(parsedUrl.hostname);
				if (parsedUrl.hostname.endsWith('xernerx.com') || parsedUrl.hostname === 'localhost' || isIp) {
					return url;
				}
			} catch (e) {
				// ignore
			}
			return baseUrl;
		},
		async signIn() {
			return true;
		},

		async jwt({ token, user, account }) {
			// QR Handoff sign-in
			if (account?.provider === 'qr-login' && user) {
				return {
					...token,
					sub: user.id,
					name: user.name,
					email: user.email,
					picture: user.image,
					accessToken: (user as any).accessToken,
					refreshToken: (user as any).refreshToken,
					accessTokenExpires: (user as any).accessTokenExpires || Date.now() + 7 * 24 * 60 * 60 * 1000,
				};
			}

			// Initial Discord OAuth sign-in: Save tokens and expiration time
			if (account) {
				return {
					...token,
					accessToken: account.access_token,
					refreshToken: account.refresh_token,
					accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000,
				};
			}

			// Return previous token if the access token has not expired yet
			if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
				return token;
			}

			// Access token has expired, try to refresh it
			return await refreshAccessToken(token);
		},

		async session({ session, token }) {
			let qrHandoffToken: string | undefined;
			if (token?.sub && token?.accessToken) {
				qrHandoffToken = encryptQrHandoffTicket({
					sub: token.sub,
					name: token.name,
					email: token.email,
					picture: token.picture,
					accessToken: token.accessToken,
					refreshToken: token.refreshToken,
					accessTokenExpires: token.accessTokenExpires,
					exp: Date.now() + 5 * 60 * 1000,
				});
			}

			return {
				...session,
				user: {
					...session.user,
					id: token.sub as string,
				},
				accessToken: token.accessToken as string | undefined,
				qrHandoffToken,
				error: token.error as string | undefined,
			};
		},
	},
};

const LEGACY_FLOW_COOKIE_CLEARS = [
	'__Secure-next-auth.callback-url=; Domain=.xernerx.com; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None',
	'__Secure-next-auth.state=; Domain=.xernerx.com; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None',
	'__Secure-next-auth.csrf-token=; Domain=.xernerx.com; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None',
];

export function wrapAuthRouteHandler(rawHandler: (req: any, ctx: any) => Promise<Response>) {
	return async function authRouteHandler(req: any, ctx: any): Promise<Response> {
		const reqUrl = new URL(req.url);
		const segments = reqUrl.pathname.split('/').filter(Boolean);
		const action = segments[2];

		const buildLoginRedirect = (errorParam?: string | null) => {
			const cleanErr = errorParam && errorParam !== 'undefined' && errorParam !== 'null' ? errorParam : null;
			const locationUrl = cleanErr ? `/login?error=${encodeURIComponent(cleanErr)}` : '/login';
			const headers = new Headers({ Location: locationUrl });
			for (const cookieStr of LEGACY_FLOW_COOKIE_CLEARS) {
				headers.append('Set-Cookie', cookieStr);
			}
			return new Response(null, { status: 302, headers });
		};

		if (action === 'error') {
			return buildLoginRedirect(reqUrl.searchParams.get('error'));
		}

		try {
			const response = await rawHandler(req, ctx);

			const location = response.headers.get('Location');
			if (location) {
				try {
					const targetUrl = new URL(location, reqUrl.origin);
					if (targetUrl.pathname.endsWith('/api/auth/error') || (targetUrl.pathname.endsWith('/api/auth/signin') && targetUrl.searchParams.has('error'))) {
						return buildLoginRedirect(targetUrl.searchParams.get('error'));
					}
				} catch {
					// keep original redirect if URL parsing fails
				}
			}

			if (req.method === 'GET' && response.status >= 500 && (action === 'signin' || action === 'callback')) {
				return buildLoginRedirect('Configuration');
			}

			if (action === 'csrf' || action === 'signin' || action === 'callback') {
				const clonedHeaders = new Headers(response.headers);
				for (const cookieStr of LEGACY_FLOW_COOKIE_CLEARS) {
					clonedHeaders.append('Set-Cookie', cookieStr);
				}
				return new Response(response.body, {
					status: response.status,
					statusText: response.statusText,
					headers: clonedHeaders,
				});
			}

			return response;
		} catch (err) {
			console.error('[NextAuth Route Handler Error]', err);
			if (req.method === 'GET') {
				return buildLoginRedirect('Callback');
			}
			return new Response(JSON.stringify({ error: 'Authentication error' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	};
}
