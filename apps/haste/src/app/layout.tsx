/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import { SessionProvider, PermissionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Haste | Fast Code & Text Pastebin',
		template: 'Xernerx Haste | %s',
	},
	description: 'Official Xernerx Studios code and text pastebin with syntax highlighting, TTL expirations, raw text streaming, and 3-tier privacy.',

	metadataBase: new URL('https://haste.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Haste | Fast Code & Text Pastebin',
			template: 'Xernerx Haste | %s',
		},
		description: 'Official Xernerx Studios code and text pastebin with syntax highlighting, TTL expirations, raw text streaming, and 3-tier privacy.',
		url: 'https://haste.xernerx.com',
		siteName: 'Xernerx Haste',
		images: [
			{
				url: '/opengraph-image',
				width: 1200,
				height: 630,
				alt: 'Xernerx Haste — Fast Code & Text Pastebin',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: {
			default: 'Xernerx Haste | Fast Code & Text Pastebin',
			template: 'Xernerx Haste | %s',
		},
		description: 'Official Xernerx Studios code and text pastebin with syntax highlighting, TTL expirations, raw text streaming, and 3-tier privacy.',
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
					<AppLayout dictionary={dict}>
						<PermissionProvider>{children}</PermissionProvider>
					</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
