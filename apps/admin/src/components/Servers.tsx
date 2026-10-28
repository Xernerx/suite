/** @format */
'use client';

import { ArrowUpDown, Download, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import { AdminServerSummary } from './servers/types';
import { ServerCard } from './servers/ServerCard';
import { useInfiniteScroll } from './useInfiniteScroll';

export default function Servers({ initialSearch = '', onViewAuditLogs }: { initialSearch?: string; onViewAuditLogs?: (serverId: string) => void }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const [servers, setServers] = useState<AdminServerSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState(initialSearch);
	const [privacyFilter, setPrivacyFilter] = useState<string>('all');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'members' | 'votes'>('asc');
	const [limit, setLimit] = useState(30);

	useEffect(() => {
		if (initialSearch !== undefined) setSearch(initialSearch);
	}, [initialSearch]);

	useEffect(() => {
		setLimit(30);
	}, [search, privacyFilter, sortOrder]);

	const fetchData = useCallback(
		async (isManual = false) => {
			if (isManual) setRefreshing(true);
			else setLoading(true);
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/guilds?all=true&limit=500'), {
					credentials: 'include',
					cache: 'no-store',
				});
				if (!res.ok) throw new Error('Failed to fetch servers');
				const data = await res.json();
				setServers(Array.isArray(data) ? data : []);
			} catch (err: any) {
				setError(err.message || t('admin.servers.fetchError'));
			} finally {
				setLoading(false);
				setRefreshing(false);
			}
		},
		[getEnvUrl, t]
	);

	useEffect(() => {
		fetchData(false);
	}, [fetchData]);

	const handleServerDeleted = (deletedId: string) => {
		setServers((prev) => prev.filter((s) => s.id !== deletedId));
	};

	const handleServerUpdated = (updated: AdminServerSummary) => {
		setServers((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
	};

	const filteredServers = useMemo(() => {
		return servers
			.filter((server) => {
				const q = search.trim().toLowerCase();
				const matchesSearch = !q || Boolean(server.name?.toLowerCase().includes(q)) || Boolean(server.id?.toLowerCase().includes(q)) || Boolean(server.vanitySlug?.toLowerCase().includes(q));

				const matchesFilter =
					privacyFilter === 'all' ||
					(privacyFilter === 'verified' ? Boolean(server.verified) : privacyFilter === 'bot' ? Boolean(server.bot) : (server.privacy || 'private') === privacyFilter);

				return matchesSearch && matchesFilter;
			})
			.sort((a, b) => {
				if (sortOrder === 'members') {
					return (b.memberCount ?? 0) - (a.memberCount ?? 0);
				}
				if (sortOrder === 'votes') {
					return (b.voteCount ?? 0) - (a.voteCount ?? 0);
				}
				const nameA = (a.name || '').toLowerCase();
				const nameB = (b.name || '').toLowerCase();
				if (!nameA && nameB) return 1;
				if (nameA && !nameB) return -1;
				return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
			});
	}, [servers, search, privacyFilter, sortOrder]);

	const renderedServers = filteredServers.slice(0, limit);
	const loadMoreRef = useInfiniteScroll(filteredServers.length > limit, loading, () => setLimit((prev) => prev + 30));

	const exportServers = (format: 'csv' | 'json') => {
		if (filteredServers.length === 0) return;
		const dateStr = new Date().toISOString().slice(0, 10);

		if (format === 'json') {
			const payload = filteredServers.map((s) => ({
				id: s.id,
				name: s.name || '',
				vanitySlug: s.vanitySlug || '',
				privacy: s.privacy || 'private',
				verified: Boolean(s.verified),
				memberCount: s.memberCount ?? 0,
				voteCount: s.voteCount ?? 0,
				owner: s.owner || '',
			}));
			const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `xernerx-servers-${dateStr}.json`;
			a.click();
			URL.revokeObjectURL(url);
			return;
		}

		const headers = ['id', 'name', 'vanitySlug', 'privacy', 'verified', 'memberCount', 'voteCount', 'owner'];
		const rows = filteredServers.map((s) =>
			[s.id, s.name || '', s.vanitySlug || '', s.privacy || 'private', Boolean(s.verified), s.memberCount ?? 0, s.voteCount ?? 0, s.owner || '']
				.map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
				.join(',')
		);
		const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `xernerx-servers-${dateStr}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading) return <Loading />;
	if (error) return <div className="p-6 text-(--accent-red)">{error}</div>;

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}>
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.servers.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.servers.description')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" size="sm" onClick={() => exportServers('csv')} disabled={filteredServers.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.users.exportCsv')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => exportServers('json')} disabled={filteredServers.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.users.exportJson')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => fetchData(true)} disabled={refreshing} className="flex items-center gap-1.5">
						<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
						{t('admin.users.refresh')}
					</Button>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="relative flex-1 w-full">
					<Input variant="search" shortcut={true} placeholder={t('admin.servers.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>
				<div className="relative w-full sm:max-w-xs z-40">
					<Selector
						value={privacyFilter}
						onChange={(val: string) => setPrivacyFilter(val)}
						options={[
							{ value: 'all', label: t('admin.bots.filterAll') },
							{ value: 'public', label: t('admin.bots.privacyPublic') },
							{ value: 'limited', label: t('admin.bots.privacyLimited') },
							{ value: 'private', label: t('admin.bots.privacyPrivate') },
							{ value: 'verified', label: t('admin.bots.filterVerified') },
							{ value: 'bot', label: t('admin.servers.filterBotActive') },
						]}
					/>
				</div>
				<button
					type="button"
					onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? 'members' : prev === 'members' ? 'votes' : 'asc'))}
					className="flex items-center justify-center gap-2 rounded-full border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm font-medium text-(--text) hover:bg-(--foreground)/50 transition-colors shrink-0 w-full sm:w-auto h-[56px] px-6 shadow-sm cursor-pointer"
				>
					<ArrowUpDown size={16} />
					<span>
						{t('admin.users.sortLabel')}{' '}
						{sortOrder === 'asc' ? 'A - Z' : sortOrder === 'desc' ? 'Z - A' : sortOrder === 'members' ? t('admin.servers.membersStat') : t('admin.bots.votesStat')}
					</span>
				</button>
			</div>

			{renderedServers.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.servers.noServersFound')}</p>
				</div>
			) : (
				<>
					<motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
						<AnimatePresence>
							{renderedServers.map((server) => (
								<ServerCard
									key={server.id}
									server={server}
									getEnvUrl={getEnvUrl}
									onServerDeleted={handleServerDeleted}
									onServerUpdated={handleServerUpdated}
									onViewAuditLogs={onViewAuditLogs}
								/>
							))}
						</AnimatePresence>
					</motion.div>
					{renderedServers.length < filteredServers.length && (
						<div ref={loadMoreRef} className="w-full py-6 flex justify-center">
							<Loading variant="small" />
						</div>
					)}
				</>
			)}
		</div>
	);
}
