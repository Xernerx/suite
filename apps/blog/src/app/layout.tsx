/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata, Viewport } from 'next';
import { SessionProvider, PermissionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { cookies, headers } from 'next/headers';
import { getServerSession } from 'next-auth';

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
};

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Blog | Announcements, Security & Engineering',
		template: 'Xernerx Blog | %s',
	},
	description: 'Official announcements, platform security advisories, product updates, and engineering deep-dives from Xernerx Studios.',

	metadataBase: new URL('https://blog.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Blog | Announcements, Security & Engineering',
			template: 'Xernerx Blog | %s',
		},
		description: 'Official announcements, platform security advisories, product updates, and engineering deep-dives from Xernerx Studios.',
		url: 'https://blog.xernerx.com',
		siteName: 'Xernerx Blog',
		images: [
			{
				url: '/opengraph-image',
				width: 1200,
				height: 630,
				alt: 'Xernerx Blog — Announcements, Security & Engineering',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		site: '@XernerxStudios',
		creator: '@XernerxStudios',
		title: {
			default: 'Xernerx Blog | Announcements, Security & Engineering',
			template: 'Xernerx Blog | %s',
		},
		description: 'Official announcements, platform security advisories, product updates, and engineering deep-dives from Xernerx Studios.',
		images: ['/opengraph-image'],
	},

	icons: {
		icon: '/logo.png',
		apple: '/logo.png',
	},

	alternates: {
		canonical: './',
		types: {
			'application/rss+xml': 'https://blog.xernerx.com/rss.xml',
		},
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [headersList, cookieStore, themeProps] = await Promise.all([
		headers(),
		cookies(),
		getThemeLayoutProps().catch(() => ({ className: 'dark', style: { '--accent': '#8b7cf6', '--page-width': '90%' } as React.CSSProperties })),
	]);

	const host = headersList.get('host') || '';
	const initialEnv: 'dev' | 'canary' | 'public' =
		host.includes('.dev.') || host.includes('localhost') || process.env.ENVIRONMENT?.toLowerCase() === 'development'
			? 'dev'
			: host.includes('.canary.') || process.env.ENVIRONMENT?.toLowerCase() === 'canary'
				? 'canary'
				: 'public';

	const locale = cookieStore.get('NEXT_LOCALE')?.value || headersList.get('x-locale') || 'en-GB';
	const hasSessionCookie = Boolean(cookieStore.get('__Secure-next-auth.session-token') || cookieStore.get('next-auth.session-token'));

	const sessionPromise = hasSessionCookie ? Promise.race([getServerSession(auth).catch(() => null), new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500))]) : Promise.resolve(null);

	const [session, dict] = await Promise.all([sessionPromise, dictionary(locale as Locale).catch(() => dictionary('en-GB' as Locale))]);

	return (
		<html lang={locale} suppressHydrationWarning className={themeProps.className} style={themeProps.style}>
			<body style={themeProps.style} suppressHydrationWarning>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict} initialEnvironment={initialEnv} enableAds>
						<PermissionProvider>{children}</PermissionProvider>
					</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
