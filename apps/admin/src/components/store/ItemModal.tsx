/** @format */

'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { StoreCategory, StoreItem } from './types';

interface ItemModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: StoreItem | null;
	categories: StoreCategory[];
	onSave: (data: Partial<StoreItem>) => Promise<void>;
}

export function ItemModal({ isOpen, onClose, item, categories, onSave }: ItemModalProps) {
	const { t } = useDictionary();

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [categoryId, setCategoryId] = useState('');
	const [itemType, setItemType] = useState<'subscription' | 'credit_pack' | 'credit_perk'>('subscription');
	const [skuId, setSkuId] = useState('');
	const [creditCost, setCreditCost] = useState<number>(0);
	const [creditAmount, setCreditAmount] = useState<number>(0);
	const [perkType, setPerkType] = useState<'none' | 'cdn_slots' | 'showcase_slots' | 'bot_slots' | 'vanity_url' | 'trial_pass' | 'vanity_badge' | 'streak_shield' | 'boost_bot' | 'boost_server'>(
		'none'
	);
	const [perkValue, setPerkValue] = useState<string>('');
	const [durationDays, setDurationDays] = useState<number>(0);
	const [badge, setBadge] = useState('');
	const [discountPercent, setDiscountPercent] = useState<number>(0);
	const [featuresText, setFeaturesText] = useState('');
	const [isFeatured, setIsFeatured] = useState(false);
	const [enabled, setEnabled] = useState(true);
	const [order, setOrder] = useState(0);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (item) {
			setName(item.name || '');
			setDescription(item.description || '');
			setCategoryId(item.categoryId || (categories[0]?.id ?? ''));
			setItemType(item.itemType || 'subscription');
			setSkuId(item.skuId || '');
			setCreditCost(item.creditCost ?? 0);
			setCreditAmount(item.creditAmount ?? 0);
			setPerkType(item.perkType || 'none');
			setPerkValue(item.perkValue !== undefined && item.perkValue !== null ? String(item.perkValue) : '');
			setDurationDays(item.durationDays ?? 0);
			setBadge(item.badge || '');
			setDiscountPercent(item.discountPercent ?? 0);
			setFeaturesText((item.features || []).join('\n'));
			setIsFeatured(Boolean(item.isFeatured));
			setEnabled(item.enabled ?? true);
			setOrder(item.order ?? 0);
		} else {
			setName('');
			setDescription('');
			setCategoryId(categories[0]?.id || 'consumers');
			setItemType('subscription');
			setSkuId('');
			setCreditCost(0);
			setCreditAmount(0);
			setPerkType('none');
			setPerkValue('');
			setDurationDays(0);
			setBadge('');
			setDiscountPercent(0);
			setFeaturesText('');
			setIsFeatured(false);
			setEnabled(true);
			setOrder(0);
		}
	}, [item, categories, isOpen]);

	const requiresSku = itemType !== 'credit_perk';

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !categoryId || (requiresSku && !skuId.trim())) return;

		setLoading(true);
		try {
			const features = featuresText
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean);

			const resolvedPerkValue =
				perkType === 'cdn_slots' || perkType === 'showcase_slots' || perkType === 'bot_slots' || perkType === 'vanity_url' ? Math.max(1, Number(perkValue) || 1) : perkValue.trim() || null;

			await onSave({
				name: name.trim(),
				description: description.trim(),
				categoryId,
				itemType,
				skuId: skuId.trim(),
				creditCost: Math.max(0, Number(creditCost) || 0),
				creditAmount: Math.max(0, Number(creditAmount) || 0),
				perkType: itemType === 'credit_perk' ? perkType : 'none',
				perkValue: itemType === 'credit_perk' ? resolvedPerkValue : null,
				durationDays: itemType === 'credit_perk' && perkType === 'trial_pass' ? Math.max(1, Number(durationDays) || 3) : 0,
				badge: badge.trim() || null,
				discountPercent: Math.min(100, Math.max(0, Number(discountPercent) || 0)),
				features,
				isFeatured,
				enabled,
				order: Number(order) || 0,
			});
			onClose();
		} catch (err) {
			console.error('Failed to save item:', err);
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
			maxWidth="max-w-xl"
			title={item ? t('admin.store.itemModal.editTitle') : t('admin.store.itemModal.createTitle')}
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[75dvh] overflow-y-auto pr-1">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.name')}</label>
						<Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder={t('admin.store.itemModal.namePlaceholder')} required />
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.itemType')}</label>
						<Selector
							value={itemType}
							onChange={(val) => setItemType(val as any)}
							options={[
								{ value: 'subscription', label: t('admin.store.itemModal.types.subscription') },
								{ value: 'credit_pack', label: t('admin.store.itemModal.types.creditPack') },
								{ value: 'credit_perk', label: t('admin.store.itemModal.types.creditPerk') },
							]}
						/>
					</div>
				</div>

				{requiresSku && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.skuId')}</label>
							<Input value={skuId} onChange={(e: any) => setSkuId(e.target.value)} placeholder={t('admin.store.itemModal.skuIdPlaceholder')} required />
						</div>

						{itemType === 'credit_pack' && (
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.creditAmount')}</label>
								<Input type="number" min="1" value={creditAmount} onChange={(e: any) => setCreditAmount(Number(e.target.value))} />
							</div>
						)}
					</div>
				)}

				{itemType === 'credit_perk' && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.creditCost')}</label>
							<Input type="number" min="0" value={creditCost} onChange={(e: any) => setCreditCost(Number(e.target.value))} />
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.perkType')}</label>
							<Selector
								value={perkType}
								onChange={(val) => setPerkType(val as any)}
								options={[
									{ value: 'cdn_slots', label: t('admin.store.itemModal.perks.cdnSlots') },
									{ value: 'showcase_slots', label: t('admin.store.itemModal.perks.showcaseSlots') },
									{ value: 'bot_slots', label: t('admin.store.itemModal.perks.botSlots') },
									{ value: 'vanity_url', label: t('admin.store.itemModal.perks.vanityUrl') },
									{ value: 'trial_pass', label: t('admin.store.itemModal.perks.trialPass') },
									{ value: 'vanity_badge', label: t('admin.store.itemModal.perks.vanityBadge') },
									{ value: 'streak_shield', label: t('admin.store.itemModal.perks.streakShield') },
								]}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.perkValue')}</label>
							<Input value={perkValue} onChange={(e: any) => setPerkValue(e.target.value)} placeholder={t('admin.store.itemModal.perkValuePlaceholder')} />
						</div>

						{perkType === 'trial_pass' && (
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.durationDays')}</label>
								<Input type="number" min="1" value={durationDays} onChange={(e: any) => setDurationDays(Number(e.target.value))} />
							</div>
						)}
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.category')}</label>
						<Selector
							value={categoryId}
							onChange={(val) => setCategoryId(val)}
							options={categories.map((cat) => ({
								value: cat.id,
								label: `${cat.name} (${cat.id})`,
							}))}
							required
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.badge')}</label>
						<Input value={badge} onChange={(e: any) => setBadge(e.target.value)} placeholder={t('admin.store.itemModal.badgePlaceholder')} />
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.description')}</label>
					<Input value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder={t('admin.store.itemModal.descriptionPlaceholder')} />
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.discount')}</label>
						<Input type="number" min="0" max="100" value={discountPercent} onChange={(e: any) => setDiscountPercent(Number(e.target.value))} />
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.order')}</label>
						<Input type="number" value={order} onChange={(e: any) => setOrder(Number(e.target.value))} />
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.features')}</label>
					<Input variant="textarea" value={featuresText} onChange={(e: any) => setFeaturesText(e.target.value)} placeholder={t('admin.store.itemModal.featuresPlaceholder')} rows={4} />
				</div>

				<div className="grid grid-cols-2 gap-4 pt-2">
					<label className="flex items-center gap-3 cursor-pointer">
						<Toggle checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
						<span className="text-xs font-medium text-(--text)">{t('admin.store.itemModal.featured')}</span>
					</label>

					<label className="flex items-center gap-3 cursor-pointer">
						<Toggle checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
						<span className="text-xs font-medium text-(--text)">{t('admin.store.itemModal.enabled')}</span>
					</label>
				</div>

				<div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)/10">
					<Button variant="secondary" onClick={onClose} type="button">
						{t('admin.store.buttons.cancel')}
					</Button>
					<Button variant="primary" type="submit" disabled={loading || !name.trim() || (requiresSku && !skuId.trim())}>
						{loading ? t('admin.store.buttons.saving') : t('admin.store.buttons.save')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
