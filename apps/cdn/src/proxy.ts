/** @format */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { proxy as i18nProxyHandler } from '@xernerx/lib';
import { getCdnCorsHeaders } from '@/lib/cors';

export async function proxy(req: NextRequest) {
	const origin = req.headers.get('origin');
	const requestedHeaders = req.headers.get('access-control-request-headers');
	const corsHeaders = getCdnCorsHeaders(origin, 'GET, POST, PUT, PATCH, DELETE, OPTIONS', undefined, requestedHeaders);

	if (req.method === 'OPTIONS') {
		return new NextResponse(null, {
			status: 204,
			headers: corsHeaders,
		});
	}

	const { pathname, search } = req.nextUrl;

	// Alias /api/media, /api/upload, and /api/raw to canonical CDN route handlers
	// so cross-origin admin/suite callers receive full CORS + session cookie support.
	if (pathname === '/api/media' || pathname.startsWith('/api/media/') || pathname === '/api/upload' || pathname.startsWith('/api/upload/') || pathname.startsWith('/api/raw/')) {
		const rewrittenPath = pathname.replace(/^\/api/, '');
		const response = NextResponse.rewrite(new URL(`${rewrittenPath}${search}`, req.url));
		for (const [key, value] of Object.entries(corsHeaders)) {
			response.headers.set(key, value);
		}
		return response;
	}

	const isDataEndpoint =
		pathname.startsWith('/api/') || pathname === '/media' || pathname.startsWith('/media/') || pathname === '/upload' || pathname.startsWith('/upload/') || pathname.startsWith('/raw/');

	const response = isDataEndpoint ? NextResponse.next() : await i18nProxyHandler(req as never);

	if (response?.headers) {
		for (const [key, value] of Object.entries(corsHeaders)) {
			response.headers.set(key, value);
		}
	}

	return response;
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)'],
};
