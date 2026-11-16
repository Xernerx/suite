/** @format */
'use client';

import React from 'react';
import { Calendar, CheckCircle2, Gift, Plus, RefreshCw, Sparkles, Users } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import type { GiveawayItem, GiveawayPrize, GiveawayRequirements, SelectOption } from './types';

export type GiveawayStatusFilter = 'all' | 'active' | 'scheduled' | 'ended' | 'cancelled';

export interface GiveawayStoreItemRef {
	id: string;
	name: string;
	itemType?: string;
	creditAmount?: number;
	durationDays?: number;
}

export const DEFAULT_REQUIREMENTS: GiveawayRequirements = {
	requireAccount: false,
	requireVerified: false,
	requireActivePass: false,
	minGlobalLevel: 0,
	minStreak: 0,
	minTotalSpent: 0,
	roleMatchMode: 'any',
	requiredDiscordRoleIds: [],
	excludedDiscordRoleIds: [],
	requiredBadgeOrItemIds: [],
};

export const DEFAULT_PRIZE: GiveawayPrize = {
	type: 'credits',
	label: '1,000 Xernerx Credits',
	creditAmount: 1000,
	storeItemId: '',
	durationDays: 30,
	discordRoleId: '',
	customPrizeValue: '',
};

export function toLocalInputString(iso?: string | null) {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export async function fetchGiveawayGuildAndStoreMetadata(getEnvUrl: (url: string) => string): Promise<{
	storeItems?: GiveawayStoreItemRef[];
	channels?: SelectOption[];
	roles?: SelectOption[];
}> {
	const result: { storeItems?: GiveawayStoreItemRef[]; channels?: SelectOption[]; roles?: SelectOption[] } = {};

	const [settingRes, storeRes] = await Promise.all([
		fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_server_id'), { credentials: 'include' }).catch(() => null),
		fetch(getEnvUrl('https://api.xernerx.com/secure/store/items'), { credentials: 'include' }).catch(() => null),
	]);

	if (storeRes?.ok) {
		const itemsData = await storeRes.json();
		if (Array.isArray(itemsData)) result.storeItems = itemsData;
	}

	let guildId = '687429190165069838';
	if (settingRes?.ok) {
		const settingData = await settingRes.json();
		if (settingData?.value) guildId = String(settingData.value);
	}

	const [channelsRes, guildRes, rolesRes] = await Promise.all([
		fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${guildId}/discord/channels`)).catch(() => null),
		fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}`), { credentials: 'include' }).catch(() => null),
		fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${guildId}/discord/roles`)).catch(() => null),
	]);

	let rawChannels: any[] = [];
	if (channelsRes?.ok) {
		const chData = await channelsRes.json().catch(() => null);
		if (Array.isArray(chData)) rawChannels = chData;
	}
	if (rawChannels.length === 0 && guildRes?.ok) {
		const guildData = await guildRes.json().catch(() => null);
		if (Array.isArray(guildData?.channels)) rawChannels = guildData.channels;
	}

	if (rawChannels.length > 0) {
		result.channels = rawChannels
			.filter((c: any) => c?.id && c?.name && (c.type === undefined || [0, 5, 15, 16].includes(Number(c.type))))
			.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
			.map((c: any) => ({ label: `#${String(c.name).replace(/^#/, '')}`, value: String(c.id) }));
	}

	if (rolesRes?.ok) {
		const rolesData = await rolesRes.json().catch(() => null);
		if (Array.isArray(rolesData)) {
			result.roles = rolesData
				.filter((r: any) => r?.name && r.name !== '@everyone')
				.sort((a: any, b: any) => (b.position ?? 0) - (a.position ?? 0))
				.map((r: any) => ({ label: `@${String(r.name).replace(/^@/, '')}`, value: String(r.id) }));
		}
	}

	return result;
}

interface GiveawaysToolbarProps {
	refreshing: boolean;
	onRefresh: () => void;
	onCreate: () => void;
	kpis: { active: number; scheduled: number; ended: number; totalEntrants: number };
	search: string;
	setSearch: (v: string) => void;
	statusFilter: GiveawayStatusFilter;
	setStatusFilter: (v: GiveawayStatusFilter) => void;
}

