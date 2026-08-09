/** @format */

import NextAuth, { AuthOptions } from 'next-auth';

import { auth } from '@xernerx/lib';

const handler = NextAuth(auth as AuthOptions);

export { handler as GET, handler as POST };
