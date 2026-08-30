/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import { SessionProvider, PermissionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Account',
		template: 'Xernerx Account | %s',
	},
	description: 'Manage your Xernerx account, API tokens, and platform configuration.',

	metadataBase: new URL('https://account.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Account',
			template: 'Xernerx Account | %s',
		},
		description: 'Manage your Xernerx account, API tokens, and platform configuration.',
		url: 'https://account.xernerx.com',
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
		title: {
			default: 'Xernerx Account',
			template: 'Xernerx Account | %s',
		},
		description: 'Manage your Xernerx account, API tokens, and platform configuration.',
		images: ['/banner.png'],
	},

	icons: {
		icon: '/logo.png',
	},

	alternates: {
		canonical: 'https://account.xernerx.com',
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

	const themeProps = await getThemeLayoutProps();

	return (
		<html lang={locale} suppressHydrationWarning className={themeProps.className}>
			<body style={themeProps.style} suppressHydrationWarning>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict}>
						<PermissionProvider>{children}</PermissionProvider>
					</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
