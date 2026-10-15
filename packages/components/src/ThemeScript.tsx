/** @format */
'use client';

import { useEffect } from 'react';

export function ThemeScript() {
	useEffect(() => {
		try {
			function getPref(key: string) {
				const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
				if (match) return match[2];
				return localStorage.getItem(key);
			}

			const accent = getPref('accent');
			if (accent) {
				document.documentElement.style.setProperty('--accent', accent);
			}

			const theme = getPref('theme');
			if (theme) {
				if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
					document.documentElement.classList.add('dark');
				} else {
					document.documentElement.classList.remove('dark');
				}
			}

			const zoom = getPref('uiZoom');
			if (zoom) {
				document.documentElement.style.setProperty('--ui-zoom', String(parseInt(zoom, 10) / 100));
			}

			const gap = getPref('uiGap');
			if (gap) {
				document.documentElement.style.setProperty('--ui-gap', gap + 'px');
			}

			const textScale = getPref('textScale');
			if (textScale) {
				document.documentElement.style.setProperty('--text-scale', textScale + 'px');
			}
		} catch (e) {}
	}, []);

	return null;
}
