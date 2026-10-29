/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Bot as BotIcon, CheckCircle2, ExternalLink, ScrollText, Server, ThumbsUp, Trash2 } from 'lucide-react';
import { Button, Confirm, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { AdminBotSummary, BotDiscordProfile } from './types';

interface BotModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bot: AdminBotSummary;
	discord: BotDiscordProfile | null;
	getEnvUrl: (url: string) => string;
	onBotDeleted: (id: string) => void;
	onBotUpdated: (updated: AdminBotSummary) => void;
	onViewAuditLogs?: (botId: string) => void;
}

export function BotModal({ open, onOpenChange, bot, discord, getEnvUrl, onBotDeleted, onBotUpdated, onViewAuditLogs }: BotModalProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const [loadingDetails, setLoadingDetails] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	const [name, setName] = useState(bot.name || '');
	const [vanitySlug, setVanitySlug] = useState(bot.vanitySlug || '');
	const [privacy, setPrivacy] = useState<string>(bot.privacy || 'private');
	const [description, setDescription] = useState(bot.description || '');
	const [ownersText, setOwnersText] = useState((bot.owners || []).join(', '));
	const [organization, setOrganization] = useState(bot.organization || '');
	const [verified, setVerified] = useState(Boolean(bot.verified));
	const [vanityUnlocked, setVanityUnlocked] = useState(Boolean(bot.vanityUnlocked || bot.vanitySlug || bot.verified));
	const [widgets, setWidgets] = useState(Boolean(bot.widgets));

	useEffect(() => {
		if (!open) return;
		setLoadingDetails(true);
		fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${bot.id}/profile`), {
			credentials: 'include',
			cache: 'no-store',
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data) {
					setName(data.name || discord?.username || '');
					setVanitySlug(data.vanitySlug || '');
					setPrivacy(data.privacy || 'private');
					setDescription(data.description || '');
					setOwnersText(Array.isArray(data.owners) ? data.owners.join(', ') : '');
					setOrganization(data.organization || '');
					setVerified(Boolean(data.verified));
					setVanityUnlocked(Boolean(data.vanityUnlocked || data.vanitySlug || data.verified));
					setWidgets(Boolean(data.widgets));
				}
			})
			.catch(() => {})
			.finally(() => setLoadingDetails(false));
	}, [open, bot.id, discord?.username, getEnvUrl]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const ownersList = ownersText
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);

			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${bot.id}/profile`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					name: name.trim(),
					vanitySlug: vanitySlug.trim().toLowerCase(),
					privacy,
					description,
					owners: ownersList,
					organization: organization.trim() || null,
					verified,
					vanityUnlocked,
					widgets,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error || t('admin.bots.toast.updateError'));
			}

			const updated: AdminBotSummary = {
				...bot,
				...data,
				name: name.trim(),
				vanitySlug: data.vanitySlug ?? vanitySlug.trim().toLowerCase(),
				privacy,
				description,
				owners: ownersList,
				organization: organization.trim() || null,
				verified,
				vanityUnlocked,
				widgets,
				discord: discord || bot.discord,
			};
			onBotUpdated(updated);
			toast({ type: 'success', title: t('admin.bots.toast.updateSuccess') });
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('admin.bots.toast.updateError') });
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${bot.id}/profile`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error(t('admin.bots.toast.deleteError'));
			onBotDeleted(bot.id);
			toast({ type: 'success', title: t('admin.bots.toast.deleteSuccess') });
			onOpenChange(false);
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('admin.bots.toast.deleteError') });
		} finally {
			setDeleting(false);
			setConfirmDeleteOpen(false);
		}
	};

	const avatarHash = discord?.avatar || bot.avatar;
	const avatarUrl =
		discord?.avatarUrl ||
		(avatarHash && String(avatarHash).startsWith('http')
			? String(avatarHash)
			: avatarHash && bot.id
				? `https://cdn.discordapp.com/avatars/${bot.id}/${avatarHash}.${String(avatarHash).startsWith('a_') ? 'gif' : 'png'}`
				: null);
	const displayName = discord?.globalName || discord?.global_name || discord?.username || name || bot.name || t('common.unknownBot');

	return (
		<>
			<Modal open={open} onOpenChange={onOpenChange} title={t('admin.bots.manageBot')} description={t('admin.bots.manageBotDesc', { name: displayName })} maxWidth="max-w-4xl">
				{loadingDetails ? (
					<div className="flex justify-center py-8">
						<Loading variant="small" />
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 1.25)' }}>
						{/* Left Preview Card */}
						<div className="flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--background)/50 p-5" style={{ gap: 'var(--ui-gap)' }}>
							<div className="flex flex-col items-center text-center gap-3">
								{avatarUrl ? (
									<Image src={avatarUrl} alt={displayName} width={72} height={72} className="h-18 w-18 rounded-full border border-(--border)/10 object-cover" unoptimized />
								) : (
									<div className="flex h-18 w-18 items-center justify-center rounded-full bg-(--border)/15 text-(--text-muted)">
										<BotIcon size={30} />
									</div>
								)}
								<div>
									<div className="flex items-center justify-center gap-1.5">
										<h3 className="text-lg font-extrabold text-(--text)">{displayName}</h3>
										{verified && <CheckCircle2 size={16} className="text-(--accent-green)" />}
									</div>
									<p className="text-xs font-mono text-(--text-muted) mt-0.5">{bot.id}</p>
								</div>

								<div className="grid grid-cols-2 gap-2 w-full pt-2">
									<div className="flex flex-col items-center p-2.5 rounded-2xl bg-(--foreground)/40 border border-(--border)/10">
										<span className="text-[11px] text-(--text-muted) flex items-center gap-1">
											<Server size={11} className="text-(--accent)" /> {t('admin.bots.serversStat')}
										</span>
										<span className="text-sm font-extrabold text-(--text)">{(bot.stats?.guildCount ?? 0).toLocaleString()}</span>
									</div>
									<div className="flex flex-col items-center p-2.5 rounded-2xl bg-(--foreground)/40 border border-(--border)/10">
										<span className="text-[11px] text-(--text-muted) flex items-center gap-1">
											<ThumbsUp size={11} className="text-(--accent)" /> {t('admin.bots.votesStat')}
										</span>
										<span className="text-sm font-extrabold text-(--text)">{(bot.voteCount ?? bot.stats?.voteCount ?? 0).toLocaleString()}</span>
									</div>
								</div>
							</div>

							<div className="flex flex-col gap-2 pt-3 border-t border-(--border)/10">
								<a
									href={`${getEnvUrl('https://app.xernerx.com')}/bots/${vanitySlug || bot.id}`}
									target="_blank"
									rel="noopener noreferrer"
									className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-(--foreground)/50 hover:bg-(--accent)/15 border border-(--border)/10 px-3 py-2 text-xs font-bold text-(--text) hover:text-(--accent) transition-colors"
								>
									<ExternalLink size={13} />
									<span>{t('admin.bots.openProfile')}</span>
								</a>
								{onViewAuditLogs && (
									<Button
										variant="secondary"
										size="sm"
										onClick={() => {
											onOpenChange(false);
											onViewAuditLogs(bot.id);
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
									<Input value={vanitySlug} onChange={(e) => setVanitySlug(e.target.value)} placeholder="my-bot" />
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
									<label className="text-xs font-semibold text-(--text)">{t('admin.bots.ownersLabel')}</label>
									<Input value={ownersText} onChange={(e) => setOwnersText(e.target.value)} placeholder="482513687417061376, ..." />
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
									<span>{t('admin.bots.deleteBot')}</span>
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
				title={t('admin.bots.deleteConfirmTitle')}
				description={t('admin.bots.deleteConfirmDesc', { name: displayName })}
				confirmKeyword={bot.id}
				confirmText={t('admin.bots.deleteBot')}
				variant="danger"
				loading={deleting}
				onConfirm={handleDelete}
			/>
		</>
	);
}
