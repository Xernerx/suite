/** @format */

import './globals.css';

import { Locale, dictionary } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import { SessionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: 'Xernerx Studios',
	description: 'Building modern software, infrastructure and developer tools with a focus on performance, simplicity and long-term maintainability.',

	metadataBase: new URL('https://xernerx.com'),

	openGraph: {
		title: 'Xernerx Studios',
		description: 'Building modern software, infrastructure and developer tools with a focus on performance, simplicity and long-term maintainability.',
		url: 'https://xernerx.com',
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
		title: 'Xernerx Studios',
		description: 'Building modern software, infrastructure and developer tools with a focus on performance, simplicity and long-term maintainability.',
		images: ['/banner.png'],
	},

	icons: {
		icon: '/logo.png',
	},

	alternates: {
		canonical: 'https://xernerx.com',
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
