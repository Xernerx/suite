/** @format */
'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { Button, Confirm } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import type { AnnouncementItem, ChannelOption, ComponentRow, EmbedData } from './announcements/types';
import { AnnouncementCard } from './announcements/AnnouncementCard';
import { AnnouncementModal } from './announcements/AnnouncementModal';

export default function Announcements() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { user } = useUser();

	const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [channels, setChannels] = useState<ChannelOption[]>([]);

	const [isOpen, setIsOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	const [editingId, setEditingId] = useState<string | null>(null);
	const [title, setTitle] = useState('');
	const [channelId, setChannelId] = useState('');
	const [webhookUrl, setWebhookUrl] = useState('');
	const [content, setContent] = useState('');
	const [scheduledFor, setScheduledFor] = useState('');

	// VISUAL BUILDER STATES
	const [embeds, setEmbeds] = useState<EmbedData[]>([]);
	const [components, setComponents] = useState<ComponentRow[]>([]);

	const fetchChannels = async () => {
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_server_id'), { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				if (data.value) {
					const guildRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${data.value}`), { credentials: 'include' });
					if (guildRes.ok) {
						const guildData = await guildRes.json();
						if (guildData.channels) {
							setChannels(guildData.channels.map((c: any) => ({ label: '#' + c.name, value: c.id })));
						}
					}
				}
			}
		} catch (e) {
			console.error('Failed to fetch channels', e);
		}
	};

	const fetchAnnouncements = async () => {
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/announcements'), { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				setAnnouncements(Array.isArray(data) ? data : []);
			}
		} catch (err) {
			console.error('Failed to fetch announcements:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAnnouncements();
		fetchChannels();
	}, []);

	const generateWebhook = async (passedChannelId?: string) => {
		const targetChannel = passedChannelId || channelId;
		if (!targetChannel) return;
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/announcements/create-webhook'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ channelId: targetChannel, name: 'Xernerx Announcements' }),
			});
			const data = await res.json();
			if (res.ok) {
				setWebhookUrl(data.url);
				toast({ type: 'success', title: t('admin.dashboard.announcements.toasts.webhookLinked') });
			} else {
				throw new Error(data.error || 'Failed');
			}
		} catch (e: any) {
			toast({ type: 'error', title: t('admin.dashboard.announcements.toasts.createWebhookFailed'), description: e.message });
		}
	};

	const fillBoilerplate = (type: 'tos' | 'privacy') => {
		const avatarUrl = user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined;

		setTitle(type === 'tos' ? t('admin.dashboard.announcements.templates.tosTitle') : t('admin.dashboard.announcements.templates.privacyTitle'));
		setContent('');
		setEmbeds([
			{
				title: type === 'tos' ? t('admin.dashboard.announcements.templates.tosEmbedTitle') : t('admin.dashboard.announcements.templates.privacyEmbedTitle'),
				description: type === 'tos' ? t('admin.dashboard.announcements.templates.tosEmbedDesc') : t('admin.dashboard.announcements.templates.privacyEmbedDesc'),
				color: '#8b7cf6',
				fields: [],
				author: { name: '', url: '', icon_url: '' },
				footer: {
					text: user?.username || user?.global_name || '',
					icon_url: avatarUrl,
				},
				timestamp: new Date().toISOString(),
			},
		]);
		setComponents([
			{
				type: 1,
				components: [
					{
						type: 2,
						style: 5,
						label: type === 'tos' ? t('admin.dashboard.announcements.templates.tosButtonLabel') : t('admin.dashboard.announcements.templates.privacyButtonLabel'),
						url: `https://xernerx.com/${type === 'tos' ? 'terms' : 'privacy'}`,
					},
				],
			},
		]);
	};

	const saveAnnouncement = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);

		try {
			// Clean up embeds (remove empty authors/footers)
			const cleanEmbeds = embeds.map((emb) => {
				const cleaned = { ...emb };
				if (cleaned.author && !cleaned.author.name) delete cleaned.author;
				if (cleaned.footer && !cleaned.footer.text) delete cleaned.footer;
				if (cleaned.color && typeof cleaned.color === 'string') {
					cleaned.color = parseInt(cleaned.color.replace('#', ''), 16);
				}
				return cleaned;
			});

			const cleanComponents = components.map((row) => ({
				...row,
				components: row.components.map((btn: any) => {
					const cleanedBtn = { ...btn };
					if (cleanedBtn.style === 5) {
						delete cleanedBtn.custom_id;
					} else {
						delete cleanedBtn.url;
						if (!cleanedBtn.custom_id) cleanedBtn.custom_id = `btn_${Date.now()}`;
					}
					return cleanedBtn;
				}),
			}));

			const payload = {
				title,
				channelId,
				webhookUrl,
				message: {
					content,
					embeds: cleanEmbeds,
					components: cleanComponents,
				},
				scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
			};

			const url = editingId ? getEnvUrl(`https://api.xernerx.com/secure/announcements/${editingId}`) : getEnvUrl('https://api.xernerx.com/secure/announcements');

			const res = await fetch(url, {
				method: editingId ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				toast({ type: 'success', title: editingId ? t('admin.dashboard.announcements.toasts.updateSuccess') : t('admin.dashboard.announcements.toasts.createSuccess') });
				setIsOpen(false);
				fetchAnnouncements();
			} else {
				throw new Error(await res.text());
			}
		} catch (e: any) {
			toast({ type: 'error', title: t('admin.dashboard.announcements.toasts.saveFailed'), description: e.message });
		} finally {
			setSaving(false);
		}
	};

	const deleteAnnouncement = (id: string) => {
		setConfirmDeleteId(id);
	};

	const confirmDeleteAnnouncement = async () => {
		if (!confirmDeleteId) return;
		const id = confirmDeleteId;
		setConfirmDeleteId(null);
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/announcements/${id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			fetchAnnouncements();
		} catch (e) {
			console.error(e);
		}
	};

	const handleEditAnnouncement = (a: AnnouncementItem) => {
		setEditingId(a.id);
		setTitle(a.title);
		setChannelId(a.channelId || '');
		setWebhookUrl(a.webhookUrl);
		setContent(a.message?.content || '');

		// Restore colors properly for inputs (int -> hex)
		const restoredEmbeds = (a.message?.embeds || []).map((e: any) => {
			const colorStr = typeof e.color === 'number' ? `#${e.color.toString(16).padStart(6, '0')}` : e.color;
			return { ...e, color: colorStr };
		});

		setEmbeds(restoredEmbeds);
		setComponents(a.message?.components || []);
		setScheduledFor(a.scheduledFor ? new Date(a.scheduledFor).toISOString().slice(0, 16) : '');
		setIsOpen(true);
	};

	const handleCreateAnnouncement = () => {
		setEditingId(null);
		setTitle('');
		setChannelId('');
		setWebhookUrl('');
		setContent('');
		setEmbeds([]);
		setComponents([]);
		setScheduledFor('');
		setIsOpen(true);
	};

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col max-w-7xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row items-center justify-between">
				<div className="flex flex-col">
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text)">{t('admin.dashboard.announcements.title')}</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.announcements.subtitle')}</p>
				</div>
				<Button variant="primary" onClick={handleCreateAnnouncement}>
					<Plus size={16} /> {t('admin.dashboard.announcements.createButton')}
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{announcements.map((a) => (
					<AnnouncementCard key={a.id} announcement={a} onEdit={handleEditAnnouncement} onDelete={deleteAnnouncement} />
				))}
			</div>

			<AnnouncementModal
				open={isOpen}
				onOpenChange={setIsOpen}
				editingId={editingId}
				title={title}
				setTitle={setTitle}
				channelId={channelId}
				setChannelId={setChannelId}
				channels={channels}
				generateWebhook={generateWebhook}
				webhookUrl={webhookUrl}
				setWebhookUrl={setWebhookUrl}
				content={content}
				setContent={setContent}
				scheduledFor={scheduledFor}
				setScheduledFor={setScheduledFor}
				embeds={embeds}
				setEmbeds={setEmbeds}
				components={components}
				setComponents={setComponents}
				fillBoilerplate={fillBoilerplate}
				onSubmit={saveAnnouncement}
				saving={saving}
			/>

			<Confirm
				open={!!confirmDeleteId}
				onOpenChange={(open) => !open && setConfirmDeleteId(null)}
				title={t('admin.dashboard.announcements.title')}
				description={t('admin.dashboard.announcements.deleteConfirm')}
				variant="danger"
				onConfirm={confirmDeleteAnnouncement}
			/>
		</div>
	);
}
