/** @format */

'use client';

import React, { useMemo } from 'react';
import { Check, Flame, Gift, Trophy } from 'lucide-react';
import { Tooltip } from '@xernerx/ui';
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
		let hasUltra = Boolean(user?.staffSubscription);

		for (const sub of subs) {
			const status = String(sub?.status || '').toLowerCase();
			if (status !== 'active' && status !== 'trialing') continue;
			const expiry = sub?.expiresAt || sub?.currentPeriodEnd;
			if (expiry && new Date(expiry).getTime() <= now) continue;
			hasActiveSub = true;
			const planStr = `${sub?.priceId || ''} ${sub?.stripeSubscriptionId || ''} ${sub?.planId || ''} ${sub?.planName || ''} ${sub?.tier || ''}`.toLowerCase();
			if (planStr.includes('ultra') || planStr.includes('staff_infinite_sub') || planStr.includes('prod_v0pd5uxotqkrys')) {
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
	}, [user?.subscriptions, user?.staffSubscription]);

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
		<div className="flex flex-wrap items-center gap-1.5">
			{Array.from({ length: 7 }, (_, idx) => {
				const dayNum = idx + 1;
				const isMilestone = dayNum === 7;
				const isCompleted = dayNum <= completedInCycle;
				const isCurrentClaimable = nextClaimDayInCycle === dayNum;
				const effectiveStreakForDay = (cycleNumber - 1) * 7 + dayNum;
				const baseBonus = effectiveStreakForDay * 10 + (isMilestone ? 250 : 0);
				const boostedBonus = Math.round(baseBonus * multiplierInfo.multiplier);

				return (
					<Tooltip
						key={dayNum}
						content={`${t('account.store.credits.ladder.dayLabel', { day: dayNum })} • +${boostedBonus} ${t('account.store.credits.ladder.bonusSuffix')} (${
							isMilestone ? t('account.store.credits.ladder.milestoneVault') : t('account.store.credits.ladder.plusRandomBase')
						})`}
					>
						<button
							type="button"
							disabled={!isCurrentClaimable || claiming}
							onClick={() => {
								if (isCurrentClaimable) onClaim();
							}}
							className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-bold transition-all ${
								isCurrentClaimable
									? 'bg-(--accent) text-white border-(--accent) shadow-xs cursor-pointer hover:opacity-90'
									: isCompleted
										? 'bg-(--accent)/15 text-(--accent) border-(--accent)/30 cursor-default'
										: isMilestone
											? 'bg-(--background)/60 text-(--text) border-(--accent)/25 cursor-default'
											: 'bg-(--background)/40 text-(--text-muted) border-(--border)/10 opacity-70 cursor-default'
							}`}
						>
							{isCompleted ? (
								<Check size={12} />
							) : isCurrentClaimable ? (
								<Gift size={12} className="animate-pulse" />
							) : isMilestone ? (
								<Trophy size={12} className="text-(--accent)" />
							) : (
								<Flame size={12} />
							)}
							<span>D{dayNum}</span>
							<span className="text-[11px] font-mono opacity-85">+{boostedBonus}</span>
						</button>
					</Tooltip>
				);
			})}
		</div>
	);
}
