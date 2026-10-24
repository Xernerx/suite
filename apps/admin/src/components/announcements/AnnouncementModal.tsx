/** @format */
'use client';

import React from 'react';
import { Button, Input, Modal, MultiSelector, Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { AnnouncementEmbedBuilder } from './AnnouncementEmbedBuilder';
import { AnnouncementActionRowsBuilder } from './AnnouncementActionRowsBuilder';
import type { ChannelOption, ComponentRow, EmbedData } from './types';

interface AnnouncementModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingId: string | null;
	title: string;
	setTitle: (title: string) => void;
	channelId: string;
	setChannelId: (channelId: string) => void;
	channels: ChannelOption[];
	generateWebhook: (channelId?: string) => void;
	webhookUrl: string;
	setWebhookUrl: (url: string) => void;
	content: string;
	setContent: (content: string) => void;
	scheduledFor: string;
	setScheduledFor: (val: string) => void;
	startsAt: string;
	setStartsAt: (val: string) => void;
	expiresAt: string;
	setExpiresAt: (val: string) => void;
	targetApps: string[];
	setTargetApps: (apps: string[]) => void;
	embeds: EmbedData[];
	setEmbeds: React.Dispatch<React.SetStateAction<EmbedData[]>>;
	components: ComponentRow[];
	setComponents: React.Dispatch<React.SetStateAction<ComponentRow[]>>;
	fillBoilerplate: (type: 'tos' | 'privacy') => void;
	onSubmit: (e: React.FormEvent) => void;
	saving: boolean;
}

const TARGET_APP_KEYS = ['all', 'app', 'store', 'account', 'docs', 'info', 'www'] as const;

export function AnnouncementModal({
	open,
	onOpenChange,
	editingId,
	title,
	setTitle,
	channelId,
	setChannelId,
	channels,
	generateWebhook,
	webhookUrl,
	setWebhookUrl,
	content,
	setContent,
	scheduledFor,
	setScheduledFor,
	startsAt,
	setStartsAt,
	expiresAt,
	setExpiresAt,
	targetApps,
	setTargetApps,
	embeds,
	setEmbeds,
	components,
	setComponents,
	fillBoilerplate,
	onSubmit,
	saving,
}: AnnouncementModalProps) {
	const { t } = useDictionary();

	const targetAppOptions = TARGET_APP_KEYS.map((key) => ({
		value: key,
		label: t(`admin.dashboard.announcements.targetApps.${key}`),
	}));

	const handleTargetAppsChange = (next: string[]) => {
		if (next.length === 0) {
			setTargetApps(['all']);
			return;
		}
		const hadAll = targetApps.includes('all');
		const hasAll = next.includes('all');
		if (!hadAll && hasAll) {
			setTargetApps(['all']);
		} else if (hadAll && next.length > 1) {
			setTargetApps(next.filter((app) => app !== 'all'));
		} else {
			setTargetApps(next);
		}
	};

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={editingId ? t('admin.dashboard.announcements.editModalTitle') : t('admin.dashboard.announcements.createModalTitle')}
			description={t('admin.dashboard.announcements.modalDesc')}
			maxWidth="max-w-4xl"
		>
			<form onSubmit={onSubmit} className="flex flex-col gap-6 max-h-[75vh] overflow-y-auto pr-2">
				<div className="flex gap-2">
					<Button type="button" variant="ghost" onClick={() => fillBoilerplate('tos')}>
						{t('admin.dashboard.announcements.loadTos')}
					</Button>
					<Button type="button" variant="ghost" onClick={() => fillBoilerplate('privacy')}>
						{t('admin.dashboard.announcements.loadPrivacy')}
					</Button>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-(--border)/10 pb-4">
					<div className="flex flex-col gap-1 w-full">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.internalTitle')}</label>
						<Input value={title} onChange={(e) => setTitle(e.target.value)} required />
					</div>
					<div className="flex flex-col gap-1 w-full">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.scheduledFor')}</label>
						<Input
							type="datetime-local"
							value={scheduledFor}
							onChange={(e) => {
								setScheduledFor(e.target.value);
								if (!startsAt) setStartsAt(e.target.value);
							}}
						/>
					</div>
					<div className="flex flex-col gap-1 w-full">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.startsAt')}</label>
						<Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
					</div>
					<div className="flex flex-col gap-1 w-full">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.expiresAt')}</label>
						<Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
					</div>
					<div className="flex flex-col gap-1 w-full sm:col-span-2">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.targetAppsLabel')}</label>
						<MultiSelector
							value={targetApps.length > 0 ? targetApps : ['all']}
							options={targetAppOptions}
							onChange={handleTargetAppsChange}
							searchable={false}
							placeholder={t('admin.dashboard.announcements.targetAppsPlaceholder')}
						/>
					</div>
					<div className="flex flex-col gap-1 w-full sm:col-span-2">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.discordChannel')}</label>
						<Selector
							value={channelId}
							options={[{ label: t('admin.dashboard.announcements.selectChannel'), value: '' }, ...channels]}
							onChange={(val: string) => {
								setChannelId(val);
								if (val) generateWebhook(val);
							}}
						/>
					</div>
					<div className="sm:col-span-2 flex flex-col gap-1 w-full">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.webhookUrl')}</label>
						<Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} required />
					</div>
				</div>

				<div className="flex flex-col gap-1 w-full">
					<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.messageContent')}</label>
					<Input value={content} onChange={(e) => setContent(e.target.value)} />
				</div>

				{/* WYSIWYG DISCORD BUILDER */}
				<AnnouncementEmbedBuilder embeds={embeds} setEmbeds={setEmbeds} />

				{/* COMPONENTS */}
				<AnnouncementActionRowsBuilder components={components} setComponents={setComponents} />

				<div className="flex justify-end gap-3 sticky bottom-0 bg-(--foreground)/80 backdrop-blur-md pt-4 pb-2 border-t border-(--border)/10 mt-4">
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						{t('admin.dashboard.announcements.cancel')}
					</Button>
					<Button type="submit" variant="primary" disabled={saving}>
						{saving ? t('admin.dashboard.announcements.saving') : t('admin.dashboard.announcements.savePublish')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
