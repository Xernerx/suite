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
	const [skuId, setSkuId] = useState('');
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
			setSkuId(item.skuId || '');
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
			setSkuId('');
			setBadge('');
			setDiscountPercent(0);
			setFeaturesText('');
			setIsFeatured(false);
			setEnabled(true);
			setOrder(0);
		}
	}, [item, categories, isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !skuId.trim() || !categoryId) return;

		setLoading(true);
		try {
			const features = featuresText
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean);

			await onSave({
				name: name.trim(),
				description: description.trim(),
				categoryId,
				skuId: skuId.trim(),
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
			<form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.name')}</label>
						<Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder={t('admin.store.itemModal.namePlaceholder')} required />
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.skuId')}</label>
						<Input value={skuId} onChange={(e: any) => setSkuId(e.target.value)} placeholder={t('admin.store.itemModal.skuIdPlaceholder')} required />
					</div>
				</div>

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
					<Button variant="primary" type="submit" disabled={loading || !name.trim() || !skuId.trim()}>
						{loading ? t('admin.store.buttons.saving') : t('admin.store.buttons.save')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
