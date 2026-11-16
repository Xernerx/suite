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

interface ClientDeviceSession {
	id: string;
	browser: string;
	os: string;
	deviceType: 'desktop' | 'mobile';
	lastActive: string;
}

function detectClientDevice(): ClientDeviceSession | null {
	if (typeof navigator === 'undefined') return null;
	const ua = navigator.userAgent || '';
	if (!ua) return null;

	let browser = 'Browser';
	if (ua.includes('XernerxDesktop') || ua.includes('Electron/')) browser = 'Xernerx Desktop';
	else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
	else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
	else if (ua.includes('Chrome/')) browser = 'Google Chrome';
	else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
	else if (ua.includes('Safari/')) browser = 'Apple Safari';

	let os = 'Unknown OS';
	if (ua.includes('Windows')) os = 'Windows';
	else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
	else if (ua.includes('Android')) os = 'Android';
	else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) os = 'iOS';
	else if (ua.includes('Linux')) os = 'Linux';

	const isMobile = /Android|iPhone|iPad|Mobile/i.test(ua);
	const id = `${os}-${browser}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

	return {
		id,
		browser,
		os,
		deviceType: isMobile ? 'mobile' : 'desktop',
		lastActive: new Date().toISOString(),
	};
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
					const currentDevice = detectClientDevice();

					if (res.status === 404) {
						// User strictly does NOT exist, create them via POST with 1000 initial credits
						const postRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), {
							method: 'POST',
							credentials: 'include',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								...(session?.user || {}),
								...(currentDevice ? { devices: [currentDevice] } : {}),
								credits: { balance: 1000 },
								level: { level: 1, xp: 0 },
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

						// Enforce global session revocation ("Sign Out All Devices")
						const sessionSignedInAt = Number((sessionWithError as any)?.signedInAt) || 0;
						const revokedAtMs = xernerx?.sessionRevokedAt ? new Date(xernerx.sessionRevokedAt).getTime() : 0;
						if (revokedAtMs > 0 && sessionSignedInAt > 0 && revokedAtMs > sessionSignedInAt + 2000) {
							const authLoginUrl = getEnvUrl('https://account.xernerx.com/login');
							signOut({ callbackUrl: authLoginUrl });
							return;
						}

						const isOptOutOrTombstone = Boolean(xernerx?.blacklisted || xernerx?.services === false || xernerx?.tombstone);
						const needsSignInBonus = !isOptOutOrTombstone && !xernerx?.credits?.signInBonusClaimed;

						if (needsSignInBonus) {
							const postRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), {
								method: 'POST',
								credentials: 'include',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									...(session?.user || {}),
									...(currentDevice ? { devices: [currentDevice] } : {}),
									credits: { balance: 1000 },
									level: { level: 1, xp: 0 },
								}),
							}).catch(() => null);

							if (postRes?.ok) {
								const postData = await postRes.json();
								xernerx = { ...xernerx, ...postData };
								if (postData?.bonusGranted) {
									toast({
										title: t('account.user.created'),
										type: 'info',
									});
								}
							}
						}

						if (!isOptOutOrTombstone && currentDevice) {
							const existingDevices: ClientDeviceSession[] = Array.isArray(xernerx?.devices) ? xernerx.devices : [];
							const prevMatch = existingDevices.find((d) => d?.id === currentDevice.id);
							const hadPlaceholder = existingDevices.some((d) => d?.id === 'web-oauth-session');
							const prevActiveMs = prevMatch?.lastActive ? new Date(prevMatch.lastActive).getTime() : 0;
							const shouldSyncDevice = !prevMatch || hadPlaceholder || !Number.isFinite(prevActiveMs) || Date.now() - prevActiveMs > 5 * 60 * 1000;
							const mergedDevices = [currentDevice, ...existingDevices.filter((d) => d && d.id !== currentDevice.id && d.id !== 'web-oauth-session')].slice(0, 10);
							xernerx = { ...xernerx, devices: mergedDevices };

							if (shouldSyncDevice) {
								fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), {
									method: 'PATCH',
									credentials: 'include',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ devices: mergedDevices }),
								}).catch(() => {});
							}
						}
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
