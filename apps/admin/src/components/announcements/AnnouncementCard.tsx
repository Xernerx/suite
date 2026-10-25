/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Send, CalendarClock, Clock, Layers } from 'lucide-react';
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
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 30000);
		return () => clearInterval(interval);
	}, []);

	const effectiveStartsAt = a.startsAt || a.scheduledFor || null;
	const startsMs = effectiveStartsAt ? new Date(effectiveStartsAt).getTime() : null;
	const expiresMs = a.expiresAt ? new Date(a.expiresAt).getTime() : null;

	const isFutureStart = Boolean(startsMs && !Number.isNaN(startsMs) && startsMs > now);
	const isActiveWithExpiry = Boolean(!isFutureStart && expiresMs && !Number.isNaN(expiresMs) && expiresMs > now);
	const isExpired = Boolean(expiresMs && !Number.isNaN(expiresMs) && expiresMs <= now);

	const formatRemaining = (targetMs: number) => {
		const totalMins = Math.max(1, Math.floor((targetMs - now) / 60000));
		const hours = Math.floor(totalMins / 60);
		const minutes = totalMins % 60;
		return { hours, minutes, time: `${hours}h ${minutes}m` };
	};

	const targetApps = Array.isArray(a.targetApps) && a.targetApps.length > 0 ? a.targetApps : ['all'];

	return (
		<div className="relative overflow-hidden rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-6 flex flex-col gap-3 shadow-sm">
			<div className="flex justify-between items-start gap-2">
				<div className="flex flex-col gap-1.5 min-w-0">
					<h3 className="font-semibold text-(--text) truncate">{a.title}</h3>
					<div className="flex flex-wrap items-center gap-1.5">
						{isFutureStart && startsMs && (
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-(--accent-orange)/15 text-(--accent-orange) border border-(--accent-orange)/30">
								<Clock size={11} />
								{t('admin.dashboard.announcements.startsIn', formatRemaining(startsMs))}
							</span>
						)}
						{isActiveWithExpiry && expiresMs && (
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
								<Clock size={11} />
								{t('admin.dashboard.announcements.expiresIn', formatRemaining(expiresMs))}
							</span>
						)}
						{isExpired && (
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-(--accent-red)/15 text-(--accent-red) border border-(--accent-red)/30">
								<Clock size={11} />
								{t('admin.dashboard.announcements.expired')}
							</span>
						)}
					</div>
				</div>
				<div className="flex gap-2 shrink-0">
					<Button variant="ghost" size="icon" onClick={() => onEdit(a)}>
						<Edit2 size={16} />
					</Button>
					<Button variant="danger" size="icon" onClick={() => onDelete(a.id)}>
						<Trash2 size={16} />
					</Button>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-1.5">
				<Layers size={12} className="text-(--accent) shrink-0" />
				{targetApps.map((appKey) => (
					<span key={appKey} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--accent)/10 text-(--accent) border border-(--accent)/25">
						{t(`admin.dashboard.announcements.targetApps.${appKey}`)}
					</span>
				))}
			</div>

			<div className="flex flex-col gap-1 text-sm text-(--text-muted)">
				{a.sentAt ? (
					<div className="flex items-center gap-2 text-(--accent-green)">
						<Send size={14} /> {t('admin.dashboard.announcements.sentOn')} {new Date(a.sentAt).toLocaleDateString()}
					</div>
				) : (
					<div className="flex items-center gap-2 text-(--accent-orange)">
						<CalendarClock size={14} />{' '}
						{effectiveStartsAt ? `${t('admin.dashboard.announcements.scheduled')} ${new Date(effectiveStartsAt).toLocaleString()}` : t('admin.dashboard.announcements.draft')}
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
