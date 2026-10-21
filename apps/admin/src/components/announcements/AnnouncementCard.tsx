/** @format */
'use client';

import React from 'react';
import { Edit2, Trash2, Send, CalendarClock } from 'lucide-react';
import { Button } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { AnnouncementItem } from './types';

interface AnnouncementCardProps {
	announcement: AnnouncementItem;
	onEdit: (announcement: AnnouncementItem) => void;
	onDelete: (id: string) => void;
}

export function AnnouncementCard({ announcement: a, onEdit, onDelete }: AnnouncementCardProps) {
	const { t } = useDictionary();

	return (
		<div className="relative overflow-hidden rounded-[2rem] border border-(--border)/10 bg-(--foreground)/30 p-6 flex flex-col gap-3">
			<div className="flex justify-between items-start">
				<h3 className="font-semibold text-(--text)">{a.title}</h3>
				<div className="flex gap-2">
					<Button variant="ghost" size="icon" onClick={() => onEdit(a)}>
						<Edit2 size={16} />
					</Button>
					<Button variant="danger" size="icon" onClick={() => onDelete(a.id)}>
						<Trash2 size={16} />
					</Button>
				</div>
			</div>

			<div className="flex flex-col gap-1 text-sm text-(--text-muted)">
				{a.sentAt ? (
					<div className="flex items-center gap-2 text-(--accent-green)">
						<Send size={14} /> {t('admin.dashboard.announcements.sentOn')} {new Date(a.sentAt).toLocaleDateString()}
					</div>
				) : (
					<div className="flex items-center gap-2 text-(--accent-orange)">
						<CalendarClock size={14} />{' '}
						{a.scheduledFor ? `${t('admin.dashboard.announcements.scheduled')} ${new Date(a.scheduledFor).toLocaleString()}` : t('admin.dashboard.announcements.draft')}
					</div>
				)}
				{a.channelId && (
					<div className="text-xs">
						{t('admin.dashboard.announcements.channel')} {a.channelId}
					</div>
				)}
			</div>
		</div>
	);
}
