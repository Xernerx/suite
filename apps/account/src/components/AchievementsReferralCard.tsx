/** @format */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, Check, Copy, Flame, Gift, Heart, Rocket, Sparkles, Trophy, UserPlus, Zap } from 'lucide-react';
import { Badge, Button, Input } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';

const ACHIEVEMENT_BADGE_ICONS: Record<string, any> = {
	streak_master_7: Flame,
	streak_master_30: Zap,
	streak_master_100: Trophy,
	top_voter_10: Heart,
	top_voter_50: Award,
	ecosystem_builder: Rocket,
};

interface AchievementItem {
	id: string;
	name: string;
	rewardCredits: number;
	badge: string;
	target: number;
	progress: number;
	rawProgress: number;
	unlocked: boolean;
	claimed: boolean;
}

interface AchievementsReferralCardProps {
	userId?: string;
	mutate?: () => Promise<any>;
}

export function AchievementsReferralCard({ userId, mutate }: AchievementsReferralCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [achievements, setAchievements] = useState<AchievementItem[]>([]);
	const [referredBy, setReferredBy] = useState<string | null>(null);
	const [referralBonusClaimed, setReferralBonusClaimed] = useState(false);
	const [referrerInput, setReferrerInput] = useState('');
	const [claimingId, setClaimingId] = useState<string | null>(null);
	const [submittingRef, setSubmittingRef] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);

	const fetchAchievements = useCallback(async () => {
		if (!userId) return;
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}/achievements`, {
				credentials: 'include',
			});
			if (!res.ok) return;
			const data = await res.json();
			if (Array.isArray(data.achievements)) setAchievements(data.achievements);
			setReferredBy(data.referredBy || null);
			setReferralBonusClaimed(Boolean(data.referralBonusClaimed));
		} catch {}
	}, [userId, getEnvUrl]);

	useEffect(() => {
		fetchAchievements();
	}, [fetchAchievements]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const refParam = new URLSearchParams(window.location.search).get('ref');
		if (refParam && refParam !== userId) {
			setReferrerInput(refParam);
		}
	}, [userId]);

	const handleClaimAchievement = async (achievementId: string) => {
		if (!userId || claimingId) return;
		setClaimingId(achievementId);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}/achievements`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ achievementId }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || t('account.billing.achievements.claimError'));
			if (Array.isArray(data.achievements)) setAchievements(data.achievements);
			if (mutate) await mutate();
			toast({
				type: 'success',
				title: t('account.billing.achievements.claimSuccess', { credits: data.rewardCredits }),
			});
		} catch (err: any) {
			toast({
				type: 'error',
				title: err.message || t('account.billing.achievements.claimError'),
			});
		} finally {
			setClaimingId(null);
		}
	};

	const handleSubmitReferrer = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!userId || !referrerInput.trim() || submittingRef) return;
		setSubmittingRef(true);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}/referrals`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ referrerId: referrerInput.trim() }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || t('account.billing.referrals.submitError'));
			setReferredBy(data.referredBy);
			setReferralBonusClaimed(Boolean(data.bonusAwarded));
			if (mutate) await mutate();
			toast({
				type: 'success',
				title: data.bonusAwarded ? t('account.billing.referrals.bonusAwardedToast') : t('account.billing.referrals.linkedToast'),
			});
		} catch (err: any) {
			toast({
				type: 'error',
				title: err.message || t('account.billing.referrals.submitError'),
			});
		} finally {
			setSubmittingRef(false);
		}
	};

	const referralLink = userId ? `${getEnvUrl('https://account.xernerx.com')}/?view=billing&ref=${userId}` : '';

	const handleCopyLink = () => {
		if (!referralLink) return;
		navigator.clipboard.writeText(referralLink);
		setCopiedLink(true);
		toast({ type: 'success', title: t('account.billing.referrals.linkCopied') });
		setTimeout(() => setCopiedLink(false), 2000);
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* Milestone Achievements Card */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<Trophy size={18} className="text-(--accent)" />
							<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.billing.achievements.title')}
							</h3>
						</div>
						<p className="text-xs text-(--text-muted)">{t('account.billing.achievements.subtitle')}</p>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{achievements.map((ach) => {
						const pct = ach.target > 0 ? Math.min(100, Math.round((ach.progress / ach.target) * 100)) : 0;
						const AchIcon = ACHIEVEMENT_BADGE_ICONS[ach.badge] || Award;
						return (
							<div
								key={ach.id}
								className={`flex flex-col justify-between p-4 rounded-2xl border transition-all gap-3 ${
									ach.claimed ? 'bg-(--background)/60 border-(--accent)/30' : ach.unlocked ? 'bg-(--accent)/10 border-(--accent)/40' : 'bg-(--background)/40 border-(--border)/10'
								}`}
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex items-center gap-2.5 min-w-0">
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
											<AchIcon size={16} />
										</div>
										<div className="min-w-0">
											<p className="text-sm font-bold text-(--text) truncate">{t(`account.billing.achievements.items.${ach.id}`, { default: ach.name })}</p>
											<span className="inline-flex items-center gap-1 text-[11px] font-bold text-(--accent)">
												+{ach.rewardCredits} <Sparkles size={10} />
											</span>
										</div>
									</div>
									{ach.claimed ? (
										<Badge variant="success" size="sm">
											{t('account.billing.achievements.claimed')}
										</Badge>
									) : ach.unlocked ? (
										<Button size="sm" onClick={() => handleClaimAchievement(ach.id)} loading={claimingId === ach.id} className="shrink-0">
											<Gift size={13} />
											{t('account.billing.achievements.claimButton')}
										</Button>
									) : (
										<span className="text-xs font-mono text-(--text-muted)">
											{ach.progress}/{ach.target}
										</span>
									)}
								</div>

								<div className="w-full h-1.5 rounded-full bg-(--foreground)/50 overflow-hidden">
									<div className="h-full rounded-full bg-(--accent) transition-all duration-300" style={{ width: `${pct}%` }} />
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Referral Program Card */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<UserPlus size={18} className="text-(--accent)" />
							<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.billing.referrals.title')}
							</h3>
							<Badge variant="accent" size="sm">
								+250
							</Badge>
						</div>
						<p className="text-xs text-(--text-muted)">{t('account.billing.referrals.subtitle')}</p>
					</div>

					<Button variant="secondary" size="sm" onClick={handleCopyLink} className="flex items-center gap-1.5 shrink-0">
						{copiedLink ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} />}
						{t('account.billing.referrals.copyLink')}
					</Button>
				</div>

				{referredBy ? (
					<div className="flex items-center justify-between p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 text-xs">
						<span className="text-(--text-muted)">
							{t('account.billing.referrals.referredByLabel')}: <strong className="font-mono text-(--text)">{referredBy}</strong>
						</span>
						<Badge variant={referralBonusClaimed ? 'success' : 'warning'} size="sm">
							{referralBonusClaimed ? t('account.billing.referrals.bonusUnlocked') : t('account.billing.referrals.claimDailyToUnlock')}
						</Badge>
					</div>
				) : (
					<form onSubmit={handleSubmitReferrer} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
						<div className="flex-1">
							<Input value={referrerInput} onChange={(e: any) => setReferrerInput(e.target.value)} placeholder={t('account.billing.referrals.inputPlaceholder')} />
						</div>
						<Button type="submit" disabled={!referrerInput.trim() || submittingRef} loading={submittingRef} className="shrink-0">
							{t('account.billing.referrals.applyButton')}
						</Button>
					</form>
				)}
			</div>
		</div>
	);
}
