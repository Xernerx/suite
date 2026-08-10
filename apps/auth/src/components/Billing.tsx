/** @format */
'use client';

import { AlertTriangle, CreditCard, ExternalLink, Loader2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@xernerx/ui';
import { useEnvironment, useUser } from '@xernerx/providers';
import { products } from '@xernerx/lib';

interface UserSubscription {
	stripeSubscriptionId: string;
	priceId: string;
	status: string;
	currentPeriodEnd: string;
}

interface EnrichedSubscription extends UserSubscription {
	productName: string;
	productDescription: string | null;
}

const allProductIds = [...products.users, ...products.developers, ...(products.servers || [])];

export default function Billing() {
	const { user, loading: userLoading } = useUser() as { user: any; loading?: boolean };
	const { getEnvUrl } = useEnvironment();

	const [enriched, setEnriched] = useState<EnrichedSubscription[]>([]);
	const [loading, setLoading] = useState(true);
	const [cancellingId, setCancellingId] = useState<string | null>(null);
	const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

	const rawSubs: UserSubscription[] = user?.subscriptions?.filter((s: UserSubscription) => s.status === 'active') || [];

	useEffect(() => {
		if (userLoading) return;

		async function resolve() {
			setLoading(true);

			// Build priceId → { name, description } by fetching each product one by one
			const priceMap: Record<string, { productName: string; productDescription: string | null }> = {};

			for (const productId of allProductIds) {
				try {
					const res = await fetch(`/api/store/${productId}/product`);
					if (!res.ok) continue;
					const data = await res.json();
					for (const price of data.prices || []) {
						priceMap[price.id] = {
							productName: data.name ?? productId,
							productDescription: data.description ?? null,
						};
					}
				} catch {}
			}

			const result: EnrichedSubscription[] = rawSubs.map((sub) => ({
				...sub,
				productName: priceMap[sub.priceId]?.productName ?? sub.priceId,
				productDescription: priceMap[sub.priceId]?.productDescription ?? null,
			}));

			setEnriched(result);
			setLoading(false);
		}

		resolve();
	}, [userLoading, user]);

	const handleCancel = async (stripeSubscriptionId: string) => {
		if (!user?.id) return;
		setCancellingId(stripeSubscriptionId);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/${user.id}/cancel`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ stripeSubscriptionId }),
			});
			if (res.ok) {
				setEnriched((prev) => prev.filter((s) => s.stripeSubscriptionId !== stripeSubscriptionId));
			}
		} catch (err) {
			console.error('Failed to cancel subscription', err);
		} finally {
			setCancellingId(null);
			setCancelConfirm(null);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'text-green-500 bg-green-500/10';
			case 'past_due':
				return 'text-yellow-500 bg-yellow-500/10';
			case 'canceled':
				return 'text-red-500 bg-red-500/10';
			default:
				return 'text-(--text-muted) bg-(--border)/10';
		}
	};

	const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

	const daysUntil = (dateStr: string) => Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

	// Group by stripeSubscriptionId for multi-item subscriptions (e.g. staff bundles)
	const grouped = enriched.reduce<Record<string, EnrichedSubscription[]>>((acc, sub) => {
		(acc[sub.stripeSubscriptionId] ??= []).push(sub);
		return acc;
	}, {});

	const isLoading = userLoading || loading;

	return (
		<div className="flex flex-col max-w-4xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}>
			{/* Header */}
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					Billing
				</h1>
				<p className="text-sm text-(--text-muted)">Manage your active subscriptions and billing details.</p>
			</div>

			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				{/* Loading */}
				{isLoading && (
					<div
						className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm items-center justify-center"
						style={{ padding: 'calc(var(--ui-gap) * 3)', gap: 'var(--ui-gap)' }}
					>
						<Loader2 size={28} className="animate-spin text-(--accent)" />
						<p className="text-sm text-(--text-muted)">Loading your subscriptions…</p>
					</div>
				)}

				{/* Empty state */}
				{!isLoading && enriched.length === 0 && !user?.staffSubscription && (
					<div
						className="flex flex-col items-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm text-center"
						style={{ padding: 'calc(var(--ui-gap) * 3)', gap: 'var(--ui-gap)' }}
					>
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--accent)/10">
							<CreditCard size={28} className="text-(--accent)" />
						</div>
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
							<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								No active subscriptions
							</h2>
							<p className="text-sm text-(--text-muted) max-w-sm">You don't have any active subscriptions. Head over to the store to explore available passes and plans.</p>
						</div>
						<Button variant="outline" onClick={() => (window.location.href = '/store')}>
							<ExternalLink size={14} />
							Browse Store
						</Button>
					</div>
				)}

				{/* Subscription cards */}
				{!isLoading &&
					Object.entries(grouped).map(([subId, items]) => {
						const renewalDate = items[0]?.currentPeriodEnd;
						const days = renewalDate ? daysUntil(renewalDate) : null;
						const isExpiringSoon = days !== null && days <= 7;
						const isCancelling = cancellingId === subId;
						const isConfirming = cancelConfirm === subId;

						return (
							<div
								key={subId}
								className={`flex flex-col rounded-3xl border bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-all ${isExpiringSoon ? 'border-yellow-500/30' : 'border-(--border)/10'}`}
							>
								{/* Card header */}
								<div className="flex items-center justify-between" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
									<div className="flex items-center" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/10">
											<Sparkles size={18} className="text-(--accent)" />
										</div>
										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.15)' }}>
											<span className="text-base font-bold text-(--text)">{items.length === 1 ? items[0].productName : `${items.length} products`}</span>
											{items.length === 1 && items[0].productDescription && <span className="text-xs text-(--text-muted) truncate max-w-xs">{items[0].productDescription}</span>}
										</div>
									</div>
									<span className={`shrink-0 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${getStatusColor(items[0].status)}`}>{items[0].status}</span>
								</div>

								{/* Multi-item product list */}
								{items.length > 1 && (
									<div className="flex flex-col border-t border-(--border)/10" style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.5)' }}>
										{items.map((item, i) => (
											<div key={i} className="flex items-start gap-3">
												<ShieldCheck size={14} className="text-(--accent) shrink-0 mt-0.5" />
												<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.1)' }}>
													<span className="text-sm font-medium text-(--text)">{item.productName}</span>
													{item.productDescription && <span className="text-xs text-(--text-muted)">{item.productDescription}</span>}
												</div>
											</div>
										))}
									</div>
								)}

								{/* Footer: renewal + cancel */}
								<div
									className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-(--border)/10 rounded-b-3xl"
									style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.5)' }}
								>
									<div className="flex items-center gap-2 text-xs">
										<RefreshCw size={13} className={isExpiringSoon ? 'text-yellow-500' : 'text-(--text-muted)'} />
										{renewalDate ? (
											<span className={isExpiringSoon ? 'text-yellow-500 font-medium' : 'text-(--text-muted)'}>
												Renews {formatDate(renewalDate)}
												{isExpiringSoon && ` · ${days}d left`}
											</span>
										) : (
											<span className="text-(--text-muted)">No renewal date</span>
										)}
									</div>

									<div className="flex items-center gap-2">
										{!isConfirming ? (
											<button onClick={() => setCancelConfirm(subId)} className="text-xs font-medium text-red-500 hover:underline transition-colors">
												Cancel subscription
											</button>
										) : (
											<div className="flex items-center gap-2">
												<span className="text-xs text-(--text-muted) flex items-center gap-1">
													<AlertTriangle size={12} className="text-yellow-500" />
													Are you sure?
												</span>
												<button onClick={() => setCancelConfirm(null)} className="text-xs font-medium text-(--text-muted) hover:text-(--text) transition-colors">
													No
												</button>
												<button
													onClick={() => handleCancel(subId)}
													disabled={isCancelling}
													className="flex items-center gap-1.5 text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
												>
													{isCancelling && <Loader2 size={11} className="animate-spin" />}
													Yes, cancel
												</button>
											</div>
										)}
									</div>
								</div>
							</div>
						);
					})}

				{/* Staff badge */}
				{!isLoading && user?.staffSubscription && (
					<div
						className="flex items-center gap-3 rounded-3xl border border-(--accent)/20 bg-(--accent)/5 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_8%,transparent)]"
						style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
					>
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15">
							<ShieldCheck size={18} className="text-(--accent)" />
						</div>
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.15)' }}>
							<span className="text-sm font-bold text-(--text)">Staff Access</span>
							<span className="text-xs text-(--text-muted)">You have a complimentary all-access staff subscription applied to your account.</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
