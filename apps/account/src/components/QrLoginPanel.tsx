/** @format */
'use client';

import { BellRing, Check, Copy, ExternalLink, QrCode, RefreshCw, ShieldAlert, Smartphone } from 'lucide-react';
import { signIn, useDictionary, useEnvironment, usePlatform, useToast } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input } from '@xernerx/ui';
import Link from 'next/link';
import { generateQrMatrix } from './qrMatrix';

const REMEMBERED_IDENTIFIER_KEY = 'xernerx_mobile_approval_identifier';

export function QrLoginPanel({ callbackUrl }: { callbackUrl: string }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { type } = usePlatform();
	const { toast } = useToast();

	const [mode, setMode] = useState<'qr' | 'push'>('qr');

	// QR mode state
	const [challenge, setChallenge] = useState<{
		token: string;
		pairCode: string;
		expiresAt: number;
	} | null>(null);
	const [status, setStatus] = useState<'loading' | 'ready' | 'expired' | 'approved' | 'denied'>('loading');
	const [copiedCode, setCopiedCode] = useState(false);
	const [enterCode, setEnterCode] = useState('');
	const [redeemingCode, setRedeemingCode] = useState(false);

	// Outlook / GitHub Mobile push approval state
	const [identifier, setIdentifier] = useState('');
	const [sendingApproval, setSendingApproval] = useState(false);
	const [approvalError, setApprovalError] = useState<string | null>(null);
	const [approvalRequest, setApprovalRequest] = useState<{
		requestId: string;
		verificationNumber: string;
		expiresAt: number;
		deviceCount: number;
	} | null>(null);
	const [approvalStatus, setApprovalStatus] = useState<'idle' | 'pending' | 'approved' | 'denied' | 'expired'>('idle');
	const [secondsLeft, setSecondsLeft] = useState(0);

	const isDesktopApp = type === 'application';

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const saved = localStorage.getItem(REMEMBERED_IDENTIFIER_KEY);
		if (saved) setIdentifier(saved);
	}, []);

	const createChallenge = useCallback(async () => {
		if (!isReady) return;
		setStatus('loading');
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/auth/qr'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'create',
					isDesktop: isDesktopApp,
				}),
			});
			if (!res.ok) throw new Error('Failed to create QR challenge');
			const data = await res.json();
			setChallenge(data);
			setStatus('ready');
		} catch {
			setStatus('expired');
		}
	}, [getEnvUrl, isDesktopApp, isReady]);

	useEffect(() => {
		if (mode === 'qr') {
			createChallenge();
		}
	}, [createChallenge, mode]);

	useEffect(() => {
		if (mode !== 'qr' || status !== 'ready' || !challenge?.token) return;

		const interval = setInterval(async () => {
			if (Date.now() > challenge.expiresAt) {
				setStatus('expired');
				clearInterval(interval);
				return;
			}
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/auth/qr?token=${encodeURIComponent(challenge.token)}&poll=true`), {
					cache: 'no-store',
				});
				if (res.status === 404 || res.status === 410) {
					setStatus('expired');
					clearInterval(interval);
					return;
				}
				if (!res.ok) return;
				const data = await res.json();
				if (data.status === 'denied') {
					setStatus('denied');
					clearInterval(interval);
					return;
				}
				if (data.status === 'approved' && data.handoffTicket) {
					setStatus('approved');
					clearInterval(interval);
					await signIn('qr-login', {
						ticket: data.handoffTicket,
						callbackUrl: callbackUrl || '/',
					});
				}
			} catch {}
		}, 2000);

		return () => clearInterval(interval);
	}, [mode, status, challenge, getEnvUrl, callbackUrl]);

	// Countdown + Polling for Outlook/GitHub-style mobile approval request
	useEffect(() => {
		if (mode !== 'push' || approvalStatus !== 'pending' || !approvalRequest?.requestId) return;

		const tick = () => {
			const remaining = Math.max(0, Math.ceil((approvalRequest.expiresAt - Date.now()) / 1000));
			setSecondsLeft(remaining);
			if (remaining <= 0) {
				setApprovalStatus('expired');
			}
		};
		tick();
		const countdownTimer = setInterval(tick, 1000);

		const pollTimer = setInterval(async () => {
			if (Date.now() > approvalRequest.expiresAt) {
				setApprovalStatus('expired');
				clearInterval(pollTimer);
				return;
			}
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/auth/approval?id=${encodeURIComponent(approvalRequest.requestId)}&poll=true`), {
					cache: 'no-store',
				});
				if (res.status === 404 || res.status === 410) {
					setApprovalStatus('expired');
					clearInterval(pollTimer);
					return;
				}
				if (!res.ok) return;
				const data = await res.json();
				if (data.status === 'denied') {
					setApprovalStatus('denied');
					clearInterval(pollTimer);
					return;
				}
				if (data.status === 'expired') {
					setApprovalStatus('expired');
					clearInterval(pollTimer);
					return;
				}
				if (data.status === 'approved' && data.handoffTicket) {
					setApprovalStatus('approved');
					clearInterval(pollTimer);
					await signIn('qr-login', {
						ticket: data.handoffTicket,
						callbackUrl: callbackUrl || '/',
					});
				}
			} catch {}
		}, 1800);

		return () => {
			clearInterval(countdownTimer);
			clearInterval(pollTimer);
		};
	}, [mode, approvalStatus, approvalRequest, getEnvUrl, callbackUrl]);

	const handleSendApprovalRequest = async () => {
		const trimmed = identifier.trim();
		if (!trimmed || !isReady) return;
		setSendingApproval(true);
		setApprovalError(null);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/auth/approval'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'request',
					identifier: trimmed,
					isDesktop: isDesktopApp,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setApprovalError(data.error || t('account.signin.approveInvalidCode'));
				return;
			}
			if (typeof window !== 'undefined') {
				localStorage.setItem(REMEMBERED_IDENTIFIER_KEY, trimmed);
			}
			setApprovalRequest({
				requestId: data.requestId,
				verificationNumber: data.verificationNumber,
				expiresAt: data.expiresAt,
				deviceCount: data.deviceCount || 1,
			});
			setApprovalStatus('pending');
		} catch {
			setApprovalError(t('account.user.networkError'));
		} finally {
			setSendingApproval(false);
		}
	};

	const approveUrl = useMemo(() => {
		if (!challenge?.pairCode) return '';
		const base = typeof window !== 'undefined' ? window.location.origin : getEnvUrl('https://account.xernerx.com');
		return `${base}/login/approve?code=${challenge.pairCode}`;
	}, [challenge, getEnvUrl]);

	const qrMatrix = useMemo(() => {
		if (!approveUrl) return null;
		return generateQrMatrix(approveUrl);
	}, [approveUrl]);

	const handleCopyPairCode = () => {
		if (!challenge?.pairCode) return;
		navigator.clipboard.writeText(challenge.pairCode);
		setCopiedCode(true);
		setTimeout(() => setCopiedCode(false), 2000);
	};

	const handleOpenBrowserApprove = async () => {
		if (!approveUrl) return;
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge?.openExternal) {
			await bridge.openExternal(approveUrl);
		} else {
			window.open(`${approveUrl}&external=true`, '_blank', 'noopener,noreferrer');
		}
	};

	const handleRedeemShareCode = async () => {
		const clean = enterCode
			.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, '');
		if (clean.length !== 6) {
			toast({ type: 'error', title: t('account.signin.approveInvalidCode') });
			return;
		}
		setRedeemingCode(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/auth/qr?code=${encodeURIComponent(clean)}&consume=true`), {
				cache: 'no-store',
			});
			if (!res.ok) {
				toast({ type: 'error', title: t('account.signin.approveInvalidCode') });
				return;
			}
			const data = await res.json();
			if (data.status === 'approved' && data.handoffTicket) {
				setStatus('approved');
				await signIn('qr-login', {
					ticket: data.handoffTicket,
					callbackUrl: callbackUrl || '/',
				});
			} else {
				toast({ type: 'error', title: t('account.signin.approveInvalidCode') });
			}
		} catch {
			toast({ type: 'error', title: t('account.signin.approveInvalidCode') });
		} finally {
			setRedeemingCode(false);
		}
	};

	return (
		<div
			className="flex flex-col items-center w-full max-w-lg rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xl"
			style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
		>
			{/* Mode Switcher: Scan QR | Approve on Mobile */}
			<div className="grid grid-cols-2 w-full rounded-2xl border border-(--border)/10 bg-(--background)/50 p-1 gap-1">
				<button
					type="button"
					onClick={() => setMode('qr')}
					className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
						mode === 'qr' ? 'bg-(--accent) text-(--accent-contrast) shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
					}`}
				>
					<QrCode size={14} />
					<span>{t('account.signin.qrTabLabel')}</span>
				</button>
				<button
					type="button"
					onClick={() => setMode('push')}
					className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
						mode === 'push' ? 'bg-(--accent) text-(--accent-contrast) shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
					}`}
				>
					<BellRing size={14} />
					<span>{t('account.signin.mobileApprovalTabLabel')}</span>
				</button>
			</div>

			{mode === 'qr' ? (
				<>
					<div className="flex items-center gap-2 text-(--accent)">
						<QrCode size={18} />
						<span className="text-sm font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('account.signin.qrTitle')}
						</span>
					</div>

					<p className="text-xs text-(--text-muted) text-center max-w-xs">{t('account.signin.qrDescription')}</p>

					{/* QR Box */}
					<div className="relative flex items-center justify-center rounded-2xl bg-white p-3.5 shadow-inner border border-(--border)/15">
						{qrMatrix ? (
							<svg
								viewBox={`-2 -2 ${qrMatrix.length + 4} ${qrMatrix.length + 4}`}
								className={`w-40 h-40 transition-opacity ${status !== 'ready' ? 'opacity-20 blur-[1px]' : 'opacity-100'}`}
								shapeRendering="crispEdges"
							>
								{qrMatrix.map((row, rIdx) => row.map((cell, cIdx) => (cell ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#09090b" /> : null)))}
							</svg>
						) : (
							<div className="w-36 h-36 flex items-center justify-center">
								<RefreshCw className="animate-spin text-(--accent)" size={24} />
							</div>
						)}

						{(status === 'expired' || status === 'denied') && (
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-(--background)/90 backdrop-blur-xs rounded-2xl p-3 text-center">
								{status === 'denied' && <ShieldAlert size={22} className="text-(--accent-red)" />}
								<span className="text-xs font-bold text-(--text)">{status === 'denied' ? t('account.signin.qrDenied') : t('account.signin.qrExpired')}</span>
								<Button size="sm" variant="primary" onClick={createChallenge} className="gap-1.5">
									<RefreshCw size={13} />
									{t('account.signin.qrRefresh')}
								</Button>
							</div>
						)}

						{status === 'approved' && (
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-(--background)/90 backdrop-blur-xs rounded-2xl p-3">
								<Check size={28} className="text-(--accent-green)" />
								<span className="text-xs font-bold text-(--text)">{t('account.signin.qrApprovedRedirecting')}</span>
							</div>
						)}
					</div>

					{/* 6-Character Pairing Code Pill */}
					{challenge?.pairCode && status === 'ready' && (
						<div className="flex flex-col items-center gap-1.5 w-full">
							<span className="text-[10px] font-bold uppercase tracking-widest text-(--text-muted)">{t('account.signin.pairCodeLabel')}</span>
							<button
								type="button"
								onClick={handleCopyPairCode}
								className="inline-flex items-center gap-2.5 rounded-2xl border border-(--border)/15 bg-(--background)/60 hover:bg-(--background) px-4 py-2 font-mono text-base font-extrabold tracking-[0.25em] text-(--accent) transition-colors cursor-pointer"
							>
								<span>
									{challenge.pairCode.slice(0, 3)}-{challenge.pairCode.slice(3)}
								</span>
								{copiedCode ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} className="text-(--text-muted)" />}
							</button>
						</div>
					)}

					{/* Quick Action for Desktop App: Open in Default Web Browser */}
					{isDesktopApp && status === 'ready' && (
						<Button variant="secondary" size="sm" onClick={handleOpenBrowserApprove} className="w-full gap-2">
							<ExternalLink size={14} />
							{t('account.signin.qrBrowserButton')}
						</Button>
					)}

					{/* Redeem a 6-Character Code generated in Account -> Devices */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full border-t border-(--border)/10 pt-3">
						<Input
							value={enterCode}
							onChange={(e) => setEnterCode(e.target.value.toUpperCase())}
							placeholder={t('account.signin.enterDeviceCodePlaceholder')}
							className="text-center font-mono text-xs tracking-wider uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
						/>
						<Button variant="secondary" size="sm" isLoading={redeemingCode} onClick={handleRedeemShareCode} className="shrink-0">
							{t('account.signin.signInWithCodeButton')}
						</Button>
					</div>

					<div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-(--text-muted)">
						<Smartphone size={13} className="text-(--accent)" />
						<span>{t('account.signin.haveCodePrompt')}</span>
						<Link href="/?tab=devices" className="font-bold text-(--accent) hover:underline">
							{t('account.signin.openApprovePage')}
						</Link>
					</div>
				</>
			) : (
				<div className="flex flex-col items-center w-full gap-4 py-1">
					<div className="flex items-center gap-2 text-(--accent)">
						<Smartphone size={18} />
						<span className="text-sm font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('account.signin.mobileApprovalTitle')}
						</span>
					</div>

					{approvalStatus === 'pending' && approvalRequest ? (
						<div className="flex flex-col items-center gap-4 w-full">
							<div className="flex flex-col items-center justify-center rounded-3xl border border-(--accent)/35 bg-(--accent)/10 px-8 py-5 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
								<span className="text-[10px] font-bold uppercase tracking-widest text-(--text-muted) mb-1">{t('account.signin.mobileApprovalNumberLabel')}</span>
								<span className="font-mono text-5xl font-black tracking-[0.18em] text-(--accent)">{approvalRequest.verificationNumber}</span>
							</div>

							<p className="text-xs text-(--text-muted) text-center max-w-xs leading-relaxed">
								{t('account.signin.mobileApprovalWaiting', { number: approvalRequest.verificationNumber })}
							</p>

							<div className="flex items-center gap-2 rounded-full bg-(--background)/60 border border-(--border)/10 px-3 py-1 text-[11px] font-mono text-(--text-muted)">
								<RefreshCw size={11} className="animate-spin text-(--accent)" />
								<span>{secondsLeft}s</span>
							</div>

							<Button
								variant="secondary"
								size="sm"
								onClick={() => {
									setApprovalRequest(null);
									setApprovalStatus('idle');
								}}
								className="w-full"
							>
								{t('account.signin.mobileApprovalCancel')}
							</Button>
						</div>
					) : approvalStatus === 'approved' ? (
						<div className="flex flex-col items-center gap-2 py-6">
							<Check size={32} className="text-(--accent-green)" />
							<span className="text-sm font-bold text-(--text)">{t('account.signin.qrApprovedRedirecting')}</span>
						</div>
					) : approvalStatus === 'denied' || approvalStatus === 'expired' ? (
						<div className="flex flex-col items-center gap-3 py-3 w-full">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--accent-red)/10 border border-(--accent-red)/25 text-(--accent-red)">
								<ShieldAlert size={22} />
							</div>
							<p className="text-xs font-semibold text-(--text) text-center max-w-xs">
								{approvalStatus === 'denied' ? t('account.signin.mobileApprovalDenied') : t('account.signin.mobileApprovalExpired')}
							</p>
							<Button
								variant="primary"
								size="sm"
								onClick={() => {
									setApprovalRequest(null);
									setApprovalStatus('idle');
								}}
								className="w-full"
							>
								{t('account.signin.mobileApprovalRetry')}
							</Button>
						</div>
					) : (
						<div className="flex flex-col items-center gap-3 w-full">
							<p className="text-xs text-(--text-muted) text-center max-w-xs leading-relaxed">{t('account.signin.mobileApprovalDescription')}</p>

							<div className="flex flex-col gap-2 w-full">
								<Input
									value={identifier}
									onChange={(e) => {
										setIdentifier(e.target.value);
										setApprovalError(null);
									}}
									onKeyDown={(e) => {
										if (e.nativeEvent.isComposing || e.keyCode === 229) return;
										if (e.key === 'Enter' && identifier.trim()) {
											handleSendApprovalRequest();
										}
									}}
									placeholder={t('account.signin.mobileApprovalIdentifierPlaceholder')}
								/>
								{approvalError && <p className="text-xs font-medium text-(--accent-red) text-center">{approvalError}</p>}
								<Button variant="primary" size="sm" isLoading={sendingApproval} disabled={!identifier.trim()} onClick={handleSendApprovalRequest} className="w-full gap-2">
									<BellRing size={14} />
									{t('account.signin.mobileApprovalSendButton')}
								</Button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
