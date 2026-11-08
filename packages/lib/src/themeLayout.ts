/** @format */

import { cookies, headers } from 'next/headers';

const LEGACY_PAGE_WIDTH_PERCENT: Record<string, number> = {
	compact: 75,
	default: 90,
	wide: 95,
	full: 100,
};

function resolvePageWidthValue(pageWidth?: string): string {
	if (pageWidth) {
		const trimmed = pageWidth.trim().toLowerCase();
		if (trimmed in LEGACY_PAGE_WIDTH_PERCENT) {
			return `${LEGACY_PAGE_WIDTH_PERCENT[trimmed]}%`;
		}
		const num = parseInt(trimmed.replace('%', ''), 10);
		if (!isNaN(num)) {
			return `${Math.min(100, Math.max(60, Math.round(num / 5) * 5))}%`;
		}
	}
	return '90%';
}

export async function getThemeLayoutProps() {
	const cookieStore = await cookies();
	const headerStore = await headers();

	const ua = headerStore.get('user-agent')?.toLowerCase() || '';
	const isElectron = ua.includes('electron');

	const accent = cookieStore.get('accent')?.value || '#8b7cf6';
	const theme = cookieStore.get('theme')?.value || 'system';
	const resolvedTheme = cookieStore.get('resolvedTheme')?.value;
	const uiZoom = cookieStore.get('uiZoom')?.value;
	const uiGap = cookieStore.get('uiGap')?.value;
	const pageWidth = cookieStore.get('pageWidth')?.value;
	const textScale = cookieStore.get('textScale')?.value;

	const isLight = theme === 'light' || (theme === 'system' && resolvedTheme === 'light');

	const initialStyles: Record<string, string> = {
		'--accent': accent,
		'--page-width': resolvePageWidthValue(pageWidth),
	};

	if (uiZoom) {
		const parsedZoom = parseInt(uiZoom, 10);
		if (!isNaN(parsedZoom)) {
			initialStyles['--ui-zoom'] = String(parsedZoom / 100);
			initialStyles['--ui-scale'] = String(parsedZoom);
		}
	}
	if (uiGap) initialStyles['--ui-gap'] = `${uiGap}px`;
	if (textScale) initialStyles['--text-scale'] = `${textScale}px`;

	const classes = [!isLight ? 'dark' : '', isElectron ? 'is-electron' : ''].filter(Boolean).join(' ');

	return {
		className: classes,
		style: initialStyles as React.CSSProperties,
	};
}
