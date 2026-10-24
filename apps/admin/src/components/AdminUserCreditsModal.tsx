/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { Award, Coins, Flame, Plus } from 'lucide-react';
import { Badge, Button, Input, Modal, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import type { UserSummary } from './users/types';

interface AdminUserCreditsModalProps {
	user: UserSummary | null;
	onClose: () => void;
}

const BADGE_OPTIONS = [
	{ value: '', label: 'None (Credits Only)' },
	{ value: 'dot_matrix_banner', label: 'Dot-Matrix Architect' },
	{ value: 'credit_patron', label: 'Credit Patron' },
	{ value: 'high_roller', label: 'High Roller' },
	{ value: 'vault_sovereign', label: 'Vault Sovereign' },
	{ value: 'ecosystem_builder', label: 'Ecosystem Builder' },
];

export function AdminUserCreditsModal({ user, onClose }: AdminUserCreditsModalProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [creditDoc, setCreditDoc] = useState<any>(null);
	const [amount, setAmount] = useState('500');
	const [reason, setReason] = useState('');
	const [badge, setBadge] = useState('');

	useEffect(() => {
		if (!user?.id) {
			setCreditDoc(null);
			return;
		}
		setLoading(true);
		fetch(getEnvUrl(`https://api.xernerx.com/secure/admin/users/${user.id}/credits`), {
			credentials: 'include',
		})
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				setCreditDoc(data);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [user?.id, getEnvUrl]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user?.id || submitting) return;
		const parsedAmount = Number(amount) || 0;
		if (parsedAmount === 0 && !badge) return;

		setSubmitting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/admin/users/${user.id}/credits`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					amount: parsedAmount,
					reason: reason.trim() || t('admin.users.creditsModal.defaultReason'),
					badge: badge || null,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || t('admin.users.creditsModal.errorToast'));
			setCreditDoc(data.credits);
			setReason('');
			toast({
				type: 'success',
				title: t('admin.users.creditsModal.successToast'),
			});
		} catch (err: any) {
			toast({
				type: 'error',
				title: err.message || t('admin.users.creditsModal.errorToast'),
			});
		} finally {
			setSubmitting(false);
		}
	};

	const displayName = user?.discord?.globalName || user?.discord?.username || user?.name || user?.id || '';

	return (
		<Modal open={Boolean(user)} onOpenChange={(open) => !open && onClose()} title={t('admin.users.creditsModal.title')} description={t('admin.users.creditsModal.subtitle', { user: displayName })}>
			{loading ? (
				<div className="flex h-40 items-center justify-center">
					<Loading variant="small" />
				</div>
			) : (
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex items-center justify-between p-4 rounded-2xl bg-(--background)/60 border border-(--border)/10">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
								<Coins size={18} />
							</div>
							<div>
								<p className="text-xs text-(--text-muted)">{t('admin.users.creditsModal.currentBalance')}</p>
								<p className="text-lg font-extrabold text-(--text) font-mono">{(Number(creditDoc?.balance) || 0).toLocaleString()}</p>
							</div>
						</div>
						<Badge variant="accent" icon={<Flame size={12} />}>
							{creditDoc?.streak || 0}d
						</Badge>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.users.creditsModal.amountLabel')}</label>
						<div className="flex flex-wrap gap-1.5 mb-1">
							{[250, 500, 1000, 2500, -250, -500].map((preset) => (
								<button
									key={preset}
									type="button"
									onClick={() => setAmount(String(preset))}
									className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer ${
										Number(amount) === preset
											? 'bg-(--accent) text-white border-(--accent)'
											: 'bg-(--background)/50 text-(--text-muted) border-(--border)/10 hover:border-(--accent)/40'
									}`}
								>
									{preset > 0 ? `+${preset}` : preset}
								</button>
							))}
						</div>
						<Input type="number" value={amount} onChange={(e: any) => setAmount(e.target.value)} required />
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.users.creditsModal.badgeLabel')}</label>
						<Selector value={badge} options={BADGE_OPTIONS} onChange={setBadge} items />
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.users.creditsModal.reasonLabel')}</label>
						<Input value={reason} onChange={(e: any) => setReason(e.target.value)} placeholder={t('admin.users.creditsModal.reasonPlaceholder')} />
					</div>

					{Array.isArray(creditDoc?.unlockedBadges) && creditDoc.unlockedBadges.length > 0 && (
						<div className="flex flex-wrap items-center gap-1.5 pt-1">
							<Award size={13} className="text-(--accent)" />
							{creditDoc.unlockedBadges.map((b: string) => (
								<Badge key={b} variant="muted" size="sm">
									{b}
								</Badge>
							))}
						</div>
					)}

					<div className="flex items-center justify-end gap-2 pt-3 border-t border-(--border)/10">
						<Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
							{t('common.buttons.cancel')}
						</Button>
						<Button type="submit" variant="primary" loading={submitting}>
							<Plus size={14} />
							{t('admin.users.creditsModal.applyButton')}
						</Button>
					</div>
				</form>
			)}
		</Modal>
	);
}
