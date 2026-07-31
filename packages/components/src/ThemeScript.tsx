/** @format */

export function ThemeScript() {
	const scriptCode = `
        try {
            var match = document.cookie.match(/(^| )accent=([^;]+)/);
            if (match) {
                document.documentElement.style.setProperty('--accent', match[2]);
            }
            var themeMatch = document.cookie.match(/(^| )theme=([^;]+)/);
            if (themeMatch) {
                var theme = themeMatch[2];
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        } catch (e) {}
    `;

	return <script dangerouslySetInnerHTML={{ __html: scriptCode }} suppressHydrationWarning />;
}
