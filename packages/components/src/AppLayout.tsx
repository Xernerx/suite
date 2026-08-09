/** @format */
'use client';

import { Cascadia_Code, Fredoka } from 'next/font/google';
import {
	CookieProvider,
	DictionaryProvider,
	EnvironmentProvider,
	NotificationProvider,
	PlatformProvider,
	ShortcutsProvider,
	SidebarProvider,
	SupportProvider,
	ThemeProvider,
	ToastProvider,
	UserProvider,
} from '@xernerx/providers';
import React, { Suspense } from 'react';

import { CookiePrompt } from './CookiePrompt';
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
});

export function AppLayout({ dictionary, children, initialEnvironment }: { children: React.ReactNode; dictionary: any; initialEnvironment?: 'dev' | 'canary' | 'public' }) {
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

				<ToastProvider>
					<DictionaryProvider dictionary={dictionary}>
						<EnvironmentProvider initialEnvironment={initialEnvironment}>
							<PlatformProvider>
								<ThemeProvider>
									<UserProvider>
										<NotificationProvider>
											<ShortcutsProvider>
												<CookieProvider>
													<SupportProvider>
														<CookiePrompt />
														<SidebarProvider>
															<Page>{children}</Page>
														</SidebarProvider>
													</SupportProvider>
												</CookieProvider>
											</ShortcutsProvider>
										</NotificationProvider>
									</UserProvider>
								</ThemeProvider>
							</PlatformProvider>
						</EnvironmentProvider>
					</DictionaryProvider>
				</ToastProvider>
			</div>
		</Suspense>
	);
}
