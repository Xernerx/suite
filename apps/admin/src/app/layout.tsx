/** @format */

import './globals.css';

import { Locale, database, dictionary, getThemeLayoutProps } from '@xernerx/lib/server';

import { AppLayout } from '@xernerx/components';
import type { Metadata } from 'next';
import ReturnPage from '@/components/ReturnPage';
import { SessionProvider } from '@xernerx/providers';
import { auth } from '@xernerx/lib';
import { cookies, headers } from 'next/headers';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Admin | Staff Portal, Telemetry & RBAC Control',
		template: 'Xernerx Admin | %s',
	},
	description: 'Official Xernerx Studios internal staff portal for ecosystem telemetry, RBAC role management, moderation, store catalog, and platform configuration.',

	metadataBase: new URL('https://admin.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Admin | Staff Portal, Telemetry & RBAC Control',
			template: 'Xernerx Admin | %s',
		},
		description: 'Official Xernerx Studios internal staff portal for ecosystem telemetry, RBAC role management, moderation, store catalog, and platform configuration.',
		url: 'https://admin.xernerx.com',
		siteName: 'Xernerx Admin',
		images: [
			{
				url: '/opengraph-image',
				width: 1200,
				height: 630,
				alt: 'Xernerx Admin — Staff Portal & Telemetry',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: {
			default: 'Xernerx Admin | Staff Portal, Telemetry & RBAC Control',
			template: 'Xernerx Admin | %s',
		},
		description: 'Official Xernerx Studios internal staff portal for ecosystem telemetry, RBAC role management, moderation, store catalog, and platform configuration.',
		images: ['/opengraph-image'],
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

	let isAuthorized = false;
	let dbError: string | null = null;

	if (session?.user) {
		try {
			const db = await database('xernerx');
			const userDoc = await (db.models.users as any).User.findOne({ id: (session.user as any)?.id });

			const userRoles = Array.isArray(userDoc?.roles) ? userDoc.roles : [];

			if (userRoles.length > 0) {
				const roleDocs = await (db.models.core as any).Role.find({ id: { $in: userRoles } }).lean();

				if (roleDocs.some((roleDoc: any) => roleDoc.permissions?.access === true)) {
					isAuthorized = true;
				}
			}
		} catch (err: any) {
			dbError = `${err?.name || 'DatabaseError'}: ${err?.message || 'Failed to connect to database'}`;
		}
	}

	return (
		<html lang={locale} suppressHydrationWarning className={themeProps.className} style={themeProps.style}>
			<body style={themeProps.style} suppressHydrationWarning>
				<SessionProvider session={session}>
					<AppLayout dictionary={dict} initialEnvironment={initialEnv}>
						{session && (isAuthorized || dbError) ? (
							<div data-db-error={dbError || undefined} className="contents">
								{children}
							</div>
						) : (
							<ReturnPage session={session} />
						)}
					</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
