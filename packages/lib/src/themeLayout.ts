/** @format */

import { cookies, headers } from 'next/headers';

function resolvePageWidthValue(pageWidth?: string): string {
	switch (pageWidth) {
		case 'compact':
			return '80rem';
		case 'wide':
			return '112rem';
		case 'full':
			return '100%';
		case 'default':
		default:
			return '96rem';
	}
}

export async function getThemeLayoutProps() {
	const cookieStore = await cookies();
	const headerStore = await headers();

	const ua = headerStore.get('user-agent')?.toLowerCase() || '';
	const isElectron = ua.includes('electron');

	const accent = cookieStore.get('accent')?.value || '#8b7cf6';
	const theme = cookieStore.get('theme')?.value || 'system';
	const uiZoom = cookieStore.get('uiZoom')?.value;
	const uiGap = cookieStore.get('uiGap')?.value;
	const pageWidth = cookieStore.get('pageWidth')?.value;
	const textScale = cookieStore.get('textScale')?.value;

	const isLight = theme === 'light';

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
