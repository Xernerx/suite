/** @format */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { SessionProviderProps } from 'next-auth/react';

export function SessionProvider({ children, session }: SessionProviderProps) {
	return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
