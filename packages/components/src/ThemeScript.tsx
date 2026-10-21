/** @format */
'use client';

import { useEffect } from 'react';

export function ThemeScript() {
	useEffect(() => {
		try {
			if (typeof (window as any).electron !== 'undefined' || navigator.userAgent.toLowerCase().includes('electron')) {
				document.documentElement.classList.add('is-electron');
			}

			function getPref(key: string) {
				const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
				if (match) return match[2];
				return localStorage.getItem(key);
			}

			function setThemeVar(name: string, value: string) {
				document.documentElement.style.setProperty(name, value);
				if (document.body) {
					document.body.style.setProperty(name, value);
				}
			}

			const accent = getPref('accent');
			if (accent) {
				setThemeVar('--accent', accent);
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
				const parsedZoom = parseInt(zoom, 10);
				if (!isNaN(parsedZoom)) {
					setThemeVar('--ui-zoom', String(parsedZoom / 100));
					setThemeVar('--ui-scale', String(parsedZoom));
				}
			}

			const gap = getPref('uiGap');
			if (gap) {
				setThemeVar('--ui-gap', gap + 'px');
			}

			const textScale = getPref('textScale');
			if (textScale) {
				setThemeVar('--text-scale', textScale + 'px');
			}
		} catch (e) {}
	}, []);

	return null;
}
