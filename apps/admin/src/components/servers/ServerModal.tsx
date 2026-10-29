/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, ExternalLink, ScrollText, Server as ServerIcon, ThumbsUp, Trash2, Users } from 'lucide-react';
import { Button, Confirm, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { AdminServerSummary } from './types';

interface ServerModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	server: AdminServerSummary;
	getEnvUrl: (url: string) => string;
	onServerDeleted: (id: string) => void;
	onServerUpdated: (updated: AdminServerSummary) => void;
	onViewAuditLogs?: (serverId: string) => void;
}

export function ServerModal({ open, onOpenChange, server, getEnvUrl, onServerDeleted, onServerUpdated, onViewAuditLogs }: ServerModalProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const [loadingDetails, setLoadingDetails] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	const [name, setName] = useState(server.name || '');
	const [vanitySlug, setVanitySlug] = useState(server.vanitySlug || '');
	const [privacy, setPrivacy] = useState<string>(server.privacy || 'private');
	const [description, setDescription] = useState(server.description || '');
	const [owner, setOwner] = useState(server.owner || '');
	const [organization, setOrganization] = useState(server.organization || '');
	const [verified, setVerified] = useState(Boolean(server.verified));
	const [vanityUnlocked, setVanityUnlocked] = useState(Boolean(server.vanityUnlocked || server.vanitySlug || server.verified));
	const [widgets, setWidgets] = useState(Boolean(server.widgets));

	useEffect(() => {
		if (!open) return;
		setLoadingDetails(true);
		fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${server.id}`), {
			credentials: 'include',
			cache: 'no-store',
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data) {
					setName(data.name || server.name || '');
					setVanitySlug(data.vanitySlug || '');
					setPrivacy(data.privacy || 'private');
					setDescription(data.description || '');
					setOwner(data.owner || '');
					setOrganization(data.organization || '');
					setVerified(Boolean(data.verified));
					setVanityUnlocked(Boolean(data.vanityUnlocked || data.vanitySlug || data.verified));
					setWidgets(Boolean(data.widgets));
				}
			})
			.catch(() => {})
			.finally(() => setLoadingDetails(false));
	}, [open, server.id, server.name, getEnvUrl]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${server.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					name: name.trim(),
					vanitySlug: vanitySlug.trim().toLowerCase(),
					privacy,
					description,
					owner: owner.trim() || null,
					organization: organization.trim() || null,
					verified,
					vanityUnlocked,
					widgets,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error || t('admin.servers.toast.updateError'));
			}

			const updated: AdminServerSummary = {
				...server,
				...data,
				name: name.trim(),
				vanitySlug: data.vanitySlug ?? vanitySlug.trim().toLowerCase(),
				privacy,
				description,
				owner: owner.trim() || null,
				organization: organization.trim() || null,
				verified,
				vanityUnlocked,
				widgets,
			};
			onServerUpdated(updated);
			toast({ type: 'success', title: t('admin.servers.toast.updateSuccess') });
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('admin.servers.toast.updateError') });
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${server.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error(t('admin.servers.toast.deleteError'));
			onServerDeleted(server.id);
			toast({ type: 'success', title: t('admin.servers.toast.deleteSuccess') });
			onOpenChange(false);
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('admin.servers.toast.deleteError') });
		} finally {
			setDeleting(false);
			setConfirmDeleteOpen(false);
		}
	};

	const iconUrl = server.icon
		? String(server.icon).startsWith('http')
			? String(server.icon)
			: `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.${String(server.icon).startsWith('a_') ? 'gif' : 'png'}`
		: null;
	const displayName = name || server.name || t('common.unknownServer');

	return (
		<>
			<Modal open={open} onOpenChange={onOpenChange} title={t('admin.servers.manageServer')} description={t('admin.servers.manageServerDesc', { name: displayName })} maxWidth="max-w-4xl">
				{loadingDetails ? (
					<div className="flex justify-center py-8">
						<Loading variant="small" />
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 1.25)' }}>
						{/* Left Preview Card */}
						<div className="flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--background)/50 p-5" style={{ gap: 'var(--ui-gap)' }}>
							<div className="flex flex-col items-center text-center gap-3">
								{iconUrl ? (
									<Image src={iconUrl} alt={displayName} width={72} height={72} className="h-18 w-18 rounded-2xl border border-(--border)/10 object-cover" unoptimized />
								) : (
									<div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-(--border)/15 text-(--text-muted)">
										<ServerIcon size={30} />
									</div>
								)}
								<div>
									<div className="flex items-center justify-center gap-1.5">
										<h3 className="text-lg font-extrabold text-(--text)">{displayName}</h3>
										{verified && <CheckCircle2 size={16} className="text-(--accent-green)" />}
									</div>
									<p className="text-xs font-mono text-(--text-muted) mt-0.5">{server.id}</p>
								</div>

								<div className="grid grid-cols-2 gap-2 w-full pt-2">
									<div className="flex flex-col items-center p-2.5 rounded-2xl bg-(--foreground)/40 border border-(--border)/10">
										<span className="text-[11px] text-(--text-muted) flex items-center gap-1">
											<Users size={11} className="text-(--accent)" /> {t('admin.servers.membersStat')}
										</span>
										<span className="text-sm font-extrabold text-(--text)">{(server.memberCount ?? 0).toLocaleString()}</span>
									</div>
									<div className="flex flex-col items-center p-2.5 rounded-2xl bg-(--foreground)/40 border border-(--border)/10">
										<span className="text-[11px] text-(--text-muted) flex items-center gap-1">
											<ThumbsUp size={11} className="text-(--accent)" /> {t('admin.bots.votesStat')}
										</span>
										<span className="text-sm font-extrabold text-(--text)">{(server.voteCount ?? 0).toLocaleString()}</span>
									</div>
								</div>
							</div>

							<div className="flex flex-col gap-2 pt-3 border-t border-(--border)/10">
								<a
									href={`${getEnvUrl('https://app.xernerx.com')}/servers/${vanitySlug || server.id}`}
									target="_blank"
									rel="noopener noreferrer"
									className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-(--foreground)/50 hover:bg-(--accent)/15 border border-(--border)/10 px-3 py-2 text-xs font-bold text-(--text) hover:text-(--accent) transition-colors"
								>
									<ExternalLink size={13} />
									<span>{t('admin.servers.openProfile')}</span>
								</a>
								{onViewAuditLogs && (
									<Button
										variant="secondary"
										size="sm"
										onClick={() => {
											onOpenChange(false);
											onViewAuditLogs(server.id);
										}}
										className="w-full justify-center gap-1.5"
									>
										<ScrollText size={13} />
										<span>{t('admin.users.viewAuditLogs')}</span>
									</Button>
								)}
							</div>
						</div>

						{/* Right Form */}
						<form onSubmit={handleSave} className="col-span-1 md:col-span-2 flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
							<div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-semibold text-(--text)">{t('admin.users.displayNameLabel')}</label>
									<Input value={name} onChange={(e) => setName(e.target.value)} placeholder={displayName} />
								</div>
								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-semibold text-(--text)">{t('admin.bots.vanitySlugLabel')}</label>
									<Input value={vanitySlug} onChange={(e) => setVanitySlug(e.target.value)} placeholder="my-server" />
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-semibold text-(--text)">{t('admin.users.privacyLabel')}</label>
									<Selector
										value={privacy}
										onChange={(val: string) => setPrivacy(val)}
										options={[
											{ value: 'public', label: t('admin.bots.privacyPublic') },
											{ value: 'limited', label: t('admin.bots.privacyLimited') },
											{ value: 'private', label: t('admin.bots.privacyPrivate') },
										]}
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-semibold text-(--text)">{t('admin.servers.ownerLabel')}</label>
									<Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="482513687417061376" />
								</div>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text)">{t('admin.users.descriptionLabel')}</label>
								<Input variant="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
								<label className="flex items-center justify-between gap-2 cursor-pointer">
									<span className="text-xs font-bold text-(--text)">{t('admin.bots.verifiedToggle')}</span>
									<Toggle checked={verified} onChange={(e) => setVerified(e.target.checked)} />
								</label>
								<label className="flex items-center justify-between gap-2 cursor-pointer">
									<span className="text-xs font-bold text-(--text)">{t('admin.bots.vanityUnlockedToggle')}</span>
									<Toggle checked={vanityUnlocked} onChange={(e) => setVanityUnlocked(e.target.checked)} />
								</label>
								<label className="flex items-center justify-between gap-2 cursor-pointer">
									<span className="text-xs font-bold text-(--text)">{t('admin.bots.widgetsToggle')}</span>
									<Toggle checked={widgets} onChange={(e) => setWidgets(e.target.checked)} />
								</label>
							</div>

							<div className="flex items-center justify-between pt-3 border-t border-(--border)/10">
								<Button type="button" variant="danger" size="sm" onClick={() => setConfirmDeleteOpen(true)} className="flex items-center gap-1.5">
									<Trash2 size={14} />
									<span>{t('admin.servers.deleteServer')}</span>
								</Button>
								<div className="flex items-center gap-2">
									<Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
										{t('common.actions.cancel')}
									</Button>
									<Button type="submit" variant="primary" size="sm" loading={saving}>
										{t('common.actions.saveChanges')}
									</Button>
								</div>
							</div>
						</form>
					</div>
				)}
			</Modal>

			<Confirm
				open={confirmDeleteOpen}
				onOpenChange={setConfirmDeleteOpen}
				title={t('admin.servers.deleteConfirmTitle')}
				description={t('admin.servers.deleteConfirmDesc', { name: displayName })}
				confirmKeyword={server.id}
				confirmText={t('admin.servers.deleteServer')}
				variant="danger"
				loading={deleting}
				onConfirm={handleDelete}
			/>
		</>
	);
}
