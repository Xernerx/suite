/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import { SessionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx API | Core Backend Gateway & REST Endpoints',
		template: 'Xernerx API | %s',
	},
	description: 'Official Xernerx Studios backend API gateway providing RESTful endpoints, Bearer token authentication, Discord synchronization, and webhook routing.',

	metadataBase: new URL('https://api.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx API | Core Backend Gateway & REST Endpoints',
			template: 'Xernerx API | %s',
		},
		description: 'Official Xernerx Studios backend API gateway providing RESTful endpoints, Bearer token authentication, Discord synchronization, and webhook routing.',
		url: 'https://api.xernerx.com',
		siteName: 'Xernerx API',
		images: [
			{
				url: '/opengraph-image',
				width: 1200,
				height: 630,
				alt: 'Xernerx API — Core Backend Gateway',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: {
			default: 'Xernerx API | Core Backend Gateway & REST Endpoints',
			template: 'Xernerx API | %s',
		},
		description: 'Official Xernerx Studios backend API gateway providing RESTful endpoints, Bearer token authentication, Discord synchronization, and webhook routing.',
		images: ['/opengraph-image'],
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
	const session = await getServerSession(auth);

	const cookieStore = await cookies();
	const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
	const dict = await dictionary(locale as Locale);

	const themeProps = await getThemeLayoutProps();

	return (
		<html lang={locale} suppressHydrationWarning className={themeProps.className} style={themeProps.style}>
			<body style={themeProps.style} suppressHydrationWarning>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict}>{children}</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
