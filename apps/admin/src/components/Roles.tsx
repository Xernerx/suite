/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button, Confirm, Modal, Selector, Toggle } from '@xernerx/ui';
import { ChevronDown, Plus, Search, Shield, Trash2 } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@xernerx/feedback';
import { permissions } from '@xernerx/lib';

interface Role {
	id: string; // Random UUID
	name?: string;
	role?: string; // Discord Role ID
	sync?: boolean; // Whether to sync name from Discord
	permissions?: Record<string, boolean>;
}

interface DiscordRole {
	id: string;
	name: string;
	color: number;
	position: number;
}

function RoleCard({
	role,
	discordRoles,
	getEnvUrl,
	onRoleDeleted,
	onRoleUpdated,
}: {
	role: Role;
	discordRoles: DiscordRole[];
	getEnvUrl: (url: string) => string;
	onRoleDeleted: (id: string) => void;
	onRoleUpdated: (updated: Role) => void;
}) {
	const { t } = useDictionary();
	const [isExpanded, setIsExpanded] = useState(false);
	const [saving, setSaving] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Editable form states
	const [name, setName] = useState(role.name || '');
	const [discordRoleId, setDiscordRoleId] = useState(role.role || '');
	const [sync, setSync] = useState(!!role.sync);
	const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>(() => {
		const initial: Record<string, boolean> = {};
		permissions.forEach((p) => {
			initial[p.key] = role.permissions?.[p.key] ?? p.defaultValue;
		});
		return initial;
	});

	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitter = (e.nativeEvent as SubmitEvent).submitter;
		if (submitter && submitter.getAttribute('type') !== 'submit') return;
		setSaving(true);

		try {
			let updatePayload = {
				name,
				role: discordRoleId || null,
				sync,
				permissions: localPermissions,
			};

			if (sync && discordRoleId) {
				const matchedDiscordRole = discordRoles.find((d) => d.id === discordRoleId);
				if (matchedDiscordRole) {
					updatePayload.name = matchedDiscordRole.name;
					setName(matchedDiscordRole.name);
				}
			}

			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/roles/${role.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatePayload),
			});

			if (res.ok) {
				const updated = await res.json();
				onRoleUpdated(updated);
			}
		} catch (err) {
			console.error('Failed to update role:', err);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/roles/${role.id}`), {
				method: 'DELETE',
			});

			if (res.ok) {
				onRoleDeleted(role.id);
			}
		} catch (err) {
			console.error('Failed to delete role:', err);
		} finally {
			setDeleting(false);
			setConfirmDeleteOpen(false);
		}
	};

	const discordRoleOptions = [
		{ value: '', label: t('admin.roles.noneUnlinked') },
		...discordRoles.map((dRole) => ({
			value: dRole.id,
			label: <span style={{ color: dRole.color ? `#${dRole.color.toString(16)}` : 'inherit' }}>{dRole.name}</span>,
		})),
	];

	const linkedDiscordRole = discordRoles.find((d) => d.id === role.role);

	return (
		<>
			<motion.div
				layout
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm overflow-hidden transition-all duration-200"
			>
				{/* Main Header / Summary Card */}
				<div
					onClick={() => setIsExpanded(!isExpanded)}
					className="flex items-center justify-between cursor-pointer hover:bg-(--border)/5 transition-colors"
					style={{ padding: 'calc(var(--ui-gap) * 0.75)' }}
				>
					<div className="flex items-center" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/10 shrink-0 text-(--accent)">
							<Shield size={24} />
						</div>
						<div className="flex flex-col overflow-hidden">
							<h2 className="font-bold text-base text-(--text) truncate">{role.name || t('admin.roles.unnamedRole')}</h2>
							<div className="flex items-center gap-2 mt-0.5">
								{linkedDiscordRole ? (
									<span
										className="text-xs px-2 py-0.5 rounded-full bg-(--border)/10 font-medium truncate"
										style={{ color: linkedDiscordRole.color ? `#${linkedDiscordRole.color.toString(16)}` : 'inherit' }}
									>
										{linkedDiscordRole.name}
									</span>
								) : (
									<span className="text-xs text-(--text-muted)">{t('admin.roles.unlinked')}</span>
								)}
								{role.sync && <span className="text-[10px] px-1.5 py-0.5 rounded bg-(--accent)/20 text-(--accent) font-semibold uppercase">{t('admin.roles.synced')}</span>}
							</div>
							<span className="text-[10px] text-(--text-muted)/60 font-mono mt-1">
								{t('admin.roles.uuid')} {role.id}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
							<ChevronDown size={18} className="text-(--text-muted)" />
						</motion.div>
					</div>
				</div>

				{/* Expanded Content: Role Management Form */}
				<AnimatePresence>
					{isExpanded && (
						<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
							<div className="border-t border-(--border)/10 bg-(--background)/50 flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
								<form onSubmit={handleUpdate} className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
									<h3 className="text-sm font-bold text-(--text)">{t('admin.roles.manageConfig')}</h3>

									<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
										<label className="block text-xs font-medium text-(--text)">{t('admin.roles.roleNameLabel')}</label>
										<input
											type="text"
											value={name}
											disabled={sync}
											onChange={(e) => setName(e.target.value)}
											className={`w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent) ${
												sync ? 'opacity-60 cursor-not-allowed' : ''
											}`}
											style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
											required
										/>
									</div>

									<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
										<label className="block text-xs font-medium text-(--text)">{t('admin.roles.linkDiscordRoleLabel')}</label>
										<Selector
											value={discordRoleId}
											options={discordRoleOptions}
											onChange={(val: string) => {
												setDiscordRoleId(val);
												if (sync) {
													const matched = discordRoles.find((d) => d.id === val);
													if (matched) setName(matched.name);
												}
											}}
											placeholder={t('admin.roles.selectDiscordRolePlaceholder')}
										/>
									</div>

									<div className="flex items-center justify-between pt-1">
										<span className="text-xs font-medium text-(--text)">{t('admin.roles.syncNameWithDiscord')}</span>
										<Toggle
											checked={sync}
											onChange={(e) => {
												const isChecked = e.target.checked;
												setSync(isChecked);
												if (isChecked && discordRoleId) {
													const matched = discordRoles.find((d) => d.id === discordRoleId);
													if (matched) setName(matched.name);
												}
											}}
											size="sm"
										/>
									</div>

									{/* Permission Matrix */}
									<div className="flex flex-col pt-2" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
										<h4 className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('admin.roles.permissionsHeader')}</h4>
										<div
											className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--background) overflow-hidden"
											style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
										>
											{permissions.map((perm) => (
												<div key={perm.key} className="flex items-center justify-between">
													<div className="flex flex-col">
														<span className="text-xs font-semibold text-(--text)">{perm.label}</span>
														<span className="text-[11px] text-(--text-muted)">{perm.description}</span>
													</div>
													<Toggle
														checked={localPermissions[perm.key] ?? perm.defaultValue}
														onChange={(e) => {
															const isChecked = e.target.checked;
															setLocalPermissions((prev) => ({
																...prev,
																[perm.key]: isChecked,
															}));
														}}
														size="sm"
													/>
												</div>
											))}
										</div>
									</div>

									<div className="flex items-center justify-between pt-2">
										<button
											type="button"
											onClick={() => setConfirmDeleteOpen(true)}
											className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors"
										>
											<Trash2 size={14} />
											{t('admin.roles.deleteRole')}
										</button>
										<Button type="submit" disabled={saving}>
											{saving ? t('admin.roles.saving') : t('admin.roles.saveChanges')}
										</Button>
									</div>
								</form>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			<Confirm
				open={confirmDeleteOpen}
				onOpenChange={setConfirmDeleteOpen}
				title={t('admin.roles.deleteRole')}
				description={t('admin.roles.deleteConfirmDescription', { name: role.name || t('admin.roles.unnamedRole') })}
				confirmText={t('admin.roles.confirmDelete')}
				cancelText={t('admin.roles.cancel')}
				onConfirm={handleDelete}
				loading={deleting}
			/>
		</>
	);
}

