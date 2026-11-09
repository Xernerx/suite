/** @format */
'use client';

import { AlertTriangle, Ban, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Input, MultiSelector, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import { DiscordProfile, FullUser, getNormalizedRoles, Role, UserSummary } from './users/types';
import { UserCard } from './users/UserCard';
import { useInfiniteScroll } from './useInfiniteScroll';

type UserSortOption = 'name_asc' | 'name_desc' | 'level_desc' | 'credits_desc' | 'streak_desc';

export default function Users({
	initialSearch = '',
	onViewAuditLogs,
	onNavigateEntity,
}: {
	initialSearch?: string;
	onViewAuditLogs?: (userId: string) => void;
	onNavigateEntity?: (tab: string, query: string) => void;
}) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [users, setUsers] = useState<UserSummary[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState(initialSearch);
	const [sortBy, setSortBy] = useState<UserSortOption>('name_asc');
	const [filterRoleIds, setFilterRoleIds] = useState<string[]>([]);
	const [verifiedOnly, setVerifiedOnly] = useState(false);
	const [blacklistedOnly, setBlacklistedOnly] = useState(false);
	const [missingRolesOnly, setMissingRolesOnly] = useState(false);
	const [limit, setLimit] = useState(30);

	useEffect(() => {
		if (initialSearch === 'missing:roles') {
			setMissingRolesOnly(true);
			setSearch('');
		} else if (initialSearch !== undefined) {
			setSearch(initialSearch);
		}
	}, [initialSearch]);

	// Reset limit when filters change
	useEffect(() => {
		setLimit(30);
	}, [search, sortBy, filterRoleIds, verifiedOnly, blacklistedOnly, missingRolesOnly]);

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
							verified: updatedUser.verified,
							blacklisted: updatedUser.blacklisted,
							services: updatedUser.services,
							vanitySlug: updatedUser.vanitySlug,
							level: updatedUser.level || u.level,
							credits: updatedUser.credits
								? {
										balance: updatedUser.credits.balance ?? u.credits?.balance ?? 0,
										streak: updatedUser.credits.streak ?? u.credits?.streak ?? 0,
									}
								: u.credits,
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

	const existingRoleIdSet = useMemo(() => new Set(roles.map((r) => r.id)), [roles]);

	const allMissingRoleIds = useMemo(() => {
		const missing = new Set<string>();
		for (const u of users) {
			for (const rid of getNormalizedRoles(u)) {
				if (rid && !existingRoleIdSet.has(rid)) missing.add(rid);
			}
		}
		return Array.from(missing);
	}, [users, existingRoleIdSet]);

	const usersWithMissingRolesCount = useMemo(() => {
		return users.filter((u) => getNormalizedRoles(u).some((rid) => Boolean(rid) && !existingRoleIdSet.has(rid))).length;
	}, [users, existingRoleIdSet]);

	const roleFilterOptions = useMemo(() => {
		const validOpts = roles.map((r) => ({
			value: r.id,
			label: r.name || t('admin.roles.unnamedRole'),
			color: r.permissions?.color || undefined,
		}));
		const missingOpts = allMissingRoleIds.map((id) => ({
			value: id,
			label: t('admin.users.missingRoles.optionLabel', { id: id.length > 12 ? `${id.slice(0, 8)}…` : id }),
			color: 'var(--accent-red)',
		}));
		return [...missingOpts, ...validOpts];
	}, [roles, allMissingRoleIds, t]);

	const filteredUsers = useMemo(() => {
		return users
			.filter((user) => {
				const query = search.toLowerCase();
				const nameMatch = user.name?.toLowerCase().includes(query) ?? false;
				const idMatch = user.id?.toLowerCase().includes(query) ?? false;
				const discordMatch = user.discord?.username?.toLowerCase().includes(query) ?? false;
				const matchesSearch = nameMatch || idMatch || discordMatch;
				const userRoleIds = getNormalizedRoles(user);
				const hasMissing = userRoleIds.some((rid) => Boolean(rid) && !existingRoleIdSet.has(rid));
				const matchesRoles = filterRoleIds.length === 0 || filterRoleIds.some((roleId) => userRoleIds.includes(roleId));
				const matchesVerified = !verifiedOnly || Boolean(user.verified);
				const matchesBlacklisted = !blacklistedOnly || Boolean(user.blacklisted);
				const matchesMissingRoles = !missingRolesOnly || hasMissing;
				return matchesSearch && matchesRoles && matchesVerified && matchesBlacklisted && matchesMissingRoles;
			})
			.sort((a, b) => {
				if (sortBy === 'level_desc') {
					const lvlDiff = (b.level?.level ?? 1) - (a.level?.level ?? 1);
					if (lvlDiff !== 0) return lvlDiff;
					return (b.level?.xp ?? 0) - (a.level?.xp ?? 0);
				}
				if (sortBy === 'credits_desc') {
					return (b.credits?.balance ?? 0) - (a.credits?.balance ?? 0);
				}
				if (sortBy === 'streak_desc') {
					return (b.credits?.streak ?? 0) - (a.credits?.streak ?? 0);
				}

				const nameA = (a.name || a.discord?.username || '').toLowerCase();
				const nameB = (b.name || b.discord?.username || '').toLowerCase();

				// Always push empty names to the very bottom
				if (!nameA && nameB) return 1;
				if (nameA && !nameB) return -1;
				if (sortBy === 'name_asc') {
					return nameA.localeCompare(nameB);
				} else {
					return nameB.localeCompare(nameA);
				}
			});
	}, [users, search, sortBy, filterRoleIds, verifiedOnly, blacklistedOnly, missingRolesOnly, existingRoleIdSet]);

	const renderedUsers = filteredUsers.slice(0, limit);
	const loadMoreRef = useInfiniteScroll(filteredUsers.length > limit, loading, () => setLimit((prev) => prev + 30));

	const exportUsers = (format: 'csv' | 'json') => {
		if (filteredUsers.length === 0) return;
		const roleMap = new Map(roles.map((r) => [r.id, r.name || r.id]));

		if (format === 'json') {
			const payload = filteredUsers.map((u) => ({
				id: u.id,
				name: u.name || u.discord?.globalName || u.discord?.username || '',
				discordUsername: u.discord?.username || '',
				verified: Boolean(u.verified),
				blacklisted: Boolean(u.blacklisted),
				services: u.services !== false,
				level: u.level?.level ?? 1,
				xp: u.level?.xp ?? 0,
				credits: u.credits?.balance ?? 0,
				streak: u.credits?.streak ?? 0,
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

		const headers = ['id', 'name', 'discordUsername', 'verified', 'blacklisted', 'services', 'level', 'xp', 'credits', 'streak', 'roles', 'stripeCustomerId'];
		const rows = filteredUsers.map((u) => {
			const roleNames = getNormalizedRoles(u)
				.map((rid) => roleMap.get(rid) || rid)
				.join('; ');
			return [
				u.id,
				u.name || u.discord?.globalName || u.discord?.username || '',
				u.discord?.username || '',
				u.verified ? 'true' : 'false',
				u.blacklisted ? 'true' : 'false',
				u.services !== false ? 'true' : 'false',
				u.level?.level ?? 1,
				u.level?.xp ?? 0,
				u.credits?.balance ?? 0,
				u.credits?.streak ?? 0,
				roleNames,
				u.stripeCustomerId || '',
			]
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
			className="flex flex-col max-w-(--page-width) mx-auto w-full"
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
						options={roleFilterOptions}
						placeholder={t('admin.users.rolesLabel')}
						searchPlaceholder={t('admin.users.searchRolesPlaceholder')}
						toggleClassName="h-[56px] !rounded-full !text-base shadow-sm"
					/>
				</div>
				<button
					type="button"
					onClick={() => setVerifiedOnly((prev) => !prev)}
					className={`flex items-center justify-center gap-2 rounded-full border backdrop-blur-md text-sm font-medium transition-colors shrink-0 w-full sm:w-auto h-[56px] px-5 shadow-sm cursor-pointer ${
						verifiedOnly ? 'border-(--accent-green)/40 bg-(--accent-green)/15 text-(--accent-green)' : 'border-(--border)/10 bg-(--foreground)/30 text-(--text) hover:bg-(--foreground)/50'
					}`}
				>
					<CheckCircle2 size={16} />
					<span>{t('admin.users.fields.verifiedFilter')}</span>
				</button>
				<button
					type="button"
					onClick={() => setBlacklistedOnly((prev) => !prev)}
					className={`flex items-center justify-center gap-2 rounded-full border backdrop-blur-md text-sm font-medium transition-colors shrink-0 w-full sm:w-auto h-[56px] px-5 shadow-sm cursor-pointer ${
						blacklistedOnly ? 'border-(--accent-red)/40 bg-(--accent-red)/15 text-(--accent-red)' : 'border-(--border)/10 bg-(--foreground)/30 text-(--text) hover:bg-(--foreground)/50'
					}`}
				>
					<Ban size={16} />
					<span>{t('admin.users.fields.blacklistedFilter')}</span>
				</button>
				<button
					type="button"
					onClick={() => setMissingRolesOnly((prev) => !prev)}
					className={`flex items-center justify-center gap-2 rounded-full border backdrop-blur-md text-sm font-medium transition-colors shrink-0 w-full sm:w-auto h-[56px] px-5 shadow-sm cursor-pointer ${
						missingRolesOnly
							? 'border-(--accent-red)/40 bg-(--accent-red)/15 text-(--accent-red)'
							: usersWithMissingRolesCount > 0
								? 'border-(--accent-red)/30 bg-(--accent-red)/5 text-(--accent-red) hover:bg-(--accent-red)/15'
								: 'border-(--border)/10 bg-(--foreground)/30 text-(--text) hover:bg-(--foreground)/50'
					}`}
				>
					<AlertTriangle size={16} />
					<span>{t('admin.users.fields.missingRolesFilter')}</span>
					{usersWithMissingRolesCount > 0 && (
						<span className="inline-flex items-center justify-center rounded-full bg-(--accent-red)/20 px-2 py-0.5 text-xs font-bold font-mono">{usersWithMissingRolesCount}</span>
					)}
				</button>
				<div className="relative w-full sm:w-56 z-50">
					<Selector
						value={sortBy}
						onChange={(val) => setSortBy(val as UserSortOption)}
						options={[
							{ value: 'name_asc', label: `${t('admin.users.sortLabel')} A - Z` },
							{ value: 'name_desc', label: `${t('admin.users.sortLabel')} Z - A` },
							{ value: 'level_desc', label: t('admin.users.sortOptions.highestLevel') },
							{ value: 'credits_desc', label: t('admin.users.sortOptions.mostCredits') },
							{ value: 'streak_desc', label: t('admin.users.sortOptions.longestStreak') },
						]}
						toggleClassName="h-[56px] !rounded-full !text-sm shadow-sm"
					/>
				</div>
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
									onNavigateEntity={onNavigateEntity}
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
		</div>
	);
}
