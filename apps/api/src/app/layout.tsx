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
	title: 'Xernerx API',
	description: 'Xernerx core API service, documentation, and endpoints.',

	metadataBase: new URL('https://api.xernerx.com'),

	openGraph: {
		title: 'Xernerx API',
		description: 'Xernerx core API service, documentation, and endpoints.',
		url: 'https://api.xernerx.com',
		siteName: 'Xernerx',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Xernerx API',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx API',
		description: 'Xernerx core API service, documentation, and endpoints.',
		images: ['/banner.png'],
	},

	icons: {
		icon: '/logo.png',
	},

	alternates: {
		canonical: 'https://api.xernerx.com',
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
			<body style={themeProps.style}>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict}>{children}</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
