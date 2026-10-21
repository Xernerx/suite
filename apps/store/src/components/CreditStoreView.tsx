/** @format */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Award, Check, Clock, Coins, Flame, Gift, HardDrive, LayoutGrid, Loader2, ShoppingBag, Sparkles, Zap } from 'lucide-react';
import { Badge, Button, Confirm, Tabs } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { CatalogItem } from './types';

interface CreditStoreViewProps {
	items: CatalogItem[];
	user: any;
	userLoading: boolean;
	mutateUser?: () => Promise<any>;
	actionLoading: string | null;
	onBuyCreditPack: (priceId: string, item: CatalogItem) => void;
}

type PerkFilter = 'all' | 'cdn_slots' | 'showcase_slots' | 'trial_pass' | 'vanity_badge' | 'credit_packs';

const FALLBACK_EUR_PRICES: Record<string, string> = {
	'credits-500': '€5.00',
	'credits-1200': '€10.00',
	'credits-3250': '€25.00',
	'credits-7000': '€50.00',
};

export function CreditStoreView({ items, user, userLoading, mutateUser, actionLoading, onBuyCreditPack }: CreditStoreViewProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [filter, setFilter] = useState<PerkFilter>('all');
	const [claimingDaily, setClaimingDaily] = useState(false);
	const [timeLeft, setTimeLeft] = useState('');
	const [confirmItem, setConfirmItem] = useState<CatalogItem | null>(null);
	const [redeemingId, setRedeemingId] = useState<string | null>(null);

	const creditBalance = user?.credits?.balance ?? 0;
	const creditStreak = user?.credits?.streak ?? 0;
	const totalSpent = user?.credits?.totalSpent ?? 0;
	const extraCdnSlots = user?.credits?.extraCdnSlots ?? 0;
	const extraShowcaseSlots = user?.credits?.extraShowcaseSlots ?? 0;
	const unlockedBadges: string[] = Array.isArray(user?.credits?.unlockedBadges) ? user.credits.unlockedBadges : [];
	const nextGiftMs = user?.credits?.giftIn ? new Date(user.credits.giftIn).getTime() : 0;
	const canClaimGift = Boolean(user?.id) && (creditStreak === 0 || nextGiftMs <= Date.now());

	useEffect(() => {
		const updateTimer = () => {
			const diff = nextGiftMs - Date.now();
			if (diff <= 0) {
				setTimeLeft('00:00:00');
				return;
			}
			const h = Math.floor((diff % 86400000) / 3600000);
			const m = Math.floor((diff % 3600000) / 60000);
			const s = Math.floor((diff % 60000) / 1000);
			setTimeLeft([h, m, s].map((v) => String(v).padStart(2, '0')).join(':'));
		};
		updateTimer();
		const id = setInterval(updateTimer, 1000);
		return () => clearInterval(id);
	}, [nextGiftMs]);

	const handleClaimDaily = async () => {
		if (!user?.id || claimingDaily) return;
		setClaimingDaily(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/${user.id}/gift`), {
				method: 'POST',
				credentials: 'include',
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || t('account.billing.credits.claimError'));
			if (mutateUser) await mutateUser();
			toast({
				type: 'success',
				title: t('account.billing.credits.claimSuccess', {
					amount: data.rewardEarned || data.reward || 50,
					streak: data.streak || 1,
				}),
			});
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('account.billing.credits.claimError') });
		} finally {
			setClaimingDaily(false);
		}
	};

	const handleRedeemConfirm = async () => {
		if (!confirmItem) return;
		if (!user?.id) {
			window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
			return;
		}
		setRedeemingId(confirmItem.id);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/store/credits/redeem'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ itemId: confirmItem.id }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || t('account.store.credits.redeemFailed'));
			if (mutateUser) await mutateUser();
			toast({
				type: 'success',
				title: t('account.store.credits.redeemSuccessTitle'),
				description: t('account.store.credits.redeemSuccessDesc', {
					item: confirmItem.name,
					cost: (data.cost ?? confirmItem.creditCost ?? 0).toLocaleString(),
				}),
			});
			setConfirmItem(null);
		} catch (err: any) {
			toast({
				type: 'error',
				title: t('account.store.credits.redeemFailed'),
				description: err.message,
			});
		} finally {
			setRedeemingId(null);
		}
	};

	const creditPacks = useMemo(() => items.filter((i) => i.itemType === 'credit_pack').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [items]);

	const creditPerks = useMemo(() => items.filter((i) => i.itemType === 'credit_perk').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [items]);

	const filteredPerks = useMemo(() => {
		if (filter === 'credit_packs') return [];
		if (filter === 'all') return creditPerks;
		return creditPerks.filter((i) => i.perkType === filter);
	}, [creditPerks, filter]);

	const getPerkIcon = (perkType?: string) => {
		switch (perkType) {
			case 'cdn_slots':
				return HardDrive;
			case 'showcase_slots':
				return LayoutGrid;
			case 'trial_pass':
				return Zap;
			case 'vanity_badge':
				return Award;
			default:
				return Sparkles;
		}
	};

	const getEffectiveCreditCost = (item: CatalogItem) => {
		const base = Math.max(0, Number(item.creditCost) || 0);
		if (item.discountPercent && item.discountPercent > 0) {
			return Math.round(base * (1 - item.discountPercent / 100));
		}
		return base;
	};

	return (
		<div className="w-full max-w-6xl flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
			{/* Wallet & Perks Status Bar */}
			<div
				className="flex flex-col lg:flex-row lg:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
						<Coins size={28} />
					</div>
					<div className="flex flex-col gap-1">
						<div className="flex flex-wrap items-center gap-2.5">
							<span className="text-2xl md:text-3xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{creditBalance.toLocaleString()} {t('account.billing.credits.unit')}
							</span>
							{creditStreak > 0 && (
								<Badge variant="accent" icon={<Flame size={12} />}>
									{t('account.billing.credits.streakDays', { count: creditStreak })}
								</Badge>
							)}
							{totalSpent > 0 && (
								<Badge variant="muted" size="sm">
									{t('account.store.credits.lifetimeSpent', { amount: totalSpent.toLocaleString() })}
								</Badge>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-2 text-xs text-(--text-muted)">
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--background)/60 border border-(--border)/10">
								<HardDrive size={11} className="text-(--accent)" />
								{t('account.store.credits.ownedCdnSlots', { count: 10 + extraCdnSlots, extra: extraCdnSlots })}
							</span>
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--background)/60 border border-(--border)/10">
								<LayoutGrid size={11} className="text-(--accent)" />
								{t('account.store.credits.ownedShowcaseSlots', { count: 1 + extraShowcaseSlots, extra: extraShowcaseSlots })}
							</span>
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--background)/60 border border-(--border)/10">
								<Award size={11} className="text-(--accent)" />
								{t('account.store.credits.ownedBadges', { count: unlockedBadges.length })}
							</span>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5 shrink-0">
					{user?.id ? (
						<Button variant={canClaimGift ? 'primary' : 'secondary'} onClick={handleClaimDaily} disabled={!canClaimGift || claimingDaily} className="flex items-center gap-2 font-mono">
							{claimingDaily ? <Loader2 size={15} className="animate-spin" /> : canClaimGift ? <Gift size={15} /> : <Clock size={15} />}
							{canClaimGift ? t('account.billing.credits.claimButton') : t('account.billing.credits.nextClaimTimer', { time: timeLeft || '24:00:00' })}
						</Button>
					) : (
						<Button
							variant="primary"
							onClick={() => {
								window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
							}}
						>
							{t('account.store.credits.signInToRedeem')}
						</Button>
					)}
					<Button variant="secondary" onClick={() => setFilter(filter === 'credit_packs' ? 'all' : 'credit_packs')} className="flex items-center gap-2">
						<Coins size={15} className="text-(--accent)" />
						{t('account.store.credits.topUpButton')}
					</Button>
				</div>
			</div>

			{/* Filter Tabs */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Tabs
					size="sm"
					activeTab={filter}
					onChange={(id) => setFilter(id as PerkFilter)}
					tabs={[
						{ id: 'all', label: t('account.store.credits.filters.all') },
						{ id: 'cdn_slots', label: t('account.store.credits.filters.cdnSlots') },
						{ id: 'showcase_slots', label: t('account.store.credits.filters.showcaseSlots') },
						{ id: 'trial_pass', label: t('account.store.credits.filters.trialPasses') },
						{ id: 'vanity_badge', label: t('account.store.credits.filters.vanityBadges') },
						{ id: 'credit_packs', label: t('account.store.credits.filters.creditPacks') },
					]}
				/>
			</div>

			{/* Credit Perks Grid */}
			{filteredPerks.length > 0 && (
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
							<Sparkles size={20} className="text-(--accent)" />
							{t('account.store.credits.perksHeading')}
						</h2>
						<span className="text-xs text-(--text-muted) hidden sm:block">{t('account.store.credits.perksSubheading')}</span>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
						{filteredPerks.map((item) => {
							const PerkIcon = getPerkIcon(item.perkType);
							const effectiveCost = getEffectiveCreditCost(item);
							const isOwnedBadge = item.perkType === 'vanity_badge' && unlockedBadges.includes(String(item.perkValue || item.id));
							const canAfford = creditBalance >= effectiveCost;

							return (
								<div
									key={item.id}
									className={`relative flex flex-col justify-between rounded-3xl border backdrop-blur-md transition-all ${
										item.isFeatured
											? 'bg-(--foreground)/40 border-(--accent)/35 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)]'
											: 'bg-(--foreground)/30 border-(--border)/10 hover:border-(--accent)/30 shadow-sm'
									}`}
									style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
								>
									<div className="flex flex-col gap-3">
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2 text-(--accent)">
												<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent)/15 border border-(--accent)/25">
													<PerkIcon size={18} />
												</div>
												{item.badge && (
													<span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/25">{item.badge}</span>
												)}
											</div>
											{item.discountPercent > 0 && (
												<span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/25">
													-{item.discountPercent}%
												</span>
											)}
										</div>

										<div>
											<h3 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
												{item.name}
											</h3>
											<p className="text-xs text-(--text-muted) mt-1">{item.description}</p>
										</div>

										<div className="flex items-baseline gap-2 pt-1">
											<span className="inline-flex items-center gap-1.5 text-2xl font-extrabold text-(--accent)">
												<Coins size={20} />
												{effectiveCost.toLocaleString()}
											</span>
											<span className="text-xs font-semibold text-(--text-muted)">{t('account.billing.credits.unit')}</span>
											{item.discountPercent > 0 && item.creditCost && (
												<span className="text-xs text-(--text-muted) line-through opacity-60">{item.creditCost.toLocaleString()}</span>
											)}
										</div>

										{item.features && item.features.length > 0 && (
											<ul className="flex flex-col gap-2 pt-2 border-t border-(--border)/10">
												{item.features.map((feat, i) => (
													<li key={i} className="flex items-start gap-2 text-xs text-(--text-muted)">
														<Check size={14} className="text-(--accent) shrink-0 mt-0.5" />
														<span>{feat}</span>
													</li>
												))}
											</ul>
										)}
									</div>

									<div className="pt-2">
										{isOwnedBadge ? (
											<Button variant="secondary" disabled className="w-full flex items-center justify-center gap-2">
												<Check size={15} className="text-(--accent-green)" />
												{t('account.store.credits.alreadyUnlocked')}
											</Button>
										) : (
											<Button
												variant={canAfford ? 'primary' : 'secondary'}
												disabled={userLoading || redeemingId === item.id}
												onClick={() => {
													if (!user?.id) {
														window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
														return;
													}
													if (!canAfford) {
														setFilter('credit_packs');
														return;
													}
													setConfirmItem(item);
												}}
												className="w-full flex items-center justify-center gap-2"
											>
												<Coins size={15} />
												{canAfford
													? t('account.store.credits.redeemButton', { cost: effectiveCost.toLocaleString() })
													: t('account.store.credits.needMoreCredits', {
															missing: Math.max(0, effectiveCost - creditBalance).toLocaleString(),
														})}
											</Button>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Credit Top-Up Packs (Stripe SKU-linked) */}
			{(filter === 'all' || filter === 'credit_packs') && creditPacks.length > 0 && (
				<div className="flex flex-col pt-2" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
						<div>
							<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
								<Coins size={20} className="text-(--accent)" />
								{t('account.store.credits.packsHeading')}
							</h2>
							<p className="text-xs text-(--text-muted) mt-0.5">{t('account.store.credits.packsSubheading')}</p>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
						{creditPacks.map((pack) => {
							const activePrice = pack.prices?.[0] || null;
							const rawAmount = activePrice ? (activePrice.discountedAmount ?? activePrice.unitAmount) : null;
							const formattedPrice =
								typeof rawAmount === 'number'
									? new Intl.NumberFormat(undefined, {
											style: 'currency',
											currency: (activePrice.currency || 'eur').toUpperCase(),
										}).format(rawAmount / 100)
									: FALLBACK_EUR_PRICES[pack.id] || '€—';

							const isBusy = Boolean(activePrice && actionLoading === activePrice.id);

							return (
								<div
									key={pack.id}
									className={`flex flex-col justify-between rounded-3xl border backdrop-blur-md transition-all ${
										pack.isFeatured
											? 'bg-(--foreground)/40 border-(--accent)/40 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
											: 'bg-(--foreground)/30 border-(--border)/10 hover:border-(--accent)/30 shadow-sm'
									}`}
									style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
								>
									<div className="flex flex-col gap-3">
										<div className="flex items-center justify-between gap-2">
											<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
												<Coins size={20} />
											</div>
											{pack.badge && (
												<span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/25">{pack.badge}</span>
											)}
										</div>

										<div>
											<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
												{pack.name}
											</h3>
											<p className="text-xs text-(--text-muted) mt-1">{pack.description}</p>
										</div>

										<div className="flex items-baseline gap-1.5 pt-1">
											<span className="text-3xl font-extrabold text-(--text)">{formattedPrice}</span>
											<span className="text-xs text-(--text-muted)">{t('account.store.credits.oneTimePurchase')}</span>
										</div>

										{pack.features && pack.features.length > 0 && (
											<ul className="flex flex-col gap-1.5 pt-2 border-t border-(--border)/10">
												{pack.features.map((feat, idx) => (
													<li key={idx} className="flex items-start gap-2 text-xs text-(--text-muted)">
														<Check size={13} className="text-(--accent) shrink-0 mt-0.5" />
														<span>{feat}</span>
													</li>
												))}
											</ul>
										)}
									</div>

									<Button
										variant={pack.isFeatured ? 'primary' : 'secondary'}
										disabled={!activePrice || isBusy}
										onClick={() => {
											if (activePrice) onBuyCreditPack(activePrice.id, pack);
										}}
										className="w-full flex items-center justify-center gap-2"
									>
										{isBusy ? <Loader2 size={15} className="animate-spin" /> : <ShoppingBag size={15} />}
										{activePrice ? t('account.store.credits.buyPackButton') : t('account.store.credits.skuPending')}
									</Button>
								</div>
							);
						})}
					</div>
				</div>
			)}

			<Confirm
				open={Boolean(confirmItem)}
				onOpenChange={(open) => !open && setConfirmItem(null)}
				title={t('account.store.credits.confirmRedeemTitle', { item: confirmItem?.name || '' })}
				description={t('account.store.credits.confirmRedeemDesc', {
					item: confirmItem?.name || '',
					cost: confirmItem ? getEffectiveCreditCost(confirmItem).toLocaleString() : '0',
					remaining: confirmItem ? Math.max(0, creditBalance - getEffectiveCreditCost(confirmItem)).toLocaleString() : '0',
				})}
				confirmText={t('account.store.credits.confirmRedeemButton')}
				cancelText={t('account.billing.keepSubscription')}
				loading={Boolean(redeemingId)}
				onConfirm={handleRedeemConfirm}
			/>
		</div>
	);
}
