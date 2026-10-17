/** @format */
'use client';

import { AnimatePresence, Reorder } from 'framer-motion';
import { Button, Input } from '@xernerx/ui';
import { Plus } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useMemo, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import { permissions } from '@xernerx/lib';
import type { DiscordRole, Role } from './roles/types';
import { RoleCard } from './roles/RoleCard';
import { CreateRoleModal } from './roles/CreateRoleModal';

export default function Roles() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [roles, setRoles] = useState<Role[]>([]);
	const [discordRoles, setDiscordRoles] = useState<DiscordRole[]>([]);
	const [guild, setGuild] = useState<any>(null);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Modal state for creation
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newName, setNewName] = useState('');
	const [newDiscordRoleId, setNewDiscordRoleId] = useState('');
	const [newSync, setNewSync] = useState(false);
	const [newPermissions, setNewPermissions] = useState<Record<string, boolean>>(() => {
		const initial: Record<string, boolean> = {};
		permissions.forEach((p) => {
			initial[p.key] = p.defaultValue;
		});
		return initial;
	});
	const [creating, setCreating] = useState(false);
	const [, setGuildId] = useState('687429190165069838');

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				let resolvedGuildId = '687429190165069838';
				try {
					const settingRes = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_server_id'));
					if (settingRes.ok) {
						const data = await settingRes.json();
						if (data?.data?.value) {
							resolvedGuildId = data.data.value;
							setGuildId(resolvedGuildId);
						}
					}
				} catch (err) {
					console.error('Failed to fetch admin server setting:', err);
				}
				const [rolesRes, guildRes, discordRolesRes] = await Promise.all([
					fetch(getEnvUrl('https://api.xernerx.com/secure/core')),
					fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${resolvedGuildId}/discord`)),
					fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${resolvedGuildId}/discord/roles`)),
				]);
				if (rolesRes.ok) {
					const fetchedRoles = await rolesRes.json();
					if (Array.isArray(fetchedRoles)) {
						setRoles(fetchedRoles.sort((a: Role, b: Role) => (a.position || 0) - (b.position || 0)));
					}
				}
				if (guildRes.ok) setGuild(await guildRes.json());
				if (discordRolesRes.ok) {
					const fetchedDiscordRoles = await discordRolesRes.json();
					setDiscordRoles(Array.isArray(fetchedDiscordRoles) ? fetchedDiscordRoles : []);
				}
			} catch (err: any) {
				setError(err.message || t('admin.roles.loadError'));
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [getEnvUrl, t]);

	const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitter = (e.nativeEvent as SubmitEvent).submitter;
		if (submitter && submitter.getAttribute('type') !== 'submit') return;
		if (!newName) return;
		setCreating(true);
		const newId = crypto.randomUUID();
		try {
			let roleName = newName;
			if (newSync && newDiscordRoleId) {
				const matchedDiscordRole = discordRoles.find((d) => d.id === newDiscordRoleId);
				if (matchedDiscordRole) {
					roleName = matchedDiscordRole.name;
				}
			}
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: newId,
					name: roleName,
					role: newDiscordRoleId || undefined,
					sync: newSync,
					permissions: newPermissions,
				}),
			});
			if (res.ok) {
				const newRole = await res.json();
				setRoles((prev) => [...prev, newRole]);
				setIsCreateOpen(false);
				setNewName('');
				setNewDiscordRoleId('');
				setNewSync(false);
				const resetPerms: Record<string, boolean> = {};
				permissions.forEach((p) => {
					resetPerms[p.key] = p.defaultValue;
				});
				setNewPermissions(resetPerms);
				toast({
					type: 'success',
					title: t('admin.roles.roleCreated'),
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || 'Unknown error');
			}
		} catch (err: any) {
			console.error('Failed to create role:', err);
			toast({
				type: 'error',
				title: t('admin.roles.createRoleError'),
				description: err.message,
			});
		} finally {
			setCreating(false);
		}
	};

	const handleRoleDeleted = (deletedId: string) => {
		setRoles((prev) => prev.filter((r) => r.id !== deletedId));
	};

	const handleRoleUpdated = (updatedRole: Role) => {
		setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
	};

	const handleReorder = async (newOrder: Role[]) => {
		// Update local state immediately with new positions
		const updatedOrder = newOrder.map((role, index) => ({ ...role, position: index }));
		setRoles(updatedOrder);

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/roles/reorder'), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedOrder.map((r) => ({ id: r.id, position: r.position }))),
			});

			if (!res.ok) {
				throw new Error('Failed to save role order');
			}
		} catch (err) {
			console.error(err);
			toast({ type: 'error', title: t('admin.roles.reorderRoleError') });
		}
	};

	const filteredRoles = useMemo(() => {
		return roles.filter((r) => r.name?.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()) || r.role?.toLowerCase().includes(search.toLowerCase()));
	}, [roles, search]);

	if (loading) return <Loading />;
	if (error)
		return (
			<div className="p-6 text-red-500">
				{t('admin.roles.errorPrefix')} {error}
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
			{/* Guild Header Info */}
			{guild && (
				<div
					className="flex items-center gap-4 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{
						padding: 'var(--ui-gap)',
					}}
				>
					{guild.iconUrl && <img src={guild.iconUrl} alt={guild.name} className="w-14 h-14 rounded-full border border-(--border)/10 object-cover shrink-0" />}
					<div className="flex flex-col">
						<h1 className="text-xl font-bold text-(--text)">{guild.name}</h1>
						<p className="text-xs text-(--text-muted)">
							{t('admin.roles.serverId')} {guild.id} | {t('admin.roles.members')} {guild.approximate_member_count || 'N/A'}
						</p>
					</div>
				</div>
			)}

			{/* Header & New Role Button */}
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
						{t('admin.roles.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.roles.description')}</p>
				</div>
				<Button
					variant="primary"
					onClick={() => {
						setNewName('');
						setNewDiscordRoleId('');
						setNewSync(false);
						const resetPerms: Record<string, boolean> = {};
						permissions.forEach((p) => {
							resetPerms[p.key] = p.defaultValue;
						});
						setNewPermissions(resetPerms);
						setIsCreateOpen(true);
					}}
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Plus size={16} />
					<span>{t('admin.roles.newRoleButton')}</span>
				</Button>
			</div>

			{/* Controls Bar: Search */}
			<div className="relative w-full">
				<Input variant="search" shortcut={true} placeholder={t('admin.roles.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
			</div>

			{/* Roles List */}
			{filteredRoles.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.roles.noRolesFound')}</p>
				</div>
			) : (
				<Reorder.Group
					axis="y"
					values={roles}
					onReorder={handleReorder}
					className="flex flex-col"
					style={{
						gap: 'var(--ui-gap)',
					}}
				>
					<AnimatePresence>
						{filteredRoles.map((role) => (
							<RoleCard key={role.id} role={role} discordRoles={discordRoles} getEnvUrl={getEnvUrl} onRoleDeleted={handleRoleDeleted} onRoleUpdated={handleRoleUpdated} />
						))}
					</AnimatePresence>
				</Reorder.Group>
			)}

			{/* Create Modal */}
			<CreateRoleModal
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				newName={newName}
				setNewName={setNewName}
				newDiscordRoleId={newDiscordRoleId}
				setNewDiscordRoleId={setNewDiscordRoleId}
				newSync={newSync}
				setNewSync={setNewSync}
				newPermissions={newPermissions}
				setNewPermissions={setNewPermissions}
				discordRoles={discordRoles}
				onSubmit={handleCreate}
				creating={creating}
			/>
		</div>
	);
}
