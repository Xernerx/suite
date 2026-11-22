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
		default: 'Xernerx Studios — Discord Bots, Suite & Open-Source SDKs',
		template: 'Xernerx Studios | %s',
	},
	description: 'Xernerx Studios builds Discord bots (Virtue, YourApps, To-Do List Bot, Metamorphosis, Zodiac), TypeScript SDKs, and the unified Xernerx Suite.',
	keywords: [
		'Xernerx',
		'Xernerx Studios',
		'Xernerx Suite',
		'Xernerx Account',
		'1 Account 1 Place 1 Setup',
		'To-Do List Bot',
		'Virtue Discord Bot',
		'YourApps Discord Bot',
		'Metamorphosis Discord Bot',
		'Zodiac Discord Bot',
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
		description: 'Xernerx Studios builds Discord bots (Virtue, YourApps, To-Do List Bot, Metamorphosis, Zodiac), TypeScript SDKs, and the unified Xernerx Suite.',
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
		site: '@XernerxStudios',
		creator: '@XernerxStudios',
		title: {
			default: 'Xernerx Studios — Discord Bots, Suite & Open-Source SDKs',
			template: 'Xernerx Studios | %s',
		},
		description: 'Xernerx Studios builds Discord bots (Virtue, YourApps, To-Do List Bot, Metamorphosis, Zodiac), TypeScript SDKs, and the unified Xernerx Suite.',
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
			legalName: 'Xernerx Studios',
			alternateName: ['Xernerx', 'Xernerx Suite', 'Amethyst Development'],
			foundingDate: '2020-03',
			areaServed: 'Worldwide',
			url: 'https://www.xernerx.com',
			logo: 'https://www.xernerx.com/logo.png',
			email: 'info@xernerx.com',
			slogan: '1 Account, 1 Place, 1 Setup',
			description:
				'Xernerx Studios is a development studio focused on consumer and developer simplicity. With 1 Xernerx Account, users configure in-house Discord services (Virtue, YourApps, To-Do List Bot, Metamorphosis, Zodiac) and discover communities in 1 unified dashboard, while bot developers use open-source TypeScript frameworks (@xernerx/framework, @xernerx/stats) and the public v1 Stats API to track bot statistics, publicly list their bots, and promote them.',
			contactPoint: [
				{
					'@type': 'ContactPoint',
					contactType: 'customer support',
					email: 'support@xernerx.com',
					url: 'https://www.xernerx.com/contact',
					availableLanguage: ['English', 'Dutch', 'Spanish', 'French', 'Russian', 'Swedish'],
					areaServed: 'Worldwide',
				},
				{
					'@type': 'ContactPoint',
					contactType: 'security',
					email: 'security@xernerx.com',
					url: 'https://www.xernerx.com/security',
					areaServed: 'Worldwide',
				},
			],
			sameAs: [
				'https://github.com/xernerx',
				'https://www.npmjs.com/org/xernerx',
				'https://x.com/XernerxStudios',
				'https://bsky.app/profile/xernerx.com',
				'https://www.instagram.com/xernerxstudios/',
				'https://discord.gg/yrm8gqTuXa',
			],
			knowsAbout: [
				'Discord Bots',
				'TypeScript Frameworks',
				'Open-Source SDKs',
				'Discord Bot Statistics Tracking',
				'Public Discord Bot Directory & Promotion',
				'Unified Discord Server Dashboard',
				'Virtue Discord Bot',
				'YourApps Discord Bot',
				'To-Do List Bot',
				'Metamorphosis Discord Bot',
				'Zodiac Discord Bot',
				'Zero Message Content Logging',
			],
		},
		{
			'@type': 'WebSite',
			'@id': 'https://www.xernerx.com/#website',
			url: 'https://www.xernerx.com',
			name: 'Xernerx Studios',
			publisher: { '@id': 'https://www.xernerx.com/#organization' },
			description:
				'Official hub for Xernerx Studios (Version 5): 1 Xernerx Account for the Xernerx Suite, Virtue, YourApps, To-Do List Bot, Metamorphosis, and Zodiac, plus bot statistics tracking, public bot listings, and developer frameworks.',
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
			offers: [
				{
					'@type': 'Offer',
					name: 'Free Tier',
					price: '0',
					priceCurrency: 'EUR',
				},
				{
					'@type': 'Offer',
					name: 'Xernerx Ultra Ecosystem Bundle',
					price: '10',
					priceCurrency: 'EUR',
				},
			],
			interactionStatistic: [
				{
					'@type': 'InteractionCounter',
					interactionType: 'https://schema.org/InstallAction',
					userInteractionCount: 26400,
					name: 'Active Discord Servers',
				},
				{
					'@type': 'InteractionCounter',
					interactionType: 'https://schema.org/UseAction',
					userInteractionCount: 2650000,
					name: 'Discord Users Reached',
				},
			],
			description:
				'Version 5 of the Xernerx platform: a unified dashboard for configuring Virtue, YourApps, To-Do List Bot, Metamorphosis, and Zodiac, discovering Discord bots and servers, tracking automated bot telemetry, and managing developer organizations with 1 Xernerx Account.',
		},
		{
			'@type': 'SoftwareApplication',
			'@id': 'https://app.xernerx.com/bots/virtue#bot',
			name: 'Virtue Discord Bot',
			alternateName: ['Virtue', 'Virtue Leveling Bot'],
			applicationCategory: 'UtilitiesApplication',
			operatingSystem: 'Discord, Web',
			url: 'https://app.xernerx.com/bots/virtue',
			author: { '@id': 'https://www.xernerx.com/#organization' },
			description:
				'Text and voice XP leveling Discord bot developed by Xernerx Studios with global and server leaderboards, configurable XP curves, role rewards, and server booster multipliers.',
		},
		{
			'@type': 'SoftwareApplication',
			'@id': 'https://app.xernerx.com/bots/yourapps#bot',
			name: 'YourApps Discord Bot',
			alternateName: ['YourApps', 'YourApps Applications Bot'],
			applicationCategory: 'UtilitiesApplication',
			operatingSystem: 'Discord, Web',
			url: 'https://app.xernerx.com/bots/yourapps',
			author: { '@id': 'https://www.xernerx.com/#organization' },
			description:
				'Discord-native forms, staff recruitment, and community applications bot developed by Xernerx Studios featuring Modals V2, web application portals, Apply panels, and automated review workflows.',
		},
		{
			'@type': 'SoftwareApplication',
			'@id': 'https://app.xernerx.com/bots/todo#bot',
			name: 'To-Do List Bot',
			alternateName: ['Xernerx To-Do List Bot'],
			applicationCategory: 'UtilitiesApplication',
			operatingSystem: 'Discord, Web',
			url: 'https://app.xernerx.com/bots/todo',
			author: { '@id': 'https://www.xernerx.com/#organization' },
			description: 'Collaborative Discord task boards, personal checklists, and productivity bot developed by Xernerx Studios.',
		},
		{
			'@type': 'SoftwareApplication',
			'@id': 'https://app.xernerx.com/bots/metamorphosis#bot',
			name: 'Metamorphosis Discord Bot',
			alternateName: ['Metamorphosis'],
			applicationCategory: 'UtilitiesApplication',
			operatingSystem: 'Discord, Web',
			url: 'https://app.xernerx.com/bots/metamorphosis',
			author: { '@id': 'https://www.xernerx.com/#organization' },
			description:
				'Real-time multilingual Discord translation bot developed by Xernerx Studios supporting automatic channel translation, slash-command translation, and global community localization.',
		},
		{
			'@type': 'SoftwareApplication',
			'@id': 'https://app.xernerx.com/bots/zodiac#bot',
			name: 'Zodiac Discord Bot',
			alternateName: ['Zodiac'],
			applicationCategory: 'UtilitiesApplication',
			operatingSystem: 'Discord, Web',
			url: 'https://app.xernerx.com/bots/zodiac',
			author: { '@id': 'https://www.xernerx.com/#organization' },
			description: 'Daily horoscopes, zodiac sign profiles, compatibility readings, and astrology Discord bot developed by Xernerx Studios.',
		},
	],
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [headersList, cookieStore, themeProps] = await Promise.all([
		headers(),
		cookies(),
		getThemeLayoutProps().catch(() => ({ className: 'dark', style: { '--accent': '#8b7cf6', '--page-width': '90%' } as React.CSSProperties })),
	]);

	const host = headersList.get('host') || '';
	const initialEnv: 'dev' | 'canary' | 'public' =
		host.includes('.dev.') || host.includes('localhost') || process.env.ENVIRONMENT?.toLowerCase() === 'development'
			? 'dev'
			: host.includes('.canary.') || process.env.ENVIRONMENT?.toLowerCase() === 'canary'
				? 'canary'
				: 'public';

	const locale = cookieStore.get('NEXT_LOCALE')?.value || headersList.get('x-locale') || 'en-GB';
	const hasSessionCookie = Boolean(cookieStore.get('__Secure-next-auth.session-token') || cookieStore.get('next-auth.session-token'));

	const sessionPromise = hasSessionCookie ? Promise.race([getServerSession(auth).catch(() => null), new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500))]) : Promise.resolve(null);

	const [session, dict] = await Promise.all([sessionPromise, dictionary(locale as Locale).catch(() => dictionary('en-GB' as Locale))]);

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
