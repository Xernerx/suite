/** @format */
// Force recompile

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
		default: 'Xernerx Support | Roadmap, Changelog, Issues & FAQ Hub',
		template: 'Xernerx Support | %s',
	},
	description: 'The official Feedback, Support, and Community Hub for Xernerx Studios. Explore our roadmap, changelog, FAQ, submit suggestions, and report issues.',

	metadataBase: new URL('https://info.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Support | Roadmap, Changelog, Issues & FAQ Hub',
			template: 'Xernerx Support | %s',
		},
		description: 'The official Feedback, Support, and Community Hub for Xernerx Studios. Explore our roadmap, changelog, FAQ, submit suggestions, and report issues.',
		url: 'https://info.xernerx.com',
		siteName: 'Xernerx Support',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Xernerx Support',
			},
		],
		locale: 'en-US',
		type: 'website',
	},

	twitter: {
		title: {
			default: 'Xernerx Support | Roadmap, Changelog, Issues & FAQ Hub',
			template: 'Xernerx Support | %s',
		},
		description: 'The official Feedback, Support, and Community Hub for Xernerx Studios. Explore our roadmap, changelog, FAQ, submit suggestions, and report issues.',
		card: 'summary_large_image',
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
