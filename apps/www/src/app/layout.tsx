/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import { SessionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { cookies, headers } from 'next/headers';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Studios — Discord Bots, Suite & Open-Source SDKs',
		template: 'Xernerx Studios | %s',
	},
	description: 'Xernerx Studios builds Discord bots (Virtue, Metamorphosis, Zodiac), open-source TypeScript SDKs, and the unified Xernerx Suite dashboard.',
	keywords: [
		'Xernerx',
		'Xernerx Studios',
		'Xernerx Suite',
		'Xernerx Account',
		'1 Account 1 Place 1 Setup',
		'Virtue Discord Bot',
		'Metamorphosis Discord Bot',
		'Zodiac Discord Bot',
		'To-Do List Bot',
		'Discord Bot Stats',
		'Discord Bot List',
		'Discord Bot Dashboard',
		'@xernerx/framework',
		'@xernerx/stats',
	],

	metadataBase: new URL('https://www.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Studios — Discord Bots, Suite & Open-Source SDKs',
			template: 'Xernerx Studios | %s',
		},
		description: 'Xernerx Studios builds Discord bots (Virtue, Metamorphosis, Zodiac), open-source TypeScript SDKs, and the unified Xernerx Suite dashboard.',
		url: 'https://www.xernerx.com',
		siteName: 'Xernerx Studios',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Xernerx Studios — Discord Bots, Suite & Open-Source SDKs',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: {
			default: 'Xernerx Studios — Discord Bots, Suite & Open-Source SDKs',
			template: 'Xernerx Studios | %s',
		},
		description: 'Xernerx Studios builds Discord bots (Virtue, Metamorphosis, Zodiac), open-source TypeScript SDKs, and the unified Xernerx Suite dashboard.',
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

const structuredData = {
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'Organization',
			'@id': 'https://www.xernerx.com/#organization',
			name: 'Xernerx Studios',
			alternateName: ['Xernerx', 'Xernerx Suite'],
			url: 'https://www.xernerx.com',
			logo: 'https://www.xernerx.com/logo.png',
			slogan: '1 Account, 1 Place, 1 Setup',
			description:
				'Xernerx Studios is a development studio focused on consumer and developer simplicity. With 1 Xernerx Account, users configure in-house Discord services (Virtue, Metamorphosis, Zodiac) and discover communities in 1 unified dashboard, while bot developers use open-source frameworks (@xernerx/framework, @xernerx/stats) and the public v1 Stats API to track bot statistics, publicly list their bots, and promote them.',
			sameAs: ['https://github.com/xernerx', 'https://www.npmjs.com/org/xernerx'],
			knowsAbout: [
				'Discord Bots',
				'Discord Bot Statistics Tracking',
				'Public Discord Bot Directory & Promotion',
				'Unified Discord Server Dashboard',
				'Virtue Discord Bot',
				'Metamorphosis Discord Bot',
				'Zodiac Discord Bot',
				'To-Do List Bot',
				'Open-Source Discord Bot Frameworks',
			],
		},
		{
			'@type': 'WebSite',
			'@id': 'https://www.xernerx.com/#website',
			url: 'https://www.xernerx.com',
			name: 'Xernerx Studios',
			publisher: { '@id': 'https://www.xernerx.com/#organization' },
			description:
				'Official hub for Xernerx Studios (Version 5): 1 Xernerx Account for the Xernerx Suite, Virtue, Metamorphosis, and Zodiac, plus bot statistics tracking, public bot listings, and developer frameworks.',
		},
		{
			'@type': 'SoftwareApplication',
			'@id': 'https://app.xernerx.com/#suite',
			name: 'Xernerx Suite',
			softwareVersion: '5.0',
			applicationCategory: 'UtilitiesApplication',
			operatingSystem: 'Web, Windows, macOS, Linux',
			url: 'https://app.xernerx.com',
			author: { '@id': 'https://www.xernerx.com/#organization' },
			description:
				'Version 5 of the Xernerx platform: a unified dashboard for configuring Virtue, Metamorphosis, and Zodiac, discovering Discord bots and servers, tracking automated bot telemetry, and managing developer organizations with 1 Xernerx Account.',
		},
	],
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [headersList, cookieStore, themeProps] = await Promise.all([headers(), cookies(), getThemeLayoutProps()]);

	const host = headersList.get('host') || '';
	const initialEnv: 'dev' | 'canary' | 'public' =
		host.includes('.dev.') || host.includes('localhost') || process.env.ENVIRONMENT?.toLowerCase() === 'development'
			? 'dev'
			: host.includes('.canary.') || process.env.ENVIRONMENT?.toLowerCase() === 'canary'
				? 'canary'
				: 'public';

	const locale = cookieStore.get('NEXT_LOCALE')?.value || headersList.get('x-locale') || 'en-GB';
	const hasSessionCookie = Boolean(cookieStore.get('__Secure-next-auth.session-token') || cookieStore.get('next-auth.session-token'));

	const [session, dict] = await Promise.all([hasSessionCookie ? getServerSession(auth) : Promise.resolve(null), dictionary(locale as Locale)]);

	return (
		<html lang={locale} suppressHydrationWarning className={themeProps.className} style={themeProps.style}>
			<body style={themeProps.style} suppressHydrationWarning>
				<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
				<SessionProvider session={session}>
					<AppLayout dictionary={dict} initialEnvironment={initialEnv} enableAds>
						{children}
					</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
