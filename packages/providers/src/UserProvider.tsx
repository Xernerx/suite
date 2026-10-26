/** @format */
'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

	const inFlightRef = useRef(false);
	const fetchedUserIdRef = useRef<string | null>(null);
	const discordCacheRef = useRef<any>(null);

	const fetchUser = useCallback(
		async (force = false) => {
			const sessionWithError = session as { error?: any; accessToken?: string; user?: any };

			if (
				status === 'authenticated' &&
				(sessionWithError?.error === 'RefreshAccessTokenError' ||
					sessionWithError?.error === 'invalid_grant' ||
					sessionWithError?.error?.error === 'invalid_grant' ||
					Boolean(sessionWithError?.error))
			) {
				const authLoginUrl = getEnvUrl('https://account.xernerx.com/login');
				signOut({ callbackUrl: authLoginUrl });
				return;
			}

			if (!sessionWithError || !sessionWithError.accessToken || sessionWithError.error) {
				setLoading(false);
				return;
			}

			const userId = (session?.user as any)?.id;
			if (!userId) {
				setLoading(false);
				return;
			}

			// Prevent duplicate in-flight requests or redundant non-forced fetches for the same user
			if (!force && (inFlightRef.current || fetchedUserIdRef.current === userId)) {
				return;
			}

			inFlightRef.current = true;

			try {
				// Fetch Discord profile and Xernerx profile in parallel
				const [discordResult, xernerxResult] = await Promise.allSettled([
					fetch('https://discord.com/api/v10/users/@me', {
						headers: { Authorization: `Bearer ${sessionWithError.accessToken}` },
					}).then((res) => (res.ok ? res.json() : null)),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), {
						credentials: 'include',
						cache: 'no-store',
					}),
				]);

				const fetchedDiscord = discordResult.status === 'fulfilled' ? discordResult.value : null;
				if (fetchedDiscord) {
					discordCacheRef.current = fetchedDiscord;
				}
				const discord = fetchedDiscord || discordCacheRef.current;
				let xernerx = null;

				if (xernerxResult.status === 'fulfilled') {
					const res = xernerxResult.value;

					if (res.status === 404) {
						// User strictly does NOT exist, create them via POST with 1000 initial credits
						const postRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), {
							method: 'POST',
							credentials: 'include',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								...(session?.user || {}),
								credits: { balance: 1000 },
								level: { level: 1, xp: 0 },
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
				} else {
					console.warn('Critical error fetching from Xernerx API:', xernerxResult.reason);
					toast({
						title: t('account.user.networkError'),
						type: 'error',
					});
				}

				const mergedUser = { ...sessionWithError.user, ...(discord || {}), ...(xernerx || {}) };
				setUser(mergedUser);
				fetchedUserIdRef.current = userId;

				// Check preferences
				const storedSync = getPref('syncFromDiscord');
				const isSyncEnabled = storedSync === 'true';

				if (isSyncEnabled && discord?.accent_color) {
					setAccent(discord.accent_color);
				}
			} catch (error) {
				console.warn('Error in fetchUser:', error);
			} finally {
				inFlightRef.current = false;
				setLoading(false);
			}
		},
		[session, status, getEnvUrl, setAccent, toast, t]
	);

	const mutate = useCallback(async () => {
		await fetchUser(true);
	}, [fetchUser]);

	useEffect(() => {
		if (isReady && status === 'authenticated') {
			fetchUser();
		} else if (status === 'unauthenticated') {
			setUser(null);
			setLoading(false);
			fetchedUserIdRef.current = null;
		}
	}, [fetchUser, isReady, status]);

	const contextValue = useMemo(() => ({ user, mutate, loading }), [user, mutate, loading]);

	return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}

export function useUser() {
	const ctx = useContext(UserContext);
	if (!ctx) throw new Error('UserProvider missing');
	return ctx;
}
