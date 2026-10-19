/** @format */
'use client';

import { AlertTriangle, Coins, CreditCard, ExternalLink, Flame, Gift, Loader2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@xernerx/ui';
import { useEnvironment, useUser, useToast, useDictionary } from '@xernerx/providers';
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
	const { t } = useDictionary();
	const {
		user,
		mutate,
		loading: userLoading,
	} = useUser() as {
		user: any;
		mutate?: () => Promise<void>;
		loading?: boolean;
	};
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [enriched, setEnriched] = useState<EnrichedSubscription[]>([]);
	const [loading, setLoading] = useState(true);
	const [cancellingId, setCancellingId] = useState<string | null>(null);
	const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
	const [claimingGift, setClaimingGift] = useState(false);

	const creditBalance = user?.credits?.balance ?? 0;
	const creditStreak = user?.credits?.streak ?? 0;
	const nextGiftMs = user?.credits?.giftIn ? new Date(user.credits.giftIn).getTime() : 0;
	const canClaimGift = creditStreak === 0 || nextGiftMs <= Date.now();
	const hoursUntilGift = !canClaimGift ? Math.max(1, Math.ceil((nextGiftMs - Date.now()) / (1000 * 60 * 60))) : 0;

	const handleClaimDailyGift = async () => {
		if (!user?.id || claimingGift) return;
		setClaimingGift(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}/credits/claim`), {
				method: 'POST',
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || t('account.billing.credits.claimError'));
			if (mutate) await mutate();
			toast({
				type: 'success',
				title: t('account.billing.credits.claimSuccess', {
					amount: data.rewardEarned || 50,
					streak: data.streak || 1,
				}),
			});
		} catch (err: any) {
			toast({
				type: 'error',
				title: err.message || t('account.billing.credits.claimError'),
			});
		} finally {
			setClaimingGift(false);
		}
	};
	const rawSubs: UserSubscription[] = user?.billing?.subscriptions?.filter((s: UserSubscription) => s.status === 'active') || [];
	useEffect(() => {
		if (userLoading) return;
		async function resolve() {
			setLoading(true);

			// Build priceId → { name, description } by fetching each product one by one
			const priceMap: Record<
				string,
				{
					productName: string;
					productDescription: string | null;
				}
			> = {};
			for (const productId of allProductIds) {
				try {
					const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/${productId}/product`));
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
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					stripeSubscriptionId,
				}),
			});
			if (res.ok) {
				setEnriched((prev) => prev.filter((s) => s.stripeSubscriptionId !== stripeSubscriptionId));
				toast({
					type: 'success',
					title: t('account.billing.toasts.cancelSuccess'),
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('account.billing.toasts.cancelError'));
			}
		} catch (err: any) {
			console.error('Failed to cancel subscription', err);
			toast({
				type: 'error',
				title: t('account.billing.toasts.cancelError'),
				description: err.message,
			});
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
	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	const daysUntil = (dateStr: string) => Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

	// No longer grouping by stripeSubscriptionId, as we want to render each price_id separately

	const isLoading = userLoading || loading;
	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{/* Header */}
			<div
				className="flex flex-col"
				style={{
					gap: 'calc(var(--ui-gap) * 0.25)',
				}}
			>
				<h1
					className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm"
					style={{
						fontFamily: 'var(--font-fredoka)',
					}}
				>
					{t('account.billing.title')}
				</h1>
				<p className="text-sm text-(--text-muted)">{t('account.billing.description')}</p>
			</div>

			<div
				className="flex flex-col"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				{/* Credits & Daily Streak Card */}
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{
						padding: 'var(--ui-gap)',
						gap: 'var(--ui-gap)',
					}}
				>
					<div className="flex items-center gap-4">
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
							<Coins size={26} />
						</div>
						<div>
							<div className="flex flex-wrap items-center gap-2.5">
								<h2 className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{creditBalance.toLocaleString()} {t('account.billing.credits.unit')}
								</h2>
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25">
									<Flame size={12} />
									{t('account.billing.credits.streakDays', { count: creditStreak })}
								</span>
							</div>
							<p className="text-xs text-(--text-muted) mt-1">{t('account.billing.credits.description')}</p>
						</div>
					</div>

					<Button onClick={handleClaimDailyGift} disabled={!canClaimGift || claimingGift} className="flex items-center gap-2 shrink-0">
						{claimingGift ? <Loader2 size={15} className="animate-spin" /> : <Gift size={15} />}
						{canClaimGift ? t('account.billing.credits.claimButton') : t('account.billing.credits.nextClaimIn', { hours: hoursUntilGift })}
					</Button>
				</div>
				{/* Loading */}
				{isLoading && (
					<div
						className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm items-center justify-center"
						style={{
							padding: 'calc(var(--ui-gap) * 3)',
							gap: 'var(--ui-gap)',
						}}
					>
						<Loader2 size={28} className="animate-spin text-(--accent)" />
						<p className="text-sm text-(--text-muted)">{t('account.billing.loading')}</p>
					</div>
				)}

				{/* Empty state */}
				{!isLoading && enriched.length === 0 && !user?.staffSubscription && (
					<div
						className="flex flex-col items-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm text-center"
						style={{
							padding: 'calc(var(--ui-gap) * 3)',
							gap: 'var(--ui-gap)',
						}}
					>
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--accent)/10">
							<CreditCard size={28} className="text-(--accent)" />
						</div>
						<div
							className="flex flex-col"
							style={{
								gap: 'calc(var(--ui-gap) * 0.25)',
							}}
						>
							<h2
								className="text-xl font-bold text-(--text)"
								style={{
									fontFamily: 'var(--font-fredoka)',
								}}
							>
								{t('account.billing.empty.title')}
							</h2>
							<p className="text-sm text-(--text-muted) max-w-sm">{t('account.billing.empty.description')}</p>
						</div>
						<Button variant="outline" onClick={() => (window.location.href = getEnvUrl('https://store.xernerx.com'))}>
							<ExternalLink size={14} />
							{t('account.billing.empty.browseStore')}
						</Button>
					</div>
				)}

				{/* Subscription cards */}
				{!isLoading &&
					enriched.map((item, index) => {
						const subId = item.stripeSubscriptionId;
						const renewalDate = item.currentPeriodEnd;
						const days = renewalDate ? daysUntil(renewalDate) : null;
						const isExpiringSoon = days !== null && days <= 7;
						const isCancelling = cancellingId === subId;
						const isConfirming = cancelConfirm === subId;
						return (
							<div
								key={`${subId}-${item.priceId}-${index}`}
								className={`flex flex-col rounded-3xl border bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-all ${isExpiringSoon ? 'border-yellow-500/30' : 'border-(--border)/10'}`}
							>
								{/* Card header */}
								<div
									className="flex items-center justify-between"
									style={{
										padding: 'var(--ui-gap)',
										gap: 'var(--ui-gap)',
									}}
								>
									<div
										className="flex items-center"
										style={{
											gap: 'calc(var(--ui-gap) * 0.75)',
										}}
									>
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/10">
											<Sparkles size={18} className="text-(--accent)" />
										</div>
										<div
											className="flex flex-col"
											style={{
												gap: 'calc(var(--ui-gap) * 0.15)',
											}}
										>
											<span className="text-base font-bold text-(--text)">{item.productName}</span>
											{item.productDescription && <span className="text-xs text-(--text-muted) truncate max-w-xs">{item.productDescription}</span>}
										</div>
									</div>
									<span className={`shrink-0 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${getStatusColor(item.status)}`}>
										{t(`account.billing.status.${item.status}`)}
									</span>
								</div>

								{/* Footer: renewal + cancel */}
								<div
									className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-(--border)/10 rounded-b-3xl"
									style={{
										padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)',
										gap: 'calc(var(--ui-gap) * 0.5)',
									}}
								>
									<div className="flex items-center gap-2 text-xs">
										<RefreshCw size={13} className={isExpiringSoon ? 'text-yellow-500' : 'text-(--text-muted)'} />
										{renewalDate ? (
											<span className={isExpiringSoon ? 'text-yellow-500 font-medium' : 'text-(--text-muted)'}>
												{t('account.billing.renewsOn', { date: formatDate(renewalDate) })}
												{isExpiringSoon && ` · ${t('account.billing.daysLeft', { days: days ?? 0 })}`}
											</span>
										) : (
											<span className="text-(--text-muted)">{t('account.billing.canceled')}</span>
										)}
									</div>

									<div className="flex items-center gap-2">
										{!isConfirming ? (
											<button onClick={() => setCancelConfirm(subId)} className="text-xs font-medium text-red-500 hover:underline transition-colors">
												{t('account.billing.cancelSubscription')}
											</button>
										) : (
											<div className="flex items-center gap-2">
												<span className="text-xs text-(--text-muted) flex items-center gap-1">
													<AlertTriangle size={12} className="text-yellow-500" />
													{t('account.billing.confirmPrompt')}
												</span>
												<button onClick={() => setCancelConfirm(null)} className="text-xs font-medium text-(--text-muted) hover:text-(--text) transition-colors">
													{t('account.billing.keepSubscription')}
												</button>
												<button
													onClick={() => handleCancel(subId)}
													disabled={isCancelling}
													className="flex items-center gap-1.5 text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
												>
													{isCancelling && <Loader2 size={11} className="animate-spin" />}
													{t('account.billing.cancelButton')}
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
						style={{
							padding: 'var(--ui-gap)',
							gap: 'calc(var(--ui-gap) * 0.75)',
						}}
					>
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15">
							<ShieldCheck size={18} className="text-(--accent)" />
						</div>
						<div
							className="flex flex-col"
							style={{
								gap: 'calc(var(--ui-gap) * 0.15)',
							}}
						>
							<span className="text-sm font-bold text-(--text)">{t('account.billing.staff.title')}</span>
							<span className="text-xs text-(--text-muted)">{t('account.billing.staff.description')}</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
