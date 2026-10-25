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
		default: 'Xernerx Docs | Bot Frameworks, NPM Packages & v1 Stats API',
		template: 'Xernerx Docs | %s',
	},
	description:
		'Official developer documentation for Xernerx Studios—featuring open-source Discord bot frameworks (@xernerx/framework, @xernerx/stats), embed widgets, and the public v1 Bot Stats & Registry REST API.',

	metadataBase: new URL('https://docs.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Docs | Bot Frameworks, NPM Packages & v1 Stats API',
			template: 'Xernerx Docs | %s',
		},
		description:
			'Official developer documentation for Xernerx Studios—featuring open-source Discord bot frameworks (@xernerx/framework, @xernerx/stats), embed widgets, and the public v1 Bot Stats & Registry REST API.',
		url: 'https://docs.xernerx.com',
		siteName: 'Xernerx',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Xernerx Docs',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: {
			default: 'Xernerx Docs | Bot Frameworks, NPM Packages & v1 Stats API',
			template: 'Xernerx Docs | %s',
		},
		description: 'Official developer documentation for Xernerx Studios—open-source Discord bot frameworks (@xernerx/framework, @xernerx/stats) and the public v1 Bot Stats & Registry REST API.',
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
