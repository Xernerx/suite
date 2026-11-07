/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata, Viewport } from 'next';
import { SessionProvider, PermissionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { cookies } from 'next/headers';
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
	const session = await getServerSession(auth);

	const cookieStore = await cookies();
	const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
	const dict = await dictionary(locale as Locale);

	const themeProps = await getThemeLayoutProps();

	return (
		<html lang={locale} suppressHydrationWarning className={themeProps.className} style={themeProps.style}>
			<body style={themeProps.style} suppressHydrationWarning>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict} enableAds>
						<PermissionProvider>{children}</PermissionProvider>
					</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
