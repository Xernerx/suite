/** @format */

'use client';

import { useState } from 'react';
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { Edit2, Trash2, Power, Copy, Check, Sparkles, Tag, PackageSearch } from 'lucide-react';
import { StoreCategory, StoreItem } from './types';

interface StoreItemsTabProps {
	items: StoreItem[];
	categories: StoreCategory[];
	onEdit: (item: StoreItem) => void;
	onToggleEnabled: (id: string, enabled: boolean) => Promise<void>;
	onQuickDiscount: (id: string, discountPercent: number) => Promise<void>;
	onDelete: (item: StoreItem) => Promise<void>;
}

export function StoreItemsTab({ items, categories, onEdit, onToggleEnabled, onQuickDiscount, onDelete }: StoreItemsTabProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const [search, setSearch] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled' | 'discounted'>('all');
	const [copiedSku, setCopiedSku] = useState<string | null>(null);
	const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
	const [tempDiscount, setTempDiscount] = useState<number>(0);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [confirmDeleteItem, setConfirmDeleteItem] = useState<StoreItem | null>(null);

	const handleCopySku = (skuId: string) => {
		navigator.clipboard.writeText(skuId);
		setCopiedSku(skuId);
		toast({ type: 'success', title: t('admin.store.alerts.skuCopied') });
		setTimeout(() => setCopiedSku(null), 2000);
	};

	const handleDeleteClick = (item: StoreItem) => {
		setConfirmDeleteItem(item);
	};

	const confirmDelete = async () => {
		if (!confirmDeleteItem) return;
		const item = confirmDeleteItem;
		setConfirmDeleteItem(null);
		setDeletingId(item.id);
		try {
			await onDelete(item);
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.deleteFailed'), description: err.message });
		} finally {
			setDeletingId(null);
		}
	};

	const handleSaveDiscount = async (id: string) => {
		await onQuickDiscount(id, tempDiscount);
		setEditingDiscountId(null);
	};

	const filteredItems = items.filter((item) => {
		const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.skuId.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase());

		const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;

		if (statusFilter === 'enabled' && !item.enabled) return false;
		if (statusFilter === 'disabled' && item.enabled) return false;
		if (statusFilter === 'discounted' && !(item.discountPercent > 0)) return false;

		return matchesSearch && matchesCategory;
	});

	return (
		<div className="flex flex-col gap-6">
			{/* Filters */}
			<div className="flex flex-col md:flex-row items-center gap-3 justify-between">
				<div className="w-full md:max-w-md">
					<Input variant="search" shortcut={true} value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder={t('admin.store.table.searchPlaceholder')} />
				</div>

				<div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
					<div className="w-full sm:w-44">
						<Selector
							value={statusFilter}
							onChange={(val) => setStatusFilter(val as any)}
							options={[
								{ value: 'all', label: t('admin.store.table.filterAll') },
								{ value: 'enabled', label: t('admin.store.table.filterEnabled') },
								{ value: 'disabled', label: t('admin.store.table.filterDisabled') },
								{ value: 'discounted', label: t('admin.store.table.filterDiscounted') },
							]}
						/>
					</div>
					<div className="w-full sm:w-56">
						<Selector
							value={selectedCategory}
							onChange={(val) => setSelectedCategory(val)}
							options={[{ value: 'all', label: t('admin.store.table.allCategories') }, ...categories.map((cat) => ({ value: cat.id, label: cat.name }))]}
						/>
					</div>
				</div>
			</div>

			{filteredItems.length === 0 ? (
				<div className="flex flex-col items-center justify-center p-12 text-center border border-(--border)/10 rounded-2xl bg-(--foreground)/10">
					<PackageSearch className="w-12 h-12 text-(--text-muted) mb-3 opacity-50" />
					<p className="text-(--text-muted) text-sm">{t('admin.store.table.noItems')}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredItems.map((item) => (
						<div
							key={item.id}
							className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 ${
								item.enabled
									? item.isFeatured
										? 'border-(--accent) bg-(--foreground)/25 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)]'
										: 'border-(--border)/15 bg-(--foreground)/20 shadow-xs'
									: 'border-(--border)/5 bg-(--foreground)/5 opacity-60'
							}`}
						>
							<div>
								{/* Header & Badges */}
								<div className="flex items-start justify-between gap-3 mb-2">
									<div className="flex flex-wrap items-center gap-1.5">
										<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-(--foreground) text-(--text-muted) border border-(--border)/10">
											{item.categoryName || item.categoryId}
										</span>
										{item.isFeatured && (
											<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) flex items-center gap-1">
												<Sparkles size={11} /> {t('admin.store.table.featuredBadge')}
											</span>
										)}
										{item.badge && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent)">{item.badge}</span>}
									</div>

									<button
										onClick={() => onToggleEnabled(item.id, !item.enabled)}
										className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
											item.enabled
												? 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/20 hover:bg-(--accent-green)/20'
												: 'bg-(--accent-red)/10 text-(--accent-red) border-(--accent-red)/20 hover:bg-(--accent-red)/20'
										}`}
										title={item.enabled ? t('admin.store.tooltips.clickToDisable') : t('admin.store.tooltips.clickToEnable')}
									>
										<Power size={14} />
									</button>
								</div>

								{/* Title & Description */}
								<h3 className="font-bold text-(--text) text-lg mb-1" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{item.name}
								</h3>
								{item.description && <p className="text-xs text-(--text-muted) mb-3 line-clamp-2">{item.description}</p>}

								{/* SKU ID or Credit Cost info */}
								<div className="flex items-center justify-between p-2 rounded-xl bg-(--background)/50 border border-(--border)/10 mb-3 text-xs">
									<div className="flex items-center gap-1.5 text-(--text-muted) font-mono text-[11px] truncate">
										<Tag size={12} className="shrink-0 text-(--accent)" />
										<span className="truncate">
											{item.itemType === 'credit_perk'
												? `${(item.creditCost || 0).toLocaleString()} Credits (${item.perkType || 'perk'})`
												: item.itemType === 'credit_pack'
													? `${item.skuId} (+${(item.creditAmount || 0).toLocaleString()} Credits)`
													: item.skuId}
										</span>
									</div>
									{item.skuId && (
										<button
											onClick={() => handleCopySku(item.skuId)}
											className="p-1 text-(--text-muted) hover:text-(--text) transition-colors cursor-pointer shrink-0"
											title={t('admin.store.tooltips.copySku')}
										>
											{copiedSku === item.skuId ? <Check size={13} className="text-(--accent-green)" /> : <Copy size={13} />}
										</button>
									)}
								</div>

								{/* Discount controller */}
								<div className="flex items-center justify-between p-2.5 rounded-xl bg-(--foreground)/30 border border-(--border)/10 mb-4">
									<span className="text-xs text-(--text-muted) font-medium">{t('admin.store.table.discount')}:</span>

									{editingDiscountId === item.id ? (
										<div className="flex items-center gap-1.5">
											<div className="w-24">
												<Input
													variant="number"
													min={0}
													max={100}
													value={tempDiscount}
													onChange={(e) => setTempDiscount(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
													className="!h-8 !text-xs"
												/>
											</div>
											<span className="text-xs">%</span>
											<button onClick={() => handleSaveDiscount(item.id)} className="px-2 py-1 text-[11px] rounded-lg bg-(--accent) text-white font-medium cursor-pointer">
												{t('admin.store.buttons.save')}
											</button>
											<button onClick={() => setEditingDiscountId(null)} className="px-1.5 py-1 text-[11px] text-(--text-muted) hover:text-(--text) cursor-pointer">
												✕
											</button>
										</div>
									) : (
										<div className="flex items-center gap-1.5">
											{item.discountPercent > 0 ? (
												<span
													onClick={() => {
														setEditingDiscountId(item.id);
														setTempDiscount(item.discountPercent);
													}}
													className="px-2 py-0.5 rounded-lg text-xs font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/20 cursor-pointer hover:opacity-80"
													title={t('admin.store.tooltips.editDiscount')}
												>
													{t('admin.store.table.percentOff', { percent: item.discountPercent })}
												</span>
											) : (
												<button
													onClick={() => {
														setEditingDiscountId(item.id);
														setTempDiscount(0);
													}}
													className="text-xs text-(--text-muted) hover:text-(--accent) cursor-pointer underline underline-offset-2"
												>
													{t('admin.store.table.addDiscount')}
												</button>
											)}
										</div>
									)}
								</div>

								{/* Features list count */}
								{item.features && item.features.length > 0 && (
									<p className="text-[11px] text-(--text-muted) mb-3">{t('admin.store.table.featuresCount', { count: item.features.length })}</p>
								)}
							</div>

							{/* Actions */}
							<div className="flex items-center justify-between pt-3 border-t border-(--border)/10 text-xs text-(--text-muted)">
								<span>
									{t('admin.store.table.order')}: <strong className="text-(--text)">{item.order}</strong>
								</span>

								<div className="flex items-center gap-1.5">
									<Button variant="secondary" onClick={() => onEdit(item)} className="!p-2 !h-8">
										<Edit2 size={14} />
									</Button>
									<Button variant="danger" onClick={() => handleDeleteClick(item)} disabled={deletingId === item.id} className="!p-2 !h-8">
										<Trash2 size={14} />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			<Confirm
				open={!!confirmDeleteItem}
				onOpenChange={(open) => !open && setConfirmDeleteItem(null)}
				title={confirmDeleteItem?.name || ''}
				description={t('admin.store.alerts.deleteItemConfirm', { name: confirmDeleteItem?.name || '' })}
				confirmKeyword={confirmDeleteItem?.name || confirmDeleteItem?.id}
				variant="danger"
				onConfirm={confirmDelete}
			/>
		</div>
	);
}
