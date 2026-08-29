/** @format */

import Script from 'next/script';

export function ThemeScript() {
	const scriptCode = `
        try {
            function getPref(key) {
                var match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
                if (match) return match[2];
                return localStorage.getItem(key);
            }

            var accent = getPref('accent');
            if (accent) {
                document.documentElement.style.setProperty('--accent', accent);
            }
            
            var theme = getPref('theme');
            if (theme) {
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }

            var zoom = getPref('uiZoom');
            if (zoom) {
                document.documentElement.style.setProperty('--ui-zoom', String(parseInt(zoom, 10) / 100));
            }

            var gap = getPref('uiGap');
            if (gap) {
                document.documentElement.style.setProperty('--ui-gap', gap + 'px');
            }

            var textScale = getPref('textScale');
            if (textScale) {
                document.documentElement.style.setProperty('--text-scale', textScale + 'px');
            }
        } catch (e) {}
    `;

	return <Script id="xernerx-theme-script" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: scriptCode }} />;
}
