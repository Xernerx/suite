/** @format */

const TRUSTED_SUITE_APPS = new Set(['www', 'api', 'cdn', 'account', 'app', 'docs', 'admin', 'info', 'store', 'portal', 'hosting', 'haste', 'blog']);

const EXPLICIT_TRUSTED_ORIGINS = new Set([
	'https://xernerx.com',
	'https://www.xernerx.com',
	'https://canary.xernerx.com',
	'https://dev.xernerx.com',
	'https://admin.xernerx.com',
	'https://admin.canary.xernerx.com',
	'https://admin.dev.xernerx.com',
]);

export function isTrustedXernerxOrigin(origin: string | null): boolean {
	if (!origin) return false;
	const trimmed = origin.trim().replace(/\/+$/, '');
	if (EXPLICIT_TRUSTED_ORIGINS.has(trimmed.toLowerCase())) {
		return true;
	}

	try {
		const parsed = new URL(trimmed);
		const hostname = parsed.hostname.toLowerCase();

		if (
			hostname === 'localhost' ||
			hostname === '127.0.0.1' ||
			hostname === '[::1]' ||
			hostname === '::1' ||
			(process.env.ENVIRONMENT?.toLowerCase() === 'development' && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname))
		) {
			return true;
		}

		const configuredDomain = (process.env.DOMAIN || 'xernerx.com').toLowerCase();
		const candidateBaseDomains = Array.from(new Set([configuredDomain, 'xernerx.com']));

		for (const baseDomain of candidateBaseDomains) {
			if (hostname === baseDomain || hostname === `canary.${baseDomain}` || hostname === `dev.${baseDomain}`) {
				return true;
			}

			for (const suffix of [`.${baseDomain}`, `.canary.${baseDomain}`, `.dev.${baseDomain}`]) {
				if (hostname.endsWith(suffix)) {
					const sub = hostname.slice(0, -suffix.length);
					if (TRUSTED_SUITE_APPS.has(sub) || /^[a-z0-9-]+$/.test(sub)) {
						return true;
					}
				}
			}
		}

		return false;
	} catch {
		return false;
	}
}

export function getCdnCorsHeaders(
	origin: string | null,
	methods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
	allowHeaders = 'Content-Type, Authorization, Cookie, x-upload-name, X-Requested-With',
	requestedHeaders?: string | null
): Record<string, string> {
	const trusted = isTrustedXernerxOrigin(origin);
	const allowedOrigin = trusted && origin ? origin : 'https://xernerx.com';
	const resolvedAllowHeaders = requestedHeaders && requestedHeaders.trim() ? requestedHeaders.trim() : allowHeaders;

	return {
		'Access-Control-Allow-Origin': allowedOrigin,
		'Access-Control-Allow-Methods': methods,
		'Access-Control-Allow-Headers': resolvedAllowHeaders,
		'Access-Control-Allow-Credentials': 'true',
		'Access-Control-Max-Age': '86400',
		Vary: 'Origin',
	};
}

export function resolveCdnBaseUrl(req?: Request): string {
	const domain = (process.env.DOMAIN || 'xernerx.com').toLowerCase();
	if (req) {
		const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').toLowerCase();
		if (host.startsWith('localhost:') || host.startsWith('127.0.0.1:')) {
			return `http://${host}`;
		}
		if (host.includes('.dev.')) {
			return `https://cdn.dev.${domain}`;
		}
		if (host.includes('.canary.')) {
			return `https://cdn.canary.${domain}`;
		}
	}
	const env = (process.env.ENVIRONMENT || '').toLowerCase();
	if (env === 'development') return `https://cdn.dev.${domain}`;
	if (env === 'canary') return `https://cdn.canary.${domain}`;
	return `https://cdn.${domain}`;
}
