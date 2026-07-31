/** @format */

import './globals.css';

import { Locale, dictionary } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import { SessionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';

export const metadata: Metadata = {
	title: 'Xernerx Account',
	description: 'Manage your Xernerx account, API tokens, and platform configuration.',

	metadataBase: new URL('https://auth.xernerx.com'),

	openGraph: {
		title: 'Xernerx Account',
		description: 'Manage your Xernerx account, API tokens, and platform configuration.',
		url: 'https://auth.xernerx.com',
		siteName: 'Xernerx',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Xernerx Account',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Account',
		description: 'Manage your Xernerx account, API tokens, and platform configuration.',
		images: ['/banner.png'],
	},

	icons: {
		icon: '/logo.png',
	},

	alternates: {
		canonical: 'https://auth.xernerx.com',
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession(auth);

	const headersList = await headers();
	const locale = headersList.get('x-locale') || 'en';

	const dict = await dictionary(locale as Locale);

	return (
		<html lang={locale} suppressHydrationWarning>
			<body>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict}>{children}</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
