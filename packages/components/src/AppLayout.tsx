/** @format */
'use client';

import { CookieProvider, PlatformProvider, SidebarProvider, SupportProvider, ThemeProvider, ToastProvider } from '@xernerx/providers';

import { CookiePrompt } from './CookiePrompt';
import { Page } from './Page';
import React from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<PlatformProvider>
				<ThemeProvider>
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
				</ThemeProvider>
			</PlatformProvider>
		</>
	);
}
