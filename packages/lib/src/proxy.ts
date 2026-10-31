/** @format */

import { defaultLocale, supportedLocales } from './i18n.config';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
	const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
	let locale: string = defaultLocale;

	if (cookieLocale && supportedLocales.includes(cookieLocale as any)) {
		locale = cookieLocale;
	} else {
		const userAgent = request.headers.get('user-agent') || '';
		const acceptLang = request.headers.get('accept-language');
		const isAutomatedCrawler =
			/bot|crawl|spider|slurp|lighthouse|pagespeed|gtmetrix|headless|curl|wget|php|axios|undici|python|facebookexternalhit|discordbot|twitterbot|linkedinbot|whatsapp|applebot|bingbot|googlebot|yandex|duckduckbot|baiduspider|semrush|ahrefs|mj12bot|dotbot|screaming|seo|analyzer|audit/i.test(
				userAgent
			) || acceptLang === 'nl-BE,nl;q=0.9,en;q=0.8';

		if (acceptLang && !isAutomatedCrawler) {
			const preferredFull = acceptLang.split(',')[0].split(';')[0].trim();
			const preferredBase = preferredFull.split('-')[0];

			if (supportedLocales.includes(preferredFull as any)) {
				locale = preferredFull;
			} else if (supportedLocales.includes(preferredBase as any)) {
				locale = preferredBase;
			} else if (preferredBase === 'en') {
				locale = defaultLocale;
			}
		}
	}

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set('x-locale', locale);

	const response = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});

	if (!cookieLocale || cookieLocale !== locale) {
		response.cookies.set('NEXT_LOCALE', locale, {
			domain: '.xernerx.com',
			path: '/',
			maxAge: 31536000,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
		});
	}

	return response;
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|ads.txt|robots.txt|sitemap.xml|manifest.webmanifest).*)'],
};
