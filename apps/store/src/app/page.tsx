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
	const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
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
			const loadedItems: CatalogItem[] = data.items || [];
			setCategories(cats);
			setItems(loadedItems);
			const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
			const urlItem = searchParams?.get('item');
			const urlCat = searchParams?.get('category');
			const matchedItem = urlItem ? loadedItems.find((i) => i.id === urlItem || i.skuId === urlItem) : null;
			if (matchedItem) {
				setHighlightedItemId(matchedItem.id);
				setActiveCategory(matchedItem.categoryId);
				setTimeout(() => {
					const el = document.getElementById(`store-item-${matchedItem.id}`);
					el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}, 180);
			} else if (urlCat && cats.some((c) => c.id === urlCat)) {
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

	const getActiveSubscription = useCallback(
		(priceId: string | null, item?: CatalogItem): UserSubscription | null => {
			const now = Date.now();
			const validSubs = subscriptions.filter((sub) => {
				if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) return false;
				if (!sub.currentPeriodEnd) return true;
				const endMs = new Date(sub.currentPeriodEnd).getTime();
				return Number.isNaN(endMs) || endMs > now;
			});

			const isUserUltra =
				Boolean(user?.staffSubscription) ||
				validSubs.some((sub) => {
					const pid = String(sub.priceId || '').toLowerCase();
					const sid = String(sub.stripeSubscriptionId || '').toLowerCase();
					return pid === 'ultra' || pid === 'prod_v0pd5uxotqkrys' || sid === 'staff_infinite_sub' || sid.includes('ultra');
				});

			if (item?.id === 'ultra' && isUserUltra) {
				const matchedUltraSub = validSubs.find((sub) => {
					const pid = String(sub.priceId || '').toLowerCase();
					const sid = String(sub.stripeSubscriptionId || '').toLowerCase();
					return pid === 'ultra' || pid === String(item.skuId || '').toLowerCase() || sid === 'staff_infinite_sub' || sid.includes('ultra') || item.prices?.some((p) => p.id === sub.priceId);
				});
				return (
					matchedUltraSub || {
						stripeSubscriptionId: 'staff_infinite_sub',
						priceId: 'ultra',
						status: 'active',
						currentPeriodEnd: '',
					}
				);
			}

			if (item) {
				const itemPrices = new Set((item.prices || []).map((p) => p.id));
				const itemIdLower = String(item.id || '').toLowerCase();
				const itemSkuLower = String(item.skuId || '').toLowerCase();
				const matchedItemSub = validSubs.find((sub) => {
					const pid = String(sub.priceId || '');
					const pidLower = pid.toLowerCase();
					const sidLower = String(sub.stripeSubscriptionId || '').toLowerCase();
					return (
						(priceId && pid === priceId) ||
						itemPrices.has(pid) ||
						(itemIdLower && pidLower === itemIdLower) ||
						(itemSkuLower && pidLower === itemSkuLower) ||
						(itemIdLower && sidLower.includes(itemIdLower))
					);
				});
				if (matchedItemSub) return matchedItemSub;

				if (item.categoryId === 'consumers' && item.id.startsWith('bot-') && isUserUltra) {
					return {
						stripeSubscriptionId: 'included_in_ultra',
						priceId: 'ultra',
						status: 'active',
						currentPeriodEnd: '',
					};
				}
			}

			if (!priceId) return null;
			return validSubs.find((sub) => sub.priceId === priceId) || null;
		},
		[subscriptions, user?.staffSubscription]
	);

	const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0];
	const currentItems = items.filter((i) => i.categoryId === currentCategory?.id);

	// Compute discount for current category
	const categoryMaxDiscount = currentItems.reduce((max, item) => Math.max(max, item.discountPercent || 0), 0);

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full min-h-screen pt-24 px-4 sm:px-8 pb-24">
			<div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-6 mb-8 border-b border-(--border)/10 relative z-30">
				<div className="flex flex-col gap-1.5">
					<h1 className="text-3xl sm:text-4xl font-black tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.store.title')}
					</h1>
					<p className="text-sm sm:text-base text-(--text-muted) max-w-2xl">{t('account.store.description')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
					{/* Dynamic Ecosystem Categories Switcher */}
					{categories.length > 0 && (
						<div className="flex flex-wrap items-center gap-1 p-1 h-10 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xs">
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
										className={`h-full px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
											isActive ? 'bg-(--accent) text-white shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
										}`}
									>
										<IconComponent size={14} /> {cat.name}
									</button>
								);
							})}
						</div>
					)}

					{/* Global Billing Interval Toggle (Only for recurring subscription categories) */}
					{currentCategory && currentCategory.id !== 'credits' && (
						<div className="flex items-center gap-1 p-1 h-10 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xs">
							<button
								onClick={() => {
									setBillingInterval('month');
									updateStoreUrlParams(currentCategory?.id, 'month');
								}}
								className={`h-full px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
								className={`h-full px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
									billingInterval === 'year' ? 'bg-(--background) text-(--text) shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
								}`}
							>
								{t('account.store.billing.annually')}
								{categoryMaxDiscount > 0 && (
									<span className="bg-(--accent-green)/15 text-(--accent-green) px-1.5 py-0.5 rounded-lg text-[10px] font-bold">-{categoryMaxDiscount}%</span>
								)}
							</button>
						</div>
					)}

					{/* Promo Code Bar (Only for paid checkout categories) */}
					{currentCategory && currentCategory.id !== 'credits' && (
						<div className="flex items-center gap-2">
							{appliedCoupon ? (
								<div className="flex items-center gap-2 h-10 px-3.5 rounded-2xl bg-(--accent-green)/15 border border-(--accent-green)/30 text-xs font-bold text-(--accent-green)">
									<Check size={14} className="shrink-0" />
									<span className="font-mono tracking-wider">{appliedCoupon.code}</span>
									<span className="text-(--text) font-semibold">({appliedCoupon.discountType === 'amount' ? `-€${appliedCoupon.amountOff}` : `-${appliedCoupon.percentOff}%`})</span>
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
								<div className="flex items-center gap-1.5">
									<div className="w-48 sm:w-56">
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
					)}
				</div>
			</div>

			{/* Category View */}
			{loading ? (
				<div className="flex items-center justify-center py-24">
					<Loading variant="small" />
				</div>
			) : (
				currentCategory &&
				(currentCategory.id === 'credits' ? (
					<CreditStoreView items={currentItems} user={user} userLoading={userLoading || loading} mutateUser={mutate} actionLoading={actionLoading} onBuyCreditPack={handleBuyCreditPack} />
				) : (
					<DynamicCategoryView
						category={currentCategory}
						items={currentItems}
						billingInterval={billingInterval}
						userLoading={userLoading || loading}
						actionLoading={actionLoading}
						highlightedItemId={highlightedItemId}
						appliedCoupon={appliedCoupon}
						getActiveSubscription={getActiveSubscription}
						handleSubscribe={handleSubscribe}
						handleCancelClick={handleCancelClick}
					/>
				))
			)}

			<p className="mt-12 text-center text-xs text-(--text-muted) opacity-70">{t('account.store.taxNotice')}</p>
		</div>
	);
}
