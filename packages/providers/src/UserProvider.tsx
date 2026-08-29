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
	const { getEnvUrl, isReady } = useEnvironment();
	const { setAccent } = useTheme();
	const { toast } = useToast();
	const { t } = useDictionary();

	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchUser = useCallback(async () => {
		const sessionWithError = session as { error?: string; accessToken?: string; user?: any };

		if (status === 'authenticated' && sessionWithError?.error === 'RefreshAccessTokenError') {
			const authLoginUrl = getEnvUrl('https://account.xernerx.com/login');
			signOut({ callbackUrl: authLoginUrl });
			return;
		}

		if (!sessionWithError || !sessionWithError.accessToken) return;

		let discord = null;
		try {
			discord = await fetch('https://discord.com/api/v10/users/@me', {
				headers: { Authorization: `Bearer ${sessionWithError.accessToken}` },
			}).then((res) => res.json());
		} catch (error) {
			console.warn('Critical error fetching from Discord:', error);
			// We can proceed without discord data if we have to, or return
		}

		let xernerx = null;
		try {
			const userId = (session?.user as any)?.id;
			const baseUrl = getEnvUrl('https://api.xernerx.com/');

			const res = await fetch(`${baseUrl}secure/users/${userId}`, {
				credentials: 'include',
				cache: 'no-store',
			});

			if (res.status === 404) {
				// User strictly does NOT exist, create them via POST with 1000 initial credits
				const postRes = await fetch(`${baseUrl}secure/users/${userId}`, {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...(session?.user || {}),
						credits: { balance: 1000 },
						roles: ['1b333119-d818-4fb1-a5dc-12621fd14198'],
					}),
				});

				if (!postRes.ok) {
					toast({
						title: t('account.user.createError'),
						type: 'error',
					});
				} else {
					xernerx = await postRes.json();

					toast({
						title: t('account.user.created'),
						type: 'info',
					});
				}
			} else if (res.ok) {
				xernerx = await res.json();
			} else {
				toast({
					title: t('account.user.fetchError'),
					type: 'error',
				});
			}

			const mergedUser = { ...sessionWithError.user, ...(discord || {}), ...(xernerx || {}) };
			setUser(mergedUser);

			// Check preferences
			const storedSync = getPref('syncFromDiscord');
			const isSyncEnabled = storedSync === 'true'; // Only true if explicitly toggled on

			// ONLY apply Discord's color if sync is explicitly enabled AND the user hasn't set a manual override
			if (isSyncEnabled) {
				setAccent(discord?.accent_color);
			}
		} catch (error) {
			console.warn('Critical error fetching from Xernerx API:', error);
			toast({
				title: t('account.user.networkError'),
				type: 'error',
			});
		} finally {
			setLoading(false);
		}
	}, [session, status, getEnvUrl, setAccent, toast, t]);

	useEffect(() => {
		if (isReady) {
			fetchUser();
		}
	}, [fetchUser, isReady]);

	return <UserContext.Provider value={{ user, mutate: fetchUser, loading }}>{children}</UserContext.Provider>;
}

export function useUser() {
	const ctx = useContext(UserContext);
	if (!ctx) throw new Error('UserProvider missing');
	return ctx;
}
