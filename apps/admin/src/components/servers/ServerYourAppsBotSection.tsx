/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { ClipboardList, FileText, Save, Trash2 } from 'lucide-react';
import { Button, Confirm, Toggle } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import type { ServerBotProfilesResponse } from './types';

interface ServerYourAppsBotSectionProps {
	serverId: string;
	serverName: string;
	yourapps: ServerBotProfilesResponse['yourapps'];
	getEnvUrl: (url: string) => string;
	onReload: () => Promise<void>;
}

export function ServerYourAppsBotSection({ serverId, serverName, yourapps, getEnvUrl, onReload }: ServerYourAppsBotSectionProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const [dmNotifications, setDmNotifications] = useState(yourapps.config.dmNotifications);
	const [threadPerSubmission, setThreadPerSubmission] = useState(yourapps.config.threadPerSubmission);
	const [savingConfig, setSavingConfig] = useState(false);
	const [confirmWipe, setConfirmWipe] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		setDmNotifications(yourapps.config.dmNotifications);
		setThreadPerSubmission(yourapps.config.threadPerSubmission);
	}, [yourapps]);

	const handleSaveConfig = async () => {
		setSavingConfig(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${serverId}/bots`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					action: 'update_yourapps_config',
					dmNotifications,
					threadPerSubmission,
				}),
			});
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('admin.servers.botProfiles.saveSuccess') });
			await onReload();
		} catch {
			toast({ type: 'error', title: t('admin.servers.botProfiles.saveError') });
		} finally {
			setSavingConfig(false);
		}
	};

	const handleConfirmWipe = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${serverId}/bots?bot=yourapps`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('admin.servers.botProfiles.deleteSuccess') });
			setConfirmWipe(false);
			await onReload();
		} catch {
			toast({ type: 'error', title: t('admin.servers.botProfiles.deleteError') });
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-4" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent)">
						<ClipboardList size={16} />
					</span>
					<div>
						<h4 className="text-sm font-extrabold text-(--text)">{t('admin.servers.botProfiles.yourappsConfigTitle')}</h4>
						<p className="text-xs text-(--text-muted)">
							{t('admin.servers.botProfiles.yourappsConfigSummary', {
								forms: yourapps.forms.length,
								panels: yourapps.config.panelsCount,
								applicants: yourapps.applicants.length,
							})}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{yourapps.hasData && (
						<Button type="button" variant="danger" size="sm" onClick={() => setConfirmWipe(true)} className="flex items-center gap-1.5">
							<Trash2 size={13} />
							<span>{t('admin.servers.botProfiles.wipeBotData')}</span>
						</Button>
					)}
					<Button type="button" variant="primary" size="sm" loading={savingConfig} onClick={handleSaveConfig} className="flex items-center gap-1.5">
						<Save size={13} />
						<span>{t('common.actions.saveChanges')}</span>
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
				<label className="flex items-center justify-between gap-2 cursor-pointer">
					<span className="text-xs font-bold text-(--text)">{t('admin.servers.botProfiles.dmNotificationsLabel')}</span>
					<Toggle checked={dmNotifications} onChange={(e) => setDmNotifications(e.target.checked)} />
				</label>
				<label className="flex items-center justify-between gap-2 cursor-pointer">
					<span className="text-xs font-bold text-(--text)">{t('admin.servers.botProfiles.threadPerSubmissionLabel')}</span>
					<Toggle checked={threadPerSubmission} onChange={(e) => setThreadPerSubmission(e.target.checked)} />
				</label>
			</div>

			{yourapps.forms.length === 0 ? (
				<div className="rounded-2xl border border-(--border)/10 bg-(--background)/50 px-4 py-6 text-center text-xs text-(--text-muted)">{t('admin.servers.botProfiles.noFormsConfigured')}</div>
			) : (
				<div className="flex flex-col gap-2">
					<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('admin.servers.botProfiles.formsHeading', { count: yourapps.forms.length })}</span>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{yourapps.forms.map((form) => (
							<div key={form.id} className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--background)/50 px-3.5 py-2.5">
								<div className="flex items-center gap-2 min-w-0">
									<FileText size={14} className="text-(--accent) shrink-0" />
									<div className="min-w-0">
										<p className="text-xs font-bold text-(--text) truncate">{form.name}</p>
										<p className="text-[11px] text-(--text-muted)">
											{t('admin.servers.botProfiles.formMeta', {
												category: form.category,
												questions: form.questionsCount,
											})}
										</p>
									</div>
								</div>
								<span
									className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
										form.state === 'open' ? 'bg-(--accent-green)/15 text-(--accent-green)' : 'bg-(--border)/15 text-(--text-muted)'
									}`}
								>
									{form.state}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			<Confirm
				open={confirmWipe}
				onOpenChange={setConfirmWipe}
				title={t('admin.users.botProfiles.confirmDeleteTitle')}
				description={t('admin.users.botProfiles.confirmDeleteDesc', { target: serverName })}
				confirmText={t('admin.roles.confirmDelete')}
				cancelText={t('admin.roles.cancel')}
				variant="danger"
				loading={deleting}
				onConfirm={handleConfirmWipe}
			/>
		</div>
	);
}
