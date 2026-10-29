/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata, Viewport } from 'next';
import { SessionProvider, PermissionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { cookies, headers } from 'next/headers';

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
};

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Account | 1 Account, 1 Place, 1 Setup Across Xernerx',
		template: 'Xernerx Account | %s',
	},
	description:
		'Your single Xernerx Account across the Xernerx Suite, Virtue, Metamorphosis, and Zodiac. Manage your unified profile, themes, linked connections, developer API tokens, and billing in one place.',

	metadataBase: new URL('https://account.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Account | 1 Account, 1 Place, 1 Setup Across Xernerx',
			template: 'Xernerx Account | %s',
		},
		description:
			'Your single Xernerx Account across the Xernerx Suite, Virtue, Metamorphosis, and Zodiac. Manage your unified profile, themes, linked connections, developer API tokens, and billing in one place.',
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
			default: 'Xernerx Account | 1 Account, 1 Place, 1 Setup Across Xernerx',
			template: 'Xernerx Account | %s',
		},
		description: '1 Account, 1 Place, 1 Setup across the Xernerx Suite, Virtue, Metamorphosis, and Zodiac.',
		images: ['/banner.png'],
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

	const headersList = await headers();
	const host = headersList.get('host') || '';
	const initialEnv: 'dev' | 'canary' | 'public' =
		host.includes('.dev.') || host.includes('localhost') || process.env.ENVIRONMENT?.toLowerCase() === 'development'
			? 'dev'
			: host.includes('.canary.') || process.env.ENVIRONMENT?.toLowerCase() === 'canary'
				? 'canary'
				: 'public';

	const cookieStore = await cookies();
	const locale = cookieStore.get('NEXT_LOCALE')?.value || headersList.get('x-locale') || 'en';

	const dict = await dictionary(locale as Locale);

	const themeProps = await getThemeLayoutProps();

	return (
		<html lang={locale} suppressHydrationWarning className={themeProps.className} style={themeProps.style}>
			<body style={themeProps.style} suppressHydrationWarning>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict} initialEnvironment={initialEnv}>
						<PermissionProvider>{children}</PermissionProvider>
					</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
