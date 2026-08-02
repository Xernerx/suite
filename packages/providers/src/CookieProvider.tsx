/** @format */
'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type CookiePreferences = {
	essential: boolean;
	functional: boolean;
	analytics: boolean;
	marketing: boolean;
};

const defaultPreferences: CookiePreferences = {
	essential: true, // Always required
	functional: false,
	analytics: false,
	marketing: false,
};

type CookieContextType = {
	cookies: Record<string, string>;
	// null means the user hasn't made a choice yet
	preferences: CookiePreferences | null;
	getCookie: (name: string) => string | undefined;
	setCookie: (name: string, value: string, days?: number) => void;
	removeCookie: (name: string) => void;
	updatePreferences: (prefs: CookiePreferences) => void;
};

const CookieContext = createContext<CookieContextType | null>(null);

const parseCookies = (): Record<string, string> => {
	if (typeof document === 'undefined') return {};

	return document.cookie.split(';').reduce(
		(acc, cookieString) => {
			const [key, val] = cookieString.split('=').map((c) => c.trim());
			if (key && val !== undefined) {
				acc[key] = decodeURIComponent(val);
			}
			return acc;
		},
		{} as Record<string, string>
	);
};

export function CookieProvider({ children }: { children: React.ReactNode }) {
	const [cookies, setCookies] = useState<Record<string, string>>({});
	const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

	useEffect(() => {
		const initialCookies = parseCookies();
		setCookies(initialCookies);

		// Try to load existing preferences
		const savedConsent = initialCookies['xernerx-cookie-consent'];
		if (savedConsent) {
			try {
				setPreferences(JSON.parse(savedConsent));
			} catch (e) {
				// Fallback if the cookie data got corrupted
				setPreferences(defaultPreferences);
			}
		}
	}, []);

	const getCookie = useCallback(
		(name: string) => {
			return cookies[name];
		},
		[cookies]
	);

	const setCookie = useCallback((name: string, value: string, days = 365) => {
		if (typeof document === 'undefined') return;
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};domain=.xernerx.com;path=/;SameSite=Lax`;
		setCookies(parseCookies());
	}, []);

	const removeCookie = useCallback((name: string) => {
		if (typeof document === 'undefined') return;
		document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=.xernerx.com;path=/;SameSite=Lax`;
		setCookies(parseCookies());
	}, []);

	const updatePreferences = useCallback(
		(prefs: CookiePreferences) => {
			setPreferences(prefs);
			setCookie('xernerx-cookie-consent', JSON.stringify(prefs), 365);
		},
		[setCookie]
	);

	return (
		<CookieContext.Provider
			value={{
				cookies,
				preferences,
				getCookie,
				setCookie,
				removeCookie,
				updatePreferences,
			}}
		>
			{children}
		</CookieContext.Provider>
	);
}

export function useCookie() {
	const ctx = useContext(CookieContext);
	if (!ctx) throw new Error('CookieProvider missing');
	return ctx;
}
