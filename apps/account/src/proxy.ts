/** @format */

import { proxy as i18nProxyHandler } from '@xernerx/lib';

export const proxy = i18nProxyHandler;

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
