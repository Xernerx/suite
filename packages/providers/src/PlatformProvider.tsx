/** @format */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type PlatformContextType = {
	type: 'application' | 'browser';
	platform: 'windows' | 'macos' | 'linux' | 'android' | 'iphone' | 'ipad' | 'other';
	device: 'desktop' | 'mobile' | 'tablet' | 'unknown';
};

const PlatformContext = createContext<PlatformContextType | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
	// Provide safe defaults for the server-side render
	const [contextValue, setContextValue] = useState<PlatformContextType>({
		type: 'browser',
		platform: 'other',
		device: 'unknown',
	});

	useEffect(() => {
		const ua = navigator.userAgent.toLowerCase();
		const uaDataPlatform = String((navigator as any).userAgentData?.platform || '').toLowerCase();

		// 1. Determine Type (strictly require Xernerx Desktop preload bridge, never generic Electron userAgent)
		const bridge = (window as any).electron;
		const isElectron = Boolean(bridge && (bridge.isXernerxDesktop || typeof bridge.minimize === 'function' || typeof bridge.close === 'function'));
		const type = isElectron ? 'application' : 'browser';

		// 2. Determine Platform (prefer Client Hints userAgentData.platform when available, fallback to userAgent)
		let platform: PlatformContextType['platform'] = 'other';
		if (uaDataPlatform.includes('win') || ua.includes('win')) {
			platform = 'windows';
		} else if (uaDataPlatform.includes('ios') || ua.includes('iphone')) {
			platform = 'iphone';
		} else if (ua.includes('ipad')) {
			platform = 'ipad';
		} else if (uaDataPlatform.includes('mac') || ua.includes('mac')) {
			// iPads on iOS 13+ spoof their User Agent as "Macintosh".
			// We check maxTouchPoints to correctly identify newer iPads.
			platform = navigator.maxTouchPoints && navigator.maxTouchPoints > 2 ? 'ipad' : 'macos';
		} else if (uaDataPlatform.includes('android') || ua.includes('android')) {
			platform = 'android';
		} else if (uaDataPlatform.includes('linux') || ua.includes('linux')) {
			platform = 'linux';
		}

		// 3. Determine Device Category
		let device: PlatformContextType['device'] = 'desktop';
		if (ua.includes('mobi') || ua.includes('iphone') || (ua.includes('android') && ua.includes('mobile'))) {
			// Android phones include both "android" and "mobile" in the UA
			device = 'mobile';
		} else if (ua.includes('ipad') || platform === 'ipad' || (ua.includes('android') && !ua.includes('mobile')) || ua.includes('tablet')) {
			// Android tablets include "android" but omit "mobile"
			device = 'tablet';
		}

		setContextValue({ type, platform, device });
	}, []);

	return <PlatformContext.Provider value={contextValue}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
	const ctx = useContext(PlatformContext);

	if (!ctx) throw new Error('PlatformProvider missing');

	return ctx;
}
