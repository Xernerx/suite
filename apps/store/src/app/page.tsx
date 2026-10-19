/** @format */

'use client';

import { Bot, Code, Server, Sparkles, Tag, ShoppingBag } from 'lucide-react';
import { useDictionary, useEnvironment, useSidebar, useToast, useUser } from '@xernerx/providers';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CatalogCategory, CatalogItem, UserSubscription } from '../components/types';
import { DynamicCategoryView } from '../components/DynamicCategoryView';

const ICONS_MAP: Record<string, any> = {
	Bot,
	Code,
	Server,
	Sparkles,
	Tag,
	ShoppingBag,
};

export default function StorePage() {
	const router = useRouter();
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const { hide } = useSidebar();
	const { user, loading: userLoading } = useUser() as { user: any; loading: boolean };

	const [categories, setCategories] = useState<CatalogCategory[]>([]);
	const [items, setItems] = useState<CatalogItem[]>([]);
	const [activeCategory, setActiveCategory] = useState<string>('');
	const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const subscriptions: UserSubscription[] = user?.billing?.subscriptions || [];

	const updateStoreUrlParams = useCallback((nextCategory?: string, nextInterval?: 'month' | 'year') => {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		if (nextCategory) params.set('category', nextCategory);
		if (nextInterval) params.set('interval', nextInterval);
		const qs = params.toString();
		window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		const urlInterval = params.get('interval');
		if (urlInterval === 'year' || urlInterval === 'month') {
			setBillingInterval(urlInterval);
		}
	}, []);

	const fetchCatalog = useCallback(async () => {
		if (!isReady) return;
		setLoading(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/store/catalog'), {
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed to load store catalog');
			const data = await res.json();
			const cats: CatalogCategory[] = data.categories || [];
			setCategories(cats);
			setItems(data.items || []);
			const urlCat = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('category') : null;
			if (urlCat && cats.some((c) => c.id === urlCat)) {
				setActiveCategory(urlCat);
			} else if (cats.length > 0 && (!activeCategory || !cats.some((c) => c.id === activeCategory))) {
				setActiveCategory(cats[0].id);
			}
		} catch (err: any) {
			console.error('Failed to fetch store catalog:', err);
		} finally {
			setLoading(false);
		}
	}, [getEnvUrl, isReady, activeCategory]);

	useEffect(() => {
		hide();
		fetchCatalog();
	}, [hide, fetchCatalog]);

	const handleSubscribe = async (priceId: string | null, discountPercent: number = 0) => {
		if (!priceId) return;
		if (!user) {
			if (typeof window !== 'undefined') {
				window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
			}
			return;
		}
		setActionLoading(priceId);

		try {
			const response = await fetch(getEnvUrl('https://api.xernerx.com/secure/store/checkout'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ priceId, discountPercent }),
			});

			if (!response.ok) throw new Error('Network response was not ok');

			const data = await response.json();
			if (data.url) {
				window.location.assign(data.url);
			}
		} catch (error: any) {
			console.error('Failed to create checkout session:', error);
			toast({ type: 'error', title: t('account.store.checkoutFailed'), description: error.message });
			setActionLoading(null);
		}
	};

	const handleCancelClick = (subscriptionId: string) => {
		router.push(`/${subscriptionId}/cancel`);
	};

	const getActiveSubscription = (priceId: string | null) => {
		if (!priceId) return null;
		return subscriptions.find((sub) => sub.priceId === priceId && (sub.status === 'active' || sub.status === 'trialing'));
	};

	const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0];
	const currentItems = items.filter((i) => i.categoryId === currentCategory?.id);

	// Compute discount for current category
	const categoryMaxDiscount = currentItems.reduce((max, item) => Math.max(max, item.discountPercent || 0), 0);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8 transition-colors duration-200">
			<div className="max-w-4xl w-full flex flex-col items-center space-y-4 mb-8">
				<h1 className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('account.store.title')}
				</h1>
				<p className="text-(--text-muted) text-lg text-center max-w-2xl">{t('account.store.description')}</p>

				{/* Dynamic Ecosystem Categories Switcher */}
				{categories.length > 0 && (
					<div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-full border border-(--border)/10 bg-(--foreground) mt-2">
						{categories.map((cat) => {
							const IconComponent = ICONS_MAP[cat.icon] || ShoppingBag;
							const isActive = cat.id === currentCategory?.id;

							return (
								<button
									key={cat.id}
									onClick={() => {
										setActiveCategory(cat.id);
										updateStoreUrlParams(cat.id, billingInterval);
									}}
									className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
										isActive ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
									}`}
								>
									<IconComponent size={16} /> {cat.name}
								</button>
							);
						})}
					</div>
				)}

				{/* Global Billing Interval Toggle */}
				<div className="flex items-center gap-2 p-1 rounded-full border border-(--border)/10 bg-(--foreground) mt-2">
					<button
						onClick={() => {
							setBillingInterval('month');
							updateStoreUrlParams(currentCategory?.id, 'month');
						}}
						className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
							billingInterval === 'month' ? 'bg-(--background) text-(--text) shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						{t('account.store.billing.monthly')}
					</button>
					<button
						onClick={() => {
							setBillingInterval('year');
							updateStoreUrlParams(currentCategory?.id, 'year');
						}}
						className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
							billingInterval === 'year' ? 'bg-(--background) text-(--text) shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						{t('account.store.billing.annually')}
						{categoryMaxDiscount > 0 && <span className="bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-md text-[10px] font-bold">-{categoryMaxDiscount}%</span>}
					</button>
				</div>
			</div>

			{/* Dynamic Category View */}
			{currentCategory && (
				<DynamicCategoryView
					category={currentCategory}
					items={currentItems}
					billingInterval={billingInterval}
					userLoading={userLoading || loading}
					actionLoading={actionLoading}
					getActiveSubscription={getActiveSubscription}
					handleSubscribe={handleSubscribe}
					handleCancelClick={handleCancelClick}
				/>
			)}

			<p className="mt-12 text-center text-xs text-(--text-muted) opacity-70">{t('account.store.taxNotice')}</p>
		</div>
	);
}
