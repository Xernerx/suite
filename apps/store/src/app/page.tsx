/** @format */

'use client';

import { Bot, Code, Coins, Server, Sparkles, Tag, ShoppingBag, TicketPercent, X, Check } from 'lucide-react';
import { useDictionary, useEnvironment, useSidebar, useToast, useUser } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Input } from '@xernerx/ui';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CatalogCategory, CatalogItem, UserSubscription } from '../components/types';
import { DynamicCategoryView } from '../components/DynamicCategoryView';
import { CreditStoreView } from '../components/CreditStoreView';

const ICONS_MAP: Record<string, any> = {
	Bot,
	Code,
	Coins,
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
	const { user, loading: userLoading, mutate } = useUser() as { user: any; loading: boolean; mutate?: () => Promise<any> };

	const [categories, setCategories] = useState<CatalogCategory[]>([]);
	const [items, setItems] = useState<CatalogItem[]>([]);
	const [activeCategory, setActiveCategory] = useState<string>('');
	const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [promoInput, setPromoInput] = useState('');
	const [validatingPromo, setValidatingPromo] = useState(false);
	const [appliedCoupon, setAppliedCoupon] = useState<{
		code: string;
		name: string;
		discountType: 'percent' | 'amount';
		percentOff: number;
		amountOff: number;
	} | null>(null);

	const handleApplyPromoCode = useCallback(
		async (codeOverride?: string, silent = false) => {
			const trimmed = (codeOverride ?? promoInput).trim().toUpperCase();
			if (!trimmed) return;
			setValidatingPromo(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/coupons?code=${encodeURIComponent(trimmed)}`), {
					credentials: 'include',
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok || !data.valid || !data.coupon) {
					throw new Error(data.error || t('account.store.promo.invalidCode'));
				}
				setAppliedCoupon(data.coupon);
				setPromoInput(data.coupon.code);
				if (typeof window !== 'undefined') {
					try {
						sessionStorage.setItem('xernerx_store_promo', JSON.stringify(data.coupon));
					} catch {}
				}
				if (!silent) {
					toast({
						type: 'success',
						title: t('account.store.promo.appliedToast', { code: data.coupon.code }),
					});
				}
			} catch (err: any) {
				if (!silent) {
					toast({
						type: 'error',
						title: err.message || t('account.store.promo.invalidCode'),
					});
				}
			} finally {
				setValidatingPromo(false);
			}
		},
		[promoInput, getEnvUrl, t, toast]
	);

	const subscriptions: UserSubscription[] = user?.subscriptions || user?.billing?.subscriptions || [];

	const updateStoreUrlParams = useCallback((nextCategory?: string, nextInterval?: 'month' | 'year') => {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		if (nextCategory) params.set('category', nextCategory);
		if (nextInterval) params.set('interval', nextInterval);
		const qs = params.toString();
		window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined' || !isReady) return;
		const params = new URLSearchParams(window.location.search);
		const urlInterval = params.get('interval');
		if (urlInterval === 'year' || urlInterval === 'month') {
			setBillingInterval(urlInterval);
		}
		const urlPromo = params.get('promo') || params.get('code');
		if (urlPromo) {
			handleApplyPromoCode(urlPromo, false);
			return;
		}
		try {
			const stored = sessionStorage.getItem('xernerx_store_promo');
			if (stored) {
				const parsed = JSON.parse(stored);
				if (parsed?.code) {
					setAppliedCoupon(parsed);
				}
			}
		} catch {}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isReady]);

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
			} else if (cats.length > 0) {
				setActiveCategory((prev) => (prev && cats.some((c) => c.id === prev) ? prev : cats[0].id));
			}
		} catch (err: any) {
			console.error('Failed to fetch store catalog:', err);
		} finally {
			setLoading(false);
		}
	}, [getEnvUrl, isReady]);

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
			const effectiveDiscount = appliedCoupon?.discountType === 'percent' ? Math.max(discountPercent, appliedCoupon.percentOff || 0) : discountPercent;
			const response = await fetch(getEnvUrl('https://api.xernerx.com/secure/store/checkout'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					priceId,
					discountPercent: effectiveDiscount,
					promoCode: appliedCoupon?.code || undefined,
				}),
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

	const handleBuyCreditPack = async (priceId: string, pack: CatalogItem) => {
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
				body: JSON.stringify({
					priceId,
					discountPercent: appliedCoupon?.discountType === 'percent' ? Math.max(pack.discountPercent || 0, appliedCoupon.percentOff || 0) : pack.discountPercent || 0,
					promoCode: appliedCoupon?.code || undefined,
					itemType: 'credit_pack',
					itemId: pack.id,
					creditAmount: pack.creditAmount || 0,
				}),
			});
			if (!response.ok) throw new Error('Network response was not ok');
			const data = await response.json();
			if (data.url) {
				window.location.assign(data.url);
			}
		} catch (error: any) {
			console.error('Failed to create credit checkout session:', error);
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

	if (loading) return <Loading />;

	return (
		<div
			className="flex flex-col items-center justify-center max-w-(--page-width) mx-auto w-full min-h-screen transition-colors duration-200"
			style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
		>
			<div className="max-w-4xl w-full flex flex-col items-center mb-4" style={{ gap: 'var(--ui-gap)' }}>
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

				{/* Global Billing Interval Toggle (Only for recurring subscription categories) */}
				{currentCategory?.id !== 'credits' && (
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
							{categoryMaxDiscount > 0 && <span className="bg-(--accent-green)/10 text-(--accent-green) px-1.5 py-0.5 rounded-xl text-[10px] font-bold">-{categoryMaxDiscount}%</span>}
						</button>
					</div>
				)}

				{/* Promo Code Bar */}
				<div className="flex flex-wrap items-center justify-center gap-2 mt-1 w-full max-w-md">
					{appliedCoupon ? (
						<div className="flex items-center justify-between gap-3 w-full px-4 py-2.5 rounded-2xl bg-(--accent-green)/15 border border-(--accent-green)/30 text-xs font-bold text-(--accent-green)">
							<div className="flex items-center gap-2 min-w-0">
								<Check size={14} className="shrink-0" />
								<span className="font-mono tracking-wider">{appliedCoupon.code}</span>
								<span className="text-(--text) font-semibold truncate">
									({appliedCoupon.discountType === 'amount' ? `-€${appliedCoupon.amountOff}` : `-${appliedCoupon.percentOff}%`})
								</span>
							</div>
							<button
								type="button"
								onClick={() => {
									setAppliedCoupon(null);
									setPromoInput('');
									if (typeof window !== 'undefined') {
										try {
											sessionStorage.removeItem('xernerx_store_promo');
											const params = new URLSearchParams(window.location.search);
											params.delete('promo');
											params.delete('code');
											const qs = params.toString();
											window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
										} catch {}
									}
								}}
								className="p-1 rounded-lg hover:bg-(--background)/50 text-(--text-muted) hover:text-(--text) transition-colors cursor-pointer"
								aria-label={t('account.store.promo.remove')}
							>
								<X size={14} />
							</button>
						</div>
					) : (
						<div className="flex items-center gap-2 w-full">
							<div className="flex-1">
								<Input
									value={promoInput}
									onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleApplyPromoCode();
										}
									}}
									placeholder={t('account.store.promo.placeholder')}
								/>
							</div>
							<Button
								variant="secondary"
								size="sm"
								loading={validatingPromo}
								disabled={!promoInput.trim()}
								onClick={() => handleApplyPromoCode()}
								className="flex items-center gap-1.5 shrink-0"
							>
								<TicketPercent size={14} className="text-(--accent)" />
								<span>{t('account.store.promo.applyButton')}</span>
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Category View */}
			{currentCategory &&
				(currentCategory.id === 'credits' ? (
					<CreditStoreView items={currentItems} user={user} userLoading={userLoading || loading} mutateUser={mutate} actionLoading={actionLoading} onBuyCreditPack={handleBuyCreditPack} />
				) : (
					<DynamicCategoryView
						category={currentCategory}
						items={currentItems}
						billingInterval={billingInterval}
						userLoading={userLoading || loading}
						actionLoading={actionLoading}
						appliedCoupon={appliedCoupon}
						getActiveSubscription={getActiveSubscription}
						handleSubscribe={handleSubscribe}
						handleCancelClick={handleCancelClick}
					/>
				))}

			<p className="mt-12 text-center text-xs text-(--text-muted) opacity-70">{t('account.store.taxNotice')}</p>
		</div>
	);
}
