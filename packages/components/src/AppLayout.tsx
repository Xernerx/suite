/** @format */
'use client';

import { CookieProvider, EnvironmentProvider, PlatformProvider, ShortcutsProvider, SidebarProvider, SupportProvider, ThemeProvider, ToastProvider, UserProvider } from '@xernerx/providers';

import { CookiePrompt } from './CookiePrompt';
import { Page } from './Page';
import React from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
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
	);
}
