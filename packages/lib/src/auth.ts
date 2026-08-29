/** @format */

import DiscordProvider from 'next-auth/providers/discord';
import { NextAuthOptions, DefaultSession } from 'next-auth';

declare module 'next-auth' {
	interface Session extends DefaultSession {
		user: {
			id: string;
		} & DefaultSession['user'];
		[index: string]: any;
	}
}

async function refreshAccessToken(token: any) {
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

		return {
			...token,
			accessToken: refreshedTokens.access_token,
			accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
			refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old if new one isn't provided
		};
	} catch (error) {
		console.error('Error refreshing Discord access token', error);
		return {
			...token,
			error: 'RefreshAccessTokenError',
		};
	}
}

export const auth: NextAuthOptions = {
	pages: {
		signIn: '/login',
		error: '/login',
		signOut: '/logout',
	},
	providers: [
		DiscordProvider({
			clientId: process.env.DISCORD_CLIENT_ID!,
			clientSecret: process.env.DISCORD_CLIENT_SECRET!,
			authorization: {
				params: {
					scope: 'identify guilds guilds.join email connections guilds.members.read',
				},
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
			name: '__Secure-next-auth.callback-url',
			options: {
				domain: '.xernerx.com',
				path: '/',
				httpOnly: true,
				sameSite: 'none',
				secure: true,
			},
		},
		csrfToken: {
			name: '__Secure-next-auth.csrf-token',
			options: {
				domain: '.xernerx.com',
				path: '/',
				httpOnly: true,
				sameSite: 'none',
				secure: true,
			},
		},
		state: {
			name: '__Secure-next-auth.state',
			options: {
				domain: '.xernerx.com',
				path: '/',
				httpOnly: true,
				sameSite: 'none',
				secure: true,
			},
		},
	},
	callbacks: {
		async redirect({ url, baseUrl }) {
			if (url.startsWith('/')) return `${baseUrl}${url}`;
			try {
				const parsedUrl = new URL(url);
				if (parsedUrl.hostname.endsWith('xernerx.com') || parsedUrl.hostname === 'localhost') {
					return url;
				}
			} catch (e) {
				// ignore
			}
			return baseUrl;
		},
		async signIn({ user }) {
			return true;
		},

		async jwt({ token, user, account }) {
			// Initial sign-in: Save tokens and expiration time
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
			return {
				...session,
				user: {
					...session.user,
					id: token.sub as string,
				},
				accessToken: token.accessToken,
				error: token.error,
			};
		},
	},
};
