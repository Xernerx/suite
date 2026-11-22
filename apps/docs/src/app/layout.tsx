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
		default: 'Xernerx Docs | Bot Frameworks, NPM Packages & v1 Stats API',
		template: 'Xernerx Docs | %s',
	},
	description: 'Official developer docs for Xernerx Studios: open-source Discord bot frameworks (@xernerx/framework, @xernerx/stats), widgets, and the public v1 REST API.',

	metadataBase: new URL('https://docs.xernerx.com'),

	openGraph: {
		title: {
			default: 'Xernerx Docs | Bot Frameworks, NPM Packages & v1 Stats API',
			template: 'Xernerx Docs | %s',
		},
		description: 'Official developer docs for Xernerx Studios: open-source Discord bot frameworks (@xernerx/framework, @xernerx/stats), widgets, and the public v1 REST API.',
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
		site: '@XernerxStudios',
		creator: '@XernerxStudios',
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

const docsStructuredData = {
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'WebSite',
			'@id': 'https://docs.xernerx.com/#website',
			url: 'https://docs.xernerx.com',
			name: 'Xernerx Developer Documentation',
			description: 'Interactive v1 REST API reference, WebSocket RPC gateway docs, Media CDN docs, and open-source TypeScript SDK references for Xernerx Studios.',
			publisher: {
				'@type': 'Organization',
				'@id': 'https://www.xernerx.com/#organization',
				name: 'Xernerx Studios',
				url: 'https://www.xernerx.com',
				logo: 'https://www.xernerx.com/logo.png',
			},
		},
		{
			'@type': 'SoftwareSourceCode',
			'@id': 'https://docs.xernerx.com/#sdk',
			name: 'Xernerx TypeScript Discord Bot SDKs (@xernerx/*)',
			description:
				'Modular open-source TypeScript packages for Discord.js v14 bots including xernerx, @xernerx/framework, @xernerx/stats, @xernerx/commands, @xernerx/hooks, @xernerx/websocket, @xernerx/terminal, and @xernerx/extension-builder.',
			codeRepository: 'https://github.com/xernerx',
			url: 'https://docs.xernerx.com/packages',
			license: 'https://www.apache.org/licenses/LICENSE-2.0',
			programmingLanguage: ['TypeScript', 'JavaScript'],
			runtimePlatform: 'Node.js',
			author: {
				'@type': 'Organization',
				'@id': 'https://www.xernerx.com/#organization',
				name: 'Xernerx Studios',
				url: 'https://www.xernerx.com',
			},
			sameAs: ['https://www.npmjs.com/org/xernerx', 'https://www.npmjs.com/package/xernerx', 'https://www.npmjs.com/package/@xernerx/framework', 'https://www.npmjs.com/package/@xernerx/stats'],
		},
	],
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
				<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(docsStructuredData) }} />
				<SessionProvider session={session}>
					<AppLayout dictionary={dict} initialEnvironment={initialEnv} enableAds>
						{children}
					</AppLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
