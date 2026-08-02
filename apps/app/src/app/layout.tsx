/** @format */

import './globals.css';
import '@/lib/console';

import { CookieProvider } from '@/providers/CookieProvider';
import { DebugProvider } from '@/providers/DebugProvider';
import Header from '@/components/Header';
import Main from '@/components/Main';
import type { Metadata } from 'next';
import { PlatformProvider } from '@/providers/PlatformProvider';
import Script from 'next/script';
import { SessionProvider } from '@/providers/SessionProvider';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider } from '@/providers/SidebarProvider';
import { SupportProvider } from '@/providers/SupportProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { UserProvider } from '@/providers/UserProvider';
import { authOptions } from '@/lib/schema/auth';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: 'Xernerx Dashboard',
	description: 'Manage your Xernerx applications, tokens, and settings. Access platform tools and infrastructure from a unified dashboard.',

	metadataBase: new URL('https://app.xernerx.com'),

	openGraph: {
		title: 'Xernerx Dashboard',
		description: 'Access the Xernerx dashboard to manage applications, API tokens, and platform configuration.',
		url: 'https://app.xernerx.com',
		siteName: 'Xernerx',
		images: [
			{
				url: '/banner.png', // ✅ now local works perfectly
				width: 1200,
				height: 630,
				alt: 'Xernerx Dashboard',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Dashboard',
		description: 'Manage your Xernerx tools, tokens, and applications in one place.',
		images: ['/banner.png'],
	},

	icons: {
		icon: '/logo.png',
	},

	alternates: {
		canonical: 'https://app.xernerx.com',
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession(authOptions);

	return (
		<html lang="en" className="h-full" suppressHydrationWarning>
			<head>
				<Script
					id={'1'}
					dangerouslySetInnerHTML={{
						__html: `
try {
	const theme = JSON.parse(localStorage.getItem('xernerx-theme'));

	if (theme?.accentColor) {
		document.documentElement.style.setProperty('--accent', theme.accentColor);
	}

	if (theme?.mode) {
		document.documentElement.dataset.theme =
			theme.mode === 'system'
				? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
				: theme.mode;
	}

	if (theme?.ui?.uiSpacing) {
		document.documentElement.dataset.spacing = theme.ui.uiSpacing;
	}

	if (theme?.ui?.zoom) {
		document.documentElement.style.setProperty('--ui-zoom-scale', theme.ui.zoom / 100);
	}
} catch {}
`,
					}}
				/>
			</head>

			<body className="h-full">
				<SessionProvider session={session}>
					<ToastProvider>
						<UserProvider>
							<ThemeProvider>
								<CookieProvider>
									<DebugProvider>
										<SupportProvider>
											<PlatformProvider>
												<div id="app-root" className="h-full w-full overflow-hidden bg-(--bg-main)">
													<SidebarProvider>
														<div className="flex flex-col h-full">
															{/* Header */}
															<Header />

															{/* Sidebar + Main */}
															<div className="flex flex-1 overflow-hidden">
																<Sidebar />

																<Main>{children}</Main>
															</div>
														</div>
													</SidebarProvider>
												</div>
											</PlatformProvider>
										</SupportProvider>
									</DebugProvider>
								</CookieProvider>
							</ThemeProvider>
						</UserProvider>
					</ToastProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
