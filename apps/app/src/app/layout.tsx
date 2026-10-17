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
		default: 'Xernerx Studios | Explore Discord Bots & Communities',
		template: 'Xernerx Studios | %s',
	},
	description: 'Discover thousands of unique Discord bots and vibrant communities on Xernerx Studios. Power up your server, manage bot dashboards, or find your next home.',

	metadataBase: new URL('https://app.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Studios | Explore Discord Bots & Communities',
			template: 'Xernerx Studios | %s',
		},
		description: 'Discover thousands of unique Discord bots and vibrant communities on Xernerx Studios. Power up your server, manage bot dashboards, or find your next home.',
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
			default: 'Xernerx Studios | Explore Discord Bots & Communities',
			template: 'Xernerx Studios | %s',
		},
		description: 'Discover thousands of unique Discord bots and vibrant communities on Xernerx Studios.',
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
		host.includes('.dev.') || host.includes('localhost') || process.env.ENVIRONMENT?.toLowerCase() === 'development' ? 'dev' : host.includes('.canary.') ? 'canary' : 'public';

	const cookieStore = await cookies();
	const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
	const dict = await dictionary(locale as Locale);

	const themeProps = await getThemeLayoutProps();

	return (
		<html lang={locale} suppressHydrationWarning className={themeProps.className}>
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
