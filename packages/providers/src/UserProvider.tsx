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
		if (status === 'authenticated' && session?.error === 'RefreshAccessTokenError') {
			const authLoginUrl = getEnvUrl('https://auth.xernerx.com/auth/login');

			signOut({ callbackUrl: authLoginUrl });
			return;
		}

		(async () => {
			if (!session || !session.accessToken) return;

			const res = await fetch('https://discord.com/api/v10/users/@me', {
				headers: { Authorization: `Bearer ${session.accessToken}` },
			}).then((res) => res.json());

			await setUser({ ...session.user, ...res });

			// Check if syncFromDiscord is enabled (default to true if not explicitly set)
			const storedSync = getPref('syncFromDiscord');
			const isSyncEnabled = storedSync === null || storedSync === 'true';

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
