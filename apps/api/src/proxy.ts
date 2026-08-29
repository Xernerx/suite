/** @format */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { proxy as i18nProxyHandler } from '@xernerx/lib';

// --- IN-MEMORY RATE LIMITER CACHE ---
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Configuration: 100 requests per 1 minute window per IP
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

// Cleanup old entries every 5 minutes to prevent memory bloat
setInterval(
	() => {
		const now = Date.now();
		for (const [ip, data] of rateLimitMap.entries()) {
			if (now > data.resetTime) {
				rateLimitMap.delete(ip);
			}
		}
	},
	5 * 60 * 1000
);

export async function proxy(req: NextRequest) {
	const origin = req.headers.get('origin') || '';
	const host = req.headers.get('host') || '';

	// Safely extract hostnames
	let originHostname = '';
	if (origin) {
		try {
			originHostname = new URL(origin).hostname;
		} catch (e) {}
	}
	const hostNameOnly = host.split(':')[0];

	const isAuthorizedOrigin = originHostname.endsWith('.xernerx.com') || originHostname === 'xernerx.com';
	const isAuthorizedHost = hostNameOnly.endsWith('.xernerx.com') || hostNameOnly === 'xernerx.com';

	// Explicitly identify trusted frontends (browsers send Origin)
	const isLocalDevOrigin =
		process.env.ENVIRONMENT?.toLowerCase() === 'development' && (originHostname === 'localhost' || originHostname === '127.0.0.1' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(originHostname));

	// Browsers don't send Origin headers on same-origin GET requests.
	// If origin is missing, but they sent Next-Auth session cookies and the host is trusted, it's a browser.
	const hasSessionCookie = req.cookies.has('next-auth.session-token') || req.cookies.has('__Secure-next-auth.session-token');
	const isSameOriginBrowser = !origin && isAuthorizedHost && hasSessionCookie;

	const isTrustedFrontend = isAuthorizedOrigin || isLocalDevOrigin || isSameOriginBrowser;

	// --- REUSABLE CORS HEADERS ---
	const corsHeaders: Record<string, string> = {
		'Access-Control-Allow-Origin': origin || '*',
		'Access-Control-Allow-Credentials': 'true',
	};

	const errorResponse = (message: string, status: number) => {
		const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin || '*' };
		if (origin) {
			headers['Access-Control-Allow-Credentials'] = 'true';
		}
		return new NextResponse(JSON.stringify({ error: message }), {
			status,
			headers,
		});
	};

	// --- IP RATE LIMITING CHECK (Excluding .xernerx.com & Local Traffic) ---
	const forwardedFor = req.headers.get('x-forwarded-for');
	const realIp = req.headers.get('x-real-ip');
	const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';

	const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
	const isXernerxDomain = isAuthorizedOrigin || isAuthorizedHost;

	if (!isLoopback && !isXernerxDomain) {
		const now = Date.now();
		let clientRate = rateLimitMap.get(ip);

		if (!clientRate || now > clientRate.resetTime) {
			rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
		} else {
			clientRate.count++;
			if (clientRate.count > MAX_REQUESTS) {
				return errorResponse('Too Many Requests: Rate limit exceeded', 429);
			}
		}
	}

	// 1. MUST HANDLE CORS PREFLIGHT FIRST
	if (req.method === 'OPTIONS') {
		const preflightHeaders = new Headers();
		preflightHeaders.set('Access-Control-Allow-Origin', origin || '*');
		if (origin) {
			preflightHeaders.set('Access-Control-Allow-Credentials', 'true');
		}
		preflightHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
		preflightHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
		return new NextResponse(null, { headers: preflightHeaders, status: 200 });
	}

	const isSecureRoute = req.nextUrl.pathname.startsWith('/secure');
	const isStripeWebhook = req.nextUrl.pathname.startsWith('/secure/webhooks/stripe');
	const isValidationRoute = req.nextUrl.pathname === '/secure/validate/token';

	// 2. Intercept and secure the /secure/ routes
	if (isSecureRoute && !isStripeWebhook && !isValidationRoute) {
		const authHeader = req.headers.get('authorization');
		const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

		if (token) {
			// PATH A: Token provided (API Clients, cURL, Postman) -> Validate it
			try {
				let validationUrl = `${req.nextUrl.origin}/secure/validate/token`;

				// Case-insensitive check for development to fix local SSL loopback issues
				if (process.env.ENVIRONMENT?.toLowerCase() === 'development') {
					const port = req.nextUrl.port || process.env.PORT || '3000';
					validationUrl = `http://127.0.0.1:${port}/secure/validate/token`;
				}

				const tokenRes = await fetch(validationUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token }),
				});

				if (!tokenRes.ok) return errorResponse('Unauthorized: Invalid Token', 401);

				const tokenData = await tokenRes.json();

				// Only refuse hard flags (inactive and suspended).
				// 'pending' and 'active' are allowed through to the backend API.
				if (tokenData.status === 'inactive' || tokenData.status === 'suspended') {
					return errorResponse(`Forbidden: Token is ${tokenData.status}`, 403);
				}

				if (!tokenData.permissions?.secure) {
					return errorResponse('Forbidden: this path is reserved', 403);
				}

				// Pass the validated ID to the backend
				req.headers.set('x-token-id', tokenData.id);
			} catch (error) {
				console.error('Token validation error:', error);
				return errorResponse('Internal Server Error', 500);
			}
		} else {
			// PATH B: No Token -> Is this your frontend relying on session cookies?
			if (!isTrustedFrontend) {
				return errorResponse('Unauthorized: Missing Bearer Token', 401);
			}
		}
	}

	// 3. Pass all actual requests to your existing proxy
	const response = await i18nProxyHandler(req as never);

	// 4. Attach the required CORS headers to the final success response
	if (response && response.headers) {
		response.headers.set('Access-Control-Allow-Origin', origin || '*');
		if (origin) {
			response.headers.set('Access-Control-Allow-Credentials', 'true');
		}
	}

	return response;
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
