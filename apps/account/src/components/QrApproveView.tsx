/** @format */
'use client';

import { CheckCircle2, Laptop, QrCode, ShieldCheck, XCircle } from 'lucide-react';
import { Button, Input } from '@xernerx/ui';
import { signIn, useDictionary, useEnvironment, useSession, useSidebar, useToast } from '@xernerx/providers';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function QrApproveView() {
	const { t } = useDictionary();
	const { data: session, status } = useSession();
	const { getEnvUrl, isReady } = useEnvironment();
	const { hide } = useSidebar();
	const { toast } = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();

	const urlCode = searchParams.get('code') || '';
	const urlToken = searchParams.get('token') || '';

	const [codeInput, setCodeInput] = useState(urlCode.toUpperCase());
	const [challengeInfo, setChallengeInfo] = useState<{
		token: string;
		pairCode: string;
		deviceInfo: string;
	} | null>(null);
	const [lookupLoading, setLookupLoading] = useState(false);
	const [approving, setApproving] = useState(false);
	const [approvedSuccess, setApprovedSuccess] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [pendingDevices, setPendingDevices] = useState<Array<{ token: string; pairCode: string; deviceInfo: string }>>([]);

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		if (!isReady || challengeInfo || approvedSuccess) return;
		const fetchPending = async () => {
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/auth/qr?list=true'), { cache: 'no-store' });
				if (!res.ok) return;
				const data = await res.json();
				if (Array.isArray(data.pending)) {
					setPendingDevices(data.pending);
				}
			} catch {}
		};
		fetchPending();
		const timer = setInterval(fetchPending, 2500);
		return () => clearInterval(timer);
	}, [isReady, challengeInfo, approvedSuccess, getEnvUrl]);

	const lookupChallenge = useCallback(
		async (opts: { token?: string; code?: string }) => {
			if (!isReady) return;
			const cleanCode = opts.code
				?.trim()
				.toUpperCase()
				.replace(/[^A-Z0-9]/g, '');
			if (!opts.token && (!cleanCode || cleanCode.length !== 6)) return;

			setLookupLoading(true);
			setErrorMsg(null);
			try {
				const qs = opts.token ? `token=${encodeURIComponent(opts.token)}` : `code=${encodeURIComponent(cleanCode || '')}`;
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/auth/qr?${qs}&consume=true`), {
					cache: 'no-store',
				});
				if (!res.ok) {
					setChallengeInfo(null);
					setErrorMsg(t('account.signin.approveInvalidCode'));
					return;
				}
				const data = await res.json();
				if (data.status === 'approved' && data.handoffTicket) {
					await signIn('qr-login', {
						ticket: data.handoffTicket,
						callbackUrl: '/',
					});
					return;
				}
				if (data.status === 'pending') {
					setChallengeInfo({
						token: data.token,
						pairCode: data.pairCode,
						deviceInfo: data.deviceInfo,
					});
				} else {
					setErrorMsg(t('account.signin.approveInvalidCode'));
				}
			} catch {
				setErrorMsg(t('account.signin.approveInvalidCode'));
			} finally {
				setLookupLoading(false);
			}
		},
		[getEnvUrl, isReady, t]
	);

	useEffect(() => {
		if (!isReady) return;
		if (urlToken) {
			lookupChallenge({ token: urlToken });
		} else if (urlCode && urlCode.replace(/[^A-Za-z0-9]/g, '').length === 6) {
			lookupChallenge({ code: urlCode });
		}
	}, [isReady, urlToken, urlCode, lookupChallenge]);

	const handleApprove = async () => {
		const handoffTicket = (session as any)?.qrHandoffToken;
		if (status !== 'authenticated' || !challengeInfo) {
			toast({ type: 'error', title: t('account.signin.approveNotSignedIn') });
			return;
		}
		setApproving(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/auth/qr'), {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'approve',
					token: challengeInfo.token,
					code: challengeInfo.pairCode,
					handoffTicket,
					username: session?.user?.name || 'user',
				}),
			});
			if (!res.ok) {
				throw new Error(t('account.signin.approveInvalidCode'));
			}
			setApprovedSuccess(true);
		} catch (err: any) {
			setErrorMsg(err.message || t('account.signin.approveInvalidCode'));
		} finally {
			setApproving(false);
		}
	};

	const handleDiscordLoginFirst = async () => {
		const currentUrl = typeof window !== 'undefined' ? window.location.href : '/login/approve';
		await signIn('discord', { callbackUrl: currentUrl });
	};

	return (
		<div className="flex min-h-screen w-full items-center justify-center" style={{ padding: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col items-center text-center w-full max-w-md rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-2xl"
				style={{ padding: 'calc(var(--ui-gap) * 1.5)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
					{approvedSuccess ? <CheckCircle2 size={28} className="text-(--accent-green)" /> : <QrCode size={28} />}
				</div>

				{approvedSuccess ? (
					<>
						<div className="flex flex-col gap-1">
							<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.signin.approveSuccessTitle')}
							</h1>
							<p className="text-xs text-(--text-muted)">{t('account.signin.approveSuccessDesc')}</p>
						</div>
						<Button variant="primary" onClick={() => router.push('/')} className="w-full">
							{t('common.toastprovider.closeModal')}
						</Button>
					</>
				) : status !== 'authenticated' ? (
					<>
						<div className="flex flex-col gap-1">
							<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.signin.approveTitle')}
							</h1>
							<p className="text-xs text-(--text-muted)">{t('account.signin.approveNotSignedIn')}</p>
						</div>
						<Button variant="primary" onClick={handleDiscordLoginFirst} className="w-full">
							{t('account.signin.button')}
						</Button>
					</>
				) : challengeInfo ? (
					<>
						<div className="flex flex-col gap-1">
							<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.signin.approveConfirmTitle')}
							</h1>
							<p className="text-xs text-(--text-muted)">{t('account.signin.approveConfirmDesc', { username: session?.user?.name || 'Discord' })}</p>
						</div>

						<div className="flex flex-col w-full rounded-2xl border border-(--border)/10 bg-(--background)/60 p-4 gap-3 text-left">
							<div className="flex items-center justify-between">
								<span className="text-xs text-(--text-muted)">{t('account.signin.approveDeviceLabel')}</span>
								<span className="inline-flex items-center gap-1.5 text-xs font-bold text-(--text)">
									<Laptop size={14} className="text-(--accent)" />
									{challengeInfo.deviceInfo}
								</span>
							</div>
							<div className="flex items-center justify-between border-t border-(--border)/10 pt-2.5">
								<span className="text-xs text-(--text-muted)">{t('account.signin.approveCodeMatch')}</span>
								<span className="font-mono text-sm font-extrabold tracking-widest text-(--accent)">
									{challengeInfo.pairCode.slice(0, 3)}-{challengeInfo.pairCode.slice(3)}
								</span>
							</div>
						</div>

						{errorMsg && (
							<div className="flex items-center gap-2 text-xs font-medium text-(--accent-red)">
								<XCircle size={14} />
								<span>{errorMsg}</span>
							</div>
						)}

						<div className="flex items-center gap-3 w-full">
							<Button variant="secondary" onClick={() => setChallengeInfo(null)} className="flex-1">
								{t('account.signin.approveCancelButton')}
							</Button>
							<Button variant="primary" onClick={handleApprove} isLoading={approving} className="flex-1 gap-1.5">
								<ShieldCheck size={16} />
								{t('account.signin.approveButton')}
							</Button>
						</div>
					</>
				) : (
					<>
						<div className="flex flex-col gap-1">
							<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.signin.approveTitle')}
							</h1>
							<p className="text-xs text-(--text-muted)">{t('account.signin.approveSubtitle')}</p>
						</div>

						{pendingDevices.length > 0 && (
							<div className="flex flex-col w-full rounded-2xl border border-(--accent)/30 bg-(--accent)/10 p-3 gap-2 text-left">
								<span className="text-[11px] font-bold uppercase tracking-wider text-(--accent)">{t('account.signin.approvePendingDevicesTitle')}</span>
								{pendingDevices.map((dev) => (
									<button
										key={dev.token}
										type="button"
										onClick={() => setChallengeInfo(dev)}
										className="flex items-center justify-between rounded-xl bg-(--background)/80 hover:bg-(--background) border border-(--border)/10 px-3 py-2 text-xs transition-all cursor-pointer"
									>
										<span className="inline-flex items-center gap-2 font-bold text-(--text)">
											<Laptop size={14} className="text-(--accent)" />
											{dev.deviceInfo}
										</span>
										<span className="font-mono font-extrabold tracking-widest text-(--accent)">
											{dev.pairCode.slice(0, 3)}-{dev.pairCode.slice(3)}
										</span>
									</button>
								))}
							</div>
						)}

						<div className="flex flex-col w-full gap-3">
							<Input
								value={codeInput}
								onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
								placeholder={t('account.signin.approveCodePlaceholder')}
								className="text-center font-mono tracking-widest uppercase"
							/>
							{errorMsg && (
								<div className="flex items-center justify-center gap-1.5 text-xs font-medium text-(--accent-red)">
									<XCircle size={14} />
									<span>{errorMsg}</span>
								</div>
							)}
							<Button variant="primary" isLoading={lookupLoading} onClick={() => lookupChallenge({ code: codeInput })} className="w-full">
								{t('account.signin.approveLookupButton')}
							</Button>
						</div>

						<div className="flex flex-col w-full rounded-2xl border border-(--border)/10 bg-(--background)/50 p-3.5 gap-1.5 text-left text-xs text-(--text-muted)">
							<span className="font-bold text-(--text)">{t('account.signin.approveWhereToFindTitle')}</span>
							<p>{t('account.signin.approveWhereStep1')}</p>
							<p>{t('account.signin.approveWhereStep2')}</p>
							<p>{t('account.signin.approveWhereStep3')}</p>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
