/** @format */
'use client';

import { Download, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import { AdminOrganizationSummary } from './organizations/types';
import { OrganizationCard } from './organizations/OrganizationCard';
import { useInfiniteScroll } from './useInfiniteScroll';

export default function Organizations({
	initialSearch = '',
	onViewAuditLogs,
	onNavigateEntity,
}: {
	initialSearch?: string;
	onViewAuditLogs?: (orgId: string) => void;
	onNavigateEntity?: (tab: string, query: string) => void;
}) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const [organizations, setOrganizations] = useState<AdminOrganizationSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState(initialSearch);
	const [privacyFilter, setPrivacyFilter] = useState<string>('all');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'members' | 'treasury'>('asc');
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
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/organizations?admin=true'), {
					credentials: 'include',
					cache: 'no-store',
				});
				if (!res.ok) throw new Error('Failed to fetch organizations');
				const data = await res.json();
				const normalized = Array.isArray(data)
					? data.map((org: any) => ({
							...org,
							id: String(org._id || org.id),
						}))
					: [];
				setOrganizations(normalized);
			} catch (err: any) {
				setError(err.message || t('admin.organizations.fetchError'));
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

	const handleOrgDeleted = (deletedId: string) => {
		setOrganizations((prev) => prev.filter((o) => o.id !== deletedId && String(o._id) !== deletedId));
	};

	const handleOrgUpdated = (updated: AdminOrganizationSummary) => {
		setOrganizations((prev) => prev.map((o) => (o.id === updated.id || String(o._id) === updated.id ? { ...o, ...updated } : o)));
	};

	const filteredOrgs = useMemo(() => {
		return organizations
			.filter((org) => {
				const q = search.trim().toLowerCase();
				const matchesSearch =
					!q ||
					Boolean(org.name?.toLowerCase().includes(q)) ||
					Boolean(org.id?.toLowerCase().includes(q)) ||
					Boolean(org.vanitySlug?.toLowerCase().includes(q)) ||
					Boolean(org.owner?.toLowerCase().includes(q));

				const matchesFilter = privacyFilter === 'all' || (privacyFilter === 'verified' ? Boolean(org.verified) : (org.privacy || 'private') === privacyFilter);

				return matchesSearch && matchesFilter;
			})
			.sort((a, b) => {
				if (sortOrder === 'members') {
					return (b.members?.length ?? 0) - (a.members?.length ?? 0);
				}
				if (sortOrder === 'treasury') {
					return (b.treasuryBalance ?? 0) - (a.treasuryBalance ?? 0);
				}
				const nameA = (a.name || '').toLowerCase();
				const nameB = (b.name || '').toLowerCase();
				if (!nameA && nameB) return 1;
				if (nameA && !nameB) return -1;
				return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
			});
	}, [organizations, search, privacyFilter, sortOrder]);

	const renderedOrgs = filteredOrgs.slice(0, limit);
	const loadMoreRef = useInfiniteScroll(filteredOrgs.length > limit, loading, () => setLimit((prev) => prev + 30));

	const exportOrgs = (format: 'csv' | 'json') => {
		if (filteredOrgs.length === 0) return;
		const dateStr = new Date().toISOString().slice(0, 10);

		if (format === 'json') {
			const payload = filteredOrgs.map((o) => ({
				id: o.id,
				name: o.name || '',
				vanitySlug: o.vanitySlug || '',
				privacy: o.privacy || 'private',
				verified: Boolean(o.verified),
				owner: o.owner || '',
				memberCount: o.members?.length ?? 0,
				treasuryBalance: o.treasuryBalance ?? 0,
			}));
			const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `xernerx-organizations-${dateStr}.json`;
			a.click();
			URL.revokeObjectURL(url);
			return;
		}

		const headers = ['id', 'name', 'vanitySlug', 'privacy', 'verified', 'owner', 'memberCount', 'treasuryBalance'];
		const rows = filteredOrgs.map((o) =>
			[o.id, o.name || '', o.vanitySlug || '', o.privacy || 'private', o.verified ? 'true' : 'false', o.owner || '', o.members?.length ?? 0, o.treasuryBalance ?? 0]
				.map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
				.join(',')
		);
		const csvContent = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `xernerx-organizations-${dateStr}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading) return <Loading />;
	if (error) {
		return <div className="p-6 text-(--accent-red)">{t('admin.users.card.fetchError', { error })}</div>;
	}

	return (
		<div
			className="flex flex-col max-w-(--page-width) mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.organizations.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.organizations.description')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" size="sm" onClick={() => exportOrgs('csv')} disabled={filteredOrgs.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.users.exportCsv')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => exportOrgs('json')} disabled={filteredOrgs.length === 0} className="flex items-center gap-1.5">
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
					<Input variant="search" shortcut={true} placeholder={t('admin.organizations.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>
				<div className="w-full sm:w-52">
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
						toggleClassName="h-[56px] !rounded-full !text-sm shadow-sm"
					/>
				</div>
				<div className="w-full sm:w-56">
					<Selector
						value={sortOrder}
						onChange={(val: string) => setSortOrder(val as any)}
						options={[
							{ value: 'asc', label: `${t('admin.users.sortLabel')} A - Z` },
							{ value: 'desc', label: `${t('admin.users.sortLabel')} Z - A` },
							{ value: 'members', label: `${t('admin.users.sortLabel')} ${t('admin.servers.membersStat')}` },
							{ value: 'treasury', label: `${t('admin.users.sortLabel')} ${t('admin.organizations.treasuryStat')}` },
						]}
						toggleClassName="h-[56px] !rounded-full !text-sm shadow-sm"
					/>
				</div>
			</div>

			{renderedOrgs.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.organizations.noOrgsFound')}</p>
				</div>
			) : (
				<>
					<motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
						<AnimatePresence>
							{renderedOrgs.map((org) => (
								<OrganizationCard
									key={org.id}
									organization={org}
									getEnvUrl={getEnvUrl}
									onOrgDeleted={handleOrgDeleted}
									onOrgUpdated={handleOrgUpdated}
									onViewAuditLogs={onViewAuditLogs}
									onNavigateEntity={onNavigateEntity}
								/>
							))}
						</AnimatePresence>
					</motion.div>
					{filteredOrgs.length > limit && (
						<div ref={loadMoreRef} className="h-14 w-full flex items-center justify-center my-6">
							<Loading variant="small" />
						</div>
					)}
				</>
			)}
		</div>
	);
}
