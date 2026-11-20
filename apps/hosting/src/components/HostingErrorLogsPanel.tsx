/** @format */
'use client';

import { AlertOctagon, AlertTriangle, Bot, CheckCircle2, ChevronDown, ChevronUp, Clock, Copy, ExternalLink, FileCode2, Layers, RefreshCw, RotateCcw, Server, Trash2 } from 'lucide-react';
import { Badge, Button, Confirm, EmptyState, Input, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface ErrorLogEntry {
	id: string;
	service: string;
	environment: 'production' | 'canary' | 'development';
	level: 'error' | 'warn' | 'fatal';
	message: string;
	stack?: string | null;
	filepath?: string | null;
	meta?: Record<string, any>;
	fingerprint: string;
	occurrences: number;
	resolved: boolean;
	resolvedAt?: string | null;
	resolvedBy?: string | null;
	firstSeenAt: string;
	lastSeenAt: string;
}

export interface ErrorLogsStats {
	total: number;
	open: number;
	resolved: number;
	fatal: number;
	occurrences: number;
	byService: Record<string, number>;
}

interface HostingErrorLogsPanelProps {
	reloadTrigger?: number;
	onOpenCountChange?: (count: number) => void;
}

function formatRelativeTime(iso?: string | null): string {
	if (!iso) return '—';
	const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
	if (diffSec < 60) return `${diffSec}s ago`;
	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr}h ago`;
	const diffDay = Math.floor(diffHr / 24);
	return `${diffDay}d ago`;
}

export default function HostingErrorLogsPanel({ reloadTrigger = 0, onOpenCountChange }: HostingErrorLogsPanelProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();

	const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
	const [stats, setStats] = useState<ErrorLogsStats>({
		total: 0,
		open: 0,
		resolved: 0,
		fatal: 0,
		occurrences: 0,
		byService: {},
	});
	const [services, setServices] = useState<string[]>(['virtue', 'yourapps', 'bot', 'app-bot', 'websocket']);
	const [loading, setLoading] = useState(true);
	const [autoRefresh, setAutoRefresh] = useState(true);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedServices, setSelectedServices] = useState<string[]>([]);
	const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
	const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]);
	const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'all'>('open');

	const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
	const [confirmClearOpen, setConfirmClearOpen] = useState(false);
	const [clearing, setClearing] = useState(false);
	const [sharingHasteId, setSharingHasteId] = useState<string | null>(null);

	const fetchLogs = useCallback(
		async (silent = false) => {
			if (!isReady) return;
			if (!silent) setLoading(true);
			try {
				const params = new URLSearchParams();
				params.set('status', statusFilter);
				if (selectedServices.length > 0) params.set('service', selectedServices.join(','));
				if (selectedLevels.length > 0) params.set('level', selectedLevels.join(','));
				if (selectedEnvs.length > 0) params.set('environment', selectedEnvs.join(','));

				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/errors?${params.toString()}`), {
					credentials: 'include',
					cache: 'no-store',
				});
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = await res.json();
				setLogs(Array.isArray(data?.data) ? data.data : []);
				if (data?.stats) {
					setStats(data.stats);
					onOpenCountChange?.(Number(data.stats.open || 0));
				}
				if (Array.isArray(data?.services) && data.services.length > 0) {
					setServices(data.services);
				}
			} catch {
				if (!silent) {
					toast({ type: 'error', title: t('hosting.errors.toasts.loadFailed') });
				}
			} finally {
				if (!silent) setLoading(false);
			}
		},
		[isReady, getEnvUrl, statusFilter, selectedServices, selectedLevels, selectedEnvs, onOpenCountChange, toast, t]
	);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs, reloadTrigger]);

	useEffect(() => {
		if (!autoRefresh) return;
		const interval = setInterval(() => {
			fetchLogs(true);
		}, 10000);
		return () => clearInterval(interval);
	}, [autoRefresh, fetchLogs]);

	const filteredLogs = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return logs;
		return logs.filter((item) => {
			const haystack = [item.service, item.message, item.filepath, item.stack, item.meta ? JSON.stringify(item.meta) : ''].filter(Boolean).join(' ').toLowerCase();
			return haystack.includes(q);
		});
	}, [logs, searchQuery]);

	const toggleExpand = (id: string) => {
		setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const handleToggleResolved = async (item: ErrorLogEntry) => {
		const nextResolved = !item.resolved;
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/errors'), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ id: item.id, resolved: nextResolved }),
			});
			if (!res.ok) throw new Error('Failed');
			toast({
				type: 'success',
				title: nextResolved ? t('hosting.errors.toasts.resolved') : t('hosting.errors.toasts.reopened'),
			});
			fetchLogs(true);
		} catch {
			toast({ type: 'error', title: t('hosting.errors.toasts.actionFailed') });
		}
	};

	const handleResolveAll = async () => {
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/errors'), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					all: true,
					service: selectedServices.length > 0 ? selectedServices.join(',') : undefined,
					resolved: true,
				}),
			});
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('hosting.errors.toasts.resolvedAll') });
			fetchLogs(true);
		} catch {
			toast({ type: 'error', title: t('hosting.errors.toasts.actionFailed') });
		}
	};

	const handleDeleteOne = async (id: string) => {
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/errors?id=${encodeURIComponent(id)}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed');
			setLogs((prev) => prev.filter((l) => l.id !== id));
			toast({ type: 'success', title: t('hosting.errors.toasts.deleted') });
			fetchLogs(true);
		} catch {
			toast({ type: 'error', title: t('hosting.errors.toasts.actionFailed') });
		}
	};

	const handleClearAll = async () => {
		setClearing(true);
		try {
			const params = new URLSearchParams({ all: 'true' });
			if (selectedServices.length > 0) params.set('service', selectedServices.join(','));
			if (statusFilter === 'resolved') params.set('resolvedOnly', 'true');
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/errors?${params.toString()}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed');
			setConfirmClearOpen(false);
			toast({ type: 'success', title: t('hosting.errors.toasts.clearedAll') });
			fetchLogs();
		} catch {
			toast({ type: 'error', title: t('hosting.errors.toasts.actionFailed') });
		} finally {
			setClearing(false);
		}
	};

	const handleCopyStack = async (item: ErrorLogEntry) => {
		const payload = `[${item.service.toUpperCase()} • ${item.environment.toUpperCase()} • ${item.level.toUpperCase()}]\nMessage: ${item.message}\n${item.filepath ? `Location: ${item.filepath}\n` : ''}Occurrences: ${item.occurrences} (Last seen: ${item.lastSeenAt})\n${item.meta && Object.keys(item.meta).length > 0 ? `Meta: ${JSON.stringify(item.meta, null, 2)}\n` : ''}\n${item.stack || item.message}`;
		try {
			await navigator.clipboard.writeText(payload);
			toast({ type: 'success', title: t('hosting.errors.toasts.copiedStack') });
		} catch {}
	};

	const handleOpenInHaste = async (item: ErrorLogEntry) => {
		setSharingHasteId(item.id);
		const content = `// Xernerx Service Error Log\n// Service: ${item.service} (${item.environment})\n// Level: ${item.level.toUpperCase()} • Occurrences: ${item.occurrences}\n// First Seen: ${item.firstSeenAt} • Last Seen: ${item.lastSeenAt}\n${item.filepath ? `// File: ${item.filepath}\n` : ''}${item.meta && Object.keys(item.meta).length > 0 ? `// Meta: ${JSON.stringify(item.meta)}\n` : ''}\n${item.stack || item.message}`;
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/v1/haste'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					title: `${item.service} — ${item.message.slice(0, 60)}`,
					content,
					language: 'typescript',
					privacy: 'limited',
				}),
			});
			const data = await res.json().catch(() => null);
			const pasteId = data?.id || data?.data?.id;
			if (res.ok && pasteId) {
				window.open(getEnvUrl(`https://haste.xernerx.com/${pasteId}`), '_blank', 'noopener,noreferrer');
			} else {
				await navigator.clipboard.writeText(content);
				toast({ type: 'info', title: t('hosting.errors.toasts.copiedStack') });
			}
		} catch {
			await navigator.clipboard.writeText(content);
			toast({ type: 'info', title: t('hosting.errors.toasts.copiedStack') });
		} finally {
			setSharingHasteId(null);
		}
	};

	return (
		<div className="flex flex-col flex-1 min-h-0 w-full h-full overflow-y-auto custom-scrollbar" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			{/* Top Summary Cards & Global Actions */}
			<div
				className="flex flex-col lg:flex-row lg:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--background)/60 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2.5 rounded-2xl bg-(--foreground)/40 border border-(--border)/10 px-3.5 py-2">
						<AlertOctagon size={16} className="text-(--accent-red)" />
						<div className="flex flex-col">
							<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.errors.stats.openErrors')}</span>
							<span className="text-sm font-extrabold font-mono text-(--text)">{stats.open.toLocaleString()}</span>
						</div>
					</div>

					<div className="flex items-center gap-2.5 rounded-2xl bg-(--foreground)/40 border border-(--border)/10 px-3.5 py-2">
						<AlertTriangle size={16} className="text-(--accent-orange)" />
						<div className="flex flex-col">
							<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.errors.stats.fatalCount')}</span>
							<span className="text-sm font-extrabold font-mono text-(--text)">{stats.fatal.toLocaleString()}</span>
						</div>
					</div>

					<div className="flex items-center gap-2.5 rounded-2xl bg-(--foreground)/40 border border-(--border)/10 px-3.5 py-2">
						<Layers size={16} className="text-(--accent)" />
						<div className="flex flex-col">
							<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.errors.stats.occurrences')}</span>
							<span className="text-sm font-extrabold font-mono text-(--text)">{stats.occurrences.toLocaleString()}</span>
						</div>
					</div>

					{/* Per-Service Quick Filter Pills */}
					<div className="flex flex-wrap items-center gap-1.5">
						{services.map((svc) => {
							const count = stats.byService[svc] || 0;
							const isSelected = selectedServices.includes(svc);
							return (
								<button
									key={svc}
									type="button"
									onClick={() => setSelectedServices((prev) => (prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]))}
									className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition-all cursor-pointer ${
										isSelected
											? 'bg-(--accent) text-(--text) border-(--accent)'
											: 'bg-(--foreground)/35 text-(--text-muted) border-(--border)/10 hover:text-(--text) hover:border-(--accent)/30'
									}`}
								>
									<Bot size={12} />
									<span className="uppercase">{svc}</span>
									<span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${count > 0 ? 'bg-(--accent-red)/20 text-(--accent-red)' : 'opacity-60'}`}>{count}</span>
								</button>
							);
						})}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5 shrink-0">
					<div className="inline-flex items-center gap-2 rounded-2xl bg-(--foreground)/35 border border-(--border)/10 px-3 py-1.5">
						<Toggle size="sm" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
						<span className="text-xs font-bold text-(--text-muted)">{t('hosting.errors.actions.livePoll')}</span>
					</div>

					<Button variant="secondary" size="sm" onClick={() => fetchLogs()} className="flex items-center gap-1.5">
						<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
						<span>{t('hosting.errors.actions.refresh')}</span>
					</Button>

					{stats.open > 0 && (
						<Button variant="secondary" size="sm" onClick={handleResolveAll} className="flex items-center gap-1.5">
							<CheckCircle2 size={13} className="text-(--accent-green)" />
							<span>{t('hosting.errors.actions.resolveAll')}</span>
						</Button>
					)}

					{logs.length > 0 && (
						<Button variant="danger" size="sm" onClick={() => setConfirmClearOpen(true)} className="flex items-center gap-1.5">
							<Trash2 size={13} />
							<span>{t('hosting.errors.actions.clearLogs')}</span>
						</Button>
					)}
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div
				className="flex flex-col lg:flex-row lg:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md"
				style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
			>
				<div className="flex-1 min-w-0">
					<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('hosting.errors.filters.searchPlaceholder')} />
				</div>

				<div className="flex flex-wrap items-center gap-2 shrink-0">
					<MultiSelector
						placeholder={t('hosting.errors.filters.allServices')}
						value={selectedServices}
						onChange={setSelectedServices}
						options={services.map((svc) => ({
							value: svc,
							label: `${svc.toUpperCase()} (${stats.byService[svc] || 0})`,
						}))}
					/>

					<MultiSelector
						searchable={false}
						placeholder={t('hosting.errors.filters.allLevels')}
						value={selectedLevels}
						onChange={setSelectedLevels}
						options={[
							{ value: 'fatal', label: t('hosting.errors.levels.fatal'), color: 'var(--accent-red)' },
							{ value: 'error', label: t('hosting.errors.levels.error'), color: 'var(--accent-orange)' },
							{ value: 'warn', label: t('hosting.errors.levels.warn'), color: 'var(--accent)' },
						]}
					/>

					<MultiSelector
						searchable={false}
						placeholder={t('hosting.errors.filters.allEnvironments')}
						value={selectedEnvs}
						onChange={setSelectedEnvs}
						options={[
							{ value: 'production', label: 'Production', color: 'var(--accent-green)' },
							{ value: 'canary', label: 'Canary', color: 'var(--accent-orange)' },
							{ value: 'development', label: 'Development', color: 'var(--accent)' },
						]}
					/>

					<div className="w-40">
						<Selector
							value={statusFilter}
							onChange={(val) => setStatusFilter(val as 'open' | 'resolved' | 'all')}
							options={[
								{ value: 'open', label: `${t('hosting.errors.status.open')} (${stats.open})` },
								{ value: 'resolved', label: `${t('hosting.errors.status.resolved')} (${stats.resolved})` },
								{ value: 'all', label: `${t('hosting.errors.status.all')} (${stats.total})` },
							]}
						/>
					</div>
				</div>
			</div>

			{/* Error Log Cards List */}
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{filteredLogs.length === 0 ? (
					<EmptyState
						icon={<CheckCircle2 size={24} />}
						title={t('hosting.errors.empty.title')}
						description={searchQuery.trim() ? t('hosting.errors.empty.searchDesc', { query: searchQuery }) : t('hosting.errors.empty.cleanDesc')}
					/>
				) : (
					filteredLogs.map((item) => {
						const isExpanded = Boolean(expandedIds[item.id]);
						const levelBadgeVariant = item.level === 'fatal' || item.level === 'error' ? 'danger' : 'warning';

						return (
							<div
								key={item.id}
								className={`flex flex-col rounded-3xl border transition-all ${
									item.resolved
										? 'border-(--border)/10 bg-(--background)/40 opacity-75'
										: item.level === 'fatal'
											? 'border-(--accent-red)/35 bg-(--background)/70 shadow-sm'
											: 'border-(--border)/15 bg-(--background)/65 hover:border-(--accent)/35'
								}`}
								style={{ padding: 'var(--ui-gap)' }}
							>
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
									<div onClick={() => toggleExpand(item.id)} className="flex flex-wrap items-center gap-2 min-w-0 flex-1 cursor-pointer">
										<Badge variant="accent" size="sm" icon={<Server size={11} />}>
											{item.service.toUpperCase()}
										</Badge>

										<Badge variant={levelBadgeVariant as any} size="sm">
											{item.level.toUpperCase()}
										</Badge>

										<span className="rounded-full bg-(--foreground)/50 border border-(--border)/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-(--text-muted) uppercase">
											{item.environment}
										</span>

										{item.occurrences > 1 && (
											<span className="rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2.5 py-0.5 text-xs font-mono font-extrabold text-(--accent)">
												×{item.occurrences.toLocaleString()}
											</span>
										)}

										{item.filepath && (
											<span className="inline-flex items-center gap-1 rounded-xl bg-(--foreground)/45 border border-(--border)/10 px-2.5 py-0.5 text-xs font-mono text-(--text-muted) truncate max-w-xs">
												<FileCode2 size={12} className="text-(--accent) shrink-0" />
												<span className="truncate">{item.filepath}</span>
											</span>
										)}

										<span className="inline-flex items-center gap-1 text-xs font-mono text-(--text-muted)">
											<Clock size={12} />
											<span>{formatRelativeTime(item.lastSeenAt)}</span>
										</span>
									</div>

									<div className="flex items-center gap-1.5 shrink-0">
										<Button variant="secondary" size="sm" onClick={() => handleCopyStack(item)} title={t('hosting.errors.actions.copyStack')} className="flex items-center gap-1">
											<Copy size={12} />
											<span className="hidden md:inline">{t('hosting.errors.actions.copyStack')}</span>
										</Button>

										<Button
											variant="secondary"
											size="sm"
											disabled={sharingHasteId === item.id}
											onClick={() => handleOpenInHaste(item)}
											title={t('hosting.errors.actions.openHaste')}
											className="flex items-center gap-1"
										>
											<ExternalLink size={12} className="text-(--accent)" />
											<span className="hidden md:inline">{t('hosting.errors.actions.openHaste')}</span>
										</Button>

										<Button variant="secondary" size="sm" onClick={() => handleToggleResolved(item)} className="flex items-center gap-1">
											{item.resolved ? <RotateCcw size={12} /> : <CheckCircle2 size={12} className="text-(--accent-green)" />}
											<span className="hidden sm:inline">{item.resolved ? t('hosting.errors.actions.reopen') : t('hosting.errors.actions.resolve')}</span>
										</Button>

										<Button variant="danger" size="sm" onClick={() => handleDeleteOne(item.id)} title={t('hosting.errors.actions.delete')}>
											<Trash2 size={12} />
										</Button>

										<button
											type="button"
											onClick={() => toggleExpand(item.id)}
											className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-(--foreground)/50 border border-(--border)/10 text-(--text-muted) hover:text-(--text) cursor-pointer"
										>
											{isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
										</button>
									</div>
								</div>

								<div onClick={() => toggleExpand(item.id)} className="mt-2.5 font-mono text-sm font-semibold text-(--text) break-words cursor-pointer">
									{item.message}
								</div>

								{isExpanded && (
									<div className="mt-4 pt-4 border-t border-(--border)/10 flex flex-col gap-3">
										{item.meta && Object.keys(item.meta).length > 0 && (
											<div className="flex flex-wrap items-center gap-2">
												{Object.entries(item.meta).map(([k, v]) =>
													v !== null && v !== undefined && v !== '' ? (
														<span
															key={k}
															className="inline-flex items-center gap-1.5 rounded-xl bg-(--foreground)/50 border border-(--border)/10 px-2.5 py-1 text-xs font-mono"
														>
															<span className="text-(--text-muted)">{k}:</span>
															<span className="font-bold text-(--accent)">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
														</span>
													) : null
												)}
												<span className="inline-flex items-center gap-1.5 rounded-xl bg-(--foreground)/50 border border-(--border)/10 px-2.5 py-1 text-xs font-mono">
													<span className="text-(--text-muted)">firstSeen:</span>
													<span className="text-(--text)">{new Date(item.firstSeenAt).toLocaleString()}</span>
												</span>
												<span className="inline-flex items-center gap-1.5 rounded-xl bg-(--foreground)/50 border border-(--border)/10 px-2.5 py-1 text-xs font-mono">
													<span className="text-(--text-muted)">lastSeen:</span>
													<span className="text-(--text)">{new Date(item.lastSeenAt).toLocaleString()}</span>
												</span>
											</div>
										)}

										<pre className="w-full overflow-x-auto custom-scrollbar rounded-2xl bg-(--background)/85 border border-(--border)/15 p-4 font-mono text-xs text-(--text-muted) leading-relaxed whitespace-pre-wrap break-all">
											{item.stack || item.message}
										</pre>
									</div>
								)}
							</div>
						);
					})
				)}
			</div>

			<Confirm
				open={confirmClearOpen}
				onOpenChange={setConfirmClearOpen}
				title={t('hosting.errors.confirmClear.title')}
				description={t('hosting.errors.confirmClear.description')}
				confirmText={t('hosting.errors.actions.clearLogs')}
				onConfirm={handleClearAll}
				loading={clearing}
				variant="danger"
			/>
		</div>
	);
}
