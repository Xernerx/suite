/** @format */

'use client';

import { useMemo, useState } from 'react';
import { Button, Confirm, Input } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { Edit2, Trash2, Folder, Power } from 'lucide-react';
import { StoreCategory } from './types';

interface StoreCategoriesTabProps {
	categories: StoreCategory[];
	onEdit: (category: StoreCategory) => void;
	onToggleEnabled: (id: string, enabled: boolean) => Promise<void>;
	onDelete: (category: StoreCategory) => Promise<void>;
}

export function StoreCategoriesTab({ categories, onEdit, onToggleEnabled, onDelete }: StoreCategoriesTabProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [search, setSearch] = useState('');
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<StoreCategory | null>(null);

	const filteredCategories = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return categories;
		return categories.filter(
			(cat) =>
				String(cat.name || '')
					.toLowerCase()
					.includes(q) ||
				String(cat.id || '')
					.toLowerCase()
					.includes(q) ||
				String(cat.description || '')
					.toLowerCase()
					.includes(q)
		);
	}, [categories, search]);

	const handleDeleteClick = (category: StoreCategory) => {
		setConfirmDeleteCategory(category);
	};

	const confirmDelete = async () => {
		if (!confirmDeleteCategory) return;
		const category = confirmDeleteCategory;
		setConfirmDeleteCategory(null);
		setDeletingId(category.id);
		try {
			await onDelete(category);
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.deleteFailed'), description: err.message });
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="w-full md:max-w-md">
				<Input variant="search" shortcut={true} value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder={t('admin.store.table.searchCategoriesPlaceholder')} />
			</div>

			{filteredCategories.length === 0 ? (
				<div className="flex flex-col items-center justify-center p-12 text-center border border-(--border)/10 rounded-3xl bg-(--foreground)/30 backdrop-blur-md shadow-xs">
					<Folder className="w-12 h-12 text-(--text-muted) mb-3 opacity-50" />
					<p className="text-(--text-muted) text-sm">{t('admin.store.table.noCategories')}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredCategories.map((cat) => (
						<div
							key={cat.id}
							className={`flex flex-col justify-between p-5 rounded-3xl border backdrop-blur-md transition-all duration-200 ${
								cat.enabled ? 'border-(--border)/10 bg-(--foreground)/30 shadow-xs' : 'border-(--border)/10 bg-(--foreground)/20 opacity-60'
							}`}
						>
							<div className="flex items-start justify-between gap-3 mb-3">
								<div className="flex items-center gap-3">
									<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-(--accent)/10 text-(--accent)">
										<Folder size={20} />
									</div>
									<div>
										<h3 className="font-bold text-(--text) text-base" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{cat.name}
										</h3>
										<code className="text-xs text-(--text-muted) font-mono">{cat.id}</code>
									</div>
								</div>

								<button
									onClick={() => onToggleEnabled(cat.id, !cat.enabled)}
									className={`p-2 rounded-xl border transition-colors cursor-pointer ${
										cat.enabled
											? 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/20 hover:bg-(--accent-green)/20'
											: 'bg-(--accent-red)/10 text-(--accent-red) border-(--accent-red)/20 hover:bg-(--accent-red)/20'
									}`}
									title={cat.enabled ? t('admin.store.tooltips.clickToDisable') : t('admin.store.tooltips.clickToEnable')}
								>
									<Power size={16} />
								</button>
							</div>

							{cat.description && <p className="text-xs text-(--text-muted) mb-4 line-clamp-2">{cat.description}</p>}

							<div className="flex items-center justify-between pt-3 border-t border-(--border)/10 text-xs text-(--text-muted)">
								<div className="flex items-center gap-3">
									<span>
										{t('admin.store.table.itemCount')}: <strong className="text-(--text)">{cat.itemCount ?? 0}</strong>
									</span>
									<span>
										{t('admin.store.table.order')}: <strong className="text-(--text)">{cat.order}</strong>
									</span>
								</div>

								<div className="flex items-center gap-1.5">
									<Button variant="secondary" onClick={() => onEdit(cat)} className="!p-2 !h-8">
										<Edit2 size={14} />
									</Button>
									<Button variant="danger" onClick={() => handleDeleteClick(cat)} disabled={deletingId === cat.id} className="!p-2 !h-8">
										<Trash2 size={14} />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			<Confirm
				open={!!confirmDeleteCategory}
				onOpenChange={(open) => !open && setConfirmDeleteCategory(null)}
				title={confirmDeleteCategory?.name || ''}
				description={t('admin.store.alerts.deleteCategoryConfirm', { name: confirmDeleteCategory?.name || '' })}
				confirmKeyword={confirmDeleteCategory?.name || confirmDeleteCategory?.id}
				variant="danger"
				onConfirm={confirmDelete}
			/>
		</div>
	);
}
