/** @format */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, Gift, Info, Lock, Sparkles, Trophy, Users, X } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button, Modal } from '@xernerx/ui';

export function GiveawayBanner() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [giveaways, setGiveaways] = useState<any[]>([]);
	const [dismissedIds, setDismissedIds] = useState<string[]>([]);
	const [selectedGiveaway, setSelectedGiveaway] = useState<any | null>(null);
	const [eligibilityData, setEligibilityData] = useState<any | null>(null);
	const [enteringId, setEnteringId] = useState<string | null>(null);
	const [nowMs, setNowMs] = useState(() => Date.now());

	const fetchActiveGiveaways = useCallback(() => {
		if (typeof window === 'undefined') return;
		const PORT_APPS = ['www', 'api', 'cdn', 'account', 'app', 'docs', 'admin', 'info', 'store', 'portal', 'hosting', 'haste', 'blog'];
		const host = window.location.hostname;
		const portIdx = Number(window.location.port) - 4000;
		const isLocalHost = host === 'localhost' || host === '127.0.0.1' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
		let appPre = 'app';
		if (isLocalHost && PORT_APPS[portIdx]) appPre = PORT_APPS[portIdx];
		else PORT_APPS.forEach((p) => host.startsWith(`${p}.`) && (appPre = p));

		try {
			const stored = JSON.parse(localStorage.getItem('xernerx-dismissed-giveaways') || '[]');
			if (Array.isArray(stored)) setDismissedIds(stored);
		} catch {}

		fetch(getEnvUrl(`https://api.xernerx.com/secure/giveaways?activeOnly=true&app=${encodeURIComponent(appPre)}`), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : []))
			.then((list: any[]) => {
				if (Array.isArray(list)) setGiveaways(list);
			})
			.catch(() => {});
	}, [getEnvUrl]);

	useEffect(() => {
		fetchActiveGiveaways();
		const timer = setInterval(() => setNowMs(Date.now()), 30000);
		return () => clearInterval(timer);
	}, [fetchActiveGiveaways]);

	const dismissGiveaway = (id: string) => {
		try {
			const next = Array.from(new Set([...dismissedIds, id]));
			setDismissedIds(next);
			localStorage.setItem('xernerx-dismissed-giveaways', JSON.stringify(next));
		} catch {}
	};

	const openDetailsModal = async (giveaway: any) => {
		setSelectedGiveaway(giveaway);
		setEligibilityData(null);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/giveaways/${giveaway.id}?checkEligibility=true`), {
				credentials: 'include',
			});
			if (res.ok) {
				const data = await res.json();
				setSelectedGiveaway(data);
				if (data.eligibility) setEligibilityData(data.eligibility);
			}
		} catch {}
	};

	const handleEnter = async (giveaway: any) => {
		setEnteringId(giveaway.id);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/giveaways/${giveaway.id}/enter`), {
				method: 'POST',
				credentials: 'include',
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || !data.ok) {
				const reasonMsg = Array.isArray(data.reasons) && data.reasons.length > 0 ? data.reasons.join(' ') : data.error;
				toast({
					type: 'error',
					title: t('giveawayBanner.toasts.enterFailed'),
					description: reasonMsg || t('giveawayBanner.toasts.notEligible'),
				});
				if (data.eligibility) setEligibilityData(data.eligibility);
				return;
			}

			if (data.eligibility) setEligibilityData(data.eligibility);

			const pendingNote =
				data.eligibility && !data.eligibility.eligible && Array.isArray(data.reasons) && data.reasons.length > 0 ? ` • Complete before giveaway ends: ${data.reasons.join(' ')}` : '';

			toast({
				type: 'success',
				title: data.alreadyEntered ? t('giveawayBanner.toasts.alreadyEntered') : t('giveawayBanner.toasts.enteredTitle'),
				description:
					t('giveawayBanner.toasts.enteredDesc', {
						weight: data.entry?.weight || 1,
						odds: data.winChancePercent ?? 100,
					}) + pendingNote,
			});

			fetchActiveGiveaways();
			if (selectedGiveaway?.id === giveaway.id) {
				setSelectedGiveaway((prev: any) =>
					prev
						? {
								...prev,
								myEntry: data.entry,
								entryCount: data.totalEntries,
								entries: data.giveaway?.entries || prev.entries,
							}
						: null
				);
			}
		} catch (err: any) {
			toast({ type: 'error', title: t('giveawayBanner.toasts.enterFailed'), description: err.message });
		} finally {
			setEnteringId(null);
		}
	};

	const handleLeave = async (giveaway: any) => {
		setEnteringId(giveaway.id);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/giveaways/${giveaway.id}/enter`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				toast({ type: 'info', title: t('giveawayBanner.toasts.leftTitle') });
				fetchActiveGiveaways();
				if (selectedGiveaway?.id === giveaway.id) {
					setSelectedGiveaway((prev: any) => (prev ? { ...prev, myEntry: null } : null));
				}
			}
		} catch {}
		setEnteringId(null);
	};

	const activeGiveaway = giveaways.find((g) => g?.id && !dismissedIds.includes(g.id) && new Date(g.endsAt).getTime() > nowMs);
	if (!activeGiveaway) return null;

	const endsMs = new Date(activeGiveaway.endsAt).getTime();
	const diffMins = Math.max(1, Math.floor((endsMs - nowMs) / 60000));
	const daysLeft = Math.floor(diffMins / 1440);
	const hoursLeft = Math.floor((diffMins % 1440) / 60);
	const minsLeft = diffMins % 60;
	const timeRemainingStr = daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`;

	const entryCount = activeGiveaway.entryCount ?? (Array.isArray(activeGiveaway.entries) ? activeGiveaway.entries.length : 0);
	const myEntry = activeGiveaway.myEntry;

	return (
		<>
			<div
				className="max-w-(--page-width) mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-3xl bg-(--foreground)/40 border border-(--accent)/35 backdrop-blur-md text-xs text-(--text) shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
				style={{ marginBottom: 'var(--ui-gap)' }}
			>
				<div className="flex flex-wrap items-center gap-2.5 min-w-0">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent) text-(--accent-contrast) px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shrink-0 shadow-xs">
						<Gift size={12} />
						{t('giveawayBanner.liveBadge')}
					</span>

					<span className="font-extrabold text-sm text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{activeGiveaway.title}
					</span>

					<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2.5 py-0.5 text-[11px] font-bold text-(--accent) shrink-0">
						<Trophy size={11} />
						{activeGiveaway.prize?.label || activeGiveaway.title}
					</span>

					<span className="inline-flex items-center gap-1 text-[11px] text-(--text-muted) shrink-0">
						<Users size={11} className="text-(--accent)" />
						{t('giveawayBanner.entriesCount', { count: entryCount })}
					</span>

					<span className="inline-flex items-center gap-1 text-[11px] text-(--text-muted) shrink-0">
						<Clock size={11} className="text-(--accent)" />
						{t('giveawayBanner.endsIn', { time: timeRemainingStr })}
					</span>
				</div>

				<div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
					{myEntry ? (
						<button
							type="button"
							onClick={() => openDetailsModal(activeGiveaway)}
							className="inline-flex items-center gap-1.5 rounded-full bg-(--accent-green)/15 border border-(--accent-green)/35 px-3 py-1.5 text-xs font-extrabold text-(--accent-green) cursor-pointer"
						>
							<CheckCircle2 size={13} />
							{t('giveawayBanner.enteredBadge', { weight: myEntry.weight || 1 })}
						</button>
					) : (
						<Button variant="primary" onClick={() => handleEnter(activeGiveaway)} disabled={enteringId === activeGiveaway.id} className="rounded-full px-3.5 py-1.5 text-xs font-extrabold">
							<Gift size={13} />
							{enteringId === activeGiveaway.id ? t('giveawayBanner.entering') : t('giveawayBanner.enterButton')}
						</Button>
					)}

					<button
						type="button"
						onClick={() => openDetailsModal(activeGiveaway)}
						className="inline-flex items-center gap-1 rounded-full bg-(--background)/60 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/30 px-2.5 py-1.5 text-xs font-semibold text-(--text-muted) hover:text-(--text) transition-colors cursor-pointer"
					>
						<Info size={13} />
						<span className="hidden md:inline">{t('giveawayBanner.detailsButton')}</span>
					</button>

					<button type="button" onClick={() => dismissGiveaway(activeGiveaway.id)} aria-label={t('common.close')} className="text-(--text-muted) hover:text-(--text) p-1 cursor-pointer">
						<X size={14} />
					</button>
				</div>
			</div>

			{selectedGiveaway && (
				<Modal
					open={Boolean(selectedGiveaway)}
					onOpenChange={(open) => !open && setSelectedGiveaway(null)}
					size="2xl"
					title={selectedGiveaway.title}
					description={t('giveawayBanner.modalSubtitle', {
						prize: selectedGiveaway.prize?.label || selectedGiveaway.title,
						winners: selectedGiveaway.winnerCount || 1,
					})}
				>
					<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
						{selectedGiveaway.bannerUrl && (
							<div className="h-40 w-full overflow-hidden rounded-2xl border border-(--border)/10 bg-(--background)/60">
								<img src={selectedGiveaway.bannerUrl} alt={selectedGiveaway.title} className="h-full w-full object-cover" />
							</div>
						)}

						{selectedGiveaway.description && <p className="text-sm text-(--text-muted) leading-relaxed">{selectedGiveaway.description}</p>}

						<div className="grid grid-cols-3 gap-2.5">
							<div className="flex flex-col rounded-2xl bg-(--foreground)/25 border border-(--border)/10 p-3">
								<span className="text-[10px] font-bold uppercase text-(--text-muted)">{t('giveawayBanner.prizeLabel')}</span>
								<span className="text-sm font-extrabold text-(--accent) truncate">{selectedGiveaway.prize?.label}</span>
							</div>
							<div className="flex flex-col rounded-2xl bg-(--foreground)/25 border border-(--border)/10 p-3">
								<span className="text-[10px] font-bold uppercase text-(--text-muted)">{t('giveawayBanner.winnersLabel')}</span>
								<span className="text-sm font-extrabold text-(--text)">{selectedGiveaway.winnerCount || 1}</span>
							</div>
							<div className="flex flex-col rounded-2xl bg-(--foreground)/25 border border-(--border)/10 p-3">
								<span className="text-[10px] font-bold uppercase text-(--text-muted)">{t('giveawayBanner.entrantsLabel')}</span>
								<span className="text-sm font-extrabold text-(--text)">
									{selectedGiveaway.entryCount ?? (Array.isArray(selectedGiveaway.entries) ? selectedGiveaway.entries.length : 0)}
								</span>
							</div>
						</div>

						{/* Configured Requirements & Bonus Rules Summary */}
						{(() => {
							const reqs = selectedGiveaway.requirements || {};
							const reqPills: string[] = [];
							if ((Number(reqs.minGlobalLevel) || 0) > 0) {
								reqPills.push(t('admin.dashboard.giveaways.requirements.levelPreset', { level: reqs.minGlobalLevel }));
							}
							if (reqs.requireAccount) reqPills.push(t('admin.dashboard.giveaways.requirements.accountBadge'));
							if (reqs.requireVerified) reqPills.push(t('admin.dashboard.giveaways.requirements.verifiedBadge'));
							if (reqs.requireActivePass) reqPills.push(t('admin.dashboard.giveaways.requirements.activePassBadge'));
							if ((Number(reqs.minStreak) || 0) > 0) {
								reqPills.push(t('admin.dashboard.giveaways.requirements.streakBadge', { streak: reqs.minStreak }));
							}
							if ((Number(reqs.minTotalSpent) || 0) > 0) {
								reqPills.push(t('admin.dashboard.giveaways.requirements.spentBadge', { amount: reqs.minTotalSpent }));
							}
							const bonuses = Array.isArray(selectedGiveaway.bonusEntries) ? selectedGiveaway.bonusEntries : [];
							if (reqPills.length === 0 && bonuses.length === 0) return null;

							return (
								<div className="flex flex-wrap items-center gap-1.5">
									{reqPills.map((pill, idx) => (
										<span
											key={`req-${idx}`}
											className="inline-flex items-center gap-1 rounded-full bg-(--foreground)/30 border border-(--border)/10 px-2.5 py-1 text-[11px] font-bold text-(--text)"
										>
											<Lock size={11} className="text-(--accent)" />
											{pill}
										</span>
									))}
									{bonuses.map((b: any, idx: number) => (
										<span
											key={`bon-${idx}`}
											className="inline-flex items-center gap-1 rounded-full bg-(--accent)/10 border border-(--accent)/25 px-2.5 py-1 text-[11px] font-bold text-(--accent)"
										>
											<Sparkles size={11} />
											{b.label || b.type} (+{b.extraEntries})
										</span>
									))}
								</div>
							);
						})()}

						{/* Eligibility & Bonus Breakdown */}
						{eligibilityData && (
							<div className="flex flex-col gap-2 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-3.5">
								<div className="flex items-center justify-between">
									<span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-(--text)">
										{eligibilityData.eligible ? <CheckCircle2 size={14} className="text-(--accent-green)" /> : <Lock size={14} className="text-(--accent-red)" />}
										{eligibilityData.eligible ? t('giveawayBanner.eligibleStatus') : t('giveawayBanner.ineligibleStatus')}
									</span>
									<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2.5 py-0.5 text-xs font-extrabold text-(--accent)">
										<Sparkles size={12} />
										{t('giveawayBanner.yourWeight', { weight: eligibilityData.weight || 1 })}
									</span>
								</div>

								{Array.isArray(eligibilityData.matchedBonuses) && eligibilityData.matchedBonuses.length > 0 && (
									<div className="flex flex-wrap items-center gap-1.5">
										{eligibilityData.matchedBonuses.map((b: any, i: number) => (
											<span
												key={i}
												className="inline-flex items-center gap-1 rounded-full bg-(--accent)/10 border border-(--accent)/25 px-2.5 py-0.5 text-[11px] font-bold text-(--accent)"
											>
												+{b.extraEntries} {b.label}
											</span>
										))}
									</div>
								)}

								{Array.isArray(eligibilityData.reasons) && eligibilityData.reasons.length > 0 && (
									<div className="flex flex-col gap-1 mt-1 text-xs text-(--accent-red)">
										{eligibilityData.reasons.map((r: string, i: number) => (
											<span key={i}>• {r}</span>
										))}
									</div>
								)}
							</div>
						)}

						<div className="flex items-center justify-between gap-2 border-t border-(--border)/10 pt-3">
							<span className="text-xs text-(--text-muted)">
								{t('giveawayBanner.endsAtLabel')}: {new Date(selectedGiveaway.endsAt).toLocaleString()}
							</span>

							<div className="flex items-center gap-2">
								{selectedGiveaway.myEntry ? (
									<>
										<Button variant="secondary" onClick={() => handleLeave(selectedGiveaway)} disabled={enteringId === selectedGiveaway.id}>
											{t('giveawayBanner.leaveButton')}
										</Button>
										<Button variant="primary" onClick={() => handleEnter(selectedGiveaway)} disabled={enteringId === selectedGiveaway.id}>
											<CheckCircle2 size={14} />
											{t('giveawayBanner.refreshEntryButton')}
										</Button>
									</>
								) : (
									<Button variant="primary" onClick={() => handleEnter(selectedGiveaway)} disabled={enteringId === selectedGiveaway.id}>
										<Gift size={14} />
										{enteringId === selectedGiveaway.id ? t('giveawayBanner.entering') : t('giveawayBanner.enterButton')}
									</Button>
								)}
							</div>
						</div>
					</div>
				</Modal>
			)}
		</>
	);
}
