/** @format */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, RefreshCw, Smartphone } from 'lucide-react';
import { signIn, useDictionary, useEnvironment, useSession, useSidebar } from '@xernerx/providers';
import { Button } from '@xernerx/ui';

const ALLOWED_SCHEMES = ['xernerx://', 'exp://', 'exps://'];

function isSafeMobileRedirect(uri: string | null): uri is string {
	if (!uri) return false;
	const trimmed = uri.trim();
	return ALLOWED_SCHEMES.some((prefix) => trimmed.startsWith(prefix));
}

function appendCodeToUri(baseUri: string, code: string): string {
	const sep = baseUri.includes('?') ? '&' : '?';
	return `${baseUri}${sep}code=${encodeURIComponent(code)}`;
}

function buildPlatformDeepLink(rawDeepLink: string): string {
	if (typeof navigator === 'undefined') return rawDeepLink;
	const isAndroid = /Android/i.test(navigator.userAgent);
	if (!isAndroid) return rawDeepLink;

	const schemeMatch = rawDeepLink.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(.*)$/);
	if (!schemeMatch) return rawDeepLink;
	const scheme = schemeMatch[1].toLowerCase();
	const rest = schemeMatch[2];

	if (scheme === 'exp' || scheme === 'exps') {
		return `intent://${rest}#Intent;scheme=${scheme};package=host.exp.exponent;end`;
	}
	if (scheme === 'xernerx') {
		return `intent://${rest}#Intent;scheme=xernerx;package=com.xernerx.mobile;end`;
	}
	return rawDeepLink;
}

export function MobileOAuthHandoffView() {
	const { t } = useDictionary();
	const { data: session, status } = useSession();
	const { getEnvUrl, isReady } = useEnvironment();
	const { hide } = useSidebar();
	const searchParams = useSearchParams();

	const rawRedirectUri = searchParams.get('redirectUri');
	const handshakeId = searchParams.get('handshakeId') || '';
	const validRedirectUri = isSafeMobileRedirect(rawRedirectUri) ? rawRedirectUri.trim() : null;

	const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [minting, setMinting] = useState(false);
	const startedDiscordRef = useRef(false);
	const startedHandoffRef = useRef(false);

	const clickableHref = useMemo(() => (deepLinkUrl ? buildPlatformDeepLink(deepLinkUrl) : null), [deepLinkUrl]);

	useEffect(() => {
		hide();
	}, [hide]);

	// Step 1: If not signed in on browser, trigger standard NextAuth Discord OAuth (reuses existing registered redirect URI)
	useEffect(() => {
		if ((!validRedirectUri && !handshakeId) || status !== 'unauthenticated' || startedDiscordRef.current) return;
		startedDiscordRef.current = true;
		const callbackUrl = typeof window !== 'undefined' ? window.location.href : '/login/mobile';
		signIn('discord', { callbackUrl });
	}, [validRedirectUri, handshakeId, status]);

	// Step 2: Once authenticated, mint 1-time mobile exchange code, publish to handshakeId, and trigger deep-link return
	useEffect(() => {
		if ((!validRedirectUri && !handshakeId) || !isReady || status !== 'authenticated' || !session || startedHandoffRef.current) return;
		startedHandoffRef.current = true;
		setMinting(true);
		setErrorMsg(null);

		(async () => {
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/auth/mobile/handoff'), {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						handoffTicket: (session as any)?.qrHandoffToken,
						handshakeId: handshakeId || undefined,
					}),
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok || !data?.code) {
					throw new Error(data?.error || t('account.signin.mobileHandoffErrorTitle'));
				}
				const target = validRedirectUri ? appendCodeToUri(validRedirectUri, data.code) : null;
				setDeepLinkUrl(target || 'done');
				if (target && typeof window !== 'undefined') {
					window.location.href = buildPlatformDeepLink(target);
				}
			} catch (err: any) {
				setErrorMsg(err?.message || t('account.signin.mobileHandoffErrorTitle'));
				startedHandoffRef.current = false;
			} finally {
				setMinting(false);
			}
		})();
	}, [validRedirectUri, handshakeId, isReady, status, session, getEnvUrl, t]);

	const hasValidTarget = Boolean(validRedirectUri || handshakeId);

	return (
		<div className="flex min-h-screen w-full items-center justify-center" style={{ padding: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col items-center text-center w-full max-w-md rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-2xl"
				style={{ padding: 'calc(var(--ui-gap) * 1.5)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
					{errorMsg || !hasValidTarget ? (
						<AlertCircle size={28} className="text-(--accent-red)" />
					) : deepLinkUrl ? (
						<CheckCircle2 size={28} className="text-(--accent-green)" />
					) : (
						<Smartphone size={28} />
					)}
				</div>

				{!hasValidTarget ? (
					<div className="flex flex-col gap-1">
						<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('account.signin.mobileHandoffErrorTitle')}
						</h1>
						<p className="text-xs text-(--text-muted)">{t('account.signin.mobileHandoffInvalidRedirect')}</p>
					</div>
				) : errorMsg ? (
					<>
						<div className="flex flex-col gap-1">
							<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.signin.mobileHandoffErrorTitle')}
							</h1>
							<p className="text-xs text-(--text-muted)">{errorMsg}</p>
						</div>
						<Button
							variant="primary"
							onClick={() => {
								if (typeof window !== 'undefined') window.location.reload();
							}}
							className="w-full"
						>
							{t('account.signin.mobileApprovalRetry')}
						</Button>
					</>
				) : deepLinkUrl ? (
					<>
						<div className="flex flex-col gap-1">
							<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.signin.mobileHandoffReadyTitle')}
							</h1>
							<p className="text-xs text-(--text-muted)">{t('account.signin.mobileHandoffReadyDesc', { username: session?.user?.name || 'Discord' })}</p>
						</div>
						{clickableHref && deepLinkUrl !== 'done' && (
							<a
								href={clickableHref}
								className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-(--accent) hover:bg-(--hover-accent) text-(--accent-contrast) font-bold text-sm px-5 py-3 transition-colors"
							>
								<Smartphone size={16} />
								<span>{t('account.signin.mobileHandoffOpenAppButton')}</span>
							</a>
						)}
						<p className="text-[11px] text-(--text-muted)">{t('account.signin.mobileHandoffCloseHint')}</p>
					</>
				) : (
					<div className="flex flex-col items-center gap-3">
						<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('account.signin.mobileHandoffTitle')}
						</h1>
						<p className="text-xs text-(--text-muted)">{status === 'unauthenticated' ? t('account.signin.mobileHandoffSigningIn') : t('account.signin.mobileHandoffCompleting')}</p>
						<RefreshCw size={22} className={`text-(--accent) ${minting || status !== 'authenticated' ? 'animate-spin' : ''}`} />
					</div>
				)}
			</div>
		</div>
	);
}
