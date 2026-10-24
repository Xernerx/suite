/** @format */

'use client';

import React, { useMemo } from 'react';
import { Check, Crown, Flame, Gift, Lock, Sparkles, Trophy } from 'lucide-react';
import { Badge } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface DailyStreakLadderProps {
	streak: number;
	canClaim: boolean;
	user: any;
	onClaim: () => void;
	claiming: boolean;
}

export function DailyStreakLadder({ streak, canClaim, user, onClaim, claiming }: DailyStreakLadderProps) {
	const { t } = useDictionary();

	const multiplierInfo = useMemo(() => {
		const subs: any[] = Array.isArray(user?.subscriptions) ? user.subscriptions : [];
		const now = Date.now();
		let hasActiveSub = false;
		let hasUltra = false;

		for (const sub of subs) {
			const status = String(sub?.status || '').toLowerCase();
			if (status !== 'active' && status !== 'trialing') continue;
			if (sub?.expiresAt && new Date(sub.expiresAt).getTime() <= now) continue;
			hasActiveSub = true;
			const planStr = `${sub?.planId || ''} ${sub?.planName || ''} ${sub?.tier || ''}`.toLowerCase();
			if (planStr.includes('ultra')) {
				hasUltra = true;
			}
		}

		if (hasUltra) {
			return { multiplier: 2, percent: 200, tier: 'ultra' as const };
		}
		if (hasActiveSub) {
			return { multiplier: 1.25, percent: 125, tier: 'subscriber' as const };
		}
		return { multiplier: 1, percent: 100, tier: 'free' as const };
	}, [user?.subscriptions]);

	// Determine how many days of the current 7-day cycle are completed
	const completedInCycle = useMemo(() => {
		if (streak <= 0) return 0;
		if (canClaim) {
			return streak % 7;
		}
		return ((streak - 1) % 7) + 1;
	}, [streak, canClaim]);

	const nextClaimDayInCycle = canClaim ? completedInCycle + 1 : null;
	const cycleNumber = Math.floor(Math.max(0, streak - (canClaim ? 0 : 1)) / 7) + 1;

	return (
		<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.85)' }}>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="flex flex-col gap-1">
					<div className="flex flex-wrap items-center gap-2">
						<Flame size={18} className="text-(--accent)" />
						<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('account.store.credits.ladder.title')}
						</h3>
						<Badge variant="accent" size="sm">
							{t('account.store.credits.ladder.cycleBadge', { cycle: cycleNumber })}
						</Badge>
					</div>
					<p className="text-xs text-(--text-muted)">{t('account.store.credits.ladder.subtitle')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2 shrink-0">
					{multiplierInfo.percent > 100 ? (
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
							<Crown size={13} />
							{multiplierInfo.tier === 'ultra' ? t('account.store.credits.ladder.ultraMultiplierBadge') : t('account.store.credits.ladder.subMultiplierBadge')}
						</span>
					) : (
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-(--background)/60 text-(--text-muted) border border-(--border)/10">
							<Sparkles size={12} className="text-(--accent)" />
							{t('account.store.credits.ladder.freeMultiplierHint')}
						</span>
					)}
				</div>
			</div>

			{/* 7-Day Step Grid */}
			<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
				{Array.from({ length: 7 }, (_, idx) => {
					const dayNum = idx + 1;
					const isMilestone = dayNum === 7;
					const isCompleted = dayNum <= completedInCycle;
					const isCurrentClaimable = nextClaimDayInCycle === dayNum;
					const effectiveStreakForDay = (cycleNumber - 1) * 7 + dayNum;
					const baseBonus = effectiveStreakForDay * 10 + (isMilestone ? 250 : 0);
					const boostedBonus = Math.round(baseBonus * multiplierInfo.multiplier);

					return (
						<button
							key={dayNum}
							type="button"
							disabled={!isCurrentClaimable || claiming}
							onClick={() => {
								if (isCurrentClaimable) onClaim();
							}}
							className={`relative flex flex-col items-center justify-between p-3.5 rounded-2xl border text-center transition-all ${
								isCurrentClaimable
									? 'bg-(--accent)/15 border-(--accent) shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_25%,transparent)] cursor-pointer hover:scale-[1.02]'
									: isCompleted
										? 'bg-(--background)/70 border-(--accent)/35 opacity-95 default'
										: isMilestone
											? 'bg-(--background)/50 border-(--accent)/25 opacity-85 default'
											: 'bg-(--background)/35 border-(--border)/10 opacity-65 default'
							}`}
						>
							<div className="flex items-center justify-between w-full mb-2">
								<span className="text-[11px] font-extrabold uppercase tracking-wider text-(--text-muted)">{t('account.store.credits.ladder.dayLabel', { day: dayNum })}</span>
								{isCompleted ? (
									<span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--accent) text-white">
										<Check size={11} />
									</span>
								) : isCurrentClaimable ? (
									<span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--accent)/20 text-(--accent) animate-pulse">
										<Gift size={12} />
									</span>
								) : isMilestone ? (
									<Trophy size={13} className="text-(--accent)" />
								) : (
									<Lock size={11} className="text-(--text-muted) opacity-60" />
								)}
							</div>

							<div
								className={`flex h-10 w-10 items-center justify-center rounded-2xl border my-1 ${
									isCompleted || isCurrentClaimable || isMilestone
										? 'bg-(--accent)/15 border-(--accent)/30 text-(--accent)'
										: 'bg-(--foreground)/40 border-(--border)/10 text-(--text-muted)'
								}`}
							>
								{isMilestone ? <Trophy size={18} /> : <Flame size={18} />}
							</div>

							<div className="flex flex-col items-center mt-1.5">
								<span className="text-xs font-extrabold text-(--text)">
									+{boostedBonus} {t('account.store.credits.ladder.bonusSuffix')}
								</span>
								<span className="text-[10px] text-(--text-muted)">
									{isMilestone ? t('account.store.credits.ladder.milestoneVault') : t('account.store.credits.ladder.plusRandomBase')}
								</span>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
