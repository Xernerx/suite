/** @format */

'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Crown, Download, History, Shield, Sparkles } from 'lucide-react';
import { Badge, Button } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';

export interface CreditTransactionEntry {
	id?: string;
	type?: 'earn' | 'spend' | 'topup' | 'tip_in' | 'tip_out' | string;
	amount: number;
	multiplierPercent?: number;
	itemId?: string | null;
	itemName?: string | null;
	createdAt?: string | Date;
}

interface CreditLedgerCardProps {
	transactions?: CreditTransactionEntry[];
	streakShields?: number;
}

export function CreditLedgerCard({ transactions = [], streakShields = 0 }: CreditLedgerCardProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [filter, setFilter] = useState<'all' | 'earned' | 'spent'>('all');
	const [showAll, setShowAll] = useState(false);

	const isEarnedEntry = (tx: CreditTransactionEntry) => (tx.amount || 0) >= 0 && tx.type !== 'spend' && tx.type !== 'tip_out';

	const allSorted = useMemo(() => {
		if (!Array.isArray(transactions)) return [];
		return [...transactions].sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
	}, [transactions]);

	const totals = useMemo(() => {
		let earned = 0;
		let spent = 0;
		for (const tx of allSorted) {
			const amt = Math.abs(Number(tx.amount) || 0);
			if (isEarnedEntry(tx)) earned += amt;
			else spent += amt;
		}
		return { earned, spent };
	}, [allSorted]);

	const filtered = useMemo(() => {
		if (filter === 'earned') return allSorted.filter(isEarnedEntry);
		if (filter === 'spent') return allSorted.filter((tx) => !isEarnedEntry(tx));
		return allSorted;
	}, [allSorted, filter]);

	const sorted = useMemo(() => {
		return showAll ? filtered : filtered.slice(0, 12);
	}, [filtered, showAll]);

	const handleExportCsv = () => {
		const header = ['Date', 'Type', 'Item', 'Amount', 'MultiplierPercent'];
		const rows = filtered.map((tx) => [
			tx.createdAt ? new Date(tx.createdAt).toISOString() : '',
			tx.type || (isEarnedEntry(tx) ? 'earn' : 'spend'),
			`"${String(tx.itemName || tx.itemId || t('account.billing.credits.ledger.defaultItem')).replace(/"/g, '""')}"`,
			String(isEarnedEntry(tx) ? Math.abs(Number(tx.amount) || 0) : -Math.abs(Number(tx.amount) || 0)),
			String(Number(tx.multiplierPercent) || 100),
		]);
		const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `xernerx-credit-ledger.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toast({ type: 'success', title: t('account.billing.credits.ledger.exportedToast') });
	};

	return (
		<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.85)' }}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<History size={18} className="text-(--accent)" />
					<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.billing.credits.ledger.title')}
					</h3>
					<Badge variant="muted" size="sm">
						{allSorted.length}
					</Badge>
					{allSorted.length > 0 && (
						<div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-(--background)/60 border border-(--border)/10">
							<span className="text-(--accent-green)">+{totals.earned.toLocaleString()}</span>
							<span className="text-(--text-muted)">/</span>
							<span className="text-(--text)">-{totals.spent.toLocaleString()}</span>
						</div>
					)}
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{allSorted.length > 0 && (
						<div className="inline-flex items-center rounded-full border border-(--border)/10 bg-(--background)/50 p-0.5 gap-0.5">
							{(['all', 'earned', 'spent'] as const).map((fKey) => (
								<button
									key={fKey}
									type="button"
									onClick={() => setFilter(fKey)}
									className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
										filter === fKey ? 'bg-(--accent) text-(--text)' : 'text-(--text-muted) hover:text-(--text)'
									}`}
								>
									{t(`account.billing.credits.ledger.filter${fKey.charAt(0).toUpperCase() + fKey.slice(1)}`)}
								</button>
							))}
						</div>
					)}
					<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-(--background)/60 text-(--text) border border-(--border)/10">
						<Shield size={13} className="text-(--accent)" />
						{t('account.billing.credits.ledger.shieldsActive', { count: streakShields })}
					</span>
					{allSorted.length > 0 && (
						<Button size="sm" variant="secondary" onClick={handleExportCsv}>
							<Download size={13} /> {t('account.billing.credits.ledger.exportCsv')}
						</Button>
					)}
				</div>
			</div>

			{sorted.length === 0 ? (
				<div className="p-6 rounded-2xl bg-(--background)/40 border border-(--border)/10 text-center text-xs text-(--text-muted)">{t('account.billing.credits.ledger.empty')}</div>
			) : (
				<div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
					{sorted.map((tx, idx) => {
						const isPositive = (tx.amount || 0) >= 0 && tx.type !== 'spend' && tx.type !== 'tip_out';
						const absAmount = Math.abs(Number(tx.amount) || 0);
						const mult = Number(tx.multiplierPercent) || 100;

						return (
							<div key={tx.id || `${tx.itemId}-${idx}`} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
								<div className="flex items-center gap-3 min-w-0">
									<div
										className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 ${
											isPositive ? 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30' : 'bg-(--accent)/15 text-(--accent) border-(--accent)/30'
										}`}
									>
										{isPositive ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
									</div>
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-1.5">
											<span className="text-xs sm:text-sm font-bold text-(--text) truncate">{tx.itemName || tx.itemId || t('account.billing.credits.ledger.defaultItem')}</span>
											{mult > 100 && (
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
													<Crown size={10} />
													{mult}%
												</span>
											)}
										</div>
										<span className="text-[11px] font-mono text-(--text-muted)">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}</span>
									</div>
								</div>

								<span className={`text-sm font-extrabold font-mono shrink-0 ${isPositive ? 'text-(--accent-green)' : 'text-(--text)'}`}>
									{isPositive ? '+' : '-'}
									{absAmount.toLocaleString()} <Sparkles size={11} className="inline text-(--accent)" />
								</span>
							</div>
						);
					})}
					{filtered.length > 12 && (
						<button
							type="button"
							onClick={() => setShowAll((prev) => !prev)}
							className="mt-1 self-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-(--background)/60 hover:bg-(--accent)/15 text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 transition-colors cursor-pointer"
						>
							{showAll ? t('account.billing.credits.ledger.showLess') : t('account.billing.credits.ledger.showAll', { count: filtered.length })}
						</button>
					)}
				</div>
			)}
		</div>
	);
}
