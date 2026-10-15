/** @format */

'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Modal, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { StoreCategory } from './types';

interface CategoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	category: StoreCategory | null;
	onSave: (data: Partial<StoreCategory>) => Promise<void>;
}

export function CategoryModal({ isOpen, onClose, category, onSave }: CategoryModalProps) {
	const { t } = useDictionary();

	const [name, setName] = useState('');
	const [id, setId] = useState('');
	const [description, setDescription] = useState('');
	const [icon, setIcon] = useState('ShoppingBag');
	const [order, setOrder] = useState(0);
	const [enabled, setEnabled] = useState(true);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (category) {
			setName(category.name || '');
			setId(category.id || '');
			setDescription(category.description || '');
			setIcon(category.icon || 'ShoppingBag');
			setOrder(category.order || 0);
			setEnabled(category.enabled ?? true);
		} else {
			setName('');
			setId('');
			setDescription('');
			setIcon('ShoppingBag');
			setOrder(0);
			setEnabled(true);
		}
	}, [category, isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		setLoading(true);
		try {
			await onSave({
				id: id.trim() || undefined,
				name: name.trim(),
				description: description.trim(),
				icon: icon.trim() || 'ShoppingBag',
				order: Number(order) || 0,
				enabled,
			});
			onClose();
		} catch (err) {
			console.error('Failed to save category:', err);
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
			title={category ? t('admin.store.categoryModal.editTitle') : t('admin.store.categoryModal.createTitle')}
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.categoryModal.name')}</label>
					<Input
						value={name}
						onChange={(e: any) => {
							setName(e.target.value);
							if (!category && !id) {
								setId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
							}
						}}
						placeholder={t('admin.store.categoryModal.namePlaceholder')}
						required
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.categoryModal.id')}</label>
					<Input value={id} onChange={(e: any) => setId(e.target.value)} placeholder={t('admin.store.categoryModal.idPlaceholder')} disabled={!!category} required />
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.itemModal.description')}</label>
					<Input value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder={t('admin.store.itemModal.descriptionPlaceholder')} />
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.categoryModal.icon')}</label>
						<Input value={icon} onChange={(e: any) => setIcon(e.target.value)} placeholder={t('admin.store.categoryModal.iconPlaceholder')} />
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('admin.store.categoryModal.order')}</label>
						<Input type="number" value={order} onChange={(e: any) => setOrder(Number(e.target.value))} />
					</div>
				</div>

				<label className="flex items-center gap-3 cursor-pointer pt-2">
					<Toggle checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
					<span className="text-sm font-medium text-(--text)">{t('admin.store.categoryModal.enabled')}</span>
				</label>

				<div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)/10">
					<Button variant="secondary" onClick={onClose} type="button">
						{t('admin.store.buttons.cancel')}
					</Button>
					<Button variant="primary" type="submit" disabled={loading || !name.trim()}>
						{loading ? t('admin.store.buttons.saving') : t('admin.store.buttons.save')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
