/** @format */

import './globals.css';

import { Locale, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import { SessionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Support',
		template: 'Xernerx Support | %s',
	},
	description: 'The official Feedback, Support, and Community Hub for the Xernerx Suite. Explore our roadmap, submit suggestions, and report bugs.',

	metadataBase: new URL('https://info.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Support',
			template: 'Xernerx Support | %s',
		},
		description: 'The official Feedback, Support, and Community Hub for the Xernerx Suite. Explore our roadmap, submit suggestions, and report bugs.',
		url: 'https://info.xernerx.com',
		siteName: 'Xernerx Support',
		images: [
			{
				url: 'https://www.xernerx.com/banner.png',
				width: 1200,
				height: 630,
			},
		],
		locale: 'en-US',
		type: 'website',
	},

	twitter: {
		title: {
			default: 'Xernerx Support',
			template: 'Xernerx Support | %s',
		},
		description: 'The official Feedback, Support, and Community Hub for the Xernerx Suite. Explore our roadmap, submit suggestions, and report bugs.',
		card: 'summary_large_image',
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
		<html lang={locale} suppressHydrationWarning className={themeProps.className}>
			<body style={themeProps.style}>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict}>{children}</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
