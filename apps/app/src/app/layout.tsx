/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata, Viewport } from 'next';
import { SessionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { cookies, headers } from 'next/headers';
import { getServerSession } from 'next-auth';

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
};

export const metadata: Metadata = {
	title: {
		default: 'Xernerx App | Discord Bot List, Server Explorer & Dashboard',
		template: 'Xernerx App | %s',
	},
	description: 'Discover public Discord bots and servers, configure Virtue, Metamorphosis, and Zodiac in one dashboard, and track live bot statistics on Xernerx App.',
	keywords: [
		'Xernerx',
		'Xernerx Studios',
		'Discord bots',
		'Discord servers',
		'bot list',
		'server directory',
		'Virtue',
		'Metamorphosis',
		'Zodiac',
		'leaderboard',
		'dashboard',
		'SEO',
		'branding',
		'audit',
	],

	metadataBase: new URL('https://app.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx App | Discord Bot List, Server Explorer & Dashboard',
			template: 'Xernerx App | %s',
		},
		description: 'Discover public Discord bots and servers, configure Virtue, Metamorphosis, and Zodiac in one dashboard, and track live bot statistics on Xernerx App.',
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
			default: 'Xernerx App | Discord Bot List, Server Explorer & Dashboard',
			template: 'Xernerx App | %s',
		},
		description: 'Discover Discord bots & servers, configure Virtue, Metamorphosis & Zodiac in one place, and track or promote your bots.',
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
	const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
	const dict = await dictionary(locale as Locale);

	const themeProps = await getThemeLayoutProps();

	return (
		<html lang={locale} suppressHydrationWarning className={themeProps.className} style={themeProps.style}>
			<body style={themeProps.style} suppressHydrationWarning>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict} initialEnvironment={initialEnv} enableAds>
						{children}
					</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
