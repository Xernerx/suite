/** @format */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Plus, ShoppingBag, Folder, Tag, CheckCircle2, Percent, TicketPercent } from 'lucide-react';

import { StoreCategory, StoreCoupon, StoreItem } from './store/types';
import { StoreItemsTab } from './store/StoreItemsTab';
import { StoreCategoriesTab } from './store/StoreCategoriesTab';
import { StoreCouponsTab } from './store/StoreCouponsTab';
import { ItemModal } from './store/ItemModal';
import { CategoryModal } from './store/CategoryModal';
import { CouponModal } from './store/CouponModal';

export default function StoreManagement() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();

	const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'coupons'>('items');
	const [loading, setLoading] = useState(true);

	const [categories, setCategories] = useState<StoreCategory[]>([]);
	const [items, setItems] = useState<StoreItem[]>([]);
	const [coupons, setCoupons] = useState<StoreCoupon[]>([]);

	// Modal states
	const [itemModalOpen, setItemModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

	const [categoryModalOpen, setCategoryModalOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<StoreCategory | null>(null);

	const [couponModalOpen, setCouponModalOpen] = useState(false);
	const [selectedCoupon, setSelectedCoupon] = useState<StoreCoupon | null>(null);

	const fetchData = useCallback(async () => {
		if (!isReady) return;
		setLoading(true);
		try {
			const [catsRes, itemsRes, couponsRes] = await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/secure/store/categories'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/store/items'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/store/coupons'), { credentials: 'include' }),
			]);

			if (catsRes.ok) {
				const catsData = await catsRes.json();
				setCategories(Array.isArray(catsData) ? catsData : []);
			}

			if (itemsRes.ok) {
				const itemsData = await itemsRes.json();
				setItems(Array.isArray(itemsData) ? itemsData : []);
			}

			if (couponsRes.ok) {
				const couponsData = await couponsRes.json();
				setCoupons(Array.isArray(couponsData) ? couponsData : []);
			}
		} catch (err: any) {
			console.error('Failed to fetch store admin data:', err);
			toast({ type: 'error', title: t('admin.store.alerts.fetchFailed'), description: err.message });
		} finally {
			setLoading(false);
		}
	}, [getEnvUrl, isReady, toast, t]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Item operations
	const handleSaveItem = async (data: Partial<StoreItem>) => {
		try {
			if (selectedItem) {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/items/${selectedItem.id}`), {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(data),
				});
				if (!res.ok) throw new Error('Failed to update product');
			} else {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/store/items'), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(data),
				});
				if (!res.ok) throw new Error('Failed to create product');
			}
			toast({ type: 'success', title: t('admin.store.alerts.itemSaved') });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.saveFailed'), description: err.message });
			throw err;
		}
	};

	const handleToggleItemEnabled = async (id: string, enabled: boolean) => {
		setItems((prev) => prev.map((item) => (item.id === id ? { ...item, enabled } : item)));
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/items/${id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ enabled }),
			});
			if (!res.ok) throw new Error('Failed to toggle status');
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.toggleFailed'), description: err.message });
			fetchData();
		}
	};

	const handleQuickDiscount = async (id: string, discountPercent: number) => {
		setItems((prev) => prev.map((item) => (item.id === id ? { ...item, discountPercent } : item)));
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/items/${id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ discountPercent }),
			});
			if (!res.ok) throw new Error('Failed to update discount');
			toast({ type: 'success', title: t('admin.store.alerts.itemSaved') });
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.discountFailed'), description: err.message });
			fetchData();
		}
	};

	const handleDeleteItem = async (item: StoreItem) => {
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/items/${item.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed to delete product');
			toast({ type: 'success', title: t('admin.store.alerts.itemDeleted') });
			setItems((prev) => prev.filter((i) => i.id !== item.id));
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.deleteFailed'), description: err.message });
			throw err;
		}
	};

	// Category operations
	const handleSaveCategory = async (data: Partial<StoreCategory>) => {
		try {
			if (selectedCategory) {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/categories/${selectedCategory.id}`), {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(data),
				});
				if (!res.ok) throw new Error('Failed to update category');
			} else {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/store/categories'), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(data),
				});
				if (!res.ok) throw new Error('Failed to create category');
			}
			toast({ type: 'success', title: t('admin.store.alerts.categorySaved') });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.saveFailed'), description: err.message });
			throw err;
		}
	};

	const handleToggleCategoryEnabled = async (id: string, enabled: boolean) => {
		setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, enabled } : cat)));
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/categories/${id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ enabled }),
			});
			if (!res.ok) throw new Error('Failed to toggle category');
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.toggleFailed'), description: err.message });
			fetchData();
		}
	};

	const handleDeleteCategory = async (category: StoreCategory) => {
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/categories/${category.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed to delete category');
			toast({ type: 'success', title: t('admin.store.alerts.categoryDeleted') });
			setCategories((prev) => prev.filter((c) => c.id !== category.id));
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.deleteFailed'), description: err.message });
			throw err;
		}
	};

	// Coupon operations
	const handleSaveCoupon = async (data: Partial<StoreCoupon>) => {
		try {
			if (selectedCoupon) {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/coupons/${selectedCoupon.id}`), {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(data),
				});
				const payload = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(payload.error || 'Failed to update coupon');
			} else {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/store/coupons'), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(data),
				});
				const payload = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(payload.error || 'Failed to create coupon');
			}
			toast({ type: 'success', title: t('admin.store.alerts.couponSaved') });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.saveFailed'), description: err.message });
			throw err;
		}
	};

	const handleToggleCouponEnabled = async (id: string, enabled: boolean) => {
		setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, enabled } : c)));
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/coupons/${id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ enabled }),
			});
			if (!res.ok) throw new Error('Failed to toggle coupon');
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.toggleFailed'), description: err.message });
			fetchData();
		}
	};

	const handleDeleteCoupon = async (coupon: StoreCoupon) => {
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/coupons/${coupon.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed to delete coupon');
			toast({ type: 'success', title: t('admin.store.alerts.couponDeleted') });
			setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.deleteFailed'), description: err.message });
			throw err;
		}
	};

	if (loading && categories.length === 0 && items.length === 0 && coupons.length === 0) {
		return <Loading />;
	}

	const activeItemsCount = items.filter((i) => i.enabled).length;
	const discountedItemsCount = items.filter((i) => i.discountPercent > 0).length;
	const activeCouponsCount = coupons.filter((c) => c.enabled && (!c.expiresAt || new Date(c.expiresAt).getTime() > Date.now())).length;

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-extrabold tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.store.title')}
					</h1>
					<p className="text-sm text-(--text-muted) max-w-2xl">{t('admin.store.description')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Button
						variant="secondary"
						onClick={() => {
							setSelectedCoupon(null);
							setCouponModalOpen(true);
						}}
						className="flex items-center gap-2"
					>
						<Plus size={16} /> {t('admin.store.buttons.newCoupon')}
					</Button>
					<Button
						variant="secondary"
						onClick={() => {
							setSelectedCategory(null);
							setCategoryModalOpen(true);
						}}
						className="flex items-center gap-2"
					>
						<Plus size={16} /> {t('admin.store.buttons.newCategory')}
					</Button>
					<Button
						variant="primary"
						onClick={() => {
							setSelectedItem(null);
							setItemModalOpen(true);
						}}
						className="flex items-center gap-2"
					>
						<Plus size={16} /> {t('admin.store.buttons.newItem')}
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<div className="p-4 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xs">
					<div className="flex items-center gap-2 text-(--text-muted) text-xs mb-1">
						<Tag size={14} className="text-(--accent)" /> {t('admin.store.stats.totalItems')}
					</div>
					<div className="text-2xl font-bold">{items.length}</div>
				</div>

				<div className="p-4 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xs">
					<div className="flex items-center gap-2 text-(--text-muted) text-xs mb-1">
						<CheckCircle2 size={14} className="text-(--accent-green)" /> {t('admin.store.stats.activeItems')}
					</div>
					<div className="text-2xl font-bold">{activeItemsCount}</div>
				</div>

				<div className="p-4 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xs">
					<div className="flex items-center gap-2 text-(--text-muted) text-xs mb-1">
						<Percent size={14} className="text-(--accent-orange)" /> {t('admin.store.stats.discounted')}
					</div>
					<div className="text-2xl font-bold">{discountedItemsCount}</div>
				</div>

				<div className="p-4 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xs">
					<div className="flex items-center gap-2 text-(--text-muted) text-xs mb-1">
						<Folder size={14} className="text-(--accent)" /> {t('admin.store.stats.categories')}
					</div>
					<div className="text-2xl font-bold">{categories.length}</div>
				</div>

				<div className="p-4 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xs">
					<div className="flex items-center gap-2 text-(--text-muted) text-xs mb-1">
						<TicketPercent size={14} className="text-(--accent)" /> {t('admin.store.stats.coupons')}
					</div>
					<div className="text-2xl font-bold">{activeCouponsCount}</div>
				</div>
			</div>

			{/* Tabs Switcher */}
			<div className="flex flex-wrap items-center gap-2 p-1 rounded-full border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xs w-fit">
				<button
					onClick={() => setActiveTab('items')}
					className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
						activeTab === 'items' ? 'bg-(--accent) text-white shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
					}`}
				>
					<ShoppingBag size={14} /> {t('admin.store.tabs.items')}
				</button>
				<button
					onClick={() => setActiveTab('categories')}
					className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
						activeTab === 'categories' ? 'bg-(--accent) text-white shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
					}`}
				>
					<Folder size={14} /> {t('admin.store.tabs.categories')}
				</button>
				<button
					onClick={() => setActiveTab('coupons')}
					className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
						activeTab === 'coupons' ? 'bg-(--accent) text-white shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
					}`}
				>
					<TicketPercent size={14} /> {t('admin.store.tabs.coupons')}
				</button>
			</div>

			{/* Tab Content */}
			{activeTab === 'items' ? (
				<StoreItemsTab
					items={items}
					categories={categories}
					onEdit={(item) => {
						setSelectedItem(item);
						setItemModalOpen(true);
					}}
					onToggleEnabled={handleToggleItemEnabled}
					onQuickDiscount={handleQuickDiscount}
					onDelete={handleDeleteItem}
				/>
			) : activeTab === 'categories' ? (
				<StoreCategoriesTab
					categories={categories}
					onEdit={(cat) => {
						setSelectedCategory(cat);
						setCategoryModalOpen(true);
					}}
					onToggleEnabled={handleToggleCategoryEnabled}
					onDelete={handleDeleteCategory}
				/>
			) : (
				<StoreCouponsTab
					coupons={coupons}
					onEdit={(coupon) => {
						setSelectedCoupon(coupon);
						setCouponModalOpen(true);
					}}
					onToggleEnabled={handleToggleCouponEnabled}
					onDelete={handleDeleteCoupon}
				/>
			)}

			{/* Modals */}
			<ItemModal isOpen={itemModalOpen} onClose={() => setItemModalOpen(false)} item={selectedItem} categories={categories} onSave={handleSaveItem} />

			<CategoryModal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} category={selectedCategory} onSave={handleSaveCategory} />

			<CouponModal isOpen={couponModalOpen} onClose={() => setCouponModalOpen(false)} coupon={selectedCoupon} onSave={handleSaveCoupon} />
		</div>
	);
}