export default function Roles() {
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();

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

	const guildId = '687429190165069838';

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const [rolesRes, guildRes, discordRolesRes] = await Promise.all([
					fetch(getEnvUrl('https://api.xernerx.com/secure/roles')),
					fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${guildId}/discord`)),
					fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${guildId}/discord/roles`)),
				]);

				if (rolesRes.ok) setRoles(await rolesRes.json());
				if (guildRes.ok) setGuild(await guildRes.json());
				if (discordRolesRes.ok) setDiscordRoles(await discordRolesRes.json());
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

			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/roles'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: newId,
					name: roleName,
					role: newDiscordRoleId || undefined,
					sync: newSync,
					permissions: newPermissions,
				}),
			});

			if (res.ok) {
				const created = await res.json();
				setRoles((prev) => [...prev, created]);
				setIsCreateOpen(false);
				setNewName('');
				setNewDiscordRoleId('');
				setNewSync(false);
				const resetPerms: Record<string, boolean> = {};
				permissions.forEach((p) => {
					resetPerms[p.key] = p.defaultValue;
				});
				setNewPermissions(resetPerms);
			}
		} catch (err) {
			console.error('Failed to create role:', err);
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

	const filteredRoles = useMemo(() => {
		return roles.filter((r) => r.name?.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()) || r.role?.toLowerCase().includes(search.toLowerCase()));
	}, [roles, search]);

	const discordRoleOptions = [
		{ value: '', label: t('admin.roles.noneUnlinked') },
		...discordRoles.map((dRole) => ({
			value: dRole.id,
			label: <span style={{ color: dRole.color ? `#${dRole.color.toString(16)}` : 'inherit' }}>{dRole.name}</span>,
		})),
	];

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
				<div className="flex items-center gap-4 rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm" style={{ padding: 'var(--ui-gap)' }}>
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
			<div className="flex flex-col sm:flex-row items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col">
					<h1 className="text-3xl font-black tracking-tight text-(--text)">{t('admin.roles.title')}</h1>
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
					style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}
				>
					<Plus size={16} />
					<span>{t('admin.roles.newRoleButton')}</span>
				</Button>
			</div>

			{/* Controls Bar: Search */}
			<div className="relative w-full">
				<Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)" />
				<input
					type="text"
					placeholder={t('admin.roles.searchPlaceholder')}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
					style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap) calc(var(--ui-gap) * 0.6) calc(var(--ui-gap) * 2.5)' }}
				/>
			</div>

			{/* Roles Grid (3 Columns) */}
			{filteredRoles.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.roles.noRolesFound')}</p>
				</div>
			) : (
				<motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
					<AnimatePresence>
						{filteredRoles.map((role) => (
							<RoleCard key={role.id} role={role} discordRoles={discordRoles} getEnvUrl={getEnvUrl} onRoleDeleted={handleRoleDeleted} onRoleUpdated={handleRoleUpdated} />
						))}
					</AnimatePresence>
				</motion.div>
			)}

			{/* Create Modal */}
			<Modal open={isCreateOpen} onOpenChange={setIsCreateOpen} title={t('admin.roles.createModalTitle')} description={t('admin.roles.createModalDesc')}>
				<form onSubmit={handleCreate} className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-xs font-medium text-(--text)">{t('admin.roles.roleNameLabel')}</label>
						<input
							type="text"
							placeholder={t('admin.roles.roleNamePlaceholder')}
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
							style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
							required
						/>
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-xs font-medium text-(--text)">{t('admin.roles.linkDiscordRoleLabel')}</label>
						<Selector
							value={newDiscordRoleId}
							options={discordRoleOptions}
							onChange={(val: string) => {
								setNewDiscordRoleId(val);
								if (newSync) {
									const matched = discordRoles.find((d) => d.id === val);
									if (matched) setNewName(matched.name);
								}
							}}
							placeholder={t('admin.roles.selectDiscordRolePlaceholder')}
						/>
					</div>
					<div className="flex items-center justify-between pt-1">
						<span className="text-xs font-medium text-(--text)">{t('admin.roles.syncNameWithDiscord')}</span>
						<Toggle
							checked={newSync}
							onChange={(e) => {
								const isChecked = e.target.checked;
								setNewSync(isChecked);
								if (isChecked && newDiscordRoleId) {
									const matched = discordRoles.find((d) => d.id === newDiscordRoleId);
									if (matched) setNewName(matched.name);
								}
							}}
							size="sm"
						/>
					</div>

					{/* Create Permission Matrix */}
					<div className="flex flex-col pt-2" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<h4 className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('admin.roles.permissionsHeader')}</h4>
						<div className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--foreground) overflow-hidden" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
							{permissions.map((perm) => (
								<div key={perm.key} className="flex items-center justify-between">
									<div className="flex flex-col">
										<span className="text-xs font-semibold text-(--text)">{perm.label}</span>
										<span className="text-[11px] text-(--text-muted)">{perm.description}</span>
									</div>
									<Toggle
										checked={newPermissions[perm.key] ?? perm.defaultValue}
										onChange={(e) => {
											const isChecked = e.target.checked;
											setNewPermissions((prev) => ({
												...prev,
												[perm.key]: isChecked,
											}));
										}}
										size="sm"
									/>
								</div>
							))}
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
							{t('admin.roles.cancel')}
						</Button>
						<Button type="submit" variant="primary" disabled={creating}>
							{creating ? t('admin.roles.creating') : t('admin.roles.createButton')}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
