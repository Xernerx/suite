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
		default: 'Xernerx Studios | Explore',
		template: 'Xernerx Studios | Explore | %s',
	},
	description: 'Discover thousands of unique Discord bots and vibrant communities. Power up your server or find your next home on Xernerx.',

	metadataBase: new URL('https://app.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Studios | Explore',
			template: 'Xernerx Studios | Explore | %s',
		},
		description: 'Discover thousands of unique Discord bots and vibrant communities. Power up your server or find your next home.',
		url: 'https://app.xernerx.com',
		siteName: 'Xernerx',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Explore Xernerx',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: {
			default: 'Xernerx Studios | Explore',
			template: 'Xernerx Studios | Explore | %s',
		},
		description: 'Discover thousands of unique Discord bots and vibrant communities on Xernerx.',
		images: ['/banner.png'],
	},

	icons: {
		icon: '/logo.png',
	},

	alternates: {
		canonical: 'https://app.xernerx.com',
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
		<html lang={locale} suppressHydrationWarning className={themeProps.className}>
			<body style={themeProps.style} suppressHydrationWarning>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict}>{children}</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
