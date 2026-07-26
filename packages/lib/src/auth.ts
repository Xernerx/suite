/** @format */

import DiscordProvider from 'next-auth/providers/discord';
import { NextAuthOptions } from 'next-auth';

export const auth: NextAuthOptions = {
	pages: {
		signIn: '/auth/login',
		error: '/auth/login',
		signOut: '/auth/logout', // Add this line!
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
	cookies: {
		sessionToken: {
			name: '__Secure-next-auth.session-token', // Fixed name
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
			name: '__Secure-next-auth.csrf-token', // Removed __Host- prefix to allow the domain attribute
			options: {
				domain: '.xernerx.com',
				path: '/',
				httpOnly: true,
				sameSite: 'none',
				secure: true,
			},
		},
		// Include PKCE / State cookies used by OAuth providers like Discord
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
		async signIn({ user }) {
			return true;
		},

		async jwt({ token, user, account }) {
			if (account) {
				token.accessToken = account.access_token;
			}
			if (user) {
				// user
			}

			return token;
		},

		async session({ session, token }) {
			const user = {
				...session,
				user: {
					id: token.sub,
					...session.user,
				},
				accessToken: token.accessToken,
			};

			return user;
		},
	},
};
