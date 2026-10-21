/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import { SessionProvider, PermissionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { cookies, headers } from 'next/headers';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Account | Profile Settings, Tokens & Billing',
		template: 'Xernerx Account | %s',
	},
	description: 'Manage your Xernerx Studios identity, profile settings, linked OAuth connections, developer API tokens, appearance preferences, and billing history.',

	metadataBase: new URL('https://account.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Account | Profile Settings, Tokens & Billing',
			template: 'Xernerx Account | %s',
		},
		description: 'Manage your Xernerx Studios identity, profile settings, linked OAuth connections, developer API tokens, appearance preferences, and billing history.',
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
			default: 'Xernerx Account | Profile Settings, Tokens & Billing',
			template: 'Xernerx Account | %s',
		},
		description: 'Manage your Xernerx Studios identity, profile settings, linked OAuth connections, developer API tokens, appearance preferences, and billing history.',
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
