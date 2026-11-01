/** @format */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Bell, CheckCircle2, Copy, ExternalLink, RefreshCw, ScrollText, Sparkles, User as UserIcon } from 'lucide-react';
import { Button, Input, Modal, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import type { DiscordProfile, FullUser, UserSummary } from './types';

interface UserProfilePreviewProps {
	user: UserSummary;
	discord: DiscordProfile | null;
	fullUser: FullUser | null;
	displayName: string;
	avatarUrl: string | null;
	discordBanner: string | null;
	globalLevel?: number;
	globalXp?: number;
	verified?: boolean;
	vanitySlug?: string;
	onViewAuditLogs?: () => void;
}

export function UserProfilePreview({ user, discord, fullUser, displayName, avatarUrl, discordBanner, globalLevel, globalXp, verified, vanitySlug, onViewAuditLogs }: UserProfilePreviewProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [syncingRoles, setSyncingRoles] = useState(false);
	const [notifyOpen, setNotifyOpen] = useState(false);
	const [notifType, setNotifType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
	const [notifTitle, setNotifTitle] = useState('');
	const [notifMessage, setNotifMessage] = useState('');
	const [notifLink, setNotifLink] = useState('');
	const [sendingNotif, setSendingNotif] = useState(false);

	const resolvedLevel = globalLevel ?? fullUser?.level?.level ?? 1;
	const resolvedXp = globalXp ?? fullUser?.level?.xp ?? 0;
	const isVerified = verified ?? Boolean(fullUser?.verified || user.verified);
	const resolvedSlug = vanitySlug ?? fullUser?.vanitySlug ?? user.vanitySlug ?? '';

	const handleSyncRoles = async () => {
		if (syncingRoles) return;
		setSyncingRoles(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'sync_roles' }),
			});
			if (!res.ok) throw new Error('Failed to sync Discord roles');
			toast({ title: t('admin.users.actions.syncRolesSuccess'), type: 'success' });
		} catch {
			toast({ title: t('admin.users.actions.syncRolesError'), type: 'error' });
		} finally {
			setSyncingRoles(false);
		}
	};

	const handleSendNotification = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!notifTitle.trim() || !notifMessage.trim()) return;
		setSendingNotif(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					action: 'send_notification',
					type: notifType,
					title: notifTitle.trim(),
					message: notifMessage.trim(),
					link: notifLink.trim() || null,
				}),
			});
			if (!res.ok) throw new Error('Failed to send notification');
			toast({ title: t('admin.users.actions.notifySuccess'), type: 'success' });
			setNotifyOpen(false);
			setNotifTitle('');
			setNotifMessage('');
			setNotifLink('');
			setNotifType('info');
		} catch {
			toast({ title: t('admin.users.actions.notifyError'), type: 'error' });
		} finally {
			setSendingNotif(false);
		}
	};

	return (
		<>
			<div className="flex flex-col col-span-1 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md overflow-hidden relative shadow-sm h-fit">
				{discordBanner ? (
					<div
						className="h-24 w-full bg-cover bg-center"
						style={{
							backgroundImage: `url(${discordBanner})`,
						}}
					/>
				) : (
					<div className="h-24 w-full bg-gradient-to-br from-(--accent)/40 to-(--accent)/40 opacity-50" />
				)}

				<div className="absolute top-12 left-4 rounded-full border-4 border-(--background) bg-(--background) overflow-hidden h-20 w-20 shadow-md">
					{avatarUrl ? (
						<Image src={avatarUrl} alt={displayName} width={80} height={80} className="object-cover w-full h-full" unoptimized draggable={false} />
					) : (
						<div className="flex w-full h-full items-center justify-center bg-(--border)/10 text-(--text)">
							<UserIcon size={32} />
						</div>
					)}
				</div>

				<div className="pt-10 px-5 pb-5 flex flex-col">
					<div className="flex items-center gap-1.5 min-w-0">
						<h3 className="font-bold text-lg text-(--text) truncate">{discord?.globalName || fullUser?.name || displayName}</h3>
						{isVerified && <CheckCircle2 size={16} className="text-(--accent-green) shrink-0" />}
					</div>
					<span className="text-sm text-(--text-muted) truncate">{discord?.username ? `@${discord.username}` : t('admin.users.noRoles')}</span>
					<div className="mt-2 flex flex-wrap items-center gap-1.5">
						<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30 font-mono">
							<Sparkles size={12} />
							{t('admin.users.card.levelBadge', { level: resolvedLevel, xp: resolvedXp.toLocaleString() })}
						</span>
						{resolvedSlug && (
							<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-(--background)/60 text-(--text-muted) border border-(--border)/10">
								/{resolvedSlug}
							</span>
						)}
					</div>

					{fullUser && (
						<div className="mt-3 grid grid-cols-1 gap-1.5 text-[11px] bg-(--background)/40 p-2.5 rounded-xl border border-(--border)/10 text-(--text-muted)">
							<div className="flex items-center justify-between">
								<span>{t('admin.users.fields.agreedTerms')}</span>
								<span className="font-mono text-(--text)">{fullUser.agreedTerms ? new Date(fullUser.agreedTerms).toLocaleDateString() : t('admin.users.fields.notAccepted')}</span>
							</div>
							<div className="flex items-center justify-between">
								<span>{t('admin.users.fields.agreedPrivacy')}</span>
								<span className="font-mono text-(--text)">{fullUser.agreedPrivacy ? new Date(fullUser.agreedPrivacy).toLocaleDateString() : t('admin.users.fields.notAccepted')}</span>
							</div>
						</div>
					)}

					<div
						className="mt-4 flex flex-col"
						style={{
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<button
							type="button"
							onClick={() => {
								navigator.clipboard.writeText(user.id);
								toast({
									title: t('admin.users.idCopied'),
									type: 'success',
								});
							}}
							className="flex items-center justify-between text-xs bg-(--background)/50 p-2.5 rounded-xl border border-(--border)/10 font-mono text-center text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/30 transition-all text-left group cursor-pointer"
						>
							<span className="truncate">
								{t('admin.users.card.idPrefix', {
									id: user.id,
								})}
							</span>
							<Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
						</button>
						{fullUser?.email && (
							<button
								type="button"
								onClick={() => {
									navigator.clipboard.writeText(fullUser.email!);
									toast({
										title: t('admin.users.emailCopied'),
										type: 'success',
									});
								}}
								className="flex items-center justify-between text-xs bg-(--background)/50 p-2.5 rounded-xl border border-(--border)/10 text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/30 transition-all text-left group cursor-pointer"
							>
								<div className="flex items-center gap-1.5 truncate">
									<div className="w-1.5 h-1.5 rounded-full bg-(--accent-green) shrink-0" />
									<span className="truncate">{fullUser.email}</span>
								</div>
								<Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
							</button>
						)}
						{user.id && (
							<button
								type="button"
								onClick={() => window.open(getEnvUrl(`https://app.xernerx.com/users/${user.id}`), '_blank')}
								className="flex items-center justify-between text-xs bg-(--background)/50 p-2.5 rounded-xl border border-(--border)/10 font-semibold text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/30 transition-all text-left group cursor-pointer"
							>
								<span className="truncate">{t('admin.users.viewPublicProfile')}</span>
								<ExternalLink size={14} className="shrink-0 ml-2" />
							</button>
						)}
						<button
							type="button"
							onClick={handleSyncRoles}
							disabled={syncingRoles}
							className="flex items-center justify-between text-xs bg-(--background)/50 p-2.5 rounded-xl border border-(--border)/10 font-semibold text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/30 transition-all text-left group cursor-pointer disabled:opacity-50"
						>
							<span className="truncate">{t('admin.users.actions.syncRoles')}</span>
							<RefreshCw size={14} className={`shrink-0 ml-2 ${syncingRoles ? 'animate-spin text-(--accent)' : ''}`} />
						</button>
						<button
							type="button"
							onClick={() => setNotifyOpen(true)}
							className="flex items-center justify-between text-xs bg-(--background)/50 p-2.5 rounded-xl border border-(--border)/10 font-semibold text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/30 transition-all text-left group cursor-pointer"
						>
							<span className="truncate">{t('admin.users.actions.sendNotification')}</span>
							<Bell size={14} className="shrink-0 ml-2" />
						</button>
						{user.id && onViewAuditLogs && (
							<button
								type="button"
								onClick={onViewAuditLogs}
								className="flex items-center justify-between text-xs bg-(--background)/50 p-2.5 rounded-xl border border-(--border)/10 font-semibold text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/30 transition-all text-left group cursor-pointer"
							>
								<span className="truncate">{t('admin.users.viewAuditHistory')}</span>
								<ScrollText size={14} className="shrink-0 ml-2" />
							</button>
						)}
					</div>
				</div>
			</div>

			<Modal open={notifyOpen} onOpenChange={setNotifyOpen} title={t('admin.users.actions.notifyModalTitle')} description={t('admin.users.actions.notifyModalDesc', { name: displayName })}>
				<form onSubmit={handleSendNotification} className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-medium text-(--text)">{t('admin.users.actions.notifyType')}</label>
						<Selector
							value={notifType}
							onChange={(val) => setNotifType(val as 'info' | 'success' | 'warning' | 'error')}
							options={[
								{ value: 'info', label: t('admin.users.actions.typeInfo') },
								{ value: 'success', label: t('admin.users.actions.typeSuccess') },
								{ value: 'warning', label: t('admin.users.actions.typeWarning') },
								{ value: 'error', label: t('admin.users.actions.typeError') },
							]}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-medium text-(--text)">{t('admin.users.actions.notifyTitleLabel')}</label>
						<Input type="text" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder={t('admin.users.actions.notifyTitlePlaceholder')} required />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-medium text-(--text)">{t('admin.users.actions.notifyMessageLabel')}</label>
						<Input
							variant="textarea"
							rows={3}
							value={notifMessage}
							onChange={(e) => setNotifMessage(e.target.value)}
							placeholder={t('admin.users.actions.notifyMessagePlaceholder')}
							required
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-medium text-(--text)">{t('admin.users.actions.notifyLinkLabel')}</label>
						<Input type="text" value={notifLink} onChange={(e) => setNotifLink(e.target.value)} placeholder="https://app.xernerx.com/..." />
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={() => setNotifyOpen(false)}>
							{t('admin.roles.cancel')}
						</Button>
						<Button type="submit" disabled={sendingNotif || !notifTitle.trim() || !notifMessage.trim()}>
							{sendingNotif ? t('admin.roles.saving') : t('admin.users.actions.sendNotification')}
						</Button>
					</div>
				</form>
			</Modal>
		</>
	);
}
