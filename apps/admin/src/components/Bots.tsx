/** @format */
'use client';

import { ArrowUpDown, Download, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import { AdminBotSummary, BotDiscordProfile } from './bots/types';
import { BotCard } from './bots/BotCard';
import { useInfiniteScroll } from './useInfiniteScroll';

export default function Bots({ initialSearch = '', onViewAuditLogs }: { initialSearch?: string; onViewAuditLogs?: (botId: string) => void }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const [bots, setBots] = useState<AdminBotSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState(initialSearch);
	const [privacyFilter, setPrivacyFilter] = useState<string>('all');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'servers' | 'votes'>('asc');
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
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/bots?all=true&limit=500'), {
					credentials: 'include',
					cache: 'no-store',
				});
				if (!res.ok) throw new Error('Failed to fetch bots');
				const data = await res.json();
				setBots(Array.isArray(data) ? data : []);
			} catch (err: any) {
				setError(err.message || t('admin.bots.fetchError'));
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

	const handleBotDeleted = (deletedId: string) => {
		setBots((prev) => prev.filter((b) => b.id !== deletedId));
	};

	const handleBotUpdated = (updated: AdminBotSummary) => {
		setBots((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
	};

	const handleDiscordFetched = useCallback((id: string, discord: BotDiscordProfile) => {
		setBots((prev) => {
			const exists = prev.find((b) => b.id === id);
			if (exists && exists.discord) return prev;
			return prev.map((b) => (b.id === id ? { ...b, discord } : b));
		});
	}, []);

	const filteredBots = useMemo(() => {
		return bots
			.filter((bot) => {
				const q = search.trim().toLowerCase();
				const matchesSearch =
					!q ||
					Boolean(bot.name?.toLowerCase().includes(q)) ||
					Boolean(bot.id?.toLowerCase().includes(q)) ||
					Boolean(bot.vanitySlug?.toLowerCase().includes(q)) ||
					Boolean(bot.discord?.username?.toLowerCase().includes(q));

				const matchesFilter = privacyFilter === 'all' || (privacyFilter === 'verified' ? Boolean(bot.verified) : (bot.privacy || 'private') === privacyFilter);

				return matchesSearch && matchesFilter;
			})
			.sort((a, b) => {
				if (sortOrder === 'servers') {
					return (b.stats?.guildCount ?? 0) - (a.stats?.guildCount ?? 0);
				}
				if (sortOrder === 'votes') {
					return (b.voteCount ?? b.stats?.voteCount ?? 0) - (a.voteCount ?? a.stats?.voteCount ?? 0);
				}
				const nameA = (a.name || a.discord?.username || '').toLowerCase();
				const nameB = (b.name || b.discord?.username || '').toLowerCase();
				if (!nameA && nameB) return 1;
				if (nameA && !nameB) return -1;
				return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
			});
	}, [bots, search, privacyFilter, sortOrder]);

	const renderedBots = filteredBots.slice(0, limit);
	const loadMoreRef = useInfiniteScroll(filteredBots.length > limit, loading, () => setLimit((prev) => prev + 30));

	const exportBots = (format: 'csv' | 'json') => {
		if (filteredBots.length === 0) return;
		const dateStr = new Date().toISOString().slice(0, 10);

		if (format === 'json') {
			const payload = filteredBots.map((b) => ({
				id: b.id,
				name: b.name || b.discord?.username || '',
				vanitySlug: b.vanitySlug || '',
				privacy: b.privacy || 'private',
				verified: Boolean(b.verified),
				guildCount: b.stats?.guildCount ?? 0,
				voteCount: b.voteCount ?? b.stats?.voteCount ?? 0,
				owners: b.owners || [],
			}));
			const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `xernerx-bots-${dateStr}.json`;
			a.click();
			URL.revokeObjectURL(url);
			return;
		}

		const headers = ['id', 'name', 'vanitySlug', 'privacy', 'verified', 'guildCount', 'voteCount', 'owners'];
		const rows = filteredBots.map((b) =>
			[
				b.id,
				b.name || b.discord?.username || '',
				b.vanitySlug || '',
				b.privacy || 'private',
				Boolean(b.verified),
				b.stats?.guildCount ?? 0,
				b.voteCount ?? b.stats?.voteCount ?? 0,
				(b.owners || []).join('; '),
			]
				.map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
				.join(',')
		);
		const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `xernerx-bots-${dateStr}.csv`;
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
						{t('admin.bots.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.bots.description')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" size="sm" onClick={() => exportBots('csv')} disabled={filteredBots.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.users.exportCsv')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => exportBots('json')} disabled={filteredBots.length === 0} className="flex items-center gap-1.5">
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
					<Input variant="search" shortcut={true} placeholder={t('admin.bots.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
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
						]}
					/>
				</div>
				<button
					type="button"
					onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? 'servers' : prev === 'servers' ? 'votes' : 'asc'))}
					className="flex items-center justify-center gap-2 rounded-full border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm font-medium text-(--text) hover:bg-(--foreground)/50 transition-colors shrink-0 w-full sm:w-auto h-[56px] px-6 shadow-sm cursor-pointer"
				>
					<ArrowUpDown size={16} />
					<span>
						{t('admin.users.sortLabel')}{' '}
						{sortOrder === 'asc' ? 'A - Z' : sortOrder === 'desc' ? 'Z - A' : sortOrder === 'servers' ? t('admin.bots.serversStat') : t('admin.bots.votesStat')}
					</span>
				</button>
			</div>

			{renderedBots.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.bots.noBotsFound')}</p>
				</div>
			) : (
				<>
					<motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
						<AnimatePresence>
							{renderedBots.map((bot) => (
								<BotCard
									key={bot.id}
									bot={bot}
									getEnvUrl={getEnvUrl}
									onBotDeleted={handleBotDeleted}
									onBotUpdated={handleBotUpdated}
									onDiscordFetched={handleDiscordFetched}
									onViewAuditLogs={onViewAuditLogs}
								/>
							))}
						</AnimatePresence>
					</motion.div>
					{renderedBots.length < filteredBots.length && (
						<div ref={loadMoreRef} className="w-full py-6 flex justify-center">
							<Loading variant="small" />
						</div>
					)}
				</>
			)}
		</div>
	);
}
