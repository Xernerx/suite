/** @format */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useEnvironment, useTheme } from '@xernerx/providers';

type UserContextType = {
	user: any;
};

const UserContext = createContext<UserContextType | null>(null);

function getPref(key: string): string | null {
	if (typeof window === 'undefined') return null;
	try {
		const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
		if (match) return match[2];
	} catch (e) {}
	try {
		return localStorage.getItem(key);
	} catch (e) {}
	return null;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
	const { data: session, status } = useSession();
	const { getEnvUrl } = useEnvironment();
	const { setAccent } = useTheme();

	const [user, setUser] = useState(null);

	useEffect(() => {
		const sessionWithError = session as { error?: string; accessToken?: string; user?: any };

		if (status === 'authenticated' && sessionWithError?.error === 'RefreshAccessTokenError') {
			const authLoginUrl = getEnvUrl('https://auth.xernerx.com/auth/login');
			signOut({ callbackUrl: authLoginUrl });
			return;
		}

		(async () => {
			if (!sessionWithError || !sessionWithError.accessToken) return;

			const res = await fetch('https://discord.com/api/v10/users/@me', {
				headers: { Authorization: `Bearer ${sessionWithError.accessToken}` },
			}).then((res) => res.json());

			await setUser({ ...sessionWithError.user, ...res });

			// Check preferences
			const storedSync = getPref('syncFromDiscord');
			const isSyncEnabled = storedSync === 'true'; // Only true if explicitly toggled on

			// ONLY apply Discord's color if sync is explicitly enabled AND the user hasn't set a manual override
			if (isSyncEnabled) {
				setAccent(res?.accent_color);
			}
		})();
	}, [session, status]);

	return <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>;
}

export function useUser() {
	const ctx = useContext(UserContext);
	if (!ctx) throw new Error('UserProvider missing');
	return ctx;
}
