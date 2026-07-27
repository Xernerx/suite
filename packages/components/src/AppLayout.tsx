/** @format */
'use client';

import { CookieProvider, EnvironmentProvider, PlatformProvider, SidebarProvider, SupportProvider, ThemeProvider, ToastProvider, ShortcutsProvider } from '@xernerx/providers';

import { CookiePrompt } from './CookiePrompt';
import { Page } from './Page';
import React from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<EnvironmentProvider>
				<PlatformProvider>
					<ThemeProvider>
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
					</ThemeProvider>
				</PlatformProvider>
			</EnvironmentProvider>
		</>
	);
}
