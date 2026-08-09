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
	title: 'Xernerx Dashboard',
	description: 'Manage your Xernerx applications, tokens, and settings. Access platform tools and infrastructure from a unified dashboard.',

	metadataBase: new URL('https://app.xernerx.com'),

	openGraph: {
		title: 'Xernerx Dashboard',
		description: 'Access the Xernerx dashboard to manage applications, API tokens, and platform configuration.',
		url: 'https://app.xernerx.com',
		siteName: 'Xernerx',
		images: [
			{
				url: '/banner.png', // ✅ now local works perfectly
				width: 1200,
				height: 630,
				alt: 'Xernerx Dashboard',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Dashboard',
		description: 'Manage your Xernerx tools, tokens, and applications in one place.',
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
		<html lang={locale} suppressHydrationWarning>
			<body {...themeProps}>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict}>{children}</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
