/** @format */
'use client';

import { Coins, CreditCard, ExternalLink, Flame, Gift, Loader2, RefreshCw, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Confirm, EmptyState, Tabs } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useEnvironment, useUser, useToast, useDictionary } from '@xernerx/providers';
import { products } from '@xernerx/lib';
import { CreditLedgerCard } from './CreditLedgerCard';
import { AchievementsReferralCard } from './AchievementsReferralCard';

interface UserSubscription {
	stripeSubscriptionId: string;
	priceId: string;
	status: string;
	currentPeriodEnd: string;
}

interface EnrichedSubscription extends UserSubscription {
	productName: string;
	productDescription: string | null;
	priceFormatted?: string | null;
	interval?: 'month' | 'year' | null;
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
	const [cancelConfirm, setCancelConfirm] = useState<EnrichedSubscription | null>(null);
	const [claimingGift, setClaimingGift] = useState(false);
	const [subFilter, setSubFilter] = useState<'all' | 'active' | 'history'>('all');
	const [timeLeft, setTimeLeft] = useState<string>('');

	const hasLoadedCredits = !userLoading && Boolean(user?.credits);
	const creditBalance = user?.credits?.balance ?? 0;
	const creditStreak = user?.credits?.streak ?? 0;
	const nextGiftMs = hasLoadedCredits && user?.credits?.giftIn ? new Date(user.credits.giftIn).getTime() : null;
	const canClaimGift = hasLoadedCredits && (nextGiftMs !== null ? Number.isFinite(nextGiftMs) && nextGiftMs <= Date.now() : creditStreak === 0);

