/** @format */
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from './SessionProvider';

export type AppBackgroundDotMode = 'blank' | 'sticky-reactive' | 'sticky-ripple';
export type AppDotLogoVariant = 'icon' | 'full' | '404' | 'error' | 'lock' | 'orbit' | 'vortex' | 'helix' | 'prism' | 'infinity' | 'wavegrid' | 'chronos';

export interface LoadingContextType {
	isLoading: boolean;
	message?: string;
	backgroundMode: AppBackgroundDotMode;
	dotVariant: AppDotLogoVariant;
	setLoading: (loading: boolean, message?: string) => void;
	setBackgroundMode: (mode: AppBackgroundDotMode | null) => void;
	setDotVariant: (variant: AppDotLogoVariant | null) => void;
	registerLoader: (id: string, message?: string) => void;
	unregisterLoader: (id: string) => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

function isAutomatedClient(): boolean {
	if (typeof window === 'undefined') return true;
	const nav = typeof navigator !== 'undefined' ? navigator : undefined;
	if (nav && (nav as any).webdriver) return true;
	const ua = nav?.userAgent || '';
	return /bot|crawl|spider|mediapartners|adsbot|google|bing|slurp|duckduck|baidu|yandex|seobility|lighthouse|pagespeed|headless|prerender|facebookexternalhit|twitterbot|discordbot|whatsapp|linkedinbot/i.test(
		ua
	);
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const { status: sessionStatus } = useSession();

	const [manualLoading, setManualLoading] = useState(false);
	const [manualMessage, setManualMessage] = useState<string | undefined>(undefined);
	const [routeLoading, setRouteLoading] = useState(false);
	const [customMode, setCustomMode] = useState<AppBackgroundDotMode | null>(null);
	const [customVariant, setCustomVariant] = useState<AppDotLogoVariant | null>(null);
	const [autoMode, setAutoMode] = useState<AppBackgroundDotMode>('blank');

	const loadersRef = useRef<Map<string, string | undefined>>(new Map());
	const [loaderCount, setLoaderCount] = useState(0);
	const [loaderMessage, setLoaderMessage] = useState<string | undefined>(undefined);

	// Load every page with Loading active for interactive browsers, then turn routeLoading false after entrance completes
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const { hostname, port } = window.location;
			const isWww = port === '4000' || hostname === 'xernerx.com' || hostname === 'www.xernerx.com' || hostname === 'canary.xernerx.com' || hostname === 'dev.xernerx.com';
			const isApi = port === '4001' || hostname.startsWith('api.');
			const isCdn = port === '4002' || hostname.startsWith('cdn.');
			const isDocs = port === '4005' || hostname.startsWith('docs.');

			if (pathname === '/download' || isDocs) {
				setAutoMode('sticky-ripple');
			} else if (pathname === '/' && (isWww || isApi || isCdn)) {
				setAutoMode('sticky-ripple');
			} else {
				setAutoMode('blank');
			}
		}

		if (isAutomatedClient()) {
			setRouteLoading(false);
			return;
		}

		setRouteLoading(true);
		const timer = setTimeout(() => {
			setRouteLoading(false);
		}, 1100);
		return () => clearTimeout(timer);
	}, [pathname]);

	const syncLoadersState = useCallback(() => {
		setLoaderCount(loadersRef.current.size);
		let latestMsg: string | undefined;
		loadersRef.current.forEach((msg) => {
			if (msg) latestMsg = msg;
		});
		setLoaderMessage(latestMsg);
	}, []);

	const registerLoader = useCallback(
		(id: string, msg?: string) => {
			loadersRef.current.set(id, msg);
			syncLoadersState();
		},
		[syncLoadersState]
	);

	const unregisterLoader = useCallback(
		(id: string) => {
			if (loadersRef.current.delete(id)) {
				syncLoadersState();
			}
		},
		[syncLoadersState]
	);

	const setLoading = useCallback((loading: boolean, msg?: string) => {
		setManualLoading(loading);
		setManualMessage(loading ? msg : undefined);
	}, []);

	const setBackgroundMode = useCallback((mode: AppBackgroundDotMode | null) => {
		setCustomMode(mode);
	}, []);

	const setDotVariant = useCallback((variant: AppDotLogoVariant | null) => {
		setCustomVariant(variant);
	}, []);

	const backgroundMode: AppBackgroundDotMode = customMode ?? (pathname === '/download' ? 'sticky-ripple' : autoMode);
	const dotVariant: AppDotLogoVariant = customVariant ?? 'full';
	const isLoading = routeLoading || sessionStatus === 'loading' || manualLoading || loaderCount > 0;
	const message = manualMessage || loaderMessage;

	const value = useMemo<LoadingContextType>(
		() => ({
			isLoading,
			message,
			backgroundMode,
			dotVariant,
			setLoading,
			setBackgroundMode,
			setDotVariant,
			registerLoader,
			unregisterLoader,
		}),
		[isLoading, message, backgroundMode, dotVariant, setLoading, setBackgroundMode, setDotVariant, registerLoader, unregisterLoader]
	);

	return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useLoading(): LoadingContextType {
	const ctx = useContext(LoadingContext);
	if (!ctx) {
		return {
			isLoading: false,
			message: undefined,
			backgroundMode: 'blank',
			dotVariant: 'full',
			setLoading: () => {},
			setBackgroundMode: () => {},
			setDotVariant: () => {},
			registerLoader: () => {},
			unregisterLoader: () => {},
		};
	}
	return ctx;
}
