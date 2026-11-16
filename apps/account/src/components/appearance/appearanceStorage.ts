/** @format */

export function setThemeVar(name: string, value: string) {
	if (typeof document === 'undefined') return;
	document.documentElement.style.setProperty(name, value);
	if (document.body) {
		document.body.style.setProperty(name, value);
	}
}

export function getPref(key: string): string | null {
	if (typeof window === 'undefined') return null;
	try {
		const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
		if (match) return match[2];
	} catch {}
	try {
		return localStorage.getItem(key);
	} catch {}
	return null;
}

export function setPref(key: string, value: string) {
	if (typeof window === 'undefined') return;
	try {
		const domain = process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com';
		if (window.location.hostname.endsWith(domain)) {
			document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
			document.cookie = `${key}=${value}; domain=.${domain}; path=/; max-age=31536000; SameSite=Lax`;
		} else {
			document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
		}
	} catch {}
	try {
		localStorage.setItem(key, value);
	} catch {}
}

export function parseStoredPageWidth(raw: string | null): number {
	if (!raw) return 90;
	const legacyMap: Record<string, number> = {
		compact: 75,
		default: 90,
		wide: 95,
		full: 100,
	};
	const trimmed = raw.trim().toLowerCase();
	if (trimmed in legacyMap) return legacyMap[trimmed];
	const parsed = parseInt(trimmed.replace('%', ''), 10);
	if (!isNaN(parsed)) {
		return Math.min(100, Math.max(60, Math.round(parsed / 5) * 5));
	}
	return 90;
}
