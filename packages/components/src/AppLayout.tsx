/** @format */
'use client';

import { Cascadia_Code, Fredoka } from 'next/font/google';
import {
	CookieProvider,
	DictionaryProvider,
	EnvironmentProvider,
	NotificationProvider,
	PlatformProvider,
	PermissionProvider,
	ShortcutsProvider,
	SidebarProvider,
	SupportProvider,
	ThemeProvider,
	ToastProvider,
	UserProvider,
	DispatchProvider,
	useSession,
	signOut,
	useEnvironment,
} from '@xernerx/providers';
import React from 'react';

import { CookiePrompt } from './CookiePrompt';
import { TermsPrompt } from './TermsPrompt';
import { Page } from './Page';
import { ThemeScript } from './ThemeScript';
import { VersionTracker } from './VersionTracker';

const fredoka = Fredoka({
	subsets: ['latin'],
	variable: '--font-fredoka',
});

const cascadiaCode = Cascadia_Code({
	subsets: ['latin'],
	variable: '--font-cascadia',
	adjustFontFallback: false,
});

function AuthWatcher() {
	const { data: session } = useSession();
	const { getEnvUrl } = useEnvironment();
	const signingOutRef = React.useRef(false);

	React.useEffect(() => {
		const sessionError = (session as any)?.error;
		if (
			!signingOutRef.current &&
			sessionError &&
			(sessionError === 'RefreshAccessTokenError' ||
				sessionError === 'invalid_grant' ||
				sessionError?.error === 'invalid_grant' ||
				(typeof sessionError === 'string' && (sessionError.includes('Token') || sessionError.includes('grant') || sessionError.includes('Refresh'))) ||
				Boolean(sessionError))
		) {
			signingOutRef.current = true;
			const isAuthPage = typeof window !== 'undefined' && (window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/logout'));
			const loginBaseUrl = getEnvUrl ? getEnvUrl('https://account.xernerx.com/login') : '/login';
			const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
			const loginUrl = !isAuthPage && currentUrl ? `${loginBaseUrl}${loginBaseUrl.includes('?') ? '&' : '?'}redirect=${encodeURIComponent(currentUrl)}` : loginBaseUrl;

			signOut({ callbackUrl: loginUrl });
		}
	}, [session, getEnvUrl]);

	return null;
}

export function AppLayout({
	dictionary,
	children,
	initialEnvironment,
	enableAds = false,
}: {
	children: React.ReactNode;
	dictionary: any;
	initialEnvironment?: 'dev' | 'canary' | 'public';
	enableAds?: boolean;
}) {
	React.useEffect(() => {
		if (typeof document !== 'undefined') {
			document.body.classList.add(fredoka.variable, cascadiaCode.variable);
		}
	}, []);

	return (
		<div
			className={`${fredoka.variable} ${cascadiaCode.variable}`}
			style={{
				fontFamily: 'var(--font-fredoka), system-ui, -apple-system, sans-serif',
				display: 'contents',
			}}
		>
			<ThemeScript />
			{enableAds && process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
				<script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`} crossOrigin="anonymous" />
			)}

			<DictionaryProvider dictionary={dictionary}>
				<ToastProvider>
					<EnvironmentProvider initialEnvironment={initialEnvironment}>
						<AuthWatcher />
						<PlatformProvider>
							<ThemeProvider>
								<UserProvider>
									<PermissionProvider>
										<NotificationProvider>
											<DispatchProvider>
												<SidebarProvider>
													<ShortcutsProvider>
														<CookieProvider>
															<CookiePrompt />
															<TermsPrompt />
															<VersionTracker />
															<SupportProvider>
																<Page>{children}</Page>
															</SupportProvider>
														</CookieProvider>
													</ShortcutsProvider>
												</SidebarProvider>
											</DispatchProvider>
										</NotificationProvider>
									</PermissionProvider>
								</UserProvider>
							</ThemeProvider>
						</PlatformProvider>
					</EnvironmentProvider>
				</ToastProvider>
			</DictionaryProvider>
		</div>
	);
}
