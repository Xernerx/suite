/** @format */
'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Crown, Dices, Download, Globe, MessageSquare, Users } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Button, Input, Modal } from '@xernerx/ui';
import type { GiveawayItem } from './types';

interface GiveawayEntrantsModalProps {
	giveaway: GiveawayItem | null;
	onClose: () => void;
	onReroll: (giveaway: GiveawayItem, replaceUserId?: string) => void;
	onFulfillWinner: (giveaway: GiveawayItem, winnerUserId: string) => void;
}

export function GiveawayEntrantsModal({ giveaway, onClose, onReroll, onFulfillWinner }: GiveawayEntrantsModalProps) {
	const { t } = useDictionary();
	const [search, setSearch] = useState('');

	const entries = useMemo(() => (Array.isArray(giveaway?.entries) ? giveaway!.entries : []), [giveaway]);
	const winners = useMemo(() => (Array.isArray(giveaway?.winners) ? giveaway!.winners : []), [giveaway]);
	const totalTickets = useMemo(() => entries.reduce((sum, e) => sum + (Number(e.weight) || 1), 0), [entries]);

	const filteredEntries = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return entries;
		return entries.filter(
			(e) =>
				String(e.username || '')
					.toLowerCase()
					.includes(q) ||
				String(e.userId || '')
					.toLowerCase()
					.includes(q)
		);
	}, [entries, search]);

	if (!giveaway) return null;

	const exportEntrants = (format: 'csv' | 'json') => {
		const filename = `giveaway-${giveaway.id}-entrants.${format}`;
		const content =
			format === 'json'
				? JSON.stringify({ giveawayId: giveaway.id, title: giveaway.title, winners, entries }, null, 2)
				: [
						'userId,username,weight,source,enteredAt',
						...entries.map((e) => `"${e.userId}","${String(e.username || '').replace(/"/g, '""')}",${e.weight || 1},"${e.source || 'web'}","${e.enteredAt || ''}"`),
					].join('\n');
		const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<Modal
			open={Boolean(giveaway)}
			onOpenChange={(open) => !open && onClose()}
			size="3xl"
			title={giveaway.title}
			description={t('admin.dashboard.giveaways.entrantsModal.subtitle', {
				entrants: entries.length,
				tickets: totalTickets,
			})}
		>
			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				{/* Drawn Winners Section */}
				{winners.length > 0 && (
					<div className="flex flex-col gap-2 rounded-2xl bg-(--accent)/10 border border-(--accent)/25 p-3.5">
						<div className="flex items-center justify-between">
							<span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-(--accent)">
								<Crown size={14} />
								{t('admin.dashboard.giveaways.card.drawnWinnersTitle', { count: winners.length })}
							</span>
							<Button variant="secondary" onClick={() => onReroll(giveaway)} className="text-xs px-2.5 py-1 rounded-xl">
								<Dices size={12} />
								{t('admin.dashboard.giveaways.actions.rerollAll')}
							</Button>
						</div>

						<div className="flex flex-col gap-2">
							{winners.map((w) => (
								<div key={w.userId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-(--background)/80 border border-(--border)/10 p-2.5">
									<div className="flex items-center gap-2.5 min-w-0">
										{w.avatar ? (
											<img src={w.avatar} alt={w.username} className="h-7 w-7 rounded-full object-cover shrink-0" />
										) : (
											<div className="h-7 w-7 rounded-full bg-(--accent)/20 text-(--accent) flex items-center justify-center text-xs font-bold shrink-0">
												{(w.username || 'U')[0]?.toUpperCase()}
											</div>
										)}
										<div className="flex flex-col min-w-0">
											<span className="text-xs font-bold text-(--text) truncate">
												{w.username} <span className="font-mono text-[10px] text-(--text-muted)">({w.userId})</span>
											</span>
											{w.fulfillmentNote && <span className="text-[11px] text-(--text-muted) truncate">{w.fulfillmentNote}</span>}
										</div>
									</div>

									<div className="flex items-center gap-1.5 shrink-0">
										{w.fulfilled ? (
											<span className="inline-flex items-center gap-1 rounded-full bg-(--accent-green)/15 text-(--accent-green) px-2.5 py-0.5 text-[10px] font-bold">
												<CheckCircle2 size={11} />
												{t('admin.dashboard.giveaways.card.fulfilled')}
											</span>
										) : (
											<Button variant="primary" onClick={() => onFulfillWinner(giveaway, w.userId)} className="text-[11px] px-2.5 py-1 rounded-xl">
												{t('admin.dashboard.giveaways.actions.fulfillNow')}
											</Button>
										)}
										<Button
											variant="secondary"
											onClick={() => onReroll(giveaway, w.userId)}
											className="text-[11px] px-2.5 py-1 rounded-xl"
											title={t('admin.dashboard.giveaways.actions.rerollWinner')}
										>
											<Dices size={12} />
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Search & Export Bar */}
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
					<div className="flex-1">
						<Input variant="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.dashboard.giveaways.entrantsModal.searchPlaceholder')} />
					</div>
					<div className="flex items-center gap-1.5">
						<Button variant="secondary" onClick={() => exportEntrants('csv')} className="text-xs px-3 py-2 rounded-2xl">
							<Download size={13} /> CSV
						</Button>
						<Button variant="secondary" onClick={() => exportEntrants('json')} className="text-xs px-3 py-2 rounded-2xl">
							<Download size={13} /> JSON
						</Button>
					</div>
				</div>

				{/* Entrants List */}
				<div className="max-h-96 overflow-y-auto flex flex-col gap-1.5 pr-1">
					{filteredEntries.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-2xl bg-(--background)/50 border border-(--border)/10 py-10 text-center">
							<Users size={24} className="text-(--text-muted) mb-2" />
							<span className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.entrantsModal.empty')}</span>
						</div>
					) : (
						filteredEntries.map((entrant) => {
							const weight = Number(entrant.weight) || 1;
							const winOdds = totalTickets > 0 ? Math.min(100, Math.round((weight / totalTickets) * (Number(giveaway.winnerCount) || 1) * 1000) / 10) : 100;
							return (
								<div key={entrant.userId} className="flex items-center justify-between gap-3 rounded-2xl bg-(--background)/60 border border-(--border)/10 px-3.5 py-2">
									<div className="flex items-center gap-2.5 min-w-0">
										{entrant.avatar ? (
											<img src={entrant.avatar} alt={entrant.username} className="h-7 w-7 rounded-full object-cover shrink-0" />
										) : (
											<div className="h-7 w-7 rounded-full bg-(--accent)/15 text-(--accent) flex items-center justify-center text-xs font-bold shrink-0">
												{(entrant.username || 'U')[0]?.toUpperCase()}
											</div>
										)}
										<div className="flex flex-col min-w-0">
											<span className="text-xs font-bold text-(--text) truncate">{entrant.username || entrant.userId}</span>
											<span className="text-[10px] font-mono text-(--text-muted) truncate">{entrant.userId}</span>
										</div>
									</div>

									<div className="flex items-center gap-2 shrink-0">
										<span className="inline-flex items-center gap-1 rounded-full bg-(--foreground)/60 border border-(--border)/10 px-2 py-0.5 text-[10px] font-semibold text-(--text-muted)">
											{entrant.source === 'discord' ? <MessageSquare size={10} className="text-(--accent)" /> : <Globe size={10} className="text-(--accent)" />}
											{entrant.source}
										</span>
										<span className="inline-flex items-center rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2.5 py-0.5 text-[11px] font-extrabold text-(--accent)">
											{weight}x ({winOdds}%)
										</span>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>
		</Modal>
	);
}
