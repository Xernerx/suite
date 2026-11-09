/** @format */
'use client';

import React from 'react';
import { Calendar, CheckCircle2, Clock, Coins, Crown, Dices, Edit3, Gift, Globe, Hash, Lock, Shield, ShoppingBag, Sparkles, Trash2, Trophy, Users, XCircle } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Button } from '@xernerx/ui';
import type { GiveawayItem, SelectOption } from './types';

interface GiveawayCardProps {
	giveaway: GiveawayItem;
	channels: SelectOption[];
	roles: SelectOption[];
	onEdit: (giveaway: GiveawayItem) => void;
	onInspectEntrants: (giveaway: GiveawayItem) => void;
	onEndNow: (giveaway: GiveawayItem) => void;
	onReroll: (giveaway: GiveawayItem, replaceUserId?: string) => void;
	onFulfillWinner: (giveaway: GiveawayItem, winnerUserId: string) => void;
	onCancel: (giveaway: GiveawayItem) => void;
	onDelete: (giveaway: GiveawayItem) => void;
}

export function GiveawayCard({ giveaway, channels, roles, onEdit, onInspectEntrants, onEndNow, onReroll, onFulfillWinner, onCancel, onDelete }: GiveawayCardProps) {
	const { t } = useDictionary();

	const entries = Array.isArray(giveaway.entries) ? giveaway.entries : [];
	const winners = Array.isArray(giveaway.winners) ? giveaway.winners : [];
	const totalTickets = entries.reduce((sum, e) => sum + (Number(e.weight) || 1), 0);
	const channelLabel = channels.find((c) => c.value === giveaway.channelId)?.label || (giveaway.channelId ? `#${giveaway.channelId}` : null);

	const reqs = giveaway.requirements || ({} as any);
	const reqBadges: string[] = [];
	if (reqs.requireAccount) reqBadges.push(t('admin.dashboard.giveaways.requirements.accountBadge'));
	if (reqs.requireVerified) reqBadges.push(t('admin.dashboard.giveaways.requirements.verifiedBadge'));
	if (reqs.requireActivePass) reqBadges.push(t('admin.dashboard.giveaways.requirements.activePassBadge'));
	if ((Number(reqs.minGlobalLevel) || 0) > 0) reqBadges.push(t('admin.dashboard.giveaways.requirements.levelBadge', { level: reqs.minGlobalLevel }));
	if ((Number(reqs.minStreak) || 0) > 0) reqBadges.push(t('admin.dashboard.giveaways.requirements.streakBadge', { streak: reqs.minStreak }));
	if ((Number(reqs.minTotalSpent) || 0) > 0) reqBadges.push(t('admin.dashboard.giveaways.requirements.spentBadge', { amount: reqs.minTotalSpent }));
	if (Array.isArray(reqs.requiredDiscordRoleIds) && reqs.requiredDiscordRoleIds.length > 0) {
		reqBadges.push(t('admin.dashboard.giveaways.requirements.rolesCountBadge', { count: reqs.requiredDiscordRoleIds.length }));
	}
	if (Array.isArray(reqs.requiredBadgeOrItemIds) && reqs.requiredBadgeOrItemIds.length > 0) {
		reqBadges.push(t('admin.dashboard.giveaways.requirements.itemsCountBadge', { count: reqs.requiredBadgeOrItemIds.length }));
	}

	const getStatusStyle = () => {
		switch (giveaway.status) {
			case 'active':
				return 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30';
			case 'scheduled':
				return 'bg-(--accent)/15 text-(--accent) border-(--accent)/30';
			case 'ended':
				return 'bg-(--foreground)/60 text-(--text) border-(--border)/20';
			case 'cancelled':
				return 'bg-(--accent-red)/15 text-(--accent-red) border-(--accent-red)/30';
			default:
				return 'bg-(--foreground)/50 text-(--text-muted) border-(--border)/10';
		}
	};

	const getPrizeIcon = () => {
		switch (giveaway.prize?.type) {
			case 'credits':
				return <Coins size={15} className="text-(--accent)" />;
			case 'store_item':
				return <ShoppingBag size={15} className="text-(--accent)" />;
			case 'discord_role':
				return <Shield size={15} className="text-(--accent)" />;
			default:
				return <Gift size={15} className="text-(--accent)" />;
		}
	};

	return (
		<div className="flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden transition-all hover:border-(--accent)/30">
			{giveaway.bannerUrl && (
				<div className="relative h-32 w-full overflow-hidden border-b border-(--border)/10 bg-(--background)/60">
					<img src={giveaway.bannerUrl} alt={giveaway.title} className="h-full w-full object-cover" />
				</div>
			)}

			<div className="flex flex-col flex-1" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
				{/* Top Row: Status + Channels */}
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex flex-wrap items-center gap-1.5">
						<span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${getStatusStyle()}`}>
							{giveaway.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-(--accent-green) animate-pulse" />}
							{t(`admin.dashboard.giveaways.status.${giveaway.status}`)}
						</span>

						{channelLabel && (
							<span className="inline-flex items-center gap-1 rounded-full bg-(--background)/60 border border-(--border)/10 px-2.5 py-0.5 text-[11px] font-medium text-(--text-muted)">
								<Hash size={11} className="text-(--accent)" />
								{channelLabel.replace(/^#/, '')}
							</span>
						)}

						{giveaway.showOnWeb && (
							<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/10 border border-(--accent)/25 px-2.5 py-0.5 text-[11px] font-semibold text-(--accent)">
								<Globe size={11} />
								{giveaway.targetApps?.includes('all') ? t('admin.dashboard.giveaways.card.allWebApps') : giveaway.targetApps?.join(', ')}
							</span>
						)}
					</div>

					<span className="inline-flex items-center gap-1 text-xs font-semibold text-(--text-muted)">
						<Trophy size={13} className="text-(--accent)" />
						{t('admin.dashboard.giveaways.card.winnerCount', { count: giveaway.winnerCount || 1 })}
					</span>
				</div>

				{/* Title & Description */}
				<div className="flex flex-col gap-1">
					<h3 className="text-lg font-extrabold text-(--text) leading-snug" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{giveaway.title}
					</h3>
					{giveaway.description && <p className="text-xs text-(--text-muted) line-clamp-2">{giveaway.description}</p>}
				</div>

				{/* Prize Pill Box */}
				<div className="flex items-center justify-between gap-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 px-3.5 py-2.5">
					<div className="flex items-center gap-2.5 min-w-0">
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-(--accent)/15 border border-(--accent)/30">{getPrizeIcon()}</div>
						<div className="flex flex-col min-w-0">
							<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t(`admin.dashboard.giveaways.prizeTypes.${giveaway.prize?.type || 'custom'}`)}</span>
							<span className="text-sm font-bold text-(--text) truncate">{giveaway.prize?.label || giveaway.title}</span>
						</div>
					</div>

					<button
						type="button"
						onClick={() => onInspectEntrants(giveaway)}
						className="flex flex-col items-end shrink-0 rounded-xl bg-(--foreground)/50 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/30 px-3 py-1 transition-all cursor-pointer"
					>
						<span className="inline-flex items-center gap-1 text-xs font-extrabold text-(--text)">
							<Users size={12} className="text-(--accent)" />
							{entries.length.toLocaleString()}
						</span>
						<span className="text-[10px] text-(--text-muted)">{t('admin.dashboard.giveaways.card.ticketsCount', { count: totalTickets.toLocaleString() })}</span>
					</button>
				</div>

				{/* Requirements & Bonus Multipliers Summary */}
				{(reqBadges.length > 0 || (Array.isArray(giveaway.bonusEntries) && giveaway.bonusEntries.length > 0)) && (
					<div className="flex flex-wrap items-center gap-1.5">
						{reqBadges.length > 0 ? (
							reqBadges.map((badge, idx) => (
								<span
									key={idx}
									className="inline-flex items-center gap-1 rounded-full bg-(--background)/50 border border-(--border)/10 px-2.5 py-0.5 text-[10px] font-semibold text-(--text-muted)"
								>
									<Lock size={10} className="text-(--accent)" />
									{badge}
								</span>
							))
						) : (
							<span className="inline-flex items-center gap-1 rounded-full bg-(--accent-green)/10 border border-(--accent-green)/25 px-2.5 py-0.5 text-[10px] font-semibold text-(--accent-green)">
								<CheckCircle2 size={10} />
								{t('admin.dashboard.giveaways.requirements.openToAll')}
							</span>
						)}

						{Array.isArray(giveaway.bonusEntries) &&
							giveaway.bonusEntries.map((b, idx) => {
								const roleLabel = b.type === 'discord_role' ? roles.find((r) => r.value === b.targetId)?.label : null;
								return (
									<span
										key={`bonus-${idx}`}
										className="inline-flex items-center gap-1 rounded-full bg-(--accent)/10 border border-(--accent)/25 px-2.5 py-0.5 text-[10px] font-bold text-(--accent)"
									>
										<Sparkles size={10} />
										{roleLabel || b.label || b.type} (+{b.extraEntries})
									</span>
								);
							})}
					</div>
				)}

				{/* Timestamps */}
				<div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-(--text-muted) pt-1 border-t border-(--border)/10">
					<span className="inline-flex items-center gap-1">
						<Calendar size={12} className="text-(--accent)" />
						{t('admin.dashboard.giveaways.card.startsLabel')}: {new Date(giveaway.startsAt).toLocaleString()}
					</span>
					<span className="inline-flex items-center gap-1">
						<Clock size={12} className="text-(--accent)" />
						{giveaway.status === 'ended' ? t('admin.dashboard.giveaways.card.endedLabel') : t('admin.dashboard.giveaways.card.endsLabel')}:{' '}
						{new Date(giveaway.endedAt || giveaway.endsAt).toLocaleString()}
					</span>
				</div>

				{/* Winners Box (if ended or winners drawn) */}
				{winners.length > 0 && (
					<div className="flex flex-col gap-2 rounded-2xl bg-(--accent)/10 border border-(--accent)/25 p-3">
						<div className="flex items-center justify-between">
							<span className="inline-flex items-center gap-1.5 text-xs font-bold text-(--accent)">
								<Crown size={13} />
								{t('admin.dashboard.giveaways.card.drawnWinnersTitle', { count: winners.length })}
							</span>
							<button
								type="button"
								onClick={() => onReroll(giveaway)}
								className="inline-flex items-center gap-1 text-[11px] font-semibold text-(--accent) hover:underline cursor-pointer"
							>
								<Dices size={12} />
								{t('admin.dashboard.giveaways.actions.rerollAll')}
							</button>
						</div>

						<div className="flex flex-col gap-1.5">
							{winners.map((w) => (
								<div key={w.userId} className="flex items-center justify-between gap-2 rounded-xl bg-(--background)/70 border border-(--border)/10 px-2.5 py-1.5">
									<div className="flex items-center gap-2 min-w-0">
										{w.avatar ? (
											<img src={w.avatar} alt={w.username} className="h-5 w-5 rounded-full object-cover shrink-0" />
										) : (
											<div className="h-5 w-5 rounded-full bg-(--accent)/20 text-(--accent) flex items-center justify-center text-[10px] font-bold shrink-0">
												{(w.username || 'U')[0]?.toUpperCase()}
											</div>
										)}
										<span className="text-xs font-bold text-(--text) truncate">{w.username || w.userId}</span>
										<span
											className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
												w.fulfilled ? 'bg-(--accent-green)/15 text-(--accent-green)' : 'bg-(--accent-orange)/15 text-(--accent-orange)'
											}`}
										>
											{w.fulfilled ? t('admin.dashboard.giveaways.card.fulfilled') : t('admin.dashboard.giveaways.card.pendingFulfillment')}
										</span>
									</div>

									<div className="flex items-center gap-1 shrink-0">
										{!w.fulfilled && (
											<button
												type="button"
												onClick={() => onFulfillWinner(giveaway, w.userId)}
												className="rounded-full bg-(--accent)/15 hover:bg-(--accent)/30 text-(--accent) px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
											>
												{t('admin.dashboard.giveaways.actions.fulfillNow')}
											</button>
										)}
										<button
											type="button"
											onClick={() => onReroll(giveaway, w.userId)}
											title={t('admin.dashboard.giveaways.actions.rerollWinner')}
											className="rounded-full bg-(--foreground)/60 hover:bg-(--accent)/20 text-(--text-muted) hover:text-(--accent) p-1 transition-colors cursor-pointer"
										>
											<Dices size={12} />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Footer Actions */}
			<div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--border)/10 bg-(--background)/40 px-4 py-3">
				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" onClick={() => onInspectEntrants(giveaway)} className="text-xs px-3 py-1.5 rounded-2xl">
						<Users size={13} />
						{t('admin.dashboard.giveaways.actions.viewEntrants')}
					</Button>

					{giveaway.status === 'active' && (
						<Button variant="primary" onClick={() => onEndNow(giveaway)} className="text-xs px-3 py-1.5 rounded-2xl">
							<Trophy size={13} />
							{t('admin.dashboard.giveaways.actions.drawNow')}
						</Button>
					)}

					{giveaway.status === 'ended' && entries.length > 0 && (
						<Button variant="secondary" onClick={() => onReroll(giveaway)} className="text-xs px-3 py-1.5 rounded-2xl">
							<Dices size={13} />
							{t('admin.dashboard.giveaways.actions.rerollAll')}
						</Button>
					)}
				</div>

				<div className="flex items-center gap-1.5">
					<Button variant="secondary" onClick={() => onEdit(giveaway)} className="text-xs px-2.5 py-1.5 rounded-2xl" title={t('common.edit')}>
						<Edit3 size={13} />
					</Button>

					{(giveaway.status === 'active' || giveaway.status === 'scheduled') && (
						<Button
							variant="secondary"
							onClick={() => onCancel(giveaway)}
							className="text-xs px-2.5 py-1.5 rounded-2xl text-(--accent-orange)"
							title={t('admin.dashboard.giveaways.actions.cancelGiveaway')}
						>
							<XCircle size={13} />
						</Button>
					)}

					<Button variant="danger" onClick={() => onDelete(giveaway)} className="text-xs px-2.5 py-1.5 rounded-2xl" title={t('common.delete')}>
						<Trash2 size={13} />
					</Button>
				</div>
			</div>
		</div>
	);
}
