/** @format */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Bot, Check, Clock, Coins, Cpu, Crown, ExternalLink, Flame, Gem, Gift, Globe, HardDrive, LayoutGrid, Loader2, PackageSearch, Shield, ShoppingBag, Sparkles, Zap } from 'lucide-react';
import { Badge, Button, Confirm, Input, Tabs, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { CreditLedgerCard } from './CreditLedgerCard';
import { DailyStreakLadder } from './DailyStreakLadder';
import { DotMatrixPerkPreview } from './DotMatrixPerkPreview';
import { CatalogItem, CHILD_TO_BUNDLE, FALLBACK_EUR_PRICES } from './types';

interface CreditStoreViewProps {
	items: CatalogItem[];
	user: any;
	userLoading: boolean;
	mutateUser?: () => Promise<any>;
	actionLoading: string | null;
	onBuyCreditPack: (priceId: string, item: CatalogItem) => void;
	hideOwned?: boolean;
	onHideOwnedChange?: (hideOwned: boolean) => void;
}

const PERK_ICONS: Record<string, any> = {
	cdn_slots: HardDrive,
	showcase_slots: LayoutGrid,
	bot_slots: Bot,
	vanity_url: Globe,
	trial_pass: Zap,
	streak_shield: Shield,
	stage_style: Cpu,
	ambient_scene: Sparkles,
	surface_style: Gem,
	profile_cosmetic: Crown,
	cursor_fx: Sparkles,
	overlay_skin: LayoutGrid,
	icon_pack: Sparkles,
	window_style: LayoutGrid,
	dot_matrix_banner: Cpu,
	credit_patron: Coins,
	high_roller: Gem,
	vault_sovereign: Crown,
	vanity_badge: Award,
};

export function CreditStoreView({ items, user, userLoading, mutateUser, actionLoading, onBuyCreditPack, hideOwned: controlledHideOwned, onHideOwnedChange }: CreditStoreViewProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [internalHideOwned, setInternalHideOwned] = useState(false);
	const hideOwned = controlledHideOwned ?? internalHideOwned;
	const setHideOwned = (val: boolean) => {
		setInternalHideOwned(val);
		onHideOwnedChange?.(val);
	};
	const [search, setSearch] = useState('');
	const [claimingDaily, setClaimingDaily] = useState(false);
	const [timeLeft, setTimeLeft] = useState('');
	const [confirmItem, setConfirmItem] = useState<CatalogItem | null>(null);
	const [redeemingId, setRedeemingId] = useState<string | null>(null);

	const hasLoadedCredits = !userLoading && Boolean(user?.credits);
	const creditBalance = user?.credits?.balance ?? 0;
	const creditStreak = user?.credits?.streak ?? 0;
	const unlockedBadges: string[] = Array.isArray(user?.credits?.unlockedBadges) ? user.credits.unlockedBadges : [];
	const nextGiftMs = hasLoadedCredits && user?.credits?.giftIn ? new Date(user.credits.giftIn).getTime() : null;
	const canClaimGift = hasLoadedCredits && Boolean(user?.id) && (nextGiftMs !== null ? Number.isFinite(nextGiftMs) && nextGiftMs <= Date.now() : creditStreak === 0);

	useEffect(() => {
		if (!hasLoadedCredits || nextGiftMs === null) {
			setTimeLeft('');
			return;
		}
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
	}, [hasLoadedCredits, nextGiftMs]);

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
	const isPerkOwned = useCallback(
		(item: CatalogItem) => {
			const isStageOrIcon = ['stage_style', 'ambient_scene', 'surface_style', 'cursor_fx', 'overlay_skin', 'icon_pack', 'window_style'].includes(String(item.perkType));
			const badgeKey = String(item.perkValue || item.id);
			return (
				((item.perkType === 'vanity_badge' || item.perkType === 'profile_cosmetic' || isStageOrIcon) &&
					(unlockedBadges.includes(badgeKey) || unlockedBadges.includes(String(item.id)) || Boolean(CHILD_TO_BUNDLE[badgeKey] && unlockedBadges.includes(CHILD_TO_BUNDLE[badgeKey])))) ||
				(item.perkType === 'streak_shield' && (user?.credits?.streakShields ?? 0) >= 3)
			);
		},
		[unlockedBadges, user?.credits?.streakShields]
	);
	const matchesPerkCategory = (item: CatalogItem, cat: string) => {
		if (cat === 'stage_style') return item.perkType === 'stage_style' || item.perkType === 'ambient_scene' || item.perkType === 'surface_style';
		if (cat === 'icon_pack') return item.perkType === 'icon_pack' || item.perkType === 'window_style' || item.perkType === 'cursor_fx' || item.perkType === 'overlay_skin';
		if (cat === 'vanity_badge') return item.perkType === 'vanity_badge' || item.perkType === 'profile_cosmetic';
		return item.perkType === cat;
	};
	const filteredPerks = useMemo(() => {
		if (selectedCategory === 'credit_packs') return [];
		const q = search.trim().toLowerCase();
		return creditPerks.filter((item) => {
			if (hideOwned && isPerkOwned(item)) return false;
			if (selectedCategory !== 'all' && !matchesPerkCategory(item, selectedCategory)) return false;
			if (!q) return true;
			return item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q) || item.badge?.toLowerCase().includes(q);
		});
	}, [creditPerks, selectedCategory, search, hideOwned, isPerkOwned]);
	const showCreditPacks = selectedCategory === 'all' || selectedCategory === 'credit_packs';
	const getPerkIcon = (perkType?: string, perkValue?: string | number | null) => PERK_ICONS[String(perkValue || '')] || PERK_ICONS[String(perkType || '')] || Sparkles;
	const getEffectiveCreditCost = (item: CatalogItem) => {
		const base = Math.max(0, Number(item.creditCost) || 0);
		return item.discountPercent && item.discountPercent > 0 ? Math.round(base * (1 - item.discountPercent / 100)) : base;
	};

	return (
		<div className="w-full flex flex-col gap-8">
			{/* Unified Wallet & Daily Streak Bar */}
			<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm">
				<div className="flex flex-wrap items-center gap-3.5">
					<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0">
						<Coins size={22} />
					</div>
					<div className="flex flex-wrap items-center gap-2.5">
						<span className="text-xl sm:text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{creditBalance.toLocaleString()} {t('account.billing.credits.unit')}
						</span>
						{creditStreak > 0 && (
							<Badge variant="accent" icon={<Flame size={12} />}>
								{t('account.billing.credits.streakDays', { count: creditStreak })}
							</Badge>
						)}
					</div>
				</div>

				<DailyStreakLadder streak={creditStreak} canClaim={canClaimGift} user={user} onClaim={handleClaimDaily} claiming={claimingDaily} />

				<div className="flex flex-wrap items-center gap-2 shrink-0">
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
					<Button
						variant="secondary"
						onClick={() => setSelectedCategory((prev) => (prev === 'credit_packs' ? 'all' : 'credit_packs'))}
						className="flex items-center gap-2"
					>
						<Coins size={15} className="text-(--accent)" />
						{t('account.store.credits.topUpButton')}
					</Button>
				</div>
			</div>

			{/* Header & Filter Bar */}
			<div className="flex flex-col gap-3">
				<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-30">
					<div className="flex flex-col gap-0.5">
						<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
							<Sparkles size={20} className="text-(--accent)" />
							{t('account.store.credits.perksHeading')}
						</h2>
						<span className="text-xs text-(--text-muted)">{t('account.store.credits.perksSubheading')}</span>
					</div>

					<div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
						<div className="flex items-center gap-2.5 h-10 px-3.5 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shrink-0">
							<Toggle size="sm" checked={hideOwned} onChange={(e) => setHideOwned(e.target.checked)} />
							<span className="text-xs font-semibold text-(--text) select-none">{t('account.store.credits.filters.hideOwned')}</span>
						</div>
						<div className="w-full sm:w-72">
							<Input variant="search" shortcut={true} placeholder={t('account.store.credits.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
						</div>
					</div>
				</div>

				<Tabs
					size="sm"
					activeTab={selectedCategory}
					onChange={setSelectedCategory}
					tabs={[
						{ id: 'all', label: t('account.store.credits.allCategories') },
						{ id: 'stage_style', label: t('account.store.credits.filters.stageStyles') },
						{ id: 'icon_pack', label: t('account.store.credits.filters.iconPacks') },
						{ id: 'cdn_slots', label: t('account.store.credits.filters.cdnSlots') },
						{ id: 'showcase_slots', label: t('account.store.credits.filters.showcaseSlots') },
						{ id: 'bot_slots', label: t('account.store.credits.filters.botSlots') },
						{ id: 'vanity_url', label: t('account.store.credits.filters.vanityUrls') },
						{ id: 'trial_pass', label: t('account.store.credits.filters.trialPasses') },
						{ id: 'vanity_badge', label: t('account.store.credits.filters.vanityBadges') },
						{ id: 'streak_shield', label: t('account.store.credits.filters.streakShields') },
						{ id: 'credit_packs', label: t('account.store.credits.filters.creditPacks') },
					]}
				/>
			</div>

			{/* Credit Perks Grid */}
			{filteredPerks.length === 0 && !showCreditPacks && (
				<div className="flex flex-col items-center justify-center p-12 text-center border border-(--border)/10 rounded-3xl bg-(--foreground)/20">
					<PackageSearch className="w-12 h-12 text-(--text-muted) mb-3 opacity-50" />
					<p className="text-(--text-muted) text-sm">{t('account.store.noItems')}</p>
				</div>
			)}
			{filteredPerks.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
					{filteredPerks.map((item) => {
						const PerkIcon = getPerkIcon(item.perkType, item.perkValue);
						const effectiveCost = getEffectiveCreditCost(item);
						const isDotMatrix = item.perkValue === 'dot_matrix_banner' || item.id === 'perk-badge-dotmatrix' || item.perkType === 'profile_cosmetic';
						const isStageOrIcon = ['stage_style', 'ambient_scene', 'surface_style', 'cursor_fx', 'overlay_skin', 'icon_pack', 'window_style'].includes(String(item.perkType));
						const isOwnedBadge = isPerkOwned(item);
						const canAfford = creditBalance >= effectiveCost;

						return (
							<div
								key={item.id}
								className={`relative flex flex-col justify-between rounded-3xl border backdrop-blur-md transition-all p-5 gap-4 ${
									item.isFeatured
										? 'bg-(--foreground)/40 border-(--accent)/35 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)]'
										: 'bg-(--foreground)/30 border-(--border)/10 hover:border-(--accent)/30 shadow-sm'
								}`}
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
											{item.discountPercent > 0 && (
												<span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/25">
													-{item.discountPercent}%
												</span>
											)}
										</div>
										<div className="flex items-baseline gap-1.5 shrink-0">
											<span className="inline-flex items-center gap-1 text-lg font-extrabold text-(--accent)">
												<Coins size={16} />
												{effectiveCost.toLocaleString()}
											</span>
											{item.discountPercent > 0 && item.creditCost && (
												<span className="text-xs text-(--text-muted) line-through opacity-60">{item.creditCost.toLocaleString()}</span>
											)}
										</div>
									</div>

									<DotMatrixPerkPreview initialVariant={(user?.credits?.dotMatrixVariant as any) || 'orbit'} perkValue={String(item.perkValue || '')} />

									<div>
										<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{item.name}
										</h3>
										<p className="text-xs text-(--text-muted) mt-1 leading-relaxed">{item.description}</p>
									</div>
								</div>

								<div className="flex flex-col gap-2">
									{isOwnedBadge ? (
										<>
											<Button variant="secondary" disabled className="w-full flex items-center justify-center gap-2">
												<Check size={15} className="text-(--accent-green)" />
												{t('account.store.credits.alreadyUnlocked')}
											</Button>
											{(isDotMatrix || isStageOrIcon) && (
												<Button
													variant="primary"
													size="sm"
													onClick={() =>
														(window.location.href = getEnvUrl(
															`https://account.xernerx.com/?tab=${
																isDotMatrix ? 'profile' : item.perkValue === 'ui_icon_packs' || item.perkType === 'window_style' ? 'preferences' : 'appearance'
															}`
														))
													}
													className="w-full flex items-center justify-center gap-1.5"
												>
													<ExternalLink size={14} />
													{t(isDotMatrix ? 'account.store.credits.dotMatrixPreview.customizeInProfile' : 'account.store.credits.equipInSettings')}
												</Button>
											)}
										</>
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
													setSelectedCategory('credit_packs');
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
			)}

			{/* Credit Top-Up Packs (Stripe SKU-linked) */}
			{showCreditPacks && creditPacks.length > 0 && (
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

			{/* Credit Balance Activity Ledger */}
			{user?.id && <CreditLedgerCard transactions={user?.credits?.transactions} streakShields={user?.credits?.streakShields ?? 0} />}

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
