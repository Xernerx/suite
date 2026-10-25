/** @format */
'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Hash, Lock, MessageSquare, Server, Terminal, Trash2, User, XCircle } from 'lucide-react';
import { Button, Confirm, Input } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { BotDiscordProfile, SupportBotItem, SupportTicketItem } from './types';

interface SupportTicketsTabProps {
	tickets: SupportTicketItem[];
	bots: SupportBotItem[];
	botProfiles: Record<string, BotDiscordProfile>;
	checklist: string[];
	updatingTicketId: string | null;
	onUpdateStatus: (ticketId: string, status: SupportTicketItem['status']) => Promise<void>;
	onDeleteTicket: (ticketId: string) => Promise<void>;
}

export function SupportTicketsTab({ tickets, bots, botProfiles, checklist, updatingTicketId, onUpdateStatus, onDeleteTicket }: SupportTicketsTabProps) {
	const { t } = useDictionary();
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | SupportTicketItem['status']>('all');
	const [deleteTarget, setDeleteTarget] = useState<SupportTicketItem | null>(null);
	const [deleting, setDeleting] = useState(false);

	const botNameMap = useMemo(() => {
		const map: Record<string, string> = {};
		bots.forEach((b) => {
			if (b.id && b.name) map[b.id] = b.name;
		});
		Object.values(botProfiles).forEach((prof) => {
			if (prof.id && prof.name) map[prof.id] = prof.name;
		});
		return map;
	}, [bots, botProfiles]);

	const filteredTickets = useMemo(() => {
		return tickets.filter((ticket) => {
			if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
			if (!search.trim()) return true;
			const q = search.toLowerCase();
			return (
				ticket.id.toLowerCase().includes(q) ||
				ticket.userId.toLowerCase().includes(q) ||
				(ticket.username && ticket.username.toLowerCase().includes(q)) ||
				(ticket.initialMessage && ticket.initialMessage.toLowerCase().includes(q)) ||
				(ticket.command?.name && ticket.command.name.toLowerCase().includes(q)) ||
				(ticket.guild?.name && ticket.guild.name.toLowerCase().includes(q))
			);
		});
	}, [tickets, statusFilter, search]);

	const statusBadgeStyle = (status: SupportTicketItem['status']) => {
		switch (status) {
			case 'open':
				return 'bg-(--accent)/15 text-(--accent) border-(--accent)/30';
			case 'on-hold':
				return 'bg-(--accent-orange)/15 text-(--accent-orange) border-(--accent-orange)/30';
			case 'resolved':
				return 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30';
			case 'closed':
				return 'bg-(--background)/60 text-(--text-muted) border-(--border)/15';
		}
	};

	const statusFilters: { id: 'all' | SupportTicketItem['status']; label: string }[] = [
		{ id: 'all', label: t('admin.support.tickets.filterAll') },
		{ id: 'open', label: t('admin.support.tickets.statusOpen') },
		{ id: 'on-hold', label: t('admin.support.tickets.statusOnHold') },
		{ id: 'resolved', label: t('admin.support.tickets.statusResolved') },
		{ id: 'closed', label: t('admin.support.tickets.statusClosed') },
	];

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col md:flex-row md:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex-1">
					<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.support.tickets.searchPlaceholder')} />
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{statusFilters.map((f) => (
						<button
							key={f.id}
							type="button"
							onClick={() => setStatusFilter(f.id)}
							className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
								statusFilter === f.id ? 'bg-(--accent) text-white border-(--accent) shadow-sm' : 'bg-(--background)/50 text-(--text-muted) border-(--border)/10 hover:text-(--text)'
							}`}
						>
							{f.label}
						</button>
					))}
				</div>
			</div>

			{filteredTickets.length === 0 ? (
				<div
					className="flex flex-col items-center justify-center text-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md"
					style={{ padding: 'calc(var(--ui-gap) * 2.5)', gap: 'calc(var(--ui-gap) * 0.5)' }}
				>
					<MessageSquare size={36} className="text-(--text-muted) opacity-50" />
					<p className="text-base font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.support.tickets.emptyTitle')}
					</p>
					<p className="text-xs text-(--text-muted) max-w-md">{t('admin.support.tickets.emptyDesc')}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-(--ui-gap)">
					{filteredTickets.map((ticket) => {
						const isUpdating = updatingTicketId === ticket.id;
						const resolvedBotLabel = ticket.bot ? botNameMap[ticket.bot] || ticket.bot : t('admin.support.tickets.unassignedBot');
						const resolvedBotAvatar = ticket.bot ? botProfiles[ticket.bot]?.avatarUrl : null;

						return (
							<div
								key={ticket.id}
								className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-all"
								style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
							>
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
									<div className="flex flex-wrap items-center gap-2.5">
										<span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${statusBadgeStyle(ticket.status)}`}>{ticket.status}</span>
										<span className="flex items-center gap-1.5 text-sm font-bold text-(--text)">
											<User size={14} className="text-(--accent)" />
											{ticket.username || ticket.userId}
										</span>
										<span className="text-xs font-mono text-(--text-muted) bg-(--background)/50 px-2.5 py-0.5 rounded-full border border-(--border)/10">#{ticket.id}</span>
										<span className="inline-flex items-center gap-1.5 text-xs bg-(--accent)/10 text-(--accent) px-2.5 py-0.5 rounded-full border border-(--accent)/20 font-medium">
											{resolvedBotAvatar && <img src={resolvedBotAvatar} alt={resolvedBotLabel} className="h-3.5 w-3.5 rounded-full object-cover shrink-0" />}
											<span>{t('admin.support.tickets.botBadge', { bot: resolvedBotLabel })}</span>
										</span>
									</div>

									<div className="flex flex-wrap items-center gap-2">
										{ticket.status !== 'open' && (
											<Button size="sm" variant="secondary" disabled={isUpdating} onClick={() => onUpdateStatus(ticket.id, 'open')}>
												{t('admin.support.tickets.reopenButton')}
											</Button>
										)}
										{ticket.status !== 'on-hold' && (
											<Button size="sm" variant="secondary" disabled={isUpdating} onClick={() => onUpdateStatus(ticket.id, 'on-hold')}>
												<Clock size={14} className="mr-1" />
												{t('admin.support.tickets.holdButton')}
											</Button>
										)}
										{ticket.status !== 'resolved' && (
											<Button size="sm" variant="primary" disabled={isUpdating} onClick={() => onUpdateStatus(ticket.id, 'resolved')}>
												<CheckCircle2 size={14} className="mr-1" />
												{t('admin.support.tickets.resolveButton')}
											</Button>
										)}
										{ticket.status !== 'closed' && (
											<Button size="sm" variant="secondary" disabled={isUpdating} onClick={() => onUpdateStatus(ticket.id, 'closed')}>
												<Lock size={14} className="mr-1" />
												{t('admin.support.tickets.closeButton')}
											</Button>
										)}
										<Button size="sm" variant="danger" disabled={isUpdating} onClick={() => setDeleteTarget(ticket)}>
											<Trash2 size={14} />
										</Button>
									</div>
								</div>

								{ticket.initialMessage && (
									<div className="rounded-2xl bg-(--background)/50 border border-(--border)/10 px-4 py-2.5 text-xs text-(--text)">
										<span className="font-semibold text-(--text-muted) mr-2">{t('admin.support.tickets.initialPromptLabel')}:</span>
										{ticket.initialMessage}
									</div>
								)}

								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
									<div className="flex items-center gap-2.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 px-3.5 py-2.5">
										<Server size={15} className="text-(--accent) shrink-0" />
										<div className="flex flex-col min-w-0">
											<span className="text-[10px] uppercase tracking-wider text-(--text-muted) font-semibold">{t('admin.support.tickets.reportedServer')}</span>
											<span className="text-xs font-medium text-(--text) truncate">{ticket.guild?.name || ticket.guild?.id || t('admin.support.tickets.notProvided')}</span>
										</div>
									</div>

									<div className="flex items-center gap-2.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 px-3.5 py-2.5">
										<Hash size={15} className="text-(--accent) shrink-0" />
										<div className="flex flex-col min-w-0">
											<span className="text-[10px] uppercase tracking-wider text-(--text-muted) font-semibold">{t('admin.support.tickets.reportedChannel')}</span>
											<span className="text-xs font-medium text-(--text) truncate">{ticket.channel?.name || ticket.channel?.id || t('admin.support.tickets.notProvided')}</span>
										</div>
									</div>

									<div className="flex items-center gap-2.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 px-3.5 py-2.5">
										<MessageSquare size={15} className="text-(--accent) shrink-0" />
										<div className="flex flex-col min-w-0">
											<span className="text-[10px] uppercase tracking-wider text-(--text-muted) font-semibold">{t('admin.support.tickets.reportedMessage')}</span>
											<span className="text-xs font-mono text-(--text) truncate">{ticket.message?.id || t('admin.support.tickets.notProvided')}</span>
										</div>
									</div>

									<div className="flex items-center gap-2.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 px-3.5 py-2.5">
										<Terminal size={15} className="text-(--accent) shrink-0" />
										<div className="flex flex-col min-w-0">
											<span className="text-[10px] uppercase tracking-wider text-(--text-muted) font-semibold">{t('admin.support.tickets.reportedCommand')}</span>
											<span className="text-xs font-mono text-(--text) truncate">{ticket.command?.name || ticket.command?.id || t('admin.support.tickets.notProvided')}</span>
										</div>
									</div>
								</div>

								<div className="flex flex-wrap items-center gap-2 pt-1">
									<span className="text-[11px] font-semibold text-(--text-muted) mr-1">{t('admin.support.tickets.checklistLabel')}:</span>
									{checklist.map((item, idx) => {
										const checked = Boolean(ticket.checks && ticket.checks[String(idx)]);
										return (
											<span
												key={idx}
												className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
													checked
														? 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/25'
														: 'bg-(--background)/40 text-(--text-muted) border-(--border)/10'
												}`}
											>
												{checked ? <CheckCircle2 size={12} /> : <XCircle size={12} className="opacity-60" />}
												{item}
											</span>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			)}

			<Confirm
				open={Boolean(deleteTarget)}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				onConfirm={async () => {
					if (!deleteTarget) return;
					setDeleting(true);
					try {
						await onDeleteTicket(deleteTarget.id);
						setDeleteTarget(null);
					} finally {
						setDeleting(false);
					}
				}}
				title={t('admin.support.tickets.deleteModalTitle')}
				description={t('admin.support.tickets.deleteModalDesc', {
					id: deleteTarget?.id || '',
					user: deleteTarget?.username || deleteTarget?.userId || '',
				})}
				confirmText={t('common.buttons.delete')}
				variant="danger"
				loading={deleting}
			/>
		</div>
	);
}
