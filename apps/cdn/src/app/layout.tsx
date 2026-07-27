/** @format */

import './globals.css';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import { SessionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: 'Xernerx CDN',
	description: 'Xernerx content delivery network and asset storage service.',

	metadataBase: new URL('https://cdn.xernerx.com'),

	openGraph: {
		title: 'Xernerx CDN',
		description: 'Xernerx content delivery network and asset storage service.',
		url: 'https://cdn.xernerx.com',
		siteName: 'Xernerx',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Xernerx CDN',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx CDN',
		description: 'Xernerx content delivery network and asset storage service.',
		images: ['/banner.png'],
	},

	icons: {
		icon: '/logo.png',
	},

	alternates: {
		canonical: 'https://cdn.xernerx.com',
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession(auth);

	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<SessionProvider session={session}>
					<AppLayout>{children}</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
