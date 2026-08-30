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
				domain: '.dummi.me',
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
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
			};
		},
	},
});

export { handler as GET, handler as POST };
