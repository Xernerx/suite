/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';

interface WebhooksSectionProps {
	adminServerId: string;
	issuesWebhookUrl: string;
	setIssuesWebhookUrl: (val: string) => void;
	suggestionsWebhookUrl: string;
	setSuggestionsWebhookUrl: (val: string) => void;
	appWebhookUrl: string;
	setAppWebhookUrl: (val: string) => void;
	auditWebhookUrl: string;
	setAuditWebhookUrl: (val: string) => void;
}

export function WebhooksSection({
	adminServerId,
	issuesWebhookUrl,
	setIssuesWebhookUrl,
	suggestionsWebhookUrl,
	setSuggestionsWebhookUrl,
	appWebhookUrl,
	setAppWebhookUrl,
	auditWebhookUrl,
	setAuditWebhookUrl,
}: WebhooksSectionProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [channels, setChannels] = useState<{ label: string; value: string }[]>([]);

	useEffect(() => {
		if (!adminServerId) {
			setChannels([]);
			return;
		}
		fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${adminServerId}`), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (Array.isArray(data?.channels)) {
					setChannels(data.channels.map((c: any) => ({ label: `#${c.name}`, value: c.id })));
				}
			})
			.catch(() => {});
	}, [adminServerId, getEnvUrl]);

	const linkChannelWebhook = async (channelId: string, webhookName: string, onLinked: (url: string) => void) => {
		if (!channelId) return;
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/announcements/create-webhook'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ channelId, name: webhookName }),
			});
			const data = await res.json();
			if (res.ok && data?.url) {
				onLinked(data.url);
				toast({ type: 'success', title: t('admin.dashboard.announcements.toasts.webhookLinked') });
			} else {
				throw new Error(data?.details || data?.error || t('admin.dashboard.announcements.toasts.createWebhookFailed'));
			}
		} catch (e: any) {
			toast({ type: 'error', title: t('admin.dashboard.announcements.toasts.createWebhookFailed'), description: e.message });
		}
	};

	const channelOptions = [{ value: '', label: t('admin.settings.linkChannelPlaceholder') }, ...channels];

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
				<label className="text-xs font-semibold text-(--text)">{t('admin.settings.issuesWebhookUrl')}</label>
				<p className="text-xs text-(--text-muted)">{t('admin.settings.issuesWebhookUrlDesc')}</p>
				{channels.length > 0 && (
					<Selector
						value=""
						options={channelOptions}
						onChange={(val: string) => linkChannelWebhook(val, 'Xernerx Bug Tracker', setIssuesWebhookUrl)}
						placeholder={t('admin.settings.linkChannelPlaceholder')}
					/>
				)}
				<Input value={issuesWebhookUrl} onChange={(e) => setIssuesWebhookUrl(e.target.value)} placeholder={t('admin.settings.appWebhookUrlPlaceholder')} />
			</div>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
				<label className="text-xs font-semibold text-(--text)">{t('admin.settings.suggestionsWebhookUrl')}</label>
				<p className="text-xs text-(--text-muted)">{t('admin.settings.suggestionsWebhookUrlDesc')}</p>
				{channels.length > 0 && (
					<Selector
						value=""
						options={channelOptions}
						onChange={(val: string) => linkChannelWebhook(val, 'Xernerx Suggestions', setSuggestionsWebhookUrl)}
						placeholder={t('admin.settings.linkChannelPlaceholder')}
					/>
				)}
				<Input value={suggestionsWebhookUrl} onChange={(e) => setSuggestionsWebhookUrl(e.target.value)} placeholder={t('admin.settings.appWebhookUrlPlaceholder')} />
			</div>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
				<label className="text-xs font-semibold text-(--text)">{t('admin.settings.appWebhookUrl')}</label>
				<p className="text-xs text-(--text-muted)">{t('admin.settings.appWebhookUrlDesc')}</p>
				{channels.length > 0 && (
					<Selector
						value=""
						options={channelOptions}
						onChange={(val: string) => linkChannelWebhook(val, 'Xernerx Applications', setAppWebhookUrl)}
						placeholder={t('admin.settings.linkChannelPlaceholder')}
					/>
				)}
				<Input value={appWebhookUrl} onChange={(e) => setAppWebhookUrl(e.target.value)} placeholder={t('admin.settings.appWebhookUrlPlaceholder')} />
			</div>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
				<label className="text-xs font-semibold text-(--text)">{t('admin.settings.auditWebhookUrl')}</label>
				<p className="text-xs text-(--text-muted)">{t('admin.settings.auditWebhookUrlDesc')}</p>
				{channels.length > 0 && (
					<Selector
						value=""
						options={channelOptions}
						onChange={(val: string) => linkChannelWebhook(val, 'Xernerx Security Audit', setAuditWebhookUrl)}
						placeholder={t('admin.settings.linkChannelPlaceholder')}
					/>
				)}
				<Input value={auditWebhookUrl} onChange={(e) => setAuditWebhookUrl(e.target.value)} placeholder={t('admin.settings.auditWebhookUrlPlaceholder')} />
			</div>
		</div>
	);
}
