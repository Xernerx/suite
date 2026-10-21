/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button, Input } from '@xernerx/ui';
import { Download, Plus, RefreshCw } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import type { Token } from './tokens/types';
import { TokenCard } from './tokens/TokenCard';
import { CreateTokenModal } from './tokens/CreateTokenModal';

export default function Tokens({ initialSearch = '', onViewAuditLogs }: { initialSearch?: string; onViewAuditLogs?: (tokenId: string) => void }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [tokens, setTokens] = useState<Token[]>([]);
	const [search, setSearch] = useState(initialSearch);
	const [statusFilter, setStatusFilter] = useState<'all' | Token['status']>('all');
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (initialSearch !== undefined) setSearch(initialSearch);
	}, [initialSearch]);

	// Modal state for creation
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newName, setNewName] = useState('');
	const [newStatus, setNewStatus] = useState<Token['status']>('active');
	const [newBotId, setNewBotId] = useState('');
	const [newSelectedOwners, setNewSelectedOwners] = useState<string[]>([]);
	const [newSecure, setNewSecure] = useState(false);
	const [newWebsocket, setNewWebsocket] = useState(false);
	const [creating, setCreating] = useState(false);

	const fetchTokens = useCallback(
		async (isManual = false) => {
			if (isManual) setRefreshing(true);
			else setLoading(true);
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/tokens?admin=true'), {
					credentials: 'include',
				});
				if (!res.ok) throw new Error(t('admin.tokens.toast.fetchFailed'));
				const data = await res.json();
				setTokens(Array.isArray(data) ? data : []);
			} catch (err: any) {
				setError(
					err.message ||
						t('admin.tokens.toast.loadError', {
							error: err.message,
						})
				);
			} finally {
				setLoading(false);
				setRefreshing(false);
			}
		},
		[getEnvUrl, t]
	);

	useEffect(() => {
		fetchTokens();
	}, [fetchTokens]);

	const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitter = (e.nativeEvent as SubmitEvent).submitter;
		if (submitter && submitter.getAttribute('type') !== 'submit') return;
		if (!newName) return;
		setCreating(true);
		const newId = crypto.randomUUID();
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/tokens/${newId}`), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					userId: newSelectedOwners[0] || 'admin',
					name: newName,
					status: newStatus,
					botId: newBotId || undefined,
					owners: newSelectedOwners,
					permissions: {
						secure: newSecure,
						websocket: newWebsocket,
					},
				}),
			});
			if (res.ok) {
				const created = await res.json();
				setTokens((prev) => [...prev, created]);
				setIsCreateOpen(false);
				setNewName('');
				setNewStatus('active');
				setNewBotId('');
				setNewSelectedOwners([]);
				setNewSecure(false);
				setNewWebsocket(false);
				toast({
					type: 'success',
					title: t('admin.tokens.toast.createSuccess'),
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('admin.tokens.toast.createError'));
			}
		} catch (err: any) {
			console.error('Failed to create token:', err);
			toast({
				type: 'error',
				title: t('admin.tokens.toast.createError'),
				description: err.message,
			});
		} finally {
			setCreating(false);
		}
	};

	const handleTokenDeleted = (deletedId: string) => {
		setTokens((prev) => prev.filter((t) => t.id !== deletedId && t._id !== deletedId));
	};

	const handleTokenUpdated = (updatedToken: Token) => {
		setTokens((prev) => prev.map((t) => ((t.id && t.id === updatedToken.id) || (t._id && t._id === updatedToken._id) ? updatedToken : t)));
	};

	const filteredTokens = useMemo(() => {
		return tokens.filter((t) => {
			if (statusFilter !== 'all' && t.status !== statusFilter) return false;
			if (!search.trim()) return true;
			const q = search.toLowerCase();
			return t.name?.toLowerCase().includes(q) || t.id?.toLowerCase().includes(q) || t.botId?.toLowerCase().includes(q);
		});
	}, [tokens, search, statusFilter]);

	const exportTokens = (format: 'csv' | 'json') => {
		if (filteredTokens.length === 0) return;
		if (format === 'json') {
			const blob = new Blob([JSON.stringify(filteredTokens, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `xernerx-tokens-${new Date().toISOString().slice(0, 10)}.json`;
			a.click();
			URL.revokeObjectURL(url);
			return;
		}
		const headers = ['id', 'name', 'status', 'botId', 'owners', 'secure', 'websocket'];
		const rows = filteredTokens.map((tk) =>
			[
				tk.id || tk._id || '',
				(tk.name || '').replace(/"/g, '""'),
				tk.status || 'active',
				tk.botId || '',
				(tk.owners || []).join(';'),
				String(Boolean(tk.permissions?.secure)),
				String(Boolean(tk.permissions?.websocket)),
			]
				.map((cell) => `"${cell}"`)
				.join(',')
		);
		const csvContent = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `xernerx-tokens-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading) return <Loading />;
	if (error)
		return (
			<div className="p-6 text-(--accent-red)">
				{t('admin.tokens.edit.failedToFetchToken', {
					error,
				})}
			</div>
		);

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{/* Header & New Token Button */}
			<div
				className="flex flex-col sm:flex-row items-center justify-between"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				<div className="flex flex-col">
					<h1
						className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm"
						style={{
							fontFamily: `var(--font-fredoka)`,
						}}
					>
						{t('admin.tokens.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.tokens.description')}</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" size="sm" onClick={() => exportTokens('csv')} disabled={filteredTokens.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.tokens.exportCsv')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => exportTokens('json')} disabled={filteredTokens.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.tokens.exportJson')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => fetchTokens(true)} disabled={refreshing} className="flex items-center gap-1.5">
						<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
						{t('admin.tokens.refresh')}
					</Button>
					<Button
						variant="primary"
						onClick={() => {
							setNewName('');
							setNewStatus('active');
							setNewBotId('');
							setNewSelectedOwners([]);
							setNewSecure(false);
							setNewWebsocket(false);
							setIsCreateOpen(true);
						}}
						style={{
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<Plus size={16} />
						<span>{t('admin.tokens.generateButton')}</span>
					</Button>
				</div>
			</div>

			{/* Controls Bar: Search & Status Filters */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
				<div className="relative flex-1">
					<Input variant="search" shortcut={true} placeholder={t('admin.tokens.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>
				<div className="flex items-center gap-1.5 flex-wrap bg-(--foreground)/30 border border-(--border)/10 p-1.5 rounded-2xl shrink-0">
					{(['all', 'active', 'inactive', 'suspended', 'pending'] as const).map((st) => (
						<button
							key={st}
							type="button"
							onClick={() => setStatusFilter(st)}
							className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
								statusFilter === st ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--background)/50'
							}`}
						>
							{st === 'all' ? t('admin.tokens.filterAll') : t(`admin.tokens.statusOptions.${st}`)}
						</button>
					))}
				</div>
			</div>

			{/* Tokens Grid (3 Columns) */}
			{filteredTokens.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.tokens.empty.title')}</p>
				</div>
			) : (
				<motion.div
					layout
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-visible"
					style={{
						gap: 'var(--ui-gap)',
					}}
				>
					<AnimatePresence>
						{filteredTokens.map((token) => (
							<TokenCard
								key={token.id || token._id}
								token={token}
								getEnvUrl={getEnvUrl}
								onTokenDeleted={handleTokenDeleted}
								onTokenUpdated={handleTokenUpdated}
								onViewAuditLogs={onViewAuditLogs}
							/>
						))}
					</AnimatePresence>
				</motion.div>
			)}

			{/* Create Modal */}
			<CreateTokenModal
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				newName={newName}
				setNewName={setNewName}
				newStatus={newStatus}
				setNewStatus={setNewStatus}
				newBotId={newBotId}
				setNewBotId={setNewBotId}
				newSelectedOwners={newSelectedOwners}
				setNewSelectedOwners={setNewSelectedOwners}
				newSecure={newSecure}
				setNewSecure={setNewSecure}
				newWebsocket={newWebsocket}
				setNewWebsocket={setNewWebsocket}
				getEnvUrl={getEnvUrl}
				onSubmit={handleCreate}
				creating={creating}
			/>
		</div>
	);
}
