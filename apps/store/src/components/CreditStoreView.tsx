/** @format */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Bot, Check, Clock, Coins, Cpu, Crown, ExternalLink, Flame, Gem, Gift, Globe, HardDrive, LayoutGrid, Loader2, PackageSearch, Shield, Sparkles, Zap } from 'lucide-react';
import { Badge, Button, Confirm, Input, Tabs, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { CreditLedgerCard } from './CreditLedgerCard';
import { CreditTopUpPacksSection } from './CreditTopUpPacksSection';
import { DailyStreakLadder } from './DailyStreakLadder';
import { DotMatrixPerkPreview } from './DotMatrixPerkPreview';
import { BUNDLE_CHILDREN_MAP, CatalogItem, COSMETIC_PARENT_UNLOCKS } from './types';

interface CreditStoreViewProps {
	items: CatalogItem[];
	user: any;
	userLoading: boolean;
	mutateUser?: () => Promise<any>;
	actionLoading: string | null;
	onBuyCreditPack: (priceId: string, item: CatalogItem) => void;
	highlightedItemId?: string | null;
	hideOwned?: boolean;
	onHideOwnedChange?: (hideOwned: boolean) => void;
}

const VALID_CREDIT_FILTER_TABS = new Set([
	'all',
	'dot_matrix',
	'stage_style',
	'icon_pack',
	'cdn_slots',
	'showcase_slots',
	'bot_slots',
	'vanity_url',
	'trial_pass',
	'vanity_badge',
	'streak_shield',
	'credit_packs',
]);

const PERK_ICONS: Record<string, any> = {
	cdn_slots: HardDrive,
	showcase_slots: LayoutGrid,
	bot_slots: Bot,
	vanity_url: Globe,
	trial_pass: Zap,
	streak_shield: Shield,
	dot_matrix: Cpu,
	stage_style: Cpu,
	stage_styles_pack: Cpu,
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

export function CreditStoreView({ items, user, userLoading, mutateUser, actionLoading, onBuyCreditPack, highlightedItemId, hideOwned: controlledHideOwned, onHideOwnedChange }: CreditStoreViewProps) {
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

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		const urlPerk = params.get('perk') || params.get('filter');
		if (urlPerk && VALID_CREDIT_FILTER_TABS.has(urlPerk)) {
			setSelectedCategory(urlPerk);
		}
	}, []);

	const handleSelectTab = useCallback((nextTab: string) => {
		setSelectedCategory(nextTab);
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		if (nextTab && nextTab !== 'all') {
			params.set('perk', nextTab);
		} else {
			params.delete('perk');
			params.delete('filter');
		}
		const qs = params.toString();
		window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
	}, []);

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
			const isCosmeticUnlock = ['dot_matrix', 'stage_style', 'ambient_scene', 'surface_style', 'cursor_fx', 'overlay_skin', 'icon_pack', 'window_style'].includes(String(item.perkType));
			const badgeKey = String(item.perkValue || item.id);
			const parentUnlocks = COSMETIC_PARENT_UNLOCKS[badgeKey] || [];
			const bundleChildren = BUNDLE_CHILDREN_MAP[badgeKey];
			const allChildrenOwned = Boolean(bundleChildren?.length && bundleChildren.every((child) => unlockedBadges.includes(child)));
			return (
				((item.perkType === 'vanity_badge' || item.perkType === 'profile_cosmetic' || isCosmeticUnlock) &&
					(unlockedBadges.includes(badgeKey) || unlockedBadges.includes(String(item.id)) || parentUnlocks.some((p) => unlockedBadges.includes(p)) || allChildrenOwned)) ||
				(item.perkType === 'streak_shield' && (user?.credits?.streakShields ?? 0) >= 3)
			);
		},
		[unlockedBadges, user?.credits?.streakShields]
	);
	const matchesPerkCategory = (item: CatalogItem, cat: string) => {
		if (cat === 'dot_matrix') return item.perkType === 'dot_matrix' || item.perkValue === 'dot_matrix_banner' || item.perkType === 'stage_style';
		if (cat === 'stage_style') return item.perkType === 'dot_matrix' || item.perkType === 'stage_style' || item.perkType === 'ambient_scene' || item.perkType === 'surface_style';
		if (cat === 'icon_pack') return item.perkType === 'icon_pack' || item.perkType === 'window_style' || item.perkType === 'cursor_fx' || item.perkType === 'overlay_skin';
		if (cat === 'vanity_badge') return item.perkType === 'vanity_badge' || item.perkType === 'profile_cosmetic' || item.perkValue === 'dot_matrix_banner';
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
					<Button variant="secondary" onClick={() => handleSelectTab(selectedCategory === 'credit_packs' ? 'all' : 'credit_packs')} className="flex items-center gap-2">
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
					onChange={handleSelectTab}
					tabs={[
						{ id: 'all', label: t('account.store.credits.allCategories') },
						{ id: 'dot_matrix', label: t('account.store.credits.filters.dotMatrix') },
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
						const isProfileCosmetic = item.perkType === 'profile_cosmetic';
						const isEquipableSetting = ['dot_matrix', 'stage_style', 'ambient_scene', 'surface_style', 'cursor_fx', 'overlay_skin', 'icon_pack', 'window_style'].includes(
							String(item.perkType)
						);
						const isOwnedBadge = isPerkOwned(item);
						const canAfford = creditBalance >= effectiveCost;
						const isHighlighted = highlightedItemId === item.id;

						return (
							<div
								key={item.id}
								id={`store-item-${item.id}`}
								className={`relative flex flex-col justify-between rounded-3xl border backdrop-blur-md transition-all p-5 gap-4 ${
									isHighlighted
										? 'bg-(--foreground)/45 border-(--accent) ring-2 ring-(--accent)/45 shadow-[0_0_26px_color-mix(in_srgb,var(--accent)_28%,transparent)]'
										: item.isFeatured
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
											{(isProfileCosmetic || isEquipableSetting) && (
												<Button
													variant="primary"
													size="sm"
													onClick={() =>
														(window.location.href = getEnvUrl(
															`https://account.xernerx.com/?tab=${
																isProfileCosmetic ? 'profile' : item.perkValue === 'ui_icon_packs' || item.perkType === 'window_style' ? 'preferences' : 'appearance'
															}`
														))
													}
													className="w-full flex items-center justify-center gap-1.5"
												>
													<ExternalLink size={14} />
													{t(isProfileCosmetic ? 'account.store.credits.dotMatrixPreview.customizeInProfile' : 'account.store.credits.equipInSettings')}
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
													handleSelectTab('credit_packs');
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
			{showCreditPacks && <CreditTopUpPacksSection creditPacks={creditPacks} actionLoading={actionLoading} onBuyCreditPack={onBuyCreditPack} />}

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
