/** @format */
'use client';

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

export function AppLayout({ dictionary, children, initialEnvironment }: { children: React.ReactNode; dictionary: any; initialEnvironment?: 'dev' | 'canary' | 'public' }) {
	return (
		<Suspense fallback={<Loading />}>
			<ThemeScript />

			<ToastProvider>
				<DictionaryProvider dictionary={dictionary}>
					{/* Pass initialEnvironment here so SSR matches the client */}
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
		</Suspense>
	);
}
