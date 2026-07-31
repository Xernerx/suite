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

export function AppLayout({ dictionary, children }: { children: React.ReactNode; dictionary: any }) {
	return (
		<>
			<ThemeScript />

			<DictionaryProvider dictionary={dictionary}>
				<EnvironmentProvider>
					<PlatformProvider>
						<ThemeProvider>
							<UserProvider>
								<ShortcutsProvider>
									<ToastProvider>
										<CookieProvider>
											<SupportProvider>
												<CookiePrompt />
												<SidebarProvider>
													<Page>{children}</Page>
												</SidebarProvider>
											</SupportProvider>
										</CookieProvider>
									</ToastProvider>
								</ShortcutsProvider>
							</UserProvider>
						</ThemeProvider>
					</PlatformProvider>
				</EnvironmentProvider>
			</DictionaryProvider>
		</>
	);
}
