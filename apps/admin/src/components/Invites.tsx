/** @format */
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { getEnabledInviteOptions, normalizeInviteOptions, safeParsePermBigInt, type InviteOptionsConfig } from '@xernerx/lib';
import { useEnvironment, useDictionary, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Confirm, Input } from '@xernerx/ui';
import { Link, Plus, Trash2, Edit2, Copy, Check, ExternalLink, Download, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InviteModal from './invites/InviteModal';

interface AppInvite {
	id: string; // URL Slug
	clientId: string;
	name: string;
	permissions: string;
	scopes: string[];
	redirect?: boolean;
	options?: InviteOptionsConfig;
	botName?: string;
	botAvatar?: string | null;
	createdAt?: string;
	updatedAt?: string;
}

export default function Invites({ initialSearch = '' }: { initialSearch?: string }) {
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { toast } = useToast();

	const [invites, setInvites] = useState<AppInvite[]>([]);
	const [availableBots, setAvailableBots] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState(initialSearch);
	const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

	useEffect(() => {
		if (initialSearch !== undefined) setSearch(initialSearch);
	}, [initialSearch]);

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

	const [editId, setEditId] = useState<string | null>(null);
	const [newId, setNewId] = useState('');
	const [newClientId, setNewClientId] = useState('');
	const [newName, setNewName] = useState('');
	const [newScopes, setNewScopes] = useState<string[]>(['bot', 'applications.commands']);
	const [newRedirect, setNewRedirect] = useState<boolean>(false);

	const [essentialEnabled, setEssentialEnabled] = useState<boolean>(true);
	const [essentialPermissions, setEssentialPermissions] = useState<bigint>(BigInt(0));
	const [optionalEnabled, setOptionalEnabled] = useState<boolean>(false);
	const [optionalPermissions, setOptionalPermissions] = useState<bigint>(BigInt(0));
	const [advancedEnabled, setAdvancedEnabled] = useState<boolean>(false);

	const fetchInvites = async (isManual = false) => {
		if (isManual) setRefreshing(true);
		else setLoading(true);
		try {
			const [res, botsRes] = await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/secure/invites'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/bots?all=true&limit=200'), { credentials: 'include' }).catch(() => null),
			]);
			if (res.ok) {
				const data = await res.json();
				setInvites(Array.isArray(data) ? data : []);
			}
			if (botsRes?.ok) {
				const botsData = await botsRes.json();
				setAvailableBots(Array.isArray(botsData) ? botsData : []);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		if (!isReady) return;
		fetchInvites();
	}, [isReady]);

	const openCreateModal = () => {
		setEditId(null);
		setNewId('');
		setNewClientId('');
		setNewName('');
		setNewScopes(['bot', 'applications.commands']);
		setNewRedirect(false);
		setEssentialEnabled(true);
		setEssentialPermissions(BigInt(0));
		setOptionalEnabled(false);
		setOptionalPermissions(BigInt(0));
		setAdvancedEnabled(false);
		setIsCreateOpen(true);
	};

	const openEditModal = (invite: AppInvite) => {
		const norm = normalizeInviteOptions(invite);
		setEditId(invite.id);
		setNewId(invite.id);
		setNewClientId(invite.clientId);
		setNewName(invite.name);
		setNewScopes(Array.isArray(invite.scopes) && invite.scopes.length > 0 ? invite.scopes : ['bot', 'applications.commands']);
		setNewRedirect(Boolean(invite.redirect));
		setEssentialEnabled(norm.essential.enabled);
		setEssentialPermissions(safeParsePermBigInt(norm.essential.permissions));
		setOptionalEnabled(norm.optional.enabled);
		setOptionalPermissions(safeParsePermBigInt(norm.optional.permissions));
		setAdvancedEnabled(norm.advanced.enabled);
		setIsCreateOpen(true);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setCreating(true);

		const effectiveOptional = essentialEnabled ? essentialPermissions | optionalPermissions : optionalPermissions;
		const options: InviteOptionsConfig = {
			essential: {
				enabled: essentialEnabled,
				permissions: essentialPermissions.toString(),
			},
			optional: {
				enabled: optionalEnabled,
				permissions: effectiveOptional.toString(),
			},
			advanced: {
				enabled: advancedEnabled,
				permissions: '0',
			},
		};
		const primaryPerms = essentialEnabled ? essentialPermissions.toString() : optionalEnabled ? effectiveOptional.toString() : '0';

		const payload = {
			id: newId,
			clientId: newClientId,
			name: newName,
			permissions: primaryPerms,
			scopes: newScopes.map((s) => s.trim()).filter(Boolean),
			redirect: newRedirect,
			options,
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
			toast({ type: 'error', title: t('admin.dashboard.invites.toasts.saveFailed'), description: err.message });
		} finally {
			setCreating(false);
		}
	};

	const handleDelete = (id: string) => {
		setDeleteConfirmId(id);
	};

	const confirmDelete = async () => {
		if (!deleteConfirmId) return;
		const id = deleteConfirmId;
		setDeleteConfirmId(null);
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

	const filteredInvites = useMemo(() => {
		return invites.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase()));
	}, [invites, search]);

	const exportInvites = (format: 'csv' | 'json') => {
		if (filteredInvites.length === 0) return;
		if (format === 'json') {
			const blob = new Blob([JSON.stringify(filteredInvites, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `xernerx-invites-${new Date().toISOString().slice(0, 10)}.json`;
			a.click();
			URL.revokeObjectURL(url);
			return;
		}
		const headers = ['id', 'name', 'clientId', 'permissions', 'scopes', 'redirect', 'enabledOptions'];
		const rows = filteredInvites.map((inv) => {
			const enabledKeys = getEnabledInviteOptions(inv)
				.map((o) => o.key)
				.join(';');
			return [inv.id, (inv.name || '').replace(/"/g, '""'), inv.clientId || '', inv.permissions || '', (inv.scopes || []).join(';'), String(Boolean(inv.redirect)), enabledKeys]
				.map((cell) => `"${cell}"`)
				.join(',');
		});
		const csvContent = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `xernerx-invites-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col w-full" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col">
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.dashboard.invites.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.invites.subtitle')}</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" size="sm" onClick={() => exportInvites('csv')} disabled={filteredInvites.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.dashboard.invites.exportCsv')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => exportInvites('json')} disabled={filteredInvites.length === 0} className="flex items-center gap-1.5">
						<Download size={14} />
						{t('admin.dashboard.invites.exportJson')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => fetchInvites(true)} disabled={refreshing} className="flex items-center gap-1.5">
						<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
						{t('admin.dashboard.invites.refresh')}
					</Button>
					<Button variant="primary" onClick={openCreateModal} style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Plus size={16} />
						<span>{t('admin.dashboard.invites.createButton')}</span>
					</Button>
				</div>
			</div>

			<Input variant="search" shortcut={true} placeholder={t('admin.dashboard.invites.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />

			{filteredInvites.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.invites.noInvites')}</p>
				</div>
			) : (
				<motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
					<AnimatePresence>
						{filteredInvites.map((invite) => {
							const enabledOpts = getEnabledInviteOptions(invite);
							return (
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
										<div className="flex items-center gap-4 min-w-0">
											{invite.botAvatar ? (
												<Image
													src={invite.botAvatar}
													alt={invite.botName || invite.name}
													width={48}
													height={48}
													unoptimized
													className="w-12 h-12 rounded-2xl shadow-sm shrink-0"
												/>
											) : (
												<div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-(--accent)/10 text-(--accent) shrink-0">
													<Link size={20} />
												</div>
											)}
											<div className="flex flex-col min-w-0">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="font-bold text-(--text) truncate">{invite.botName || invite.name}</span>
													{invite.redirect && (
														<span className="rounded-full bg-(--accent)/10 border border-(--accent)/30 px-2 py-0.5 text-[10px] font-semibold text-(--accent)">
															{t('admin.dashboard.invites.redirectBadge')}
														</span>
													)}
												</div>
												<span className="text-xs text-(--text-muted) truncate">/invites/{invite.id}</span>
											</div>
										</div>
										<div className="flex items-center gap-1 shrink-0">
											<button
												type="button"
												onClick={() => {
													const url = `${getEnvUrl('https://www.xernerx.com')}/invites/${invite.id}`;
													navigator.clipboard.writeText(url);
													setCopiedSlug(invite.id);
													toast({ type: 'success', title: t('admin.dashboard.invites.inviteUrlCopied') });
													setTimeout(() => setCopiedSlug((prev) => (prev === invite.id ? null : prev)), 2000);
												}}
												title={t('admin.dashboard.invites.copyInviteUrl')}
												aria-label={t('admin.dashboard.invites.copyInviteUrl')}
												className="p-2 rounded-2xl text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) transition-colors cursor-pointer"
											>
												{copiedSlug === invite.id ? <Check size={16} className="text-(--accent-green)" /> : <Copy size={16} />}
											</button>
											<a
												href={`${getEnvUrl('https://www.xernerx.com')}/invites/${invite.id}`}
												target="_blank"
												rel="noopener noreferrer"
												aria-label={t('admin.dashboard.invites.openInvite')}
												title={t('admin.dashboard.invites.openInvite')}
												className="p-2 rounded-2xl text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) transition-colors"
											>
												<ExternalLink size={16} />
											</a>
											<button
												type="button"
												onClick={() => openEditModal(invite)}
												aria-label={t('common.edit')}
												className="p-2 rounded-2xl text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) transition-colors cursor-pointer"
											>
												<Edit2 size={16} />
											</button>
											<button
												type="button"
												onClick={() => handleDelete(invite.id)}
												aria-label={t('common.delete')}
												className="p-2 rounded-2xl text-(--text-muted) hover:text-(--accent-red) hover:bg-(--accent-red)/10 transition-colors cursor-pointer"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>

									<div className="flex flex-wrap items-center justify-between gap-2">
										<div className="flex flex-wrap items-center gap-1.5">
											{enabledOpts.map((opt) => (
												<span
													key={opt.key}
													className="rounded-full bg-(--accent)/10 border border-(--accent)/30 px-2.5 py-0.5 text-[10px] font-semibold text-(--accent) capitalize"
												>
													{opt.key} ({opt.permissionCount})
												</span>
											))}
										</div>
										<span className="text-[10px] font-mono text-(--text-muted)">
											{enabledOpts.length === 1
												? t('admin.dashboard.invites.singleUrlBehaviorPill')
												: t('admin.dashboard.invites.multiUrlBehaviorPill', { count: enabledOpts.length })}
										</span>
									</div>

									<div className="bg-(--background)/50 rounded-2xl p-3 border border-(--border)/10 text-xs font-mono text-(--text-muted) truncate">
										{t('admin.dashboard.invites.perms')} {invite.permissions}
									</div>
								</motion.div>
							);
						})}
					</AnimatePresence>
				</motion.div>
			)}

			<InviteModal
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				editId={editId}
				newId={newId}
				setNewId={setNewId}
				newClientId={newClientId}
				setNewClientId={setNewClientId}
				newName={newName}
				setNewName={setNewName}
				newScopes={newScopes}
				setNewScopes={setNewScopes}
				newRedirect={newRedirect}
				setNewRedirect={setNewRedirect}
				essentialEnabled={essentialEnabled}
				setEssentialEnabled={setEssentialEnabled}
				essentialPermissions={essentialPermissions}
				setEssentialPermissions={setEssentialPermissions}
				optionalEnabled={optionalEnabled}
				setOptionalEnabled={setOptionalEnabled}
				optionalPermissions={optionalPermissions}
				setOptionalPermissions={setOptionalPermissions}
				advancedEnabled={advancedEnabled}
				setAdvancedEnabled={setAdvancedEnabled}
				availableBots={availableBots}
				creating={creating}
				onSave={handleSave}
			/>

			<Confirm
				open={Boolean(deleteConfirmId)}
				onOpenChange={(open) => !open && setDeleteConfirmId(null)}
				title={t('common.buttons.delete')}
				description={t('admin.dashboard.invites.toasts.deleteConfirm')}
				confirmKeyword={deleteConfirmId || undefined}
				confirmText={t('common.buttons.delete')}
				cancelText={t('common.buttons.cancel')}
				onConfirm={confirmDelete}
				variant="danger"
			/>
		</div>
	);
}
