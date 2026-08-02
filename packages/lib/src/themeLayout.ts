/** @format */

import { cookies } from 'next/headers';

export async function getThemeLayoutProps() {
	const cookieStore = await cookies();

	const accent = cookieStore.get('accent')?.value || '#8b7cf6';
	const theme = cookieStore.get('theme')?.value || 'system';
	const uiZoom = cookieStore.get('uiZoom')?.value;
	const uiGap = cookieStore.get('uiGap')?.value;
	const textScale = cookieStore.get('textScale')?.value;

	const isDark = theme === 'dark';

	const initialStyles: Record<string, string> = {
		'--accent': accent,
	};

	if (uiZoom) initialStyles['--ui-zoom'] = String(parseInt(uiZoom, 10) / 100);
	if (uiGap) initialStyles['--ui-gap'] = `${uiGap}px`;
	if (textScale) initialStyles['--text-scale'] = `${textScale}px`;

	return {
		className: isDark ? 'dark' : '',
		style: initialStyles as React.CSSProperties,
	};
}
