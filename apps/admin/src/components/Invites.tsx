// Force recompile
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useEnvironment, useDictionary, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Modal, Button, Input, Toggle } from '@xernerx/ui';
import { Link, Plus, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PermissionFlagsBits } from 'discord-api-types/v10';

interface AppInvite {
	id: string; // URL Slug
	clientId: string;
	name: string;
	permissions: string;
	scopes: string[];
	botName?: string;
	botAvatar?: string | null;
	createdAt?: string;
	updatedAt?: string;
}

export default function Invites() {
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { toast } = useToast();

	const [invites, setInvites] = useState<AppInvite[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [creating, setCreating] = useState(false);

	const [editId, setEditId] = useState<string | null>(null);
	const [newId, setNewId] = useState('');
	const [newClientId, setNewClientId] = useState('');
	const [newName, setNewName] = useState('');
	const [newScopes, setNewScopes] = useState('bot, applications.commands');
	const [selectedPermissions, setSelectedPermissions] = useState<bigint>(BigInt(0));

	useEffect(() => {
		if (!isReady) return;
		fetchInvites();
	}, [isReady]);

	const fetchInvites = async () => {
		setLoading(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/invites'), { credentials: 'include' });
			if (res.ok) {
				setInvites(await res.json());
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const openCreateModal = () => {
		setEditId(null);
		setNewId('');
		setNewClientId('');
		setNewName('');
		setNewScopes('bot, applications.commands');
		setSelectedPermissions(BigInt(0));
		setIsCreateOpen(true);
	};

	const openEditModal = (invite: AppInvite) => {
		setEditId(invite.id);
		setNewId(invite.id);
		setNewClientId(invite.clientId);
		setNewName(invite.name);
		setNewScopes(invite.scopes.join(', '));
		setSelectedPermissions(BigInt(invite.permissions));
		setIsCreateOpen(true);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setCreating(true);

		const payload = {
			id: newId,
			clientId: newClientId,
			name: newName,
			permissions: selectedPermissions.toString(),
			scopes: newScopes
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
		};

		try {
			const url = editId ? getEnvUrl(`https://api.xernerx.com/secure/invites/${editId}`) : getEnvUrl('https://api.xernerx.com/secure/invites');

			const res = await fetch(url, {
				method: editId ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				const saved = await res.json();
				if (editId) {
					setInvites((prev) => prev.map((i) => (i.id === editId ? saved : i)));
					toast({ type: 'success', title: t('admin.dashboard.invites.toasts.updateSuccess') });
				} else {
					setInvites((prev) => [saved, ...prev]);
					toast({ type: 'success', title: t('admin.dashboard.invites.toasts.createSuccess') });
				}
				setIsCreateOpen(false);
			} else {
				throw new Error('Failed to save');
			}
		} catch (err: any) {
			toast({ type: 'error', title: 'Error', description: err.message });
		} finally {
			setCreating(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm(t('admin.dashboard.invites.toasts.deleteConfirm'))) return;
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/invites/${id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				setInvites((prev) => prev.filter((i) => i.id !== id));
				toast({ type: 'success', title: t('admin.dashboard.invites.toasts.deleteSuccess') });
			}
		} catch (error) {
			toast({ type: 'error', title: t('admin.dashboard.invites.toasts.deleteFailed') });
		}
	};

	const togglePermission = (bit: bigint) => {
		setSelectedPermissions((prev) => ((prev & bit) === bit ? prev & ~bit : prev | bit));
	};

	const filteredInvites = useMemo(() => {
		return invites.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase()));
	}, [invites, search]);

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col w-full" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col">
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						Application Invites
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.invites.subtitle')}</p>
				</div>
				<Button variant="primary" onClick={openCreateModal} style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<Plus size={16} />
					<span>Create Invite</span>
				</Button>
			</div>

			<Input variant="search" placeholder={t('admin.dashboard.invites.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />

			{filteredInvites.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.invites.noInvites')}</p>
				</div>
			) : (
				<motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
					<AnimatePresence>
						{filteredInvites.map((invite) => (
							<motion.div
								key={invite.id}
								layout
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
								className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-6 relative group"
								style={{ gap: 'var(--ui-gap)' }}
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										{invite.botAvatar ? (
											<img src={invite.botAvatar} alt={invite.botName || invite.name} className="w-12 h-12 rounded-2xl shadow-sm" />
										) : (
											<div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-(--accent)/10 text-(--accent)">
												<Link size={20} />
											</div>
										)}
										<div className="flex flex-col">
											<span className="font-bold text-(--text)">{invite.botName || invite.name}</span>
											<span className="text-xs text-(--text-muted)">/invites/{invite.id}</span>
										</div>
									</div>
									<div className="flex gap-2">
										<button onClick={() => openEditModal(invite)} className="p-2 rounded-xl text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) transition-colors">
											<Edit2 size={16} />
										</button>
										<button onClick={() => handleDelete(invite.id)} className="p-2 rounded-xl text-(--text-muted) hover:text-red-500 hover:bg-red-500/10 transition-colors">
											<Trash2 size={16} />
										</button>
									</div>
								</div>

								<div className="bg-(--background) rounded-xl p-3 border border-(--border)/5 text-xs font-mono text-(--text-muted) truncate">
									{t('admin.dashboard.invites.perms')} {invite.permissions}
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</motion.div>
			)}

			<Modal
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				title={editId ? t('admin.dashboard.invites.editModalTitle') : t('admin.dashboard.invites.createModalTitle')}
				description={t('admin.dashboard.invites.modalDesc')}
				maxWidth="max-w-4xl"
			>
				<form onSubmit={handleSave} className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-2">
							<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.invites.urlSlug')}</label>
							<input
								type="text"
								value={newId}
								onChange={(e) => setNewId(e.target.value)}
								required
								className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground)/30 p-3 text-sm focus:ring-2 focus:ring-(--accent)"
								placeholder={t('admin.dashboard.invites.placeholderTodo') || 'e.g. todo'}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.invites.appName')}</label>
							<input
								type="text"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								required
								className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground)/30 p-3 text-sm focus:ring-2 focus:ring-(--accent)"
								placeholder={t('admin.dashboard.invites.placeholderAppName') || 'e.g. To-Do List Bot'}
							/>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.invites.clientId')}</label>
						<input
							type="text"
							value={newClientId}
							onChange={(e) => setNewClientId(e.target.value)}
							required
							className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground)/30 p-3 text-sm focus:ring-2 focus:ring-(--accent)"
							placeholder={t('admin.dashboard.invites.placeholderClientId') || 'Discord Client ID'}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.invites.scopes')}</label>
						<input
							type="text"
							value={newScopes}
							onChange={(e) => setNewScopes(e.target.value)}
							required
							className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground)/30 p-3 text-sm focus:ring-2 focus:ring-(--accent)"
						/>
					</div>

					<div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-2 rounded-xl bg-(--foreground)/10 border border-(--border)/10 p-4">
						<label className="text-xs font-medium text-(--text) sticky top-0 py-1 z-10 mb-2 border-b border-(--border)/10 pb-2">{t('admin.dashboard.invites.permMatrix')}</label>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
							{Object.entries(PermissionFlagsBits).map(([key, bit]) => {
								const b = BigInt(bit as bigint);
								return (
									<label
										key={key}
										className="flex items-center justify-between gap-2 text-[11px] text-(--text-muted) cursor-pointer p-2 hover:bg-(--foreground)/50 rounded-xl transition-colors border border-transparent hover:border-(--border)/10"
									>
										<span className="truncate flex-1">{key}</span>
										<Toggle checked={(selectedPermissions & b) === b} onChange={() => togglePermission(b)} size="sm" />
									</label>
								);
							})}
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-4 border-t border-(--border)/10 mt-2">
						<Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
							{t('admin.dashboard.invites.cancel')}
						</Button>
						<Button type="submit" variant="primary" disabled={creating}>
							{creating ? t('admin.dashboard.invites.saving') : t('admin.dashboard.invites.saveButton')}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
