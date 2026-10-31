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
	LoadingProvider,
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
	if (typeof window !== 'undefined') {
		const w = window as any;
		w.googlefc = w.googlefc || {};
		w.googlefc.controlledMessagingFunction = () => false;
	}

	React.useEffect(() => {
		if (typeof document !== 'undefined') {
			document.body.classList.add(fredoka.variable, cascadiaCode.variable);
		}
	}, []);

	React.useEffect(() => {
		if (typeof window === 'undefined' || typeof document === 'undefined') return;

		const w = window as any;
		w.googlefc = w.googlefc || {};
		w.googlefc.controlledMessagingFunction = () => false;

		const isGoogleCmpNode = (node: Element): boolean => {
			const id = node.id || '';
			const cls = typeof node.className === 'string' ? node.className : '';
			if (
				cls.includes('fc-consent-root') ||
				cls.includes('fc-message-root') ||
				cls.includes('fc-revocation') ||
				cls.includes('google-revocation-link-placeholder') ||
				id.startsWith('google-anno') ||
				node.getAttribute('name') === 'googlefcPresent'
			) {
				return true;
			}
			const text = `${node.textContent || ''} ${(node as HTMLElement).shadowRoot?.textContent || ''}`;
			if (text.includes('CMP ID: 300') || text.includes('Complies with IAB TCF')) {
				return true;
			}
			return false;
		};

		const sweep = () => {
			for (const child of Array.from(document.body.children)) {
				if (child.classList.contains(fredoka.variable)) continue;
				if (isGoogleCmpNode(child)) {
					(child as HTMLElement).style.setProperty('display', 'none', 'important');
					child.remove();
				}
			}
		};

		sweep();
		const observer = new MutationObserver(() => sweep());
		observer.observe(document.body, { childList: true, subtree: true });
		return () => observer.disconnect();
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
				<EnvironmentProvider initialEnvironment={initialEnvironment}>
					<AuthWatcher />
					<PlatformProvider>
						<ThemeProvider>
							<ToastProvider>
								<UserProvider>
									<PermissionProvider>
										<NotificationProvider>
											<DispatchProvider>
												<SidebarProvider>
													<ShortcutsProvider>
														<CookieProvider>
															<VersionTracker />
															<SupportProvider>
																<LoadingProvider>
																	<Page>{children}</Page>
																</LoadingProvider>
															</SupportProvider>
															<CookiePrompt />
															<TermsPrompt />
														</CookieProvider>
													</ShortcutsProvider>
												</SidebarProvider>
											</DispatchProvider>
										</NotificationProvider>
									</PermissionProvider>
								</UserProvider>
							</ToastProvider>
						</ThemeProvider>
					</PlatformProvider>
				</EnvironmentProvider>
			</DictionaryProvider>
		</div>
	);
}
