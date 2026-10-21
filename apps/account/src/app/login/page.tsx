/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { signIn, useDictionary, useSession, useSidebar } from '@xernerx/providers';

import Banner from '@/../public/banner.svg';
import { Button } from '@xernerx/ui';
import { QrLoginPanel } from '@/components/QrLoginPanel';
import { useSearchParams } from 'next/navigation';

function isSafeRedirect(url: string | null | undefined): url is string {
	if (!url || url === '/') return false;
	try {
		if (url.startsWith('/')) {
			return !url.startsWith('/login') && !url.startsWith('/logout');
		}
		const parsed = new URL(url);
		const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(parsed.hostname);
		const validHost = parsed.hostname.endsWith('xernerx.com') || parsed.hostname === 'localhost' || isIp;
		const isAuthPath = parsed.pathname.startsWith('/login') || parsed.pathname.startsWith('/logout');
		return validHost && !isAuthPath;
	} catch {
		return false;
	}
}

function SignInContent() {
	const { t } = useDictionary();
	const { data: session, status } = useSession();
	const { hide } = useSidebar();
	const searchParams = useSearchParams();
	const rawParam = searchParams.get('redirect') || searchParams.get('callbackUrl');
	const rawError = searchParams.get('error');
	const authError = rawError && rawError !== 'undefined' && rawError !== 'null' ? rawError : null;
	const [resolvedRedirect, setResolvedRedirect] = useState<string>(() => (isSafeRedirect(rawParam) ? rawParam : '/'));
	const [loading, setLoading] = useState(false);
	const [about, setAbout] = useState<boolean>(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (isSafeRedirect(rawParam)) {
			sessionStorage.setItem('xernerx_login_redirect', rawParam);
			sessionStorage.setItem('xernerx_login_redirect_ts', String(Date.now()));
			setResolvedRedirect(rawParam);
			return;
		}

		const saved = sessionStorage.getItem('xernerx_login_redirect');
		const savedTs = Number(sessionStorage.getItem('xernerx_login_redirect_ts') || '0');
		if (isSafeRedirect(saved) && Date.now() - savedTs < 10 * 60 * 1000) {
			setResolvedRedirect(saved);
			return;
		}

		if (document.referrer && isSafeRedirect(document.referrer)) {
			try {
				const refUrl = new URL(document.referrer);
				if (refUrl.origin !== window.location.origin) {
					sessionStorage.setItem('xernerx_login_redirect', document.referrer);
					sessionStorage.setItem('xernerx_login_redirect_ts', String(Date.now()));
					setResolvedRedirect(document.referrer);
				}
			} catch {
				// ignore
			}
		}
	}, [rawParam]);

	async function handleLogin() {
		setLoading(true);
		const target = isSafeRedirect(rawParam) ? rawParam : resolvedRedirect;
		if (typeof window !== 'undefined' && isSafeRedirect(target)) {
			sessionStorage.setItem('xernerx_login_redirect', target);
			sessionStorage.setItem('xernerx_login_redirect_ts', String(Date.now()));
		}
		await signIn('discord', {
			callbackUrl: target || '/',
		});
	}
	useEffect(() => {
		hide();
	}, [hide]);
	useEffect(() => {
		if (status === 'authenticated' && session && !(session as any)?.error) {
			let target = isSafeRedirect(rawParam) ? rawParam : resolvedRedirect;
			if (!isSafeRedirect(target) && typeof window !== 'undefined') {
				const saved = sessionStorage.getItem('xernerx_login_redirect');
				if (isSafeRedirect(saved)) target = saved;
			}
			if (typeof window !== 'undefined') {
				sessionStorage.removeItem('xernerx_login_redirect');
				sessionStorage.removeItem('xernerx_login_redirect_ts');
			}
			window.location.replace(target || '/');
		}
	}, [session, status, rawParam, resolvedRedirect]);
	return (
		<div className="flex h-full min-h-screen items-center justify-center px-6">
			<AnimatePresence>
				<motion.div
					initial={{
						opacity: 1,
						scale: 1,
						y: 0,
					}}
					animate={{
						opacity: 1,
						scale: 1,
						y: 0,
					}}
					transition={{
						duration: 0.28,
						ease: [0.22, 1, 0.36, 1],
					}}
					className="flex w-full flex-col items-center gap-6 text-center"
				>
					{/* LOGO */}
					<div className="m-4 flex flex-col items-center">
						<h1 className="sr-only">{t('account.login.title')}</h1>
						<Banner className="h-auto w-48 text-(--accent) md:w-56" />
					</div>

					{authError && (
						<div className="flex items-start gap-3 w-full max-w-md rounded-2xl border border-(--accent-orange)/30 bg-(--accent-orange)/10 backdrop-blur-md px-4 py-3 text-left">
							<AlertCircle size={18} className="text-(--accent-orange) shrink-0 mt-0.5" />
							<div className="flex flex-col gap-0.5">
								<span className="text-xs font-bold text-(--text)">{t('account.signin.authErrorTitle')}</span>
								<span className="text-[11px] text-(--text-muted) leading-relaxed">{t('account.signin.authErrorDesc', { error: authError })}</span>
							</div>
						</div>
					)}

					{/* LOGIN BUTTON */}
					<Button
						variant="primary"
						size="lg"
						onClick={handleLogin}
						isLoading={loading}
						className="w-full max-w-65 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_50%,transparent)] transition-all"
					>
						{loading ? t('account.signin.redirecting') : t('account.signin.button')}
					</Button>

					{/* QR + PAIRING LOGIN */}
					<div className="flex items-center gap-3 w-full max-w-md my-1">
						<div className="h-[1px] flex-1 bg-(--border)/10" />
						<span className="text-[10px] font-bold uppercase tracking-widest text-(--text-muted)">{t('account.signin.orDivider')}</span>
						<div className="h-[1px] flex-1 bg-(--border)/10" />
					</div>

					<QrLoginPanel callbackUrl={isSafeRedirect(rawParam) ? rawParam : resolvedRedirect} />

					{/* ABOUT TOGGLE */}
					<button
						type="button"
						onClick={() => setAbout(!about)}
						className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted) transition-colors hover:text-(--text)"
					>
						{t('account.signin.aboutToggle')}
						{about ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</button>

					{/* PERMISSIONS PANEL */}
					<AnimatePresence>
						{about && (
							<motion.div
								initial={{
									opacity: 0,
									height: 0,
									y: -10,
								}}
								animate={{
									opacity: 1,
									height: 'auto',
									y: 0,
								}}
								exit={{
									opacity: 0,
									height: 0,
									y: -10,
								}}
								transition={{
									duration: 0.25,
									ease: 'easeInOut',
								}}
								className="w-full max-w-md overflow-hidden"
							>
								<div className="mt-2 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-6 text-left shadow-xl">
									<div className="flex flex-col gap-4">
										<div className="flex flex-col gap-0.5">
											<h2 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.profile.title')}</h2>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.profile.description')}</p>
										</div>

										<div className="flex flex-col gap-0.5">
											<h2 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.email.title')}</h2>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.email.description')}</p>
										</div>

										<div className="flex flex-col gap-0.5">
											<h2 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.connections.title')}</h2>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.connections.description')}</p>
										</div>

										<div className="flex flex-col gap-0.5">
											<h2 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.joinServers.title')}</h2>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.joinServers.description')}</p>
										</div>

										<div className="flex flex-col gap-0.5">
											<h2 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.servers.title')}</h2>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.servers.description')}</p>
										</div>

										<div className="flex flex-col gap-0.5">
											<h2 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.memberInfo.title')}</h2>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.memberInfo.description')}</p>
										</div>

										{/* DIVIDER */}
										<div className="mt-2 border-t border-(--border)/10 pt-4 text-xs leading-relaxed text-(--text-muted)">{t('account.signin.permissions.footer')}</div>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}

export default function SignInPage() {
	const { t } = useDictionary();
	return (
		<Suspense fallback={<div className="flex h-screen items-center justify-center">{t('account.login.description')}</div>}>
			<SignInContent />
		</Suspense>
	);
}