	useEffect(() => {
		if (!hasLoadedCredits || nextGiftMs === null) {
			setTimeLeft('');
			return;
		}
		const updateCountdown = () => {
			const diff = nextGiftMs - Date.now();
			if (diff <= 0) {
				setTimeLeft('00:00:00');
				return;
			}
			const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diff % (1000 * 60)) / 1000);
			setTimeLeft([hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':'));
		};
		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	}, [hasLoadedCredits, nextGiftMs]);

	const handleClaimDailyGift = async () => {
		if (!user?.id || claimingGift) return;
		setClaimingGift(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/${user.id}/gift`), {
				method: 'POST',
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || t('account.billing.credits.claimError'));
			if (mutate) await mutate();
			toast({
				type: 'success',
				title: t('account.billing.credits.claimSuccess', {
					amount: data.rewardEarned || data.reward || 50,
					streak: data.streak || data.credits?.streak || 1,
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

	const allRawSubs: UserSubscription[] = useMemo(() => {
		return user?.billing?.subscriptions || user?.subscriptions || [];
	}, [user]);

	useEffect(() => {
		if (userLoading) return;
		async function resolve() {
			setLoading(true);

			const priceMap: Record<
				string,
				{
					productName: string;
					productDescription: string | null;
					priceFormatted?: string | null;
					interval?: 'month' | 'year' | null;
				}
			> = {};

			// 1. Primary lookup via live Store Catalog (/secure/store/catalog)
			try {
				const catalogRes = await fetch(getEnvUrl('https://api.xernerx.com/secure/store/catalog'), {
					credentials: 'include',
				});
				if (catalogRes.ok) {
					const catalogData = await catalogRes.json();
					for (const item of catalogData.items || []) {
						for (const price of item.prices || []) {
							const unitAmount = price.discountedAmount ?? price.unitAmount;
							const formatted =
								typeof unitAmount === 'number'
									? new Intl.NumberFormat(undefined, {
											style: 'currency',
											currency: (price.currency || 'eur').toUpperCase(),
										}).format(unitAmount / 100)
									: null;
							priceMap[price.id] = {
								productName: item.name || item.stripeName || item.skuId,
								productDescription: item.description || item.stripeDescription || null,
								priceFormatted: formatted,
								interval: price.interval === 'year' ? 'year' : price.interval === 'month' ? 'month' : null,
							};
						}
					}
				}
			} catch {}

			// 2. Fallback lookup for any legacy priceId not in catalog
			const missingSubs = allRawSubs.filter((s) => s.priceId && !priceMap[s.priceId]);
			if (missingSubs.length > 0) {
				for (const productId of allProductIds) {
					try {
						const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/${productId}/product`));
						if (!res.ok) continue;
						const data = await res.json();
						for (const price of data.prices || []) {
							if (!priceMap[price.id]) {
								priceMap[price.id] = {
									productName: data.name ?? productId,
									productDescription: data.description ?? null,
								};
							}
						}
					} catch {}
				}
			}

			const result: EnrichedSubscription[] = allRawSubs.map((sub) => ({
				...sub,
				productName: priceMap[sub.priceId]?.productName ?? sub.priceId,
				productDescription: priceMap[sub.priceId]?.productDescription ?? null,
				priceFormatted: priceMap[sub.priceId]?.priceFormatted ?? null,
				interval: priceMap[sub.priceId]?.interval ?? null,
			}));
			setEnriched(result);
			setLoading(false);
		}
		resolve();
	}, [userLoading, allRawSubs, getEnvUrl]);

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
				setEnriched((prev) => prev.map((s) => (s.stripeSubscriptionId === stripeSubscriptionId ? { ...s, status: 'canceled' } : s)));
				if (mutate) await mutate();
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

	const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'accent' | 'muted' => {
		switch (status) {
			case 'active':
				return 'success';
			case 'trialing':
				return 'accent';
			case 'past_due':
				return 'warning';
			case 'canceled':
				return 'danger';
			default:
				return 'muted';
		}
	};

	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	const daysUntil = (dateStr: string) => Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

	const activeSubs = useMemo(() => enriched.filter((s) => s.status === 'active' || s.status === 'trialing'), [enriched]);
	const historySubs = useMemo(() => enriched.filter((s) => s.status !== 'active' && s.status !== 'trialing'), [enriched]);

	const filteredSubs = useMemo(() => {
		if (subFilter === 'active') return activeSubs;
		if (subFilter === 'history') return historySubs;
		return enriched;
	}, [subFilter, enriched, activeSubs, historySubs]);

	const isLoading = userLoading || loading;
	if (isLoading) return <Loading />;

	return (
		<div
			className="flex flex-col max-w-(--page-width) mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
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

				<Button variant="secondary" onClick={() => (window.location.href = getEnvUrl('https://store.xernerx.com'))} className="flex items-center gap-2 shrink-0">
					<ExternalLink size={15} />
					{t('account.billing.browseStore')}
				</Button>
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
								<Badge variant="accent" icon={<Flame size={12} />}>
									{t('account.billing.credits.streakDays', { count: creditStreak })}
								</Badge>
							</div>
							<p className="text-xs text-(--text-muted) mt-1">{t('account.billing.credits.description')}</p>
						</div>
					</div>

					<Button onClick={handleClaimDailyGift} disabled={!canClaimGift || claimingGift} className="flex items-center gap-2 shrink-0 font-mono">
						{claimingGift ? <Loader2 size={15} className="animate-spin" /> : canClaimGift ? <Gift size={15} /> : <Clock size={15} />}
						{canClaimGift ? t('account.billing.credits.claimButton') : t('account.billing.credits.nextClaimTimer', { time: timeLeft || '24:00:00' })}
					</Button>
				</div>

				{/* Credit Balance Activity Ledger */}
				<CreditLedgerCard transactions={user?.credits?.transactions} streakShields={user?.credits?.streakShields ?? 0} />

				{/* Contributor Achievements & Referral Program */}
				<AchievementsReferralCard userId={user?.id} mutate={mutate} />

				{/* Subscription Filter Tabs */}
				{!isLoading && enriched.length > 0 && (
					<div className="flex items-center justify-between">
						<Tabs
							size="sm"
							activeTab={subFilter}
							onChange={(id) => setSubFilter(id as 'all' | 'active' | 'history')}
							tabs={[
								{ id: 'all', label: t('account.billing.tabs.all', { count: enriched.length }) },
								{ id: 'active', label: t('account.billing.tabs.active', { count: activeSubs.length }) },
								{ id: 'history', label: t('account.billing.tabs.history', { count: historySubs.length }) },
							]}
						/>
					</div>
				)}

				{/* Empty state */}
				{filteredSubs.length === 0 && !user?.staffSubscription && (
					<EmptyState
						icon={<CreditCard size={28} />}
						title={t('account.billing.empty.title')}
						description={t('account.billing.empty.description')}
						action={
							<Button variant="outline" onClick={() => (window.location.href = getEnvUrl('https://store.xernerx.com'))}>
								<ExternalLink size={14} />
								{t('account.billing.empty.browseStore')}
							</Button>
						}
					/>
				)}

				{/* Subscription cards */}
				{!isLoading &&
					filteredSubs.map((item, index) => {
						const subId = item.stripeSubscriptionId;
						const renewalDate = item.currentPeriodEnd;
						const isActive = item.status === 'active' || item.status === 'trialing';
						const days = renewalDate && isActive ? daysUntil(renewalDate) : null;
						const isExpiringSoon = days !== null && days <= 7;
						const isCancelling = cancellingId === subId;
						return (
							<div
								key={`${subId}-${item.priceId}-${index}`}
								className={`flex flex-col rounded-3xl border bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-all ${
									isExpiringSoon ? 'border-(--accent-orange)/30' : 'border-(--border)/10'
								}`}
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
											<div className="flex flex-wrap items-center gap-2">
												<span className="text-base font-bold text-(--text)">{item.productName}</span>
												{item.priceFormatted && item.interval && (
													<Badge variant="muted" size="sm">
														{t(`account.billing.billingCycle.${item.interval}`, { price: item.priceFormatted })}
													</Badge>
												)}
											</div>
											{item.productDescription && <span className="text-xs text-(--text-muted) truncate max-w-md">{item.productDescription}</span>}
										</div>
									</div>
									<Badge variant={getStatusVariant(item.status)} dot>
										{t(`account.billing.status.${item.status}`)}
									</Badge>
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
										<RefreshCw size={13} className={isExpiringSoon ? 'text-(--accent-orange)' : 'text-(--text-muted)'} />
										{renewalDate && isActive ? (
											<span className={isExpiringSoon ? 'text-(--accent-orange) font-medium' : 'text-(--text-muted)'}>
												{t('account.billing.renewsOn', { date: formatDate(renewalDate) })}
												{isExpiringSoon && ` · ${t('account.billing.daysLeft', { days: days ?? 0 })}`}
											</span>
										) : (
											<span className="text-(--text-muted)">{t('account.billing.canceled')}</span>
										)}
									</div>

									{isActive && (
										<div className="flex items-center gap-2">
											<Button variant="danger" size="sm" onClick={() => setCancelConfirm(item)} disabled={isCancelling}>
												{t('account.billing.cancelSubscription')}
											</Button>
										</div>
									)}
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

			<Confirm
				open={Boolean(cancelConfirm)}
				onOpenChange={(open) => !open && setCancelConfirm(null)}
				title={t('account.billing.cancelConfirmTitle')}
				description={t('account.billing.cancelConfirmDesc', { product: cancelConfirm?.productName || '' })}
				confirmKeyword={cancelConfirm?.productName || cancelConfirm?.stripeSubscriptionId || undefined}
				confirmText={t('account.billing.cancelButton')}
				cancelText={t('account.billing.keepSubscription')}
				variant="danger"
				loading={Boolean(cancellingId)}
				onConfirm={() => {
					if (cancelConfirm) handleCancel(cancelConfirm.stripeSubscriptionId);
				}}
			/>
		</div>
	);
}
