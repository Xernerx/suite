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

		// 1. Determine Type
		const type = ua.includes('electron') ? 'application' : 'browser';

		// 2. Determine Platform
		let platform: PlatformContextType['platform'] = 'other';
		if (ua.includes('win')) {
			platform = 'windows';
		} else if (ua.includes('iphone')) {
			platform = 'iphone';
		} else if (ua.includes('ipad')) {
			platform = 'ipad';
		} else if (ua.includes('mac')) {
			// iPads on iOS 13+ spoof their User Agent as "Macintosh".
			// We check maxTouchPoints to correctly identify newer iPads.
			platform = navigator.maxTouchPoints && navigator.maxTouchPoints > 2 ? 'ipad' : 'macos';
		} else if (ua.includes('android')) {
			platform = 'android';
		} else if (ua.includes('linux')) {
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
