/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Building2, CheckCircle2, Coins, ExternalLink, ScrollText, Trash2, Users } from 'lucide-react';
import { Button, Confirm, Input, Modal, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { AdminOrganizationSummary } from './types';

interface OrganizationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organization: AdminOrganizationSummary;
	getEnvUrl: (url: string) => string;
	onOrgDeleted: (id: string) => void;
	onOrgUpdated: (updated: AdminOrganizationSummary) => void;
	onViewAuditLogs?: (orgId: string) => void;
	onNavigateEntity?: (tab: string, query: string) => void;
}

export function OrganizationModal({ open, onOpenChange, organization, getEnvUrl, onOrgDeleted, onOrgUpdated, onViewAuditLogs, onNavigateEntity }: OrganizationModalProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const orgId = organization.id || String(organization._id || '');
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

	const [name, setName] = useState(organization.name || '');
	const [vanitySlug, setVanitySlug] = useState(organization.vanitySlug || '');
	const [privacy, setPrivacy] = useState<string>(organization.privacy || 'private');
	const [description, setDescription] = useState(organization.description || '');
	const [info, setInfo] = useState(organization.info || '');
	const [owner, setOwner] = useState(organization.owner || '');
	const [members, setMembers] = useState<string[]>(organization.members || []);
	const [verified, setVerified] = useState(Boolean(organization.verified));
	const [vanityUnlocked, setVanityUnlocked] = useState(Boolean(organization.vanityUnlocked || organization.vanitySlug || organization.verified));
	const [widgets, setWidgets] = useState(Boolean(organization.widgets));
	const [treasuryBalance, setTreasuryBalance] = useState<number>(organization.treasuryBalance ?? 0);

	useEffect(() => {
		if (!open) return;
		setLoadingDetails(true);
		Promise.all([
			fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${orgId}`), { credentials: 'include', cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
			fetch(getEnvUrl('https://api.xernerx.com/secure/users'), { credentials: 'include', cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
		])
			.then(([data, usersData]) => {
				if (Array.isArray(usersData)) {
					setUserOptions(
						usersData.map((u: any) => ({
							value: String(u.id),
							label: `${u.name || u.discord?.globalName || u.discord?.username || u.id} (${u.id})`,
						}))
					);
				}
				if (data) {
					setName(data.name || organization.name || '');
					setVanitySlug(data.vanitySlug || '');
					setPrivacy(data.privacy || 'private');
					setDescription(data.description || '');
					setInfo(data.info || '');
					setOwner(data.owner || '');
					setMembers(Array.isArray(data.members) ? data.members : []);
					setVerified(Boolean(data.verified));
					setVanityUnlocked(Boolean(data.vanityUnlocked || data.vanitySlug || data.verified));
					setWidgets(Boolean(data.widgets));
					setTreasuryBalance(Number(data.treasuryBalance ?? organization.treasuryBalance ?? 0));
				}
			})
			.catch(() => {})
			.finally(() => setLoadingDetails(false));
	}, [open, orgId, organization.name, organization.treasuryBalance, getEnvUrl]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${orgId}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					name: name.trim(),
					vanitySlug: vanitySlug.trim().toLowerCase(),
					privacy,
					description,
					info,
					owner: owner.trim(),
					members,
					verified,
					vanityUnlocked,
					widgets,
					treasuryBalance: Math.max(0, Number(treasuryBalance) || 0),
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error || t('admin.organizations.toast.updateError'));
			}

			const updated: AdminOrganizationSummary = {
				...organization,
				...data,
				id: orgId,
				name: name.trim(),
				vanitySlug: data.vanitySlug ?? vanitySlug.trim().toLowerCase(),
				privacy,
				description,
				info,
				owner: owner.trim(),
				members,
				verified,
				vanityUnlocked,
				widgets,
				treasuryBalance: Math.max(0, Number(treasuryBalance) || 0),
			};
			onOrgUpdated(updated);
			toast({ type: 'success', title: t('admin.organizations.toast.updateSuccess') });
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('admin.organizations.toast.updateError') });
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${orgId}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error(t('admin.organizations.toast.deleteError'));
			onOrgDeleted(orgId);
			toast({ type: 'success', title: t('admin.organizations.toast.deleteSuccess') });
			onOpenChange(false);
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('admin.organizations.toast.deleteError') });
		} finally {
			setDeleting(false);
			setConfirmDeleteOpen(false);
		}
	};

	const iconUrl = organization.iconUrl || organization.icon || null;
	const displayName = name || organization.name || t('admin.organizations.unnamedOrg');

	return (
		<>
			<Modal open={open} onOpenChange={onOpenChange} title={t('admin.organizations.manageOrg')} description={t('admin.organizations.manageOrgDesc', { name: displayName })} maxWidth="max-w-7xl">
				{loadingDetails ? (
					<div className="flex justify-center py-8">
						<Loading variant="small" />
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3 items-start" style={{ gap: 'calc(var(--ui-gap) * 1.25)' }}>
						{/* Left Preview Card */}
						<div className="md:sticky md:top-0 flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--background)/50 p-5" style={{ gap: 'var(--ui-gap)' }}>
							<div className="flex flex-col items-center text-center gap-3">
								{iconUrl ? (
									<Image src={iconUrl} alt={displayName} width={72} height={72} className="h-18 w-18 rounded-2xl border border-(--border)/10 object-cover" unoptimized />
								) : (
									<div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-(--border)/15 text-(--text-muted)">
										<Building2 size={30} />
									</div>
								)}
								<div>
									<div className="flex items-center justify-center gap-1.5">
										<h3 className="text-lg font-extrabold text-(--text)">{displayName}</h3>
										{verified && <CheckCircle2 size={16} className="text-(--accent-green)" />}
									</div>
									<p className="text-xs font-mono text-(--text-muted) mt-0.5">{orgId}</p>
								</div>

								<div className="grid grid-cols-2 gap-2 w-full pt-2">
									<div className="flex flex-col items-center p-2.5 rounded-2xl bg-(--foreground)/40 border border-(--border)/10">
										<span className="text-[11px] text-(--text-muted) flex items-center gap-1">
											<Users size={11} className="text-(--accent)" /> {t('admin.servers.membersStat')}
										</span>
										<span className="text-sm font-extrabold text-(--text)">{members.length.toLocaleString()}</span>
									</div>
									<div className="flex flex-col items-center p-2.5 rounded-2xl bg-(--foreground)/40 border border-(--border)/10">
										<span className="text-[11px] text-(--text-muted) flex items-center gap-1">
											<Coins size={11} className="text-(--accent)" /> {t('admin.organizations.treasuryStat')}
										</span>
										<span className="text-sm font-extrabold text-(--text)">{treasuryBalance.toLocaleString()}</span>
									</div>
								</div>
							</div>

							<div className="flex flex-col gap-2 pt-3 border-t border-(--border)/10">
								<a
									href={`${getEnvUrl('https://app.xernerx.com')}/organizations/${vanitySlug || orgId}`}
									target="_blank"
									rel="noopener noreferrer"
									className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-(--foreground)/50 hover:bg-(--accent)/15 border border-(--border)/10 px-3 py-2 text-xs font-bold text-(--text) hover:text-(--accent) transition-colors"
								>
									<ExternalLink size={13} />
									<span>{t('admin.organizations.openProfile')}</span>
								</a>
								{onNavigateEntity && owner && (
									<Button
										variant="secondary"
										size="sm"
										onClick={() => {
											onOpenChange(false);
											onNavigateEntity('users', owner);
										}}
										className="w-full justify-center gap-1.5"
									>
										<Users size={13} />
										<span>{t('admin.bots.inspectOwner')}</span>
									</Button>
								)}
								{onViewAuditLogs && (
									<Button
										variant="secondary"
										size="sm"
										onClick={() => {
											onOpenChange(false);
											onViewAuditLogs(orgId);
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
									<Input value={vanitySlug} onChange={(e) => setVanitySlug(e.target.value)} placeholder="my-org" />
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
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
									<Selector value={owner} onChange={(val: string) => setOwner(val)} options={userOptions} />
								</div>
								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-semibold text-(--text)">{t('admin.organizations.treasuryLabel')}</label>
									<Input type="number" value={treasuryBalance} onChange={(e) => setTreasuryBalance(Math.max(0, Number(e.target.value) || 0))} />
								</div>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text)">{t('admin.organizations.membersLabel')}</label>
								<MultiSelector
									value={members}
									onChange={setMembers}
									options={userOptions}
									placeholder={t('admin.organizations.selectMembersPlaceholder')}
									searchPlaceholder={t('admin.users.searchPlaceholder')}
								/>
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

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text)">{t('admin.users.descriptionLabel')}</label>
								<Input variant="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text)">{t('admin.users.fields.infoLabel')}</label>
								<Input variant="textarea" rows={4} value={info} onChange={(e) => setInfo(e.target.value)} />
							</div>

							<div className="sticky bottom-0 z-10 flex items-center justify-between pt-3 pb-1 bg-(--background)/95 backdrop-blur-md border-t border-(--border)/10">
								<Button type="button" variant="danger" size="sm" onClick={() => setConfirmDeleteOpen(true)} className="flex items-center gap-1.5">
									<Trash2 size={14} />
									<span>{t('admin.organizations.deleteOrg')}</span>
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
				title={t('admin.organizations.deleteConfirmTitle')}
				description={t('admin.organizations.deleteConfirmDesc', { name: displayName })}
				confirmKeyword={orgId}
				confirmText={t('admin.organizations.deleteOrg')}
				variant="danger"
				loading={deleting}
				onConfirm={handleDelete}
			/>
		</>
	);
}
