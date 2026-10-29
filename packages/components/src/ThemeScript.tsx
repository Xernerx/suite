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

			const pageWidth = getPref('pageWidth');
			if (pageWidth) {
				const legacyMap: Record<string, number> = {
					compact: 75,
					default: 90,
					wide: 95,
					full: 100,
				};
				const trimmed = pageWidth.trim().toLowerCase();
				const parsed = trimmed in legacyMap ? legacyMap[trimmed] : parseInt(trimmed.replace('%', ''), 10);
				const pct = !isNaN(parsed) ? Math.min(100, Math.max(60, Math.round(parsed / 5) * 5)) : 90;
				setThemeVar('--page-width', pct + '%');
			} else {
				setThemeVar('--page-width', '90%');
			}

			const textScale = getPref('textScale');
			if (textScale) {
				setThemeVar('--text-scale', textScale + 'px');
			}
		} catch (e) {}
	}, []);

	return null;
}
