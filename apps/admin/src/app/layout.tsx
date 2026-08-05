/** @format */

import './globals.css';

import { Locale, database, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import ReturnPage from '@/components/ReturnPage';
import { SessionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: 'Xernerx Admin',
	description: 'Xernerx administrative dashboard, user management, and control center.',

	metadataBase: new URL('https://admin.xernerx.com'),

	openGraph: {
		title: 'Xernerx Admin',
		description: 'Xernerx administrative dashboard, user management, and control center.',
		url: 'https://admin.xernerx.com',
		siteName: 'Xernerx',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Xernerx Admin',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Admin',
		description: 'Xernerx administrative dashboard, user management, and control center.',
		images: ['/banner.png'],
	},

	icons: {
		icon: '/logo.png',
	},

	alternates: {
		canonical: 'https://admin.xernerx.com',
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

	let isAuthorized = false;

	if (session?.user) {
		const db = (await database('xernerx')).models.profiles.users as any;
		const userDoc = await db.findOne({ id: (session.user as any)?.id });
		const allowedRoles = ['owner', 'administrator', 'moderator'];

		if (userDoc && allowedRoles.includes(userDoc.role)) {
			isAuthorized = true;
		}
	}

	return (
		<html lang={locale} suppressHydrationWarning>
			<body {...themeProps}>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict}>{isAuthorized && session ? children : <ReturnPage />}</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
