/** @format */

import { proxy as i18nProxyHandler } from '@xernerx/lib';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
	return i18nProxyHandler(request);
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
