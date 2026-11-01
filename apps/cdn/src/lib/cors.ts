/** @format */

const TRUSTED_SUITE_APPS = new Set(['www', 'api', 'cdn', 'account', 'app', 'docs', 'admin', 'info', 'store', 'portal', 'hosting', 'haste']);

export function isTrustedXernerxOrigin(origin: string | null): boolean {
	if (!origin) return false;
	try {
		const parsed = new URL(origin);
		const hostname = parsed.hostname.toLowerCase();

		if (process.env.ENVIRONMENT?.toLowerCase() === 'development') {
			if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
				return true;
			}
		}

		const baseDomain = (process.env.DOMAIN || 'xernerx.com').toLowerCase();
		if (hostname === baseDomain || hostname === `canary.${baseDomain}` || hostname === `dev.${baseDomain}`) {
			return true;
		}

		for (const suffix of [`.${baseDomain}`, `.canary.${baseDomain}`, `.dev.${baseDomain}`]) {
			if (hostname.endsWith(suffix)) {
				const sub = hostname.slice(0, -suffix.length);
				if (TRUSTED_SUITE_APPS.has(sub)) {
					return true;
				}
			}
		}

		return false;
	} catch {
		return false;
	}
}

export function getCdnCorsHeaders(origin: string | null, methods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS', allowHeaders = 'Content-Type, Authorization'): Record<string, string> {
	const allowedOrigin = isTrustedXernerxOrigin(origin) && origin ? origin : 'https://xernerx.com';

	return {
		'Access-Control-Allow-Origin': allowedOrigin,
		'Access-Control-Allow-Methods': methods,
		'Access-Control-Allow-Headers': allowHeaders,
		'Access-Control-Allow-Credentials': 'true',
		Vary: 'Origin',
	};
}
