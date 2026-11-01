/** @format */
'use client';

import React from 'react';
import { Input, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { UserCreditTransaction } from './types';

const VANITY_BADGE_IDS = [
	'dot_matrix_banner',
	'credit_patron',
	'high_roller',
	'vault_sovereign',
	'streak_master_7',
	'streak_master_30',
	'streak_master_100',
	'top_voter_10',
	'top_voter_50',
	'ecosystem_builder',
] as const;

const ACHIEVEMENT_IDS = ['streak_7', 'streak_30', 'streak_100', 'voter_10', 'voter_50', 'ecosystem_builder'] as const;

const DOT_MATRIX_VARIANTS = ['orbit', 'vortex', 'helix', 'prism', 'infinity', 'wavegrid', 'full', 'icon'] as const;

interface UserEconomyPerksTabProps {
	credits: number;
	setCredits: (val: number) => void;
	streak: number;
	setStreak: (val: number) => void;
	streakShields: number;
	setStreakShields: (val: number) => void;
	totalSpent: number;
	setTotalSpent: (val: number) => void;
	globalLevel: number;
	setGlobalLevel: (val: number) => void;
	globalXp: number;
	setGlobalXp: (val: number) => void;
	extraBotSlots: number;
	setExtraBotSlots: (val: number) => void;
	extraCdnSlots: number;
	setExtraCdnSlots: (val: number) => void;
	extraShowcaseSlots: number;
	setExtraShowcaseSlots: (val: number) => void;
	extraVanitySlots: number;
	setExtraVanitySlots: (val: number) => void;
	referredBy: string;
	setReferredBy: (val: string) => void;
	referralBonusClaimed: boolean;
	setReferralBonusClaimed: (val: boolean) => void;
	dotMatrixVariant: string;
	setDotMatrixVariant: (val: string) => void;
	unlockedBadges: string[];
	setUnlockedBadges: (val: string[]) => void;
	activeBadges: string[];
	setActiveBadges: (val: string[]) => void;
	claimedAchievements: string[];
	setClaimedAchievements: (val: string[]) => void;
	transactions: UserCreditTransaction[];
}

export function UserEconomyPerksTab({
	credits,
	setCredits,
	streak,
	setStreak,
	streakShields,
	setStreakShields,
	totalSpent,
	setTotalSpent,
	globalLevel,
	setGlobalLevel,
	globalXp,
	setGlobalXp,
	extraBotSlots,
	setExtraBotSlots,
	extraCdnSlots,
	setExtraCdnSlots,
	extraShowcaseSlots,
	setExtraShowcaseSlots,
	extraVanitySlots,
	setExtraVanitySlots,
	referredBy,
	setReferredBy,
	referralBonusClaimed,
	setReferralBonusClaimed,
	dotMatrixVariant,
	setDotMatrixVariant,
	unlockedBadges,
	setUnlockedBadges,
	activeBadges,
	setActiveBadges,
	claimedAchievements,
	setClaimedAchievements,
	transactions,
}: UserEconomyPerksTabProps) {
	const { t } = useDictionary();

	const badgeOptions = VANITY_BADGE_IDS.map((id) => ({
		value: id,
		label: `${t(`account.profile.showcases.badges.${id}`)} (${id})`,
	}));

	const achievementOptions = ACHIEVEMENT_IDS.map((id) => ({
		value: id,
		label: `${t(`account.billing.achievements.items.${id}`)} (${id})`,
	}));

	return (
		<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 1.25)' }}>
			<div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.card.creditsLabel')}</label>
					<Input variant="number" value={credits} onChange={(e) => setCredits(Math.max(0, parseInt(e.target.value) || 0))} className="bg-(--background)/50" />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.card.dailyStreakLabel')}</label>
					<Input variant="number" value={streak} onChange={(e) => setStreak(Math.max(0, parseInt(e.target.value) || 0))} className="bg-(--background)/50" />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.streakShieldsLabel')}</label>
					<Input variant="number" value={streakShields} onChange={(e) => setStreakShields(Math.min(3, Math.max(0, parseInt(e.target.value) || 0)))} className="bg-(--background)/50" />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.card.globalLevelLabel')}</label>
					<Input variant="number" value={globalLevel} onChange={(e) => setGlobalLevel(Math.max(0, parseInt(e.target.value) || 0))} className="bg-(--background)/50" />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.card.globalXpLabel')}</label>
					<Input variant="number" value={globalXp} onChange={(e) => setGlobalXp(Math.max(0, parseInt(e.target.value) || 0))} className="bg-(--background)/50" />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.totalSpentLabel')}</label>
					<Input variant="number" value={totalSpent} onChange={(e) => setTotalSpent(Math.max(0, parseInt(e.target.value) || 0))} className="bg-(--background)/50" />
				</div>
			</div>

			<div className="rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4 flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				<span className="text-xs font-bold uppercase tracking-wider text-(--accent)">{t('admin.users.fields.extraSlotsTitle')}</span>
				<div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.extraBotSlotsLabel')}</label>
						<Input variant="number" value={extraBotSlots} onChange={(e) => setExtraBotSlots(Math.max(0, parseInt(e.target.value) || 0))} />
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.extraCdnSlotsLabel')}</label>
						<Input variant="number" value={extraCdnSlots} onChange={(e) => setExtraCdnSlots(Math.max(0, parseInt(e.target.value) || 0))} />
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.extraShowcaseSlotsLabel')}</label>
						<Input variant="number" value={extraShowcaseSlots} onChange={(e) => setExtraShowcaseSlots(Math.max(0, parseInt(e.target.value) || 0))} />
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.extraVanitySlotsLabel')}</label>
						<Input variant="number" value={extraVanitySlots} onChange={(e) => setExtraVanitySlots(Math.max(0, parseInt(e.target.value) || 0))} />
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.unlockedBadgesLabel')}</label>
					<MultiSelector value={unlockedBadges} onChange={setUnlockedBadges} options={badgeOptions} placeholder={t('admin.users.fields.unlockedBadgesLabel')} />
				</div>
				<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.activeBadgesLabel')}</label>
					<MultiSelector value={activeBadges} onChange={setActiveBadges} options={badgeOptions} placeholder={t('admin.users.fields.activeBadgesLabel')} />
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.claimedAchievementsLabel')}</label>
					<MultiSelector value={claimedAchievements} onChange={setClaimedAchievements} options={achievementOptions} placeholder={t('admin.users.fields.claimedAchievementsLabel')} />
				</div>
				<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.dotMatrixVariantLabel')}</label>
					<Selector
						value={dotMatrixVariant}
						onChange={setDotMatrixVariant}
						options={DOT_MATRIX_VARIANTS.map((v) => ({
							value: v,
							label: t(`account.appearance.dotMatrix.types.${v}`),
						}))}
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.referredByLabel')}</label>
					<Input type="text" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} placeholder="482513687417061376" />
				</div>
				<div className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--background)/50 px-4 py-2.5 self-end h-[46px]">
					<span className="text-xs font-bold text-(--text)">{t('admin.users.fields.referralBonusClaimedToggle')}</span>
					<Toggle checked={referralBonusClaimed} onChange={(e) => setReferralBonusClaimed(e.target.checked)} />
				</div>
			</div>

			<div className="rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('admin.users.fields.transactionsTitle')}</span>
				{transactions.length === 0 ? (
					<p className="text-xs text-(--text-muted) italic">{t('admin.users.fields.noTransactions')}</p>
				) : (
					<div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
						{[...transactions]
							.reverse()
							.slice(0, 20)
							.map((tx, idx) => (
								<div key={tx.id || idx} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-(--foreground)/30 border border-(--border)/10">
									<div className="flex items-center gap-2 min-w-0">
										<span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-(--accent)/15 text-(--accent)">{tx.type || 'spend'}</span>
										<span className="truncate text-(--text)">{tx.itemName || tx.itemId || '-'}</span>
									</div>
									<div className="flex items-center gap-3 shrink-0 font-mono">
										<span className={(tx.amount || 0) >= 0 ? 'text-(--accent-green) font-bold' : 'text-(--accent-red) font-bold'}>
											{(tx.amount || 0) >= 0 ? `+${tx.amount}` : tx.amount}
										</span>
										{tx.createdAt && <span className="text-[10px] text-(--text-muted)">{new Date(tx.createdAt).toLocaleDateString()}</span>}
									</div>
								</div>
							))}
					</div>
				)}
			</div>
		</div>
	);
}
