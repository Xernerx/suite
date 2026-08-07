/** @format */
'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useDictionary, useEnvironment, useTheme, useToast } from '@xernerx/providers';

type UserContextType = {
	user: any;
	mutate: () => Promise<void>;
	loading: boolean;
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
	const { toast } = useToast();
	const { t } = useDictionary();

	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchUser = useCallback(async () => {
		const sessionWithError = session as { error?: string; accessToken?: string; user?: any };

		if (status === 'authenticated' && sessionWithError?.error === 'RefreshAccessTokenError') {
			const authLoginUrl = getEnvUrl('https://auth.xernerx.com/login');
			signOut({ callbackUrl: authLoginUrl });
			return;
		}

		if (!sessionWithError || !sessionWithError.accessToken) return;

		try {
			const discord = await fetch('https://discord.com/api/v10/users/@me', {
				headers: { Authorization: `Bearer ${sessionWithError.accessToken}` },
			}).then((res) => res.json());

			const userId = (session?.user as any)?.id;
			const baseUrl = getEnvUrl('https://api.xernerx.com/');
			let xernerx = null;

			const res = await fetch(`${baseUrl}secure/users/${userId}`);

			if (res.status === 404) {
				// User strictly does NOT exist, create them via POST with 1000 initial credits
				const postRes = await fetch(`${baseUrl}secure/users/${userId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...(session?.user || {}),
						credits: 1000,
					}),
				});

				if (!postRes.ok) {
					toast({
						title: t('auth.user.createError'),
						type: 'error',
					});
				} else {
					xernerx = await postRes.json();
					toast({
						title: t('auth.user.created'),
						type: 'info',
					});
				}
			} else if (res.ok) {
				xernerx = await res.json();
			} else {
				toast({
					title: t('auth.user.fetchError'),
					type: 'error',
				});
			}

			const mergedUser = { ...sessionWithError.user, ...discord, ...xernerx };
			setUser(mergedUser);

			// Check preferences
			const storedSync = getPref('syncFromDiscord');
			const isSyncEnabled = storedSync === 'true'; // Only true if explicitly toggled on

			// ONLY apply Discord's color if sync is explicitly enabled AND the user hasn't set a manual override
			if (isSyncEnabled) {
				setAccent(discord?.accent_color);
			}
		} catch (error) {
			console.error('Critical error during user account synchronization:', error);
			toast({
				title: t('auth.user.networkError'),
				type: 'error',
			});
		} finally {
			setLoading(false);
		}
	}, [session, status, getEnvUrl, setAccent, toast, t]);

	useEffect(() => {
		fetchUser();
	}, [fetchUser]);

	return <UserContext.Provider value={{ user, mutate: fetchUser, loading }}>{children}</UserContext.Provider>;
}

export function useUser() {
	const ctx = useContext(UserContext);
	if (!ctx) throw new Error('UserProvider missing');
	return ctx;
}
