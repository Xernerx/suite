/** @format */

'use client';

import { AlertCircle, Bot, Check, Code, Server, Sparkles, Zap } from 'lucide-react';
import { useDictionary, useSidebar, useUser, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { products } from '@xernerx/lib';
import { useRouter } from 'next/navigation';

interface UserSubscription {
	stripeSubscriptionId: string;
	priceId: string;
	status: string;
	currentPeriodEnd: string;
}

interface StripePrice {
	id: string;
	unitAmount: number;
	currency: string;
	interval: 'month' | 'year' | 'week' | 'day';
	intervalCount: number;
}

interface ProductData {
	name: string;
	description: string | null;
	prices: StripePrice[];
}

export default function StorePage() {
	const router = useRouter();
	const { t } = useDictionary();
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [productCache, setProductCache] = useState<Record<string, ProductData>>({});
	const [activeTab, setActiveTab] = useState<'consumers' | 'developers'>('consumers');
	const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
	const [loadingPrices, setLoadingPrices] = useState(true);

	const { hide } = useSidebar();
	const { user, loading: userLoading } = useUser() as { user: any; loading: boolean };
	const subscriptions: UserSubscription[] = user?.billing?.subscriptions || [];
	const { toast } = useToast();

	useEffect(() => {
		hide();

		async function fetchAllProducts() {
			setLoadingPrices(true);
			try {
				const allIds = [...products.developers, ...products.users, ...products.servers];
				const cacheMap: Record<string, ProductData> = {};

				for (const id of allIds) {
					const res = await fetch(`/api/store/${id}/product`);
					if (res.ok) {
						const data = await res.json();
						cacheMap[id] = {
							name: data.name || 'Product',
							description: data.description,
							prices: data.prices || [],
						};
					}
				}
				setProductCache(cacheMap);
			} catch (err) {
				console.error('Failed to fetch product data:', err);
			} finally {
				setLoadingPrices(false);
			}
		}
		fetchAllProducts();
	}, [hide]);

	const handleSubscribe = async (priceId: string | null) => {
		if (!priceId) return;
		setActionLoading(priceId);

		try {
			const response = await fetch('/api/store/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ priceId }),
			});

			if (!response.ok) throw new Error('Network response was not ok');

			const data = await response.json();

			if (data.url) {
				window.location.assign(data.url);
			}
		} catch (error: any) {
			console.error('Failed to create checkout session:', error);
			toast({ type: 'error', title: 'Failed to create checkout session', description: error.message });
			setActionLoading(null);
		}
	};

	const handleCancelClick = (subscriptionId: string) => {
		router.push(`/store/${subscriptionId}/cancel`);
	};

	const getActiveSubscription = (priceId: string | null) => {
		if (!priceId) return null;
		return subscriptions.find((sub) => sub.priceId === priceId && (sub.status === 'active' || sub.status === 'trialing'));
	};

	const ultraProductId = products.users[products.users.length - 1];
	const individualBotProductIds = products.users.slice(0, -1);
	const serverProductIds = products.servers;
	const developerProductIds = products.developers;

	const ultraProduct = productCache[ultraProductId];
	const monthlyUltra = ultraProduct?.prices.find((p) => p.interval === 'month' && p.intervalCount === 1);
	const yearlyUltra = ultraProduct?.prices.find((p) => p.interval === 'year' && p.intervalCount === 1);
	const currentUltraPrice = billingInterval === 'month' ? monthlyUltra : yearlyUltra;

	const devProductId = developerProductIds[0];
	const devProduct = productCache[devProductId];
	const monthlyDev = devProduct?.prices.find((p) => p.interval === 'month' && p.intervalCount === 1);
	const yearlyDev = devProduct?.prices.find((p) => p.interval === 'year' && p.intervalCount === 1);

	const calculateDiscount = (monthly: StripePrice | undefined, yearly: StripePrice | undefined) => {
		if (!monthly || !yearly) return 0;
		const monthlyCostForYear = monthly.unitAmount * 12;
		const yearlyCost = yearly.unitAmount;
		if (yearlyCost >= monthlyCostForYear) return 0;
		return Math.round(((monthlyCostForYear - yearlyCost) / monthlyCostForYear) * 100);
	};
	const ultraDiscount = calculateDiscount(monthlyUltra, yearlyUltra);
	const devDiscount = calculateDiscount(monthlyDev, yearlyDev);

	const currentTabDiscount = activeTab === 'consumers' ? ultraDiscount : devDiscount;

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8 transition-colors duration-200">
			<div className="max-w-4xl w-full flex flex-col items-center space-y-4 mb-8">
				<h1 className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('account.store.title')}
				</h1>
				<p className="text-(--text-muted) text-lg text-center max-w-2xl">{t('account.store.description')}</p>

				{/* Ecosystem Tab Switcher */}
				<div className="flex items-center gap-2 p-1.5 rounded-full border border-(--border)/10 bg-(--foreground) mt-2">
					<button
						onClick={() => setActiveTab('consumers')}
						className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
							activeTab === 'consumers' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						<Bot size={16} /> {t('account.store.tabs.consumers')}
					</button>
					<button
						onClick={() => setActiveTab('developers')}
						className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
							activeTab === 'developers' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						<Code size={16} /> {t('account.store.tabs.developers')}
					</button>
				</div>

				{/* Global Billing Interval Toggle */}
				<div className="flex items-center gap-2 p-1 rounded-full border border-(--border)/10 bg-(--foreground) mt-2">
					<button
						onClick={() => setBillingInterval('month')}
						className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
							billingInterval === 'month' ? 'bg-(--background) text-(--text) shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						Monthly
					</button>
					<button
						onClick={() => setBillingInterval('year')}
						className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
							billingInterval === 'year' ? 'bg-(--background) text-(--text) shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						Annually
						{currentTabDiscount > 0 && <span className="bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-md text-[10px] font-bold">-{currentTabDiscount}%</span>}
					</button>
				</div>
			</div>

			{/* TAB 1: CONSUMERS, BOTS, SERVERS & ULTRA */}
			{activeTab === 'consumers' && (
				<div className="w-full max-w-6xl space-y-16">
					{/* Ultra Featured Bundle */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
						{/* Free Plan */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
							className="relative flex flex-col p-8 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md"
						>
							<div className="flex items-center gap-2 mb-4 text-(--text-muted)">
								<Bot size={22} />
								<span className="text-xs font-semibold uppercase tracking-wider">Basic</span>
							</div>

							<div className="mb-6">
								<h3 className="text-3xl font-extrabold mb-2 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									Free
								</h3>
								<p className="text-sm text-(--text-muted)">Essential access to the platform.</p>
							</div>

							<div className="mb-6 flex items-baseline gap-1">
								<span className="text-5xl font-bold">€0</span>
								<span className="text-(--text-muted) font-medium">
									{billingInterval === 'month' ? t('account.store.pricing.monthlySuffix') : t('account.store.pricing.yearlySuffix')}
								</span>
							</div>

							<ul className="flex-1 space-y-4 mb-8">
								{['Access to all Consumer Bots', '10 Media Uploads (CDN)'].map((feature) => (
									<li key={feature} className="flex items-start gap-3 text-sm text-(--text-muted)">
										<Check className="w-5 h-5 shrink-0 text-(--text-muted)" />
										<span>{feature}</span>
									</li>
								))}
							</ul>

							{!getActiveSubscription(currentUltraPrice?.id || null) ? (
								<button
									disabled
									className="w-full py-3 px-4 rounded-xl font-medium bg-(--background) text-(--text) border border-(--border)/10 flex items-center justify-center gap-2 cursor-default shadow-xs"
								>
									<Check size={16} className="text-green-500" /> Current Plan
								</button>
							) : (
								<button
									disabled
									className="w-full py-3 px-4 rounded-xl font-medium bg-transparent text-(--text-muted) border border-(--border)/5 flex items-center justify-center gap-2 cursor-default"
								>
									Included Free
								</button>
							)}
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
							className="relative flex flex-col p-8 rounded-3xl border-2 border-(--accent) bg-(--foreground)/30 backdrop-blur-md shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
						>
							<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-(--accent) text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-sm">
								<Sparkles size={12} />
								{t('account.store.ultra.badge')}
							</div>

							<div className="flex items-center gap-2 mb-4" style={{ color: 'var(--accent)' }}>
								<Zap size={22} />
								<span className="text-xs font-semibold uppercase tracking-wider">{t('account.store.ultra.subtitle')}</span>
							</div>

							<div className="mb-6">
								<h3 className="text-3xl font-extrabold mb-2 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{ultraProduct?.name || t('account.store.ultra.fallbackName')}
								</h3>
								<p className="text-sm text-(--text-muted)">{ultraProduct?.description || t('account.store.ultra.fallbackDesc')}</p>
							</div>

							<div className="mb-6 flex items-baseline gap-1">
								<span className="text-5xl font-bold">{loadingPrices ? '...' : currentUltraPrice ? `€${(currentUltraPrice.unitAmount / 100).toFixed(0)}` : '—'}</span>
								<span className="text-(--text-muted) font-medium">
									{billingInterval === 'month' ? t('account.store.pricing.monthlySuffix') : t('account.store.pricing.yearlySuffix')}
								</span>
							</div>

							<ul className="flex-1 space-y-4 mb-8">
								{['Premium Access to all Consumer Bots', 'All server-level utility subscriptions', '1,000 Media Uploads (CDN)'].map((feature) => (
									<li key={feature} className="flex items-start gap-3 text-sm text-(--text-muted)">
										<Check className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
										<span>{feature}</span>
									</li>
								))}
							</ul>

							{userLoading || loadingPrices ? (
								<div className="w-full py-3 px-4 rounded-xl bg-(--background) text-(--text-muted) text-center text-sm animate-pulse">{t('account.store.buttons.loading')}</div>
							) : getActiveSubscription(currentUltraPrice?.id || null) ? (
								<div className="space-y-2">
									<button
										onClick={() => handleCancelClick(getActiveSubscription(currentUltraPrice?.id || null)!.stripeSubscriptionId)}
										className="w-full py-3 px-4 rounded-xl font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
									>
										<AlertCircle size={16} />
										{t('account.store.buttons.cancelUltra')}
									</button>
									<p className="text-xs text-center text-(--text-muted)">
										{t('account.store.buttons.activeUntil', { date: new Date(getActiveSubscription(currentUltraPrice?.id || null)!.currentPeriodEnd).toLocaleDateString() })}
									</p>
								</div>
							) : (
								<button
									onClick={() => handleSubscribe(currentUltraPrice?.id || null)}
									disabled={!currentUltraPrice || actionLoading === currentUltraPrice?.id}
									className="w-full py-3 px-4 rounded-xl font-medium bg-(--accent) hover:bg-(--hover-accent) text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
								>
									<Zap size={16} />
									{actionLoading === currentUltraPrice?.id ? t('account.store.buttons.redirecting') : t('account.store.buttons.getUltra')}
								</button>
							)}
						</motion.div>
					</div>

					{/* Individual Bot Passes */}
					{individualBotProductIds.length > 0 && (
						<div>
							<h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
								<Bot style={{ color: 'var(--accent)' }} /> {t('account.store.sections.bots')}
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
								{individualBotProductIds.map((botProdId) => {
									const botData = productCache[botProdId];
									const activePrice = botData?.prices.find((p) => p.interval === billingInterval);

									return (
										<div
											key={botProdId}
											className="p-6 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md flex flex-col justify-between shadow-sm hover:border-(--accent)/50 hover:bg-(--foreground)/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)] transition-all"
										>
											<div>
												<h4 className="text-xl font-bold mb-1 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
													{botData?.name || t('account.store.buttons.loading')}
												</h4>
												<p className="text-xs text-(--text-muted) mb-6 min-h-7.5">{botData?.description || t('account.store.cards.botFallback')}</p>
												<div className="text-3xl font-bold mb-6">
													{loadingPrices ? '...' : activePrice ? `€${(activePrice.unitAmount / 100).toFixed(0)}` : '—'}
													<span className="text-xs text-(--text-muted) font-normal">
														/{billingInterval === 'month' ? t('account.store.pricing.monthShort') : t('account.store.pricing.yearShort')}
													</span>
												</div>
											</div>

											{getActiveSubscription(activePrice?.id || null) ? (
												<button
													onClick={() => handleCancelClick(getActiveSubscription(activePrice?.id || null)!.stripeSubscriptionId)}
													className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 cursor-pointer"
												>
													{t('account.store.buttons.cancelPass')}
												</button>
											) : (
												<button
													onClick={() => handleSubscribe(activePrice?.id || null)}
													disabled={!activePrice || actionLoading === activePrice?.id}
													className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-(--background) hover:bg-[var(--border)/10] border border-(--border)/10 transition-colors disabled:opacity-50 cursor-pointer"
												>
													{actionLoading === activePrice?.id ? t('account.store.buttons.redirecting') : t('account.store.buttons.getPass')}
												</button>
											)}
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Server Passes */}
					{serverProductIds.length > 0 && (
						<div>
							<h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
								<Server style={{ color: 'var(--accent)' }} /> {t('account.store.sections.servers')}
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{serverProductIds.map((serverProdId) => {
									const serverData = productCache[serverProdId];
									const activePrice = serverData?.prices.find((p) => p.interval === billingInterval);

									return (
										<div
											key={serverProdId}
											className="p-6 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md flex flex-col justify-between shadow-sm hover:border-(--accent)/50 hover:bg-(--foreground)/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)] transition-all"
										>
											<div>
												<h4 className="text-xl font-bold mb-1 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
													{serverData?.name || t('account.store.buttons.loading')}
												</h4>
												<p className="text-xs text-(--text-muted) mb-6 min-h-7.5">{serverData?.description || t('account.store.cards.serverFallback')}</p>
												<div className="text-3xl font-bold mb-6">
													{loadingPrices ? '...' : activePrice ? `€${(activePrice.unitAmount / 100).toFixed(0)}` : '—'}
													<span className="text-xs text-(--text-muted) font-normal">
														/{billingInterval === 'month' ? t('account.store.pricing.monthShort') : t('account.store.pricing.yearShort')}
													</span>
												</div>
											</div>

											{getActiveSubscription(activePrice?.id || null) ? (
												<button
													onClick={() => handleCancelClick(getActiveSubscription(activePrice?.id || null)!.stripeSubscriptionId)}
													className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 cursor-pointer"
												>
													{t('account.store.buttons.cancelPass')}
												</button>
											) : (
												<button
													onClick={() => handleSubscribe(activePrice?.id || null)}
													disabled={!activePrice || actionLoading === activePrice?.id}
													className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-(--background) hover:bg-[var(--border)/10] border border-(--border)/10 transition-colors disabled:opacity-50 cursor-pointer"
												>
													{actionLoading === activePrice?.id ? t('account.store.buttons.redirecting') : t('account.store.buttons.getPass')}
												</button>
											)}
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			)}

			{/* TAB 2: DEVELOPERS & API ECOSYSTEM */}
			{activeTab === 'developers' && (
				<div className="w-full max-w-4xl">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						{/* Free Developer Tier */}
						<div className="relative flex flex-col p-6 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm">
							<div className="flex items-center gap-2 mb-4" style={{ color: 'var(--accent)' }}>
								<Code size={20} />
								<span className="text-xs font-semibold uppercase tracking-wider">{t('account.store.developer.free.badge')}</span>
							</div>

							<div className="mb-6">
								<h3 className="text-2xl font-bold mb-2 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('account.store.developer.free.title')}
								</h3>
								<p className="text-sm text-(--text-muted) min-h-10">{t('account.store.developer.free.desc')}</p>
							</div>

							<div className="mb-6 flex items-baseline gap-1">
								<span className="text-4xl font-bold">{t('account.store.developer.free.price')}</span>
							</div>

							<ul className="flex-1 space-y-4 mb-8">
								{[t('account.store.developer.free.features.standardApi'), t('account.store.developer.free.features.projects')].map((feature) => (
									<li key={feature} className="flex items-start gap-3 text-sm text-(--text-muted)">
										<Check className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
										<span>{feature}</span>
									</li>
								))}
							</ul>

							<button disabled className="w-full py-3 px-4 rounded-xl font-medium bg-(--background) text-(--text-muted) border border-(--border)/10 cursor-default">
								{t('account.store.buttons.currentPlan')}
							</button>
						</div>

						{/* Paid Developer / API Products */}
						{developerProductIds.map((devProdId) => {
							const devData = productCache[devProdId];
							const activePrice = devData?.prices.find((p) => p.interval === billingInterval);

							return (
								<div
									key={devProdId}
									className="relative flex flex-col p-6 rounded-3xl border border-(--accent) bg-(--foreground)/30 backdrop-blur-md shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)] transition-all"
								>
									<div className="flex items-center gap-2 mb-4" style={{ color: 'var(--accent)' }}>
										<Code size={20} />
										<span className="text-xs font-semibold uppercase tracking-wider">{t('account.store.developer.pro.badge')}</span>
									</div>

									<div className="mb-6">
										<h3 className="text-2xl font-bold mb-2 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{devData?.name || t('account.store.developer.pro.fallbackName')}
										</h3>
										<p className="text-sm text-(--text-muted) min-h-10">{devData?.description || t('account.store.developer.pro.fallbackDesc')}</p>
									</div>

									<div className="mb-6 flex items-baseline gap-1">
										<span className="text-4xl font-bold">{loadingPrices ? '...' : activePrice ? `€${(activePrice.unitAmount / 100).toFixed(0)}` : '—'}</span>
										<span className="text-(--text-muted) font-medium">
											{billingInterval === 'month' ? t('account.store.pricing.monthlySuffix') : t('account.store.pricing.yearlySuffix')}
										</span>
									</div>

									<ul className="flex-1 space-y-4 mb-8">
										{[
											t('account.store.developer.pro.features.advancedApi'),
											t('account.store.developer.pro.features.rateLimits'),
											t('account.store.developer.pro.features.unlimitedProjects'),
										].map((feature) => (
											<li key={feature} className="flex items-start gap-3 text-sm text-(--text-muted)">
												<Check className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
												<span>{feature}</span>
											</li>
										))}
									</ul>

									{getActiveSubscription(activePrice?.id || null) ? (
										<button
											onClick={() => handleCancelClick(getActiveSubscription(activePrice?.id || null)!.stripeSubscriptionId)}
											className="w-full py-3 px-4 rounded-xl font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 cursor-pointer"
										>
											{t('account.store.buttons.cancelApi')}
										</button>
									) : (
										<button
											onClick={() => handleSubscribe(activePrice?.id || null)}
											disabled={!activePrice || actionLoading === activePrice?.id}
											className="w-full py-3 px-4 rounded-xl font-medium bg-(--accent) hover:bg-(--hover-accent) text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm"
										>
											{actionLoading === activePrice?.id ? t('account.store.buttons.redirecting') : t('account.store.buttons.upgradeApi')}
										</button>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			<p className="mt-12 text-center text-xs text-(--text-muted) opacity-70">Locale prices and applicable taxes are calculated securely at checkout.</p>
		</div>
	);
}
