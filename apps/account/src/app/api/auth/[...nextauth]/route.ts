/** @format */

import NextAuth from 'next-auth/next';
import { AuthOptions } from 'next-auth';
import { auth } from '@xernerx/lib';

const rawHandler = NextAuth(auth as AuthOptions);

const LEGACY_FLOW_COOKIE_CLEARS = [
	'__Secure-next-auth.callback-url=; Domain=.xernerx.com; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None',
	'__Secure-next-auth.state=; Domain=.xernerx.com; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None',
	'__Secure-next-auth.csrf-token=; Domain=.xernerx.com; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None',
];

async function handler(req: Request, ctx: any): Promise<Response> {
	const reqUrl = new URL(req.url);
	const segments = reqUrl.pathname.split('/').filter(Boolean);
	const action = segments[2];

	const buildLoginRedirect = (errorParam?: string | null) => {
		const cleanErr = errorParam && errorParam !== 'undefined' && errorParam !== 'null' ? errorParam : null;
		const locationPath = cleanErr ? `/login?error=${encodeURIComponent(cleanErr)}` : '/login';
		const headers = new Headers({ Location: locationPath });
		for (const cookieStr of LEGACY_FLOW_COOKIE_CLEARS) {
			headers.append('Set-Cookie', cookieStr);
		}
		return new Response(null, { status: 302, headers });
	};

	if (action === 'error') {
		return buildLoginRedirect(reqUrl.searchParams.get('error'));
	}

	try {
		const response = (await (rawHandler as any)(req, ctx)) as Response;

		const location = response.headers.get('Location');
		if (location) {
			try {
				const targetUrl = new URL(location, reqUrl.origin);
				if (targetUrl.pathname.endsWith('/api/auth/error') || (targetUrl.pathname.endsWith('/api/auth/signin') && targetUrl.searchParams.has('error'))) {
					return buildLoginRedirect(targetUrl.searchParams.get('error'));
				}
			} catch {
				// keep original redirect if URL parsing fails
			}
		}

		if (req.method === 'GET' && response.status >= 500 && (action === 'signin' || action === 'callback')) {
			return buildLoginRedirect('Configuration');
		}

		if (action === 'csrf' || action === 'signin' || action === 'callback') {
			const clonedHeaders = new Headers(response.headers);
			for (const cookieStr of LEGACY_FLOW_COOKIE_CLEARS) {
				clonedHeaders.append('Set-Cookie', cookieStr);
			}
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers: clonedHeaders,
			});
		}

		return response;
	} catch (err) {
		console.error('[NextAuth Route Handler Error]', err);
		if (req.method === 'GET') {
			return buildLoginRedirect('Callback');
		}
		return new Response(JSON.stringify({ error: 'Authentication error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

export { handler as GET, handler as POST };
