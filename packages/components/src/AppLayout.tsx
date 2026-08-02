/** @format */
'use client';

import {
	CookieProvider,
	DictionaryProvider,
	EnvironmentProvider,
	PlatformProvider,
	ShortcutsProvider,
	SidebarProvider,
	SupportProvider,
	ThemeProvider,
	ToastProvider,
	UserProvider,
} from '@xernerx/providers';

import { CookiePrompt } from './CookiePrompt';
import { Page } from './Page';
import React from 'react';
import { ThemeScript } from './ThemeScript';

export function AppLayout({ dictionary, children, initialEnvironment }: { children: React.ReactNode; dictionary: any; initialEnvironment?: 'dev' | 'canary' | 'public' }) {
	return (
		<>
			<ThemeScript />

			<ToastProvider>
				<DictionaryProvider dictionary={dictionary}>
					{/* Pass initialEnvironment here so SSR matches the client */}
					<EnvironmentProvider initialEnvironment={initialEnvironment}>
						<PlatformProvider>
							<ThemeProvider>
								<UserProvider>
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
								</UserProvider>
							</ThemeProvider>
						</PlatformProvider>
					</EnvironmentProvider>
				</DictionaryProvider>
			</ToastProvider>
		</>
	);
}