export function GiveawaysToolbar({ refreshing, onRefresh, onCreate, kpis, search, setSearch, statusFilter, setStatusFilter }: GiveawaysToolbarProps) {
	const { t } = useDictionary();

	return (
		<>
			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div className="flex flex-col">
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.dashboard.giveaways.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.giveaways.subtitle')}</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="secondary" onClick={onRefresh} disabled={refreshing}>
						<RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
						{t('common.refresh')}
					</Button>
					<Button variant="primary" onClick={onCreate}>
						<Plus size={16} />
						{t('admin.dashboard.giveaways.createButton')}
					</Button>
				</div>
			</div>

			{/* KPI Strip */}
			<div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
				{[
					{ label: t('admin.dashboard.giveaways.kpis.active'), value: kpis.active, icon: Sparkles },
					{ label: t('admin.dashboard.giveaways.kpis.totalEntrants'), value: kpis.totalEntrants.toLocaleString(), icon: Users },
					{ label: t('admin.dashboard.giveaways.kpis.scheduled'), value: kpis.scheduled, icon: Calendar },
					{ label: t('admin.dashboard.giveaways.kpis.completed'), value: kpis.ended, icon: CheckCircle2 },
				].map((kpi, idx) => {
					const Icon = kpi.icon;
					return (
						<div key={idx} className="flex items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-4 shadow-sm">
							<div className="flex flex-col">
								<span className="text-xs font-semibold text-(--text-muted)">{kpi.label}</span>
								<span className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{kpi.value}
								</span>
							</div>
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 border border-(--accent)/30 text-(--accent)">
								<Icon size={18} />
							</div>
						</div>
					);
				})}
			</div>

			{/* Search & Status Filter */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
				<div className="relative flex-1">
					<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.dashboard.giveaways.searchPlaceholder')} />
				</div>
				<div className="w-full sm:w-52">
					<Selector
						value={statusFilter}
						onChange={(val) => setStatusFilter(val as GiveawayStatusFilter)}
						options={[
							{ label: t('admin.dashboard.giveaways.filters.all'), value: 'all' },
							{ label: t('admin.dashboard.giveaways.status.active'), value: 'active' },
							{ label: t('admin.dashboard.giveaways.status.scheduled'), value: 'scheduled' },
							{ label: t('admin.dashboard.giveaways.status.ended'), value: 'ended' },
							{ label: t('admin.dashboard.giveaways.status.cancelled'), value: 'cancelled' },
						]}
					/>
				</div>
			</div>
		</>
	);
}

export function GiveawaysEmptyState({ onCreate }: { onCreate: () => void }) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md py-16 px-6 text-center">
			<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/15 border border-(--accent)/30 text-(--accent) mb-3">
				<Gift size={26} />
			</div>
			<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('admin.dashboard.giveaways.emptyTitle')}
			</h3>
			<p className="text-xs text-(--text-muted) max-w-md mt-1 mb-4">{t('admin.dashboard.giveaways.emptySubtitle')}</p>
			<Button variant="primary" onClick={onCreate}>
				<Plus size={16} />
				{t('admin.dashboard.giveaways.createButton')}
			</Button>
		</div>
	);
}

interface GiveawayConfirmModalProps {
	confirmAction: { type: 'end_now' | 'cancel' | 'delete'; giveaway: GiveawayItem } | null;
	onClose: () => void;
	onConfirm: () => void;
}

export function GiveawayConfirmModal({ confirmAction, onClose, onConfirm }: GiveawayConfirmModalProps) {
	const { t } = useDictionary();

	return (
		<Confirm
			open={Boolean(confirmAction)}
			onOpenChange={(open) => !open && onClose()}
			variant={confirmAction?.type === 'delete' ? 'danger' : confirmAction?.type === 'cancel' ? 'warning' : 'primary'}
			title={
				confirmAction?.type === 'end_now'
					? t('admin.dashboard.giveaways.confirm.endNowTitle')
					: confirmAction?.type === 'cancel'
						? t('admin.dashboard.giveaways.confirm.cancelTitle')
						: t('admin.dashboard.giveaways.confirm.deleteTitle')
			}
			description={
				confirmAction?.type === 'end_now'
					? t('admin.dashboard.giveaways.confirm.endNowDesc', { title: confirmAction?.giveaway.title || '' })
					: confirmAction?.type === 'cancel'
						? t('admin.dashboard.giveaways.confirm.cancelDesc', { title: confirmAction?.giveaway.title || '' })
						: t('admin.dashboard.giveaways.confirm.deleteDesc', { title: confirmAction?.giveaway.title || '' })
			}
			confirmText={
				confirmAction?.type === 'end_now'
					? t('admin.dashboard.giveaways.actions.drawNow')
					: confirmAction?.type === 'cancel'
						? t('admin.dashboard.giveaways.actions.cancelGiveaway')
						: t('common.delete')
			}
			onConfirm={onConfirm}
		/>
	);
}
