/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata, Viewport } from 'next';
import { SessionProvider, PermissionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
};

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Portal | Developer Studio & Organizations',
		template: 'Xernerx Portal | %s',
	},
	description: 'Manage your Xernerx Studios developer organizations, publish Discord bots, configure webhooks, and monitor application telemetry.',

	metadataBase: new URL('https://portal.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Portal | Developer Studio & Organizations',
			template: 'Xernerx Portal | %s',
		},
		description: 'Manage your Xernerx Studios developer organizations, publish Discord bots, configure webhooks, and monitor application telemetry.',
		url: 'https://portal.xernerx.com',
		siteName: 'Xernerx Portal',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Xernerx Portal',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: {
			default: 'Xernerx Portal | Developer Studio & Organizations',
			template: 'Xernerx Portal | %s',
		},
		description: 'Manage your Xernerx Studios developer organizations, publish Discord bots, configure webhooks, and monitor application telemetry.',
		images: ['/banner.png'],
	},

	icons: {
		icon: '/logo.png',
		apple: '/logo.png',
	},

	robots: {
		index: false,
		follow: false,
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

	if (!session) {
		const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]+)?$/.test(host);
		const domain = process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com';

		let url = 'https://account.xernerx.com/login';
		let returnTo = `https://portal.${domain}`;
		if (host.includes('localhost')) {
			url = 'http://localhost:4003/login';
			returnTo = `http://${host}`;
		} else if (isIp) {
			url = `http://${host.split(':')[0]}:4003/login`;
			returnTo = `http://${host}`;
		} else if (host.includes('.dev.')) {
			url = `https://account.dev.${domain}/login`;
			returnTo = `https://portal.dev.${domain}`;
		} else if (host.includes('.canary.')) {
			url = `https://account.canary.${domain}/login`;
			returnTo = `https://portal.canary.${domain}`;
		}
		redirect(`${url}?redirect=${encodeURIComponent(returnTo)}`);
	}

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
