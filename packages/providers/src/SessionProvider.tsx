/** @format */

'use client';

import React from 'react';
import { SessionProvider as NextAuthSessionProvider, type SessionProviderProps, useSession, signIn, signOut } from 'next-auth/react';

export function SessionProvider({ refetchOnWindowFocus = false, ...props }: SessionProviderProps) {
	return <NextAuthSessionProvider refetchOnWindowFocus={refetchOnWindowFocus} {...props} />;
}

export { useSession, signIn, signOut };
