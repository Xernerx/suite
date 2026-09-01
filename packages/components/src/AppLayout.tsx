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
} from '@xernerx/providers';
import React, { Suspense } from 'react';
import Script from 'next/script';

import { CookiePrompt } from './CookiePrompt';
import { TermsPrompt } from './TermsPrompt';
import { Loading } from '@xernerx/feedback';
import { Page } from './Page';
import { ThemeScript } from './ThemeScript';

const fredoka = Fredoka({
	subsets: ['latin'],
	variable: '--font-fredoka',
});

const cascadiaCode = Cascadia_Code({
	subsets: ['latin'],
	variable: '--font-cascadia',
	adjustFontFallback: false,
});

export function AppLayout({ dictionary, children, initialEnvironment }: { children: React.ReactNode; dictionary: any; initialEnvironment?: 'dev' | 'canary' | 'public' }) {
	React.useEffect(() => {
		if (typeof document !== 'undefined') {
			document.body.classList.add(fredoka.variable, cascadiaCode.variable);
		}
	}, []);

	return (
		<Suspense fallback={<Loading />}>
			<div
				className={`${fredoka.variable} ${cascadiaCode.variable}`}
				style={{
					fontFamily: 'var(--font-fredoka), system-ui, -apple-system, sans-serif',
					display: 'contents',
				}}
			>
				<ThemeScript />
				{process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
					<Script
						async
						src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
						crossOrigin="anonymous"
						strategy="afterInteractive"
					/>
				)}

				<DictionaryProvider dictionary={dictionary}>
					<ToastProvider>
						<EnvironmentProvider initialEnvironment={initialEnvironment}>
							<PlatformProvider>
								<ThemeProvider>
									<UserProvider>
										<PermissionProvider>
											<NotificationProvider>
												<DispatchProvider>
													<ShortcutsProvider>
														<CookieProvider>
															<CookiePrompt />
															<TermsPrompt />
															<SidebarProvider>
																<SupportProvider>
																	<Page>{children}</Page>
																</SupportProvider>
															</SidebarProvider>
														</CookieProvider>
													</ShortcutsProvider>
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
		</Suspense>
	);
}
