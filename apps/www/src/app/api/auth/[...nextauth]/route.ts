/** @format */

import NextAuth from 'next-auth/next';

const handler = NextAuth({
	providers: [],

	session: {
		strategy: 'jwt',
	},

	secret: process.env.NEXTAUTH_SECRET,

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
	},
	callbacks: {
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
});

export { handler as GET, handler as POST };
