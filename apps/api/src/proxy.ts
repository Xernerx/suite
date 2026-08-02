/** @format */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { proxy as i18nProxyHandler } from '@xernerx/lib';

export async function proxy(req: NextRequest) {
	const origin = req.headers.get('origin') || '';
	const host = req.headers.get('host') || '';

	const isAuthorizedOrigin = origin.endsWith('.xernerx.com') || origin === 'https://xernerx.com';
	const isAuthorizedHost = host.endsWith('.xernerx.com') || host === 'xernerx.com';
	// Included origin check for local dev to ensure frontend localhost ports are accepted
	const isLocalDev = process.env.NODE_ENV === 'development' && (host.includes('localhost') || host.includes('127.0.0.1') || origin.includes('localhost') || origin.includes('127.0.0.1'));

	const isAllowed = isAuthorizedOrigin || isAuthorizedHost || isLocalDev;

	// 1. Intercept and secure only the /secure/ routes
	if (req.nextUrl.pathname.startsWith('/secure')) {
		if (!isAllowed) {
			return new NextResponse(JSON.stringify({ error: 'Forbidden: Unauthorized Origin' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}

	// 2. Handle CORS Preflight (OPTIONS) for the browser
	if (req.method === 'OPTIONS') {
		const preflightHeaders = new Headers();

		if (isAllowed && origin) {
			preflightHeaders.set('Access-Control-Allow-Origin', origin);
		}

		preflightHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
		preflightHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		preflightHeaders.set('Access-Control-Allow-Credentials', 'true');

		return new NextResponse(null, { headers: preflightHeaders, status: 200 });
	}

	// 3. Pass all actual requests to your existing proxy
	const response = await i18nProxyHandler(req as never);

	// 4. Attach the required CORS headers to the final response
	if (isAllowed && origin && response instanceof Response) {
		response.headers.set('Access-Control-Allow-Origin', origin);
		response.headers.set('Access-Control-Allow-Credentials', 'true');
	}

	return response;
}

// Keep your existing matcher so it applies to the whole app (except static/api)
export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
