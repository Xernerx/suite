/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import { SessionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { cookies, headers } from 'next/headers';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Studios | Modern Software, Bots & Developer Tools',
		template: 'Xernerx Studios | %s',
	},
	description: 'Building modern software, infrastructure and developer tools with a focus on performance, simplicity and long-term maintainability.',

	metadataBase: new URL('https://www.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Studios | Modern Software, Bots & Developer Tools',
			template: 'Xernerx Studios | %s',
		},
		description: 'Building modern software, infrastructure and developer tools with a focus on performance, simplicity and long-term maintainability.',
		url: 'https://www.xernerx.com',
		siteName: 'Xernerx',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Xernerx Studios',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: {
			default: 'Xernerx Studios | Modern Software, Bots & Developer Tools',
			template: 'Xernerx Studios | %s',
		},
		description: 'Building modern software, infrastructure and developer tools with a focus on performance, simplicity and long-term maintainability.',
		images: ['/banner.png'],
	},

	icons: {
		icon: '/logo.png',
		apple: '/logo.png',
	},

	alternates: {
		canonical: './',
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [headersList, cookieStore, themeProps] = await Promise.all([headers(), cookies(), getThemeLayoutProps()]);

	const host = headersList.get('host') || '';
	const initialEnv: 'dev' | 'canary' | 'public' =
		host.includes('.dev.') || host.includes('localhost') || process.env.ENVIRONMENT?.toLowerCase() === 'development' ? 'dev' : host.includes('.canary.') ? 'canary' : 'public';

	const locale = cookieStore.get('NEXT_LOCALE')?.value || headersList.get('x-locale') || 'en-GB';
	const hasSessionCookie = Boolean(cookieStore.get('__Secure-next-auth.session-token') || cookieStore.get('next-auth.session-token'));

	const [session, dict] = await Promise.all([hasSessionCookie ? getServerSession(auth) : Promise.resolve(null), dictionary(locale as Locale)]);

	return (
		<html lang={locale} suppressHydrationWarning className={themeProps.className} style={themeProps.style}>
			<body style={themeProps.style} suppressHydrationWarning>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict} initialEnvironment={initialEnv} enableAds>
						{children}
					</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
