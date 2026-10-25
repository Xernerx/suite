/** @format */

'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { Dices } from 'lucide-react';
import { StoreCoupon } from './types';

interface CouponModalProps {
	isOpen: boolean;
	onClose: () => void;
	coupon: StoreCoupon | null;
	onSave: (data: Partial<StoreCoupon>) => Promise<void>;
}

export function CouponModal({ isOpen, onClose, coupon, onSave }: CouponModalProps) {
	const { t } = useDictionary();

	const [code, setCode] = useState('');
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
	const [percentOff, setPercentOff] = useState(20);
	const [amountOff, setAmountOff] = useState(5);
	const [currency, setCurrency] = useState('usd');
	const [duration, setDuration] = useState<'once' | 'repeating' | 'forever'>('once');
	const [durationInMonths, setDurationInMonths] = useState(3);
	const [maxRedemptions, setMaxRedemptions] = useState<string>('');
	const [expiresAt, setExpiresAt] = useState<string>('');
	const [enabled, setEnabled] = useState(true);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (coupon) {
			setCode(coupon.code || '');
			setName(coupon.name || '');
			setDescription(coupon.description || '');
			setDiscountType(coupon.discountType || 'percent');
			setPercentOff(coupon.percentOff || 20);
			setAmountOff(coupon.amountOff || 5);
			setCurrency(coupon.currency || 'usd');
			setDuration(coupon.duration || 'once');
			setDurationInMonths(coupon.durationInMonths || 3);
			setMaxRedemptions(coupon.maxRedemptions ? String(coupon.maxRedemptions) : '');
			setExpiresAt(coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '');
			setEnabled(coupon.enabled ?? true);
		} else {
			setCode('');
			setName('');
			setDescription('');
			setDiscountType('percent');
			setPercentOff(20);
			setAmountOff(5);
			setCurrency('usd');
			setDuration('once');
			setDurationInMonths(3);
			setMaxRedemptions('');
			setExpiresAt('');
			setEnabled(true);
		}
	}, [coupon, isOpen]);

	const generateRandomCode = () => {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let randomPart = '';
		for (let i = 0; i < 6; i++) {
			randomPart += chars[Math.floor(Math.random() * chars.length)];
		}
		setCode(`XRX-${randomPart}`);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!code.trim() || !name.trim()) return;

		setLoading(true);
		try {
			await onSave({
				code: code.trim().toUpperCase(),
				name: name.trim(),
				description: description.trim(),
				discountType,
				percentOff: discountType === 'percent' ? Math.min(100, Math.max(1, Number(percentOff) || 1)) : 0,
				amountOff: discountType === 'amount' ? Math.max(0.5, Number(amountOff) || 1) : 0,
				currency,
				duration,
				durationInMonths: duration === 'repeating' ? Math.max(1, Number(durationInMonths) || 1) : null,
				maxRedemptions: maxRedemptions.trim() && Number(maxRedemptions) > 0 ? Math.floor(Number(maxRedemptions)) : null,
				expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59Z`).toISOString() : null,
				enabled,
			});
			onClose();
		} catch (err) {
			console.error('Failed to save coupon:', err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			title={coupon ? t('admin.store.couponModal.editTitle') : t('admin.store.couponModal.createTitle')}
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.couponModal.code')}</label>
					<div className="flex items-center gap-2">
						<div className="flex-1">
							<Input
								value={code}
								onChange={(e: any) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
								placeholder={t('admin.store.couponModal.codePlaceholder')}
								disabled={!!coupon}
								required
							/>
						</div>
						{!coupon && (
							<Button type="button" variant="secondary" onClick={generateRandomCode} className="shrink-0 flex items-center gap-1.5">
								<Dices size={15} /> {t('admin.store.couponModal.generateCode')}
							</Button>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.couponModal.name')}</label>
					<Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder={t('admin.store.couponModal.namePlaceholder')} required />
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.description')}</label>
					<Input value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder={t('admin.store.couponModal.descriptionPlaceholder')} />
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.couponModal.discountType')}</label>
						<div className={coupon ? 'pointer-events-none opacity-60' : ''}>
							<Selector
								value={discountType}
								onChange={(val) => setDiscountType(val as 'percent' | 'amount')}
								options={[
									{ value: 'percent', label: t('admin.store.couponModal.typePercent') },
									{ value: 'amount', label: t('admin.store.couponModal.typeAmount') },
								]}
							/>
						</div>
					</div>

					{discountType === 'percent' ? (
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.couponModal.percentOff')}</label>
							<Input
								variant="number"
								min={1}
								max={100}
								value={percentOff}
								onChange={(e: any) => setPercentOff(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
								disabled={!!coupon}
								required
							/>
						</div>
					) : (
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.couponModal.amountOff')}</label>
							<Input variant="number" min={1} value={amountOff} onChange={(e: any) => setAmountOff(Math.max(0.5, Number(e.target.value) || 1))} disabled={!!coupon} required />
						</div>
					)}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.couponModal.duration')}</label>
						<div className={coupon ? 'pointer-events-none opacity-60' : ''}>
							<Selector
								value={duration}
								onChange={(val) => setDuration(val as 'once' | 'repeating' | 'forever')}
								options={[
									{ value: 'once', label: t('admin.store.coupons.durationOnce') },
									{ value: 'repeating', label: t('admin.store.coupons.durationRepeating') },
									{ value: 'forever', label: t('admin.store.coupons.durationForever') },
								]}
							/>
						</div>
					</div>

					{duration === 'repeating' && (
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.couponModal.durationInMonths')}</label>
							<Input
								variant="number"
								min={1}
								max={36}
								value={durationInMonths}
								onChange={(e: any) => setDurationInMonths(Math.max(1, Number(e.target.value) || 1))}
								disabled={!!coupon}
								required
							/>
						</div>
					)}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.couponModal.maxRedemptions')}</label>
						<Input
							variant="number"
							min={1}
							value={maxRedemptions}
							onChange={(e: any) => setMaxRedemptions(e.target.value)}
							placeholder={t('admin.store.couponModal.maxRedemptionsPlaceholder')}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.couponModal.expiresAt')}</label>
						<Input variant="date" value={expiresAt} onChange={(e: any) => setExpiresAt(e.target.value)} />
					</div>
				</div>

				<label className="flex items-center gap-3 cursor-pointer pt-2">
					<Toggle checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
					<span className="text-sm font-medium text-(--text)">{t('admin.store.couponModal.enabled')}</span>
				</label>

				<div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)/10">
					<Button variant="secondary" onClick={onClose} type="button">
						{t('admin.store.buttons.cancel')}
					</Button>
					<Button variant="primary" type="submit" disabled={loading || !code.trim() || !name.trim()}>
						{loading ? t('admin.store.buttons.saving') : t('admin.store.buttons.save')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
