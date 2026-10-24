/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useSession, useToast } from '@xernerx/providers';
import { Button, Input, Modal } from '@xernerx/ui';
import { Coins, HeartHandshake, Sparkles } from 'lucide-react';

interface TipCreditsModalProps {
	isOpen: boolean;
	onClose: () => void;
	recipientId: string;
	recipientName: string;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000];

export default function TipCreditsModal({ isOpen, onClose, recipientId, recipientName }: TipCreditsModalProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { data: session } = useSession();

	const [amount, setAmount] = useState<string>('250');
	const [note, setNote] = useState<string>('');
	const [balance, setBalance] = useState<number | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const senderId = (session as any)?.user?.id;
	const numericAmount = Math.round(Number(amount) || 0);
	const isValidAmount = numericAmount >= 50 && numericAmount <= 2500;

	useEffect(() => {
		if (!isOpen || !senderId) return;
		fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${senderId}/credits/history`), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data && typeof data.balance === 'number') {
					setBalance(data.balance);
				}
			})
			.catch(() => null);
	}, [isOpen, senderId, getEnvUrl]);

	const handleSendTip = async () => {
		if (!senderId) {
			toast({ type: 'error', title: t('app.tip.signInRequired') });
			return;
		}
		if (!isValidAmount) return;

		setSubmitting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${recipientId}/credits/tip`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					amount: numericAmount,
					note: note.trim(),
					recipientName,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toast({ type: 'error', title: t('app.tip.failedTitle'), description: data.error || t('common.error') });
				return;
			}
			if (typeof data.balance === 'number') setBalance(data.balance);
			toast({
				type: 'success',
				title: t('app.tip.successTitle'),
				description: t('app.tip.successDesc', { amount: numericAmount.toLocaleString(), name: recipientName }),
			});
			setNote('');
			onClose();
		} catch (err: any) {
			toast({ type: 'error', title: t('app.tip.failedTitle'), description: err.message });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			title={t('app.tip.modalTitle', { name: recipientName })}
		>
			<div className="space-y-5">
				<div className="p-4 rounded-2xl bg-(--accent)/10 border border-(--accent)/25 flex items-start gap-3">
					<div className="w-10 h-10 rounded-2xl bg-(--accent)/20 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
						<HeartHandshake size={20} />
					</div>
					<div className="text-sm">
						<p className="font-bold text-(--text)">{t('app.tip.subtitle', { name: recipientName })}</p>
						<p className="text-xs text-(--text-muted) mt-0.5">{t('app.tip.description')}</p>
					</div>
				</div>

				<div>
					<label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-2">{t('app.tip.presetLabel')}</label>
					<div className="grid grid-cols-4 gap-2">
						{PRESET_AMOUNTS.map((preset) => (
							<button
								key={preset}
								type="button"
								onClick={() => setAmount(String(preset))}
								className={`py-2.5 px-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
									numericAmount === preset
										? 'bg-(--accent) text-(--accent-text) border-(--accent) shadow-sm'
										: 'bg-(--background)/50 text-(--text) border-(--border)/10 hover:border-(--accent)/40'
								}`}
							>
								<Coins size={12} />
								{preset.toLocaleString()}
							</button>
						))}
					</div>
				</div>

				<div>
					<label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">{t('app.tip.customAmountLabel')}</label>
					<Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="250" />
				</div>

				<div>
					<label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">{t('app.tip.noteLabel')}</label>
					<Input value={note} onChange={(e) => setNote(e.target.value.slice(0, 140))} placeholder={t('app.tip.notePlaceholder')} />
				</div>

				{balance !== null && (
					<div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 text-xs">
						<span className="text-(--text-muted) font-medium">{t('app.tip.yourBalance')}</span>
						<span className={`font-extrabold flex items-center gap-1.5 ${balance >= numericAmount ? 'text-(--accent)' : 'text-(--accent-red)'}`}>
							<Coins size={13} />
							{balance.toLocaleString()} {t('app.boost.creditsLabel')}
						</span>
					</div>
				)}

				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={onClose} disabled={submitting}>
						{t('common.cancel')}
					</Button>
					<Button variant="primary" onClick={handleSendTip} loading={submitting} disabled={!isValidAmount || (balance !== null && balance < numericAmount)}>
						<Sparkles size={15} className="mr-1.5" />
						{t('app.tip.sendBtn', { amount: isValidAmount ? numericAmount.toLocaleString() : '0' })}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
