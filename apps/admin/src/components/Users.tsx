/** @format */
'use client';

import { ArrowUpDown, Download, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Input, MultiSelector } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import { DiscordProfile, FullUser, getNormalizedRoles, Role, UserSummary } from './users/types';
import { UserCard } from './users/UserCard';
import { AdminUserCreditsModal } from './AdminUserCreditsModal';

export default function Users({ initialSearch = '', onViewAuditLogs }: { initialSearch?: string; onViewAuditLogs?: (userId: string) => void }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [users, setUsers] = useState<UserSummary[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState(initialSearch);
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
	const [filterRoleIds, setFilterRoleIds] = useState<string[]>([]);
	const [limit, setLimit] = useState(30);
	const [creditsTargetUser, setCreditsTargetUser] = useState<UserSummary | null>(null);

	useEffect(() => {
		if (initialSearch !== undefined) setSearch(initialSearch);
	}, [initialSearch]);

	// Reset limit when filters change
	useEffect(() => {
		setLimit(30);
	}, [search, sortOrder, filterRoleIds]);

	const observer = useRef<IntersectionObserver | null>(null);
	const lastIncrementTime = useRef(0);
	const loadMoreRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (loading) return;
			if (observer.current) observer.current.disconnect();
			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting) {
					const now = Date.now();
					if (now - lastIncrementTime.current > 500) {
						setLimit((prev) => prev + 30);
						lastIncrementTime.current = now;
					}
				}
			});
			if (node) observer.current.observe(node);
		},
		[loading]
	);

	const fetchData = useCallback(
		async (isManual = false) => {
			if (isManual) setRefreshing(true);
			else setLoading(true);
			try {
				const [usersRes, rolesRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/users`), { credentials: 'include', cache: 'no-store' }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/core`), { credentials: 'include', cache: 'no-store' }),
				]);
				if (!usersRes.ok) throw new Error('Failed to fetch users');
				if (!rolesRes.ok) throw new Error('Failed to fetch roles');
				const usersData = await usersRes.json();
				const rolesData = await rolesRes.json();
				setUsers(Array.isArray(usersData) ? usersData : []);
				setRoles(Array.isArray(rolesData) ? rolesData : []);
			} catch (err: any) {
				setError(err.message || t('admin.users.card.loadError'));
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

	const handleUserDeleted = (deletedId: string) => {
		setUsers((prev) => prev.filter((u) => u.id !== deletedId));
	};

	const handleUserUpdated = (updatedUser: FullUser) => {
		setUsers((prev) =>
			prev.map((u) =>
				u.id === updatedUser.id
					? {
							...u,
							name: updatedUser.name,
							roles: updatedUser.roles,
							stripeCustomerId: updatedUser.stripeCustomerId,
							icon: updatedUser.icon,
						}
					: u
			)
		);
	};

	const handleDiscordFetched = useCallback((id: string, discord: DiscordProfile) => {
		setUsers((prev) => {
			// Prevent unnecessary updates if already set
			const exists = prev.find((u) => u.id === id);
			if (exists && exists.discord) return prev;
			return prev.map((u) =>
				u.id === id
					? {
							...u,
							discord,
						}
					: u
			);
		});
	}, []);

	const filteredUsers = useMemo(() => {
		return users
			.filter((user) => {
				const query = search.toLowerCase();
				const nameMatch = user.name?.toLowerCase().includes(query) ?? false;
				const idMatch = user.id?.toLowerCase().includes(query) ?? false;
				const discordMatch = user.discord?.username?.toLowerCase().includes(query) ?? false;
				const matchesSearch = nameMatch || idMatch || discordMatch;
				const userRoleIds = getNormalizedRoles(user);
				const matchesRoles = filterRoleIds.length === 0 || filterRoleIds.some((roleId) => userRoleIds.includes(roleId));
				return matchesSearch && matchesRoles;
			})
			.sort((a, b) => {
				const nameA = (a.name || a.discord?.username || '').toLowerCase();
				const nameB = (b.name || b.discord?.username || '').toLowerCase();

				// Always push empty names to the very bottom
				if (!nameA && nameB) return 1;
				if (nameA && !nameB) return -1;
				if (sortOrder === 'asc') {
					return nameA.localeCompare(nameB);
				} else {
					return nameB.localeCompare(nameA);
				}
			});
	}, [users, search, sortOrder, filterRoleIds]);

	const renderedUsers = filteredUsers.slice(0, limit);

	const exportUsers = (format: 'csv' | 'json') => {
		if (filteredUsers.length === 0) return;
		const roleMap = new Map(roles.map((r) => [r.id, r.name || r.id]));

		if (format === 'json') {
			const payload = filteredUsers.map((u) => ({
				id: u.id,
				name: u.name || u.discord?.globalName || u.discord?.username || '',
				discordUsername: u.discord?.username || '',
				roles: getNormalizedRoles(u).map((rid) => roleMap.get(rid) || rid),
				stripeCustomerId: u.stripeCustomerId || '',
			}));
			const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `xernerx-users-${new Date().toISOString().slice(0, 10)}.json`;
			a.click();
			URL.revokeObjectURL(url);
			return;
		}

		const headers = ['id', 'name', 'discordUsername', 'roles', 'stripeCustomerId'];
		const rows = filteredUsers.map((u) => {
			const roleNames = getNormalizedRoles(u)
				.map((rid) => roleMap.get(rid) || rid)
				.join('; ');
			return [u.id, u.name || u.discord?.globalName || u.discord?.username || '', u.discord?.username || '', roleNames, u.stripeCustomerId || '']
				.map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
				.join(',');
		});
		const csvContent = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `xernerx-users-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading) return <Loading />;
	if (error)
		return (
			<div className="p-6 text-(--accent-red)">
				{t('admin.users.card.fetchError', {
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
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div
					className="flex flex-col"
					style={{
						gap: 'calc(var(--ui-gap) * 0.25)',
					}}
				>
					<h1
						className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm"
						style={{
							fontFamily: `var(--font-fredoka)`,
						}}
					>
						{t('admin.users.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.users.description')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" size="sm" onClick={() => exportUsers('csv')} disabled={filteredUsers.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.users.exportCsv')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => exportUsers('json')} disabled={filteredUsers.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.users.exportJson')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => fetchData(true)} disabled={refreshing} className="flex items-center gap-1.5">
						<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
						{t('admin.users.refresh')}
					</Button>
				</div>
			</div>

			{/* Controls Bar: Search & Sort */}
			<div
				className="flex flex-col sm:flex-row items-center justify-between"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				<div className="relative flex-1 w-full">
					<Input variant="search" shortcut={true} placeholder={t('admin.users.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>
				<div className="relative w-full sm:max-w-xs z-50">
					<MultiSelector
						value={filterRoleIds}
						onChange={setFilterRoleIds}
						options={roles.map((r) => ({
							value: r.id,
							label: r.name || t('admin.roles.unnamedRole'),
							color: r.permissions?.color || undefined,
						}))}
						placeholder={t('admin.users.rolesLabel')}
						searchPlaceholder={t('admin.users.searchRolesPlaceholder')}
						toggleClassName="h-[56px] !rounded-full !text-base shadow-sm"
					/>
				</div>
				<button
					onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
					className="flex items-center justify-center gap-2 rounded-full border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm font-medium text-(--text) hover:bg-(--foreground)/50 transition-colors shrink-0 w-full sm:w-auto h-[56px] px-6 shadow-sm"
				>
					<ArrowUpDown size={16} />
					<span>
						{t('admin.users.sortLabel')} {sortOrder === 'asc' ? 'A - Z' : 'Z - A'}
					</span>
				</button>
			</div>

			{/* User Grid (3 Columns) */}
			{renderedUsers.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.users.noUsersFound')}</p>
				</div>
			) : (
				<>
					<motion.div
						layout
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-visible"
						style={{
							gap: 'var(--ui-gap)',
						}}
					>
						<AnimatePresence>
							{renderedUsers.map((user) => (
								<UserCard
									key={user.id}
									user={user}
									roles={roles}
									getEnvUrl={getEnvUrl}
									onUserDeleted={handleUserDeleted}
									onUserUpdated={handleUserUpdated}
									onDiscordFetched={handleDiscordFetched}
									onViewAuditLogs={onViewAuditLogs}
									onManageCredits={setCreditsTargetUser}
								/>
							))}
						</AnimatePresence>
					</motion.div>
					{filteredUsers.length > limit && (
						<div ref={loadMoreRef} className="h-14 w-full flex items-center justify-center my-6">
							<Loading variant="small" />
						</div>
					)}
				</>
			)}

			<AdminUserCreditsModal user={creditsTargetUser} onClose={() => setCreditsTargetUser(null)} />
		</div>
	);
}
