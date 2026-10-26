/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useSession, useToast } from '@xernerx/providers';
import { Button, Modal } from '@xernerx/ui';
import { Coins, Flame, Rocket, Sparkles } from 'lucide-react';

export interface SpotlightBoostModalProps {
	isOpen: boolean;
	onClose: () => void;
	targetType: 'bot' | 'server';
	targetId: string;
	targetName: string;
	currentBoostedUntil?: string | null;
	onBoostSuccess?: (boostedUntil: string) => void;
}

export function SpotlightBoostModal({ isOpen, onClose, targetType, targetId, targetName, currentBoostedUntil, onBoostSuccess }: SpotlightBoostModalProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { data: session } = useSession();

	const [duration, setDuration] = useState<'24h' | '7d'>('24h');
	const [balance, setBalance] = useState<number | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const userId = (session as any)?.user?.id;
	const cost = duration === '7d' ? 5000 : 1000;

	useEffect(() => {
		if (!isOpen || !userId) return;
		fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}/credits/history`), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data && typeof data.balance === 'number') {
					setBalance(data.balance);
				}
			})
			.catch(() => null);
	}, [isOpen, userId, getEnvUrl]);

	const handleBoost = async () => {
		if (!userId) {
			toast({ type: 'error', title: t('app.boost.signInRequired') });
			return;
		}
		setSubmitting(true);
		try {
			const endpoint = targetType === 'bot' ? `https://api.xernerx.com/secure/bots/${targetId}/boost` : `https://api.xernerx.com/secure/guilds/${targetId}/boost`;
			const res = await fetch(getEnvUrl(endpoint), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ duration }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toast({ type: 'error', title: t('app.boost.failedTitle'), description: data.error || t('common.toast.saveFailed') });
				return;
			}
			if (typeof data.balance === 'number') setBalance(data.balance);
			toast({
				type: 'success',
				title: t('app.boost.successTitle'),
				description: t('app.boost.successDesc', { name: targetName }),
			});
			onBoostSuccess?.(data.boostedUntil);
			onClose();
		} catch (err: any) {
			toast({ type: 'error', title: t('app.boost.failedTitle'), description: err.message });
		} finally {
			setSubmitting(false);
		}
	};

	const isCurrentlyBoosted = Boolean(currentBoostedUntil && new Date(currentBoostedUntil).getTime() > Date.now());

	return (
		<Modal
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			title={t('app.boost.modalTitle', { name: targetName })}
		>
			<div className="space-y-5">
				<div className="p-4 rounded-2xl bg-(--accent)/10 border border-(--accent)/25 flex items-start gap-3">
					<div className="w-10 h-10 rounded-2xl bg-(--accent)/20 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
						<Rocket size={20} />
					</div>
					<div className="text-sm">
						<p className="font-bold text-(--text)">{t('app.boost.subtitle')}</p>
						<p className="text-xs text-(--text-muted) mt-0.5">{t('app.boost.description')}</p>
						{isCurrentlyBoosted && currentBoostedUntil && (
							<p className="text-xs font-bold text-(--accent) mt-2 flex items-center gap-1.5">
								<Sparkles size={12} />
								{t('app.boost.activeUntil', { date: new Date(currentBoostedUntil).toLocaleString() })}
							</p>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<button
						type="button"
						onClick={() => setDuration('24h')}
						className={`p-4 rounded-2xl border text-left transition-all ${
							duration === '24h'
								? 'bg-(--accent)/15 border-(--accent) shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
								: 'bg-(--background)/50 border-(--border)/10 hover:border-(--border)/30'
						}`}
					>
						<div className="flex items-center justify-between mb-1">
							<span className="text-sm font-extrabold text-(--text)">{t('app.boost.tier24hTitle')}</span>
							<Flame size={15} className="text-(--accent)" />
						</div>
						<p className="text-xs text-(--text-muted) mb-3">{t('app.boost.tier24hDesc')}</p>
						<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--accent)/20 text-(--accent) text-xs font-bold">
							<Coins size={12} /> 1,000 {t('app.boost.creditsLabel')}
						</div>
					</button>

					<button
						type="button"
						onClick={() => setDuration('7d')}
						className={`p-4 rounded-2xl border text-left transition-all relative ${
							duration === '7d'
								? 'bg-(--accent)/15 border-(--accent) shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
								: 'bg-(--background)/50 border-(--border)/10 hover:border-(--border)/30'
						}`}
					>
						<span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-(--accent) text-(--accent-text) text-[10px] font-extrabold uppercase tracking-wider">
							{t('app.boost.saveBadge')}
						</span>
						<div className="flex items-center justify-between mb-1">
							<span className="text-sm font-extrabold text-(--text)">{t('app.boost.tier7dTitle')}</span>
							<Sparkles size={15} className="text-(--accent)" />
						</div>
						<p className="text-xs text-(--text-muted) mb-3">{t('app.boost.tier7dDesc')}</p>
						<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--accent)/20 text-(--accent) text-xs font-bold">
							<Coins size={12} /> 5,000 {t('app.boost.creditsLabel')}
						</div>
					</button>
				</div>

				{balance !== null && (
					<div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 text-xs">
						<span className="text-(--text-muted) font-medium">{t('app.boost.yourBalance')}</span>
						<span className={`font-extrabold flex items-center gap-1.5 ${balance >= cost ? 'text-(--accent)' : 'text-(--accent-red)'}`}>
							<Coins size={13} />
							{balance.toLocaleString()} {t('app.boost.creditsLabel')}
						</span>
					</div>
				)}

				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={onClose} disabled={submitting}>
						{t('common.cancel')}
					</Button>
					<Button variant="primary" onClick={handleBoost} loading={submitting} disabled={balance !== null && balance < cost}>
						<Rocket size={15} className="mr-1.5" />
						{t('app.boost.confirmBtn', { cost: cost.toLocaleString() })}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

export default SpotlightBoostModal;
