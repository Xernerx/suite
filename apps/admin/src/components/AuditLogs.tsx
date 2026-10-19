/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button, Input } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { ScrollText, RefreshCw, Shield, Bug, Inbox, Ticket, Server, User, Clock, Download } from 'lucide-react';

interface AuditLogEntry {
	id: string;
	actorId: string;
	actorName?: string | null;
	action: string;
	targetType?: string;
	category?: string;
	targetId?: string | null;
	summary?: string;
	targetLabel?: string;
	metadata?: Record<string, any>;
	details?: Record<string, any>;
	createdAt: string;
}

const CATEGORIES = ['all', 'issue', 'suggestion', 'application', 'setting', 'role', 'user', 'system'] as const;

export default function AuditLogs() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();

	const [logs, setLogs] = useState<AuditLogEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [category, setCategory] = useState<string>('all');
	const [search, setSearch] = useState<string>('');

	const fetchLogs = async (isManual = false) => {
		if (!isReady) return;
		if (isManual) setRefreshing(true);
		else setLoading(true);

		try {
			const params = new URLSearchParams();
			if (category !== 'all') params.set('targetType', category);
			params.set('limit', '200');

			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/audit?${params.toString()}`), {
				credentials: 'include',
			});

			if (res.ok) {
				const json = await res.json();
				const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
				setLogs(list);
			} else {
				toast({
					type: 'error',
					title: t('admin.dashboard.audit.fetchError'),
				});
			}
		} catch (error: any) {
			toast({
				type: 'error',
				title: t('admin.dashboard.audit.fetchError'),
				description: error.message,
			});
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		if (isReady) {
			fetchLogs();
		}
	}, [isReady, category]);

	const filteredLogs = logs.filter((log) => {
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		const summaryText = log.summary || log.targetLabel || '';
		return (
			log.actorName?.toLowerCase().includes(q) ||
			log.actorId?.toLowerCase().includes(q) ||
			log.action?.toLowerCase().includes(q) ||
			summaryText.toLowerCase().includes(q) ||
			log.targetId?.toLowerCase().includes(q)
		);
	});

	const exportLogs = (format: 'json' | 'csv') => {
		if (filteredLogs.length === 0) return;

		if (format === 'json') {
			const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `xernerx-audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
			a.click();
			URL.revokeObjectURL(url);
			return;
		}

		const headers = ['id', 'createdAt', 'actorName', 'actorId', 'action', 'targetType', 'targetId', 'summary'];
		const rows = filteredLogs.map((l) =>
			[l.id, l.createdAt, l.actorName || '', l.actorId || '', l.action, l.targetType || l.category || 'system', l.targetId || '', (l.summary || l.targetLabel || '').replace(/"/g, '""')]
				.map((cell) => `"${cell}"`)
				.join(',')
		);
		const csvContent = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `xernerx-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const getCategoryIcon = (cat: string) => {
		switch (cat) {
			case 'issue':
				return <Bug size={16} className="text-red-400" />;
			case 'suggestion':
				return <Inbox size={16} className="text-blue-400" />;
			case 'application':
				return <Ticket size={16} className="text-purple-400" />;
			case 'setting':
				return <Server size={16} className="text-amber-400" />;
			case 'role':
				return <Shield size={16} className="text-emerald-400" />;
			case 'user':
				return <User size={16} className="text-cyan-400" />;
			default:
				return <ScrollText size={16} className="text-(--accent)" />;
		}
	};

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col w-full" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col md:flex-row md:items-center justify-between border-b border-(--border)/10 pb-6" style={{ gap: 'var(--ui-gap)' }}>
				<div>
					<h1 className="text-3xl font-bold text-(--text) tracking-tight flex items-center gap-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<ScrollText className="text-(--accent)" size={28} />
						{t('admin.dashboard.audit.title')}
					</h1>
					<p className="text-(--text-muted) mt-1 text-sm">{t('admin.dashboard.audit.description')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" size="sm" onClick={() => exportLogs('csv')} disabled={filteredLogs.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.dashboard.audit.exportCsv')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => exportLogs('json')} disabled={filteredLogs.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.dashboard.audit.exportJson')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => fetchLogs(true)} disabled={refreshing} className="flex items-center gap-1.5">
						<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
						{t('admin.dashboard.audit.refresh')}
					</Button>
				</div>
			</div>

			<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
				<div className="flex flex-wrap items-center gap-1.5 bg-(--foreground)/30 p-1.5 rounded-xl border border-(--border)/10">
					{CATEGORIES.map((cat) => (
						<button
							key={cat}
							type="button"
							onClick={() => setCategory(cat)}
							className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
								category === cat ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--background)/50'
							}`}
						>
							{t(`admin.dashboard.audit.categories.${cat}`)}
						</button>
					))}
				</div>

				<div className="w-full lg:w-80">
					<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.dashboard.audit.searchPlaceholder')} />
				</div>
			</div>

			{filteredLogs.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-(--border)/10 bg-(--foreground)/20">
					<ScrollText size={40} className="text-(--text-muted) opacity-40 mb-3" />
					<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.dashboard.audit.emptyTitle')}
					</h3>
					<p className="text-sm text-(--text-muted) max-w-md mt-1">{t('admin.dashboard.audit.emptyDescription')}</p>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{filteredLogs.map((log) => {
						const resolvedCat = log.targetType || log.category || 'system';
						const resolvedSummary = log.summary || log.targetLabel || log.targetId || log.action;
						const resolvedMeta = log.metadata || log.details || {};

						return (
							<div
								key={log.id}
								className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 hover:border-(--border)/25 transition-all"
							>
								<div className="flex items-start gap-3.5 min-w-0">
									<div className="p-2.5 rounded-xl bg-(--background)/70 border border-(--border)/10 shrink-0 mt-0.5">{getCategoryIcon(resolvedCat)}</div>
									<div className="flex flex-col gap-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-bold text-sm text-(--text)">{log.actorName || log.actorId}</span>
											<span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-(--accent)/15 text-(--accent) border border-(--accent)/20">
												{log.action}
											</span>
											<span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-(--background)/80 text-(--text-muted) border border-(--border)/10">
												{resolvedCat}
											</span>
										</div>
										<p className="text-xs text-(--text-muted) truncate">
											<span className="font-semibold text-(--text)/80">{resolvedSummary}</span>
											{log.targetId && resolvedSummary !== log.targetId && <span className="ml-1.5 font-mono opacity-60">({log.targetId})</span>}
										</p>
										{resolvedMeta && Object.keys(resolvedMeta).length > 0 && (
											<div className="flex flex-wrap gap-2 mt-1">
												{Object.entries(resolvedMeta)
													.filter(([, val]) => val !== undefined && val !== null && val !== '')
													.map(([key, val]) => (
														<span key={key} className="text-[11px] font-mono px-2 py-0.5 rounded bg-(--background)/60 border border-(--border)/10 text-(--text-muted)">
															<strong className="text-(--text)/80">{key}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
														</span>
													))}
											</div>
										)}
									</div>
								</div>

								<div className="flex items-center gap-1.5 text-xs font-mono text-(--text-muted) shrink-0 self-end md:self-center">
									<Clock size={13} className="opacity-60" />
									{new Date(log.createdAt).toLocaleString()}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
