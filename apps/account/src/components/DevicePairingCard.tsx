/** @format */
'use client';

import { Check, Copy, Laptop, QrCode, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { Button, Input } from '@xernerx/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDictionary, useEnvironment, useSession, useToast } from '@xernerx/providers';
import { generateQrMatrix } from './qrMatrix';

export function DevicePairingCard() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { data: session } = useSession();
	const { toast } = useToast();

	// 1. Outgoing Share Code (generated from active session in Account -> Devices)
	const [shareChallenge, setShareChallenge] = useState<{
		token: string;
		pairCode: string;
		expiresAt: number;
	} | null>(null);
	const [shareStatus, setShareStatus] = useState<'loading' | 'ready' | 'expired' | 'linked'>('loading');
	const [copiedShareCode, setCopiedShareCode] = useState(false);

	// 2. Incoming Request Approval (for devices waiting on /login)
	const [pendingDevices, setPendingDevices] = useState<Array<{ token: string; pairCode: string; deviceInfo: string }>>([]);
	const [codeInput, setCodeInput] = useState('');
	const [selectedDevice, setSelectedDevice] = useState<{ token: string; pairCode: string; deviceInfo: string } | null>(null);
	const [lookupLoading, setLookupLoading] = useState(false);
	const [approving, setApproving] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const createShareChallenge = useCallback(async () => {
		if (!isReady || !session) return;
		setShareStatus('loading');
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/auth/qr'), {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'create',
					mode: 'share',
					handoffTicket: (session as any)?.qrHandoffToken,
					username: session?.user?.name || 'user',
				}),
			});
			if (!res.ok) throw new Error('Failed');
			const data = await res.json();
			setShareChallenge(data);
			setShareStatus('ready');
		} catch {
			setShareStatus('expired');
		}
	}, [getEnvUrl, isReady, session]);

	useEffect(() => {
		createShareChallenge();
	}, [createShareChallenge]);

	// Poll share challenge status & pending devices
	useEffect(() => {
		if (!isReady) return;
		const interval = setInterval(async () => {
			if (shareStatus === 'ready' && shareChallenge?.token) {
				if (Date.now() > shareChallenge.expiresAt) {
					setShareStatus('expired');
				} else {
					try {
						const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/auth/qr?token=${encodeURIComponent(shareChallenge.token)}`), {
							cache: 'no-store',
						});
						if (res.status === 404) {
							setShareStatus('linked');
							toast({ type: 'success', title: t('account.devices.deviceLinked') });
						}
					} catch {}
				}
			}

			try {
				const listRes = await fetch(getEnvUrl('https://api.xernerx.com/secure/auth/qr?list=true'), { cache: 'no-store' });
				if (listRes.ok) {
					const listData = await listRes.json();
					if (Array.isArray(listData.pending)) {
						setPendingDevices(listData.pending);
					}
				}
			} catch {}
		}, 2500);

		return () => clearInterval(interval);
	}, [isReady, shareStatus, shareChallenge, getEnvUrl, toast, t]);

	const shareQrUrl = useMemo(() => {
		if (!shareChallenge?.pairCode) return '';
		const base = typeof window !== 'undefined' ? window.location.origin : getEnvUrl('https://account.xernerx.com');
		return `${base}/login/qr?code=${shareChallenge.pairCode}`;
	}, [shareChallenge, getEnvUrl]);

	const qrMatrix = useMemo(() => {
		if (!shareQrUrl) return null;
		return generateQrMatrix(shareQrUrl);
	}, [shareQrUrl]);

	const handleCopyShareCode = () => {
		if (!shareChallenge?.pairCode) return;
		navigator.clipboard.writeText(shareChallenge.pairCode);
		setCopiedShareCode(true);
		toast({ type: 'success', title: t('account.devices.codeCopied') });
		setTimeout(() => setCopiedShareCode(false), 2000);
	};

	const handleLookupCode = async () => {
		const cleanCode = codeInput
			.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, '');
		if (cleanCode.length !== 6) {
			setErrorMsg(t('account.signin.approveInvalidCode'));
			return;
		}
		setLookupLoading(true);
		setErrorMsg(null);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/auth/qr?code=${encodeURIComponent(cleanCode)}`), {
				cache: 'no-store',
			});
			if (!res.ok) {
				setErrorMsg(t('account.signin.approveInvalidCode'));
				return;
			}
			const data = await res.json();
			if (data.status === 'pending') {
				setSelectedDevice({
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
	};

	const handleApproveDevice = async () => {
		if (!selectedDevice) return;
		setApproving(true);
		setErrorMsg(null);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/auth/qr'), {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'approve',
					token: selectedDevice.token,
					code: selectedDevice.pairCode,
					handoffTicket: (session as any)?.qrHandoffToken,
					username: session?.user?.name || 'user',
				}),
			});
			if (!res.ok) throw new Error(t('account.signin.approveInvalidCode'));
			toast({ type: 'success', title: t('account.signin.approveSuccessTitle') });
			setSelectedDevice(null);
			setCodeInput('');
		} catch (err: any) {
			setErrorMsg(err.message || t('account.signin.approveInvalidCode'));
		} finally {
			setApproving(false);
		}
	};

	return (
		<div
			className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden"
			style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
		>
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h2 className="text-xl font-bold text-(--text) flex items-center gap-2.5" style={{ fontFamily: 'var(--font-fredoka)' }}>
					<QrCode className="text-(--accent)" size={22} />
					{t('account.devices.pairTitle')}
				</h2>
				<p className="text-xs text-(--text-muted)">{t('account.devices.pairDescription')}</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
				{/* Left Column: Instant Sign-In QR + 6-Character Code */}
				<div
					className="flex flex-col items-center justify-between rounded-2xl border border-(--border)/10 bg-(--background)/50 text-center"
					style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
				>
					<div className="flex flex-col gap-1">
						<h3 className="text-sm font-bold text-(--text)">{t('account.devices.shareQrTitle')}</h3>
						<p className="text-xs text-(--text-muted)">{t('account.devices.shareQrDesc')}</p>
					</div>

					<div className="relative flex items-center justify-center rounded-2xl bg-white p-3 shadow-inner border border-(--border)/15">
						{qrMatrix ? (
							<svg
								viewBox={`-2 -2 ${qrMatrix.length + 4} ${qrMatrix.length + 4}`}
								className={`w-36 h-36 transition-opacity ${shareStatus !== 'ready' ? 'opacity-20 blur-[1px]' : 'opacity-100'}`}
								shapeRendering="crispEdges"
							>
								{qrMatrix.map((row, rIdx) => row.map((cell, cIdx) => (cell ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#09090b" /> : null)))}
							</svg>
						) : (
							<div className="w-36 h-36 flex items-center justify-center">
								<RefreshCw className="animate-spin text-(--accent)" size={22} />
							</div>
						)}

						{(shareStatus === 'expired' || shareStatus === 'linked') && (
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-(--background)/90 backdrop-blur-xs rounded-2xl p-3">
								<span className="text-xs font-bold text-(--text)">{shareStatus === 'linked' ? t('account.devices.deviceLinked') : t('account.signin.qrExpired')}</span>
								<Button size="sm" variant="primary" onClick={createShareChallenge} className="gap-1.5">
									<RefreshCw size={13} />
									{t('account.devices.generateNewCode')}
								</Button>
							</div>
						)}
					</div>

					{shareChallenge?.pairCode && (
						<div className="flex flex-col items-center gap-1 w-full">
							<span className="text-[10px] font-bold uppercase tracking-widest text-(--text-muted)">{t('account.signin.pairCodeLabel')}</span>
							<button
								type="button"
								onClick={handleCopyShareCode}
								className="inline-flex items-center gap-2.5 rounded-2xl border border-(--border)/15 bg-(--foreground)/60 hover:bg-(--foreground) px-4 py-2 font-mono text-lg font-extrabold tracking-[0.25em] text-(--accent) transition-colors cursor-pointer"
							>
								<span>
									{shareChallenge.pairCode.slice(0, 3)}-{shareChallenge.pairCode.slice(3)}
								</span>
								{copiedShareCode ? <Check size={15} className="text-(--accent-green)" /> : <Copy size={15} className="text-(--text-muted)" />}
							</button>
						</div>
					)}
				</div>

				{/* Right Column: Approve Waiting Device or Enter Code from /login */}
				<div className="flex flex-col justify-between rounded-2xl border border-(--border)/10 bg-(--background)/50" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<div className="flex flex-col gap-1">
						<h3 className="text-sm font-bold text-(--text)">{t('account.signin.approveTitle')}</h3>
						<p className="text-xs text-(--text-muted)">{t('account.signin.approveSubtitle')}</p>
					</div>

					{selectedDevice ? (
						<div className="flex flex-col gap-3">
							<div className="flex flex-col rounded-2xl border border-(--accent)/30 bg-(--accent)/10 p-3.5 gap-2">
								<div className="flex items-center justify-between text-xs">
									<span className="text-(--text-muted)">{t('account.signin.approveDeviceLabel')}</span>
									<span className="inline-flex items-center gap-1.5 font-bold text-(--text)">
										<Laptop size={14} className="text-(--accent)" />
										{selectedDevice.deviceInfo}
									</span>
								</div>
								<div className="flex items-center justify-between text-xs border-t border-(--border)/10 pt-2">
									<span className="text-(--text-muted)">{t('account.signin.approveCodeMatch')}</span>
									<span className="font-mono font-extrabold tracking-widest text-(--accent)">
										{selectedDevice.pairCode.slice(0, 3)}-{selectedDevice.pairCode.slice(3)}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Button variant="secondary" size="sm" onClick={() => setSelectedDevice(null)} className="flex-1">
									{t('account.signin.approveCancelButton')}
								</Button>
								<Button variant="primary" size="sm" onClick={handleApproveDevice} isLoading={approving} className="flex-1 gap-1.5">
									<ShieldCheck size={15} />
									{t('account.signin.approveButton')}
								</Button>
							</div>
						</div>
					) : (
						<div className="flex flex-col gap-3">
							{pendingDevices.length > 0 && (
								<div className="flex flex-col rounded-2xl border border-(--accent)/30 bg-(--accent)/10 p-3 gap-2">
									<span className="text-[10px] font-bold uppercase tracking-wider text-(--accent)">{t('account.signin.approvePendingDevicesTitle')}</span>
									{pendingDevices.map((dev) => (
										<button
											key={dev.token}
											type="button"
											onClick={() => setSelectedDevice(dev)}
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

							<div className="flex flex-col gap-2">
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
								<Button variant="primary" size="sm" isLoading={lookupLoading} onClick={handleLookupCode} className="w-full">
									{t('account.signin.approveLookupButton')}
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
