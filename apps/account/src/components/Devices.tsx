/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useSession, useToast, useUser } from '@xernerx/providers';
import { Button, Confirm } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { Computer, Smartphone, ShieldCheck, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { DevicePairingCard } from './DevicePairingCard';

interface DeviceSession {
	id: string;
	browser: string;
	os: string;
	deviceType: 'desktop' | 'mobile';
	lastActive: string;
}

function detectCurrentDevice(): DeviceSession {
	const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
	let browser = 'Browser';
	if (ua.includes('Edg/')) browser = 'Microsoft Edge';
	else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
	else if (ua.includes('Chrome/')) browser = 'Google Chrome';
	else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
	else if (ua.includes('Safari/')) browser = 'Apple Safari';

	let os = 'Unknown OS';
	if (ua.includes('Windows')) os = 'Windows';
	else if (ua.includes('Mac OS')) os = 'macOS';
	else if (ua.includes('Android')) os = 'Android';
	else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
	else if (ua.includes('Linux')) os = 'Linux';

	const isMobile = /Android|iPhone|iPad|Mobile/i.test(ua);
	const id = `${os}-${browser}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

	return {
		id,
		browser,
		os,
		deviceType: isMobile ? 'mobile' : 'desktop',
		lastActive: new Date().toISOString(),
	};
}

export default function Devices() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { data: session } = useSession();
	const { user: discordUser } = useUser();
	const { toast } = useToast();

	const activeUser = discordUser || session?.user;
	const userId = (activeUser as any)?.id;

	const [devices, setDevices] = useState<DeviceSession[]>([]);
	const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [revoking, setRevoking] = useState(false);
	const [confirmRevokeOthers, setConfirmRevokeOthers] = useState(false);
	const [revokeTarget, setRevokeTarget] = useState<DeviceSession | null>(null);

	useEffect(() => {
		if (!isReady || !userId) {
			setLoading(false);
			return;
		}
		const current = detectCurrentDevice();
		setCurrentDeviceId(current.id);

		fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : null))
			.then(async (data) => {
				const existing: DeviceSession[] = Array.isArray(data?.devices) ? data.devices : [];
				const merged = [current, ...existing.filter((d) => d.id !== current.id)].slice(0, 10);
				setDevices(merged);

				await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ devices: merged }),
				}).catch(() => {});
			})
			.catch(() => {
				setDevices([current]);
			})
			.finally(() => setLoading(false));
	}, [isReady, userId, getEnvUrl]);

	const handleRevokeOthers = async () => {
		if (!userId) return;
		setRevoking(true);
		try {
			const onlyCurrent = devices.filter((d) => d.id === currentDeviceId);
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ devices: onlyCurrent }),
			});
			if (res.ok) {
				setDevices(onlyCurrent);
				toast({ type: 'success', title: t('account.devices.revokeSuccess') });
			}
		} catch (err: any) {
			toast({ type: 'error', title: err.message });
		} finally {
			setRevoking(false);
			setConfirmRevokeOthers(false);
		}
	};

	const handleRevokeSingle = async () => {
		if (!userId || !revokeTarget) return;
		setRevoking(true);
		try {
			const remaining = devices.filter((d) => d.id !== revokeTarget.id);
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ devices: remaining }),
			});
			if (res.ok) {
				setDevices(remaining);
				toast({ type: 'success', title: t('account.devices.revokeSingleSuccess') });
			}
		} catch (err: any) {
			toast({ type: 'error', title: err.message });
		} finally {
			setRevoking(false);
			setRevokeTarget(null);
		}
	};

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col max-w-5xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/10 pb-6" style={{ gap: 'var(--ui-gap)' }}>
				<div>
					<h1 className="text-3xl font-bold text-(--text) flex items-center gap-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<Computer className="text-(--accent)" size={28} />
						{t('account.devices.title')}
					</h1>
					<p className="text-sm text-(--text-muted) mt-1">{t('account.devices.description')}</p>
				</div>

				{devices.length > 1 && (
					<Button variant="danger" onClick={() => setConfirmRevokeOthers(true)} disabled={revoking} className="flex items-center gap-2">
						<Trash2 size={15} />
						{t('account.devices.revokeOthers')}
					</Button>
				)}
			</div>

			<DevicePairingCard />

			<div className="flex flex-col gap-3">
				{devices.map((device) => {
					const isCurrent = device.id === currentDeviceId;
					return (
						<div
							key={device.id}
							className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md"
						>
							<div className="flex items-center gap-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--background)/70 border border-(--border)/10 text-(--accent) shrink-0">
									{device.deviceType === 'mobile' ? <Smartphone size={22} /> : <Computer size={22} />}
								</div>
								<div>
									<div className="flex items-center gap-2">
										<h2 className="font-bold text-base text-(--text)">
											{device.browser} • {device.os}
										</h2>
										{isCurrent && (
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/25">
												<CheckCircle2 size={12} />
												{t('account.devices.currentSession')}
											</span>
										)}
									</div>
									<p className="text-xs text-(--text-muted) flex items-center gap-1.5 mt-1 font-mono">
										<Clock size={12} />
										{new Date(device.lastActive).toLocaleString()}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3 text-xs text-(--text-muted)">
								<div className="flex items-center gap-1.5">
									<ShieldCheck size={15} className="text-(--accent-green)" />
									<span>{t('account.devices.oauthVerified')}</span>
								</div>
								{!isCurrent && (
									<Button variant="danger" size="sm" onClick={() => setRevokeTarget(device)} disabled={revoking} className="flex items-center gap-1.5">
										<Trash2 size={13} />
										{t('account.devices.revokeDevice')}
									</Button>
								)}
							</div>
						</div>
					);
				})}
			</div>

			<Confirm
				open={confirmRevokeOthers}
				onOpenChange={setConfirmRevokeOthers}
				title={t('account.devices.revokeOthersConfirmTitle')}
				description={t('account.devices.revokeOthersConfirmDesc')}
				confirmText={t('account.devices.revokeOthers')}
				cancelText={t('common.buttons.cancel')}
				variant="danger"
				loading={revoking}
				onConfirm={handleRevokeOthers}
			/>

			<Confirm
				open={Boolean(revokeTarget)}
				onOpenChange={(open) => !open && setRevokeTarget(null)}
				title={t('account.devices.revokeConfirmTitle')}
				description={t('account.devices.revokeConfirmDesc', { device: revokeTarget ? `${revokeTarget.browser} • ${revokeTarget.os}` : '' })}
				confirmText={t('account.devices.revokeDevice')}
				cancelText={t('common.buttons.cancel')}
				variant="danger"
				loading={revoking}
				onConfirm={handleRevokeSingle}
			/>
		</div>
	);
}
