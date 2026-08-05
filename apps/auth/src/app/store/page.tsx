/** @format */

'use client';

import { AlertCircle, Bot, Check, Code, Server, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSidebar, useUser } from '@xernerx/providers';

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
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [productCache, setProductCache] = useState<Record<string, ProductData>>({});
	const [activeTab, setActiveTab] = useState<'consumers' | 'developers'>('consumers');
	const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
	const [loadingPrices, setLoadingPrices] = useState(true);

	const { hide } = useSidebar();
	const { user, loading: userLoading } = useUser() as { user: any; loading?: boolean };
	const subscriptions: UserSubscription[] = user?.subscriptions || [];

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
	}, []);

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
		} catch (error) {
			console.error('Failed to create checkout session:', error);
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

	const hasAnyActivePaidPlan = subscriptions.some((sub) => sub.status === 'active' || sub.status === 'trialing');

	const ultraProductId = products.users[products.users.length - 1];
	const individualBotProductIds = products.users.slice(0, -1);
	const serverProductIds = products.servers;
	const developerProductIds = products.developers;

	const ultraProduct = productCache[ultraProductId];
	const monthlyUltra = ultraProduct?.prices.find((p) => p.interval === 'month' && p.intervalCount === 1);
	const yearlyUltra = ultraProduct?.prices.find((p) => p.interval === 'year' && p.intervalCount === 1);
	const currentUltraPrice = billingInterval === 'month' ? monthlyUltra : yearlyUltra;

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8 transition-colors duration-200">
			<div className="max-w-4xl w-full flex flex-col items-center space-y-4 mb-8">
				<h1 className="text-4xl md:text-5xl font-bold tracking-tight">Xernerx Store</h1>
				<p className="text-(--text-muted) text-lg text-center max-w-2xl">
					Choose your ecosystem. Access individual bot passes and the all-in-one Ultra bundle, or manage your developer API tools.
				</p>

				{/* Ecosystem Tab Switcher */}
				<div className="flex items-center gap-2 p-1.5 rounded-full border border-(--border)/10 bg-(--foreground) mt-2">
					<button
						onClick={() => setActiveTab('consumers')}
						className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
							activeTab === 'consumers' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						<Bot size={16} /> Bots, Servers & Ultra
					</button>
					<button
						onClick={() => setActiveTab('developers')}
						className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
							activeTab === 'developers' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						<Code size={16} /> Developer API
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
						className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
							billingInterval === 'year' ? 'bg-(--background) text-(--text) shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
						}`}
					>
						Annually (Save 20%)
					</button>
				</div>
			</div>

			{/* TAB 1: CONSUMERS, BOTS, SERVERS & ULTRA */}
			{activeTab === 'consumers' && (
				<div className="w-full max-w-6xl space-y-16">
					{/* Ultra Featured Bundle */}
					<div className="grid grid-cols-1 md:grid-cols-1 gap-8 w-full max-w-xl mx-auto">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
							className="relative flex flex-col p-8 rounded-2xl border-2 border-(--accent) bg-(--foreground) shadow-xl"
						>
							<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-(--accent) text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-sm">
								<Sparkles size={12} />
								Ultimate Ecosystem Bundle
							</div>

							<div className="flex items-center gap-2 mb-4" style={{ color: 'var(--accent)' }}>
								<Zap size={22} />
								<span className="text-xs font-semibold uppercase tracking-wider">All-in-One Access</span>
							</div>

							<div className="mb-6">
								<h3 className="text-2xl font-semibold mb-2">{ultraProduct?.name || 'Ultra'}</h3>
								<p className="text-sm text-(--text-muted)">{ultraProduct?.description || 'Includes all user and server subscriptions of our bots in a single master pass.'}</p>
							</div>

							<div className="mb-6 flex items-baseline gap-1">
								<span className="text-5xl font-bold">{loadingPrices ? '...' : currentUltraPrice ? `€${(currentUltraPrice.unitAmount / 100).toFixed(0)}` : '—'}</span>
								<span className="text-(--text-muted) font-medium">{billingInterval === 'month' ? '/mo' : '/yr'}</span>
							</div>

							<ul className="flex-1 space-y-4 mb-8">
								{['Access to all consumer bots (Zodiac, Virtue, To-Do, Metamorphosis)', 'All server-level utility subscriptions', 'Priority support channel access'].map((feature) => (
									<li key={feature} className="flex items-start gap-3 text-sm text-(--text-muted)">
										<Check className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
										<span>{feature}</span>
									</li>
								))}
							</ul>

							{userLoading || loadingPrices ? (
								<div className="w-full py-3 px-4 rounded-xl bg-(--background) text-(--text-muted) text-center text-sm animate-pulse">Loading plan...</div>
							) : getActiveSubscription(currentUltraPrice?.id || null) ? (
								<div className="space-y-2">
									<button
										onClick={() => handleCancelClick(getActiveSubscription(currentUltraPrice?.id || null)!.stripeSubscriptionId)}
										className="w-full py-3 px-4 rounded-xl font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
									>
										<AlertCircle size={16} />
										Cancel Ultra Bundle
									</button>
									<p className="text-xs text-center text-(--text-muted)">
										Active until {new Date(getActiveSubscription(currentUltraPrice?.id || null)!.currentPeriodEnd).toLocaleDateString()}
									</p>
								</div>
							) : (
								<button
									onClick={() => handleSubscribe(currentUltraPrice?.id || null)}
									disabled={!currentUltraPrice || actionLoading === currentUltraPrice?.id}
									className="w-full py-3 px-4 rounded-xl font-medium bg-(--accent) hover:bg-(--hover-accent) text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
								>
									<Zap size={16} />
									{actionLoading === currentUltraPrice?.id ? 'Redirecting...' : 'Get Ultra Bundle'}
								</button>
							)}
						</motion.div>
					</div>

					{/* Individual Bot Passes */}
					{individualBotProductIds.length > 0 && (
						<div>
							<h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
								<Bot style={{ color: 'var(--accent)' }} /> Individual Bot Passes
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
								{individualBotProductIds.map((botProdId) => {
									const botData = productCache[botProdId];
									const activePrice = botData?.prices.find((p) => p.interval === billingInterval);

									return (
										<div key={botProdId} className="p-6 rounded-2xl border border-(--border)/10 bg-(--foreground) flex flex-col justify-between shadow-xs">
											<div>
												<h4 className="text-lg font-semibold mb-1">{botData?.name || 'Loading...'}</h4>
												<p className="text-xs text-(--text-muted) mb-6 min-h-7.5">{botData?.description || 'Individual bot license pass'}</p>
												<div className="text-3xl font-bold mb-6">
													{loadingPrices ? '...' : activePrice ? `€${(activePrice.unitAmount / 100).toFixed(0)}` : '—'}
													<span className="text-xs text-(--text-muted) font-normal">/{billingInterval === 'month' ? 'mo' : 'yr'}</span>
												</div>
											</div>

											{getActiveSubscription(activePrice?.id || null) ? (
												<button
													onClick={() => handleCancelClick(getActiveSubscription(activePrice?.id || null)!.stripeSubscriptionId)}
													className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 cursor-pointer"
												>
													Cancel Pass
												</button>
											) : (
												<button
													onClick={() => handleSubscribe(activePrice?.id || null)}
													disabled={!activePrice || actionLoading === activePrice?.id}
													className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-(--background) hover:bg-[var(--border)/10] border border-(--border)/10 transition-colors disabled:opacity-50 cursor-pointer"
												>
													{actionLoading === activePrice?.id ? 'Redirecting...' : 'Get Pass'}
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
								<Server style={{ color: 'var(--accent)' }} /> Server Infrastructure Passes
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{serverProductIds.map((serverProdId) => {
									const serverData = productCache[serverProdId];
									const activePrice = serverData?.prices.find((p) => p.interval === billingInterval);

									return (
										<div key={serverProdId} className="p-6 rounded-2xl border border-(--border)/10 bg-(--foreground) flex flex-col justify-between shadow-xs">
											<div>
												<h4 className="text-lg font-semibold mb-1">{serverData?.name || 'Loading...'}</h4>
												<p className="text-xs text-(--text-muted) mb-6 min-h-7.5">{serverData?.description || 'Server infrastructure pass'}</p>
												<div className="text-3xl font-bold mb-6">
													{loadingPrices ? '...' : activePrice ? `€${(activePrice.unitAmount / 100).toFixed(0)}` : '—'}
													<span className="text-xs text-(--text-muted) font-normal">/{billingInterval === 'month' ? 'mo' : 'yr'}</span>
												</div>
											</div>

											{getActiveSubscription(activePrice?.id || null) ? (
												<button
													onClick={() => handleCancelClick(getActiveSubscription(activePrice?.id || null)!.stripeSubscriptionId)}
													className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 cursor-pointer"
												>
													Cancel Pass
												</button>
											) : (
												<button
													onClick={() => handleSubscribe(activePrice?.id || null)}
													disabled={!activePrice || actionLoading === activePrice?.id}
													className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-(--background) hover:bg-[var(--border)/10] border border-(--border)/10 transition-colors disabled:opacity-50 cursor-pointer"
												>
													{actionLoading === activePrice?.id ? 'Redirecting...' : 'Get Pass'}
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
						<div className="relative flex flex-col p-6 rounded-2xl border border-(--border)/10 bg-(--foreground) shadow-xs">
							<div className="flex items-center gap-2 mb-4" style={{ color: 'var(--accent)' }}>
								<Code size={20} />
								<span className="text-xs font-semibold uppercase tracking-wider">API Access</span>
							</div>

							<div className="mb-6">
								<h3 className="text-xl font-semibold mb-2">Developer Free</h3>
								<p className="text-sm text-(--text-muted) min-h-10">Perfect for individual developers testing local environments and personal projects.</p>
							</div>

							<div className="mb-6 flex items-baseline gap-1">
								<span className="text-4xl font-bold">Free</span>
							</div>

							<ul className="flex-1 space-y-4 mb-8">
								{['Standard API access', '1 Project'].map((feature) => (
									<li key={feature} className="flex items-start gap-3 text-sm text-(--text-muted)">
										<Check className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
										<span>{feature}</span>
									</li>
								))}
							</ul>

							<button disabled className="w-full py-3 px-4 rounded-xl font-medium bg-(--background) text-(--text-muted) border border-(--border)/10 cursor-default">
								Current Plan
							</button>
						</div>

						{/* Paid Developer / API Products */}
						{developerProductIds.map((devProdId) => {
							const devData = productCache[devProdId];
							const activePrice = devData?.prices.find((p) => p.interval === billingInterval);

							return (
								<div key={devProdId} className="relative flex flex-col p-6 rounded-2xl border border-(--accent) bg-(--foreground) shadow-md">
									<div className="flex items-center gap-2 mb-4" style={{ color: 'var(--accent)' }}>
										<Code size={20} />
										<span className="text-xs font-semibold uppercase tracking-wider">Developer Pro</span>
									</div>

									<div className="mb-6">
										<h3 className="text-xl font-semibold mb-2">{devData?.name || 'API Suite'}</h3>
										<p className="text-sm text-(--text-muted) min-h-10">{devData?.description || 'Advanced API rate limits and custom domains.'}</p>
									</div>

									<div className="mb-6 flex items-baseline gap-1">
										<span className="text-4xl font-bold">{loadingPrices ? '...' : activePrice ? `€${(activePrice.unitAmount / 100).toFixed(0)}` : '—'}</span>
										<span className="text-(--text-muted) font-medium">/{billingInterval === 'month' ? 'mo' : 'yr'}</span>
									</div>

									<ul className="flex-1 space-y-4 mb-8">
										{['Advanced API access', 'Extended rate limits', 'Unlimited Projects'].map((feature) => (
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
											Cancel API Plan
										</button>
									) : (
										<button
											onClick={() => handleSubscribe(activePrice?.id || null)}
											disabled={!activePrice || actionLoading === activePrice?.id}
											className="w-full py-3 px-4 rounded-xl font-medium bg-(--accent) hover:bg-(--hover-accent) text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm"
										>
											{actionLoading === activePrice?.id ? 'Redirecting...' : 'Upgrade API'}
										</button>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
