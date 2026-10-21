/** @format */
'use client';

import { Check, Copy, ExternalLink, QrCode, RefreshCw, Smartphone } from 'lucide-react';
import { signIn, useDictionary, useEnvironment, usePlatform, useToast } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input } from '@xernerx/ui';
import Link from 'next/link';
import { generateQrMatrix } from './qrMatrix';

export function QrLoginPanel({ callbackUrl }: { callbackUrl: string }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { type } = usePlatform();
	const { toast } = useToast();

	const [challenge, setChallenge] = useState<{
		token: string;
		pairCode: string;
		expiresAt: number;
	} | null>(null);
	const [status, setStatus] = useState<'loading' | 'ready' | 'expired' | 'approved'>('loading');
	const [copiedCode, setCopiedCode] = useState(false);
	const [enterCode, setEnterCode] = useState('');
	const [redeemingCode, setRedeemingCode] = useState(false);

	const isDesktopApp = type === 'application';

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
		createChallenge();
	}, [createChallenge]);

	useEffect(() => {
		if (status !== 'ready' || !challenge?.token) return;

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
	}, [status, challenge, getEnvUrl, callbackUrl]);

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
			className="flex flex-col items-center w-full max-w-md rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xl"
			style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
		>
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

				{status === 'expired' && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-(--background)/85 backdrop-blur-xs rounded-2xl p-3">
						<span className="text-xs font-bold text-(--text)">{t('account.signin.qrExpired')}</span>
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
			<div className="flex items-center gap-2 w-full border-t border-(--border)/10 pt-3">
				<Input
					value={enterCode}
					onChange={(e) => setEnterCode(e.target.value.toUpperCase())}
					placeholder={t('account.signin.enterDeviceCodePlaceholder')}
					className="text-center font-mono text-xs tracking-wider uppercase"
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
		</div>
	);
}
