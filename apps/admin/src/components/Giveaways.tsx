/** @format */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Gift, Plus, RefreshCw, Sparkles, Users } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import type { BonusEntryRule, GiveawayItem, GiveawayPrize, GiveawayRequirements, SelectOption } from './giveaways/types';
import { GiveawayCard } from './giveaways/GiveawayCard';
import { GiveawayModal } from './giveaways/GiveawayModal';
import { GiveawayEntrantsModal } from './giveaways/GiveawayEntrantsModal';

const DEFAULT_REQUIREMENTS: GiveawayRequirements = {
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

const DEFAULT_PRIZE: GiveawayPrize = {
	type: 'credits',
	label: '1,000 Xernerx Credits',
	creditAmount: 1000,
	storeItemId: '',
	durationDays: 30,
	discordRoleId: '',
	customPrizeValue: '',
};

export default function Giveaways() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();

	const [giveaways, setGiveaways] = useState<GiveawayItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const [channels, setChannels] = useState<SelectOption[]>([]);
	const [roles, setRoles] = useState<SelectOption[]>([]);
	const [storeItems, setStoreItems] = useState<Array<{ id: string; name: string; itemType?: string; creditAmount?: number; durationDays?: number }>>([]);

	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'ended' | 'cancelled'>('all');

	// Modal & Form States
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [bannerUrl, setBannerUrl] = useState('');
	const [winnerCount, setWinnerCount] = useState(1);
	const [startsAt, setStartsAt] = useState('');
	const [endsAt, setEndsAt] = useState('');
	const [channelId, setChannelId] = useState('');
	const [pingRoleId, setPingRoleId] = useState('');
	const [showOnWeb, setShowOnWeb] = useState(true);
	const [targetApps, setTargetApps] = useState<string[]>(['all']);
	const [prize, setPrize] = useState<GiveawayPrize>(DEFAULT_PRIZE);
	const [requirements, setRequirements] = useState<GiveawayRequirements>(DEFAULT_REQUIREMENTS);
	const [bonusEntries, setBonusEntries] = useState<BonusEntryRule[]>([]);

	// Inspector & Confirm Dialog States
	const [inspectingGiveawayId, setInspectingGiveawayId] = useState<string | null>(null);
	const [confirmAction, setConfirmAction] = useState<{
		type: 'end_now' | 'cancel' | 'delete';
		giveaway: GiveawayItem;
	} | null>(null);

	const fetchMetadata = useCallback(async () => {
		if (!isReady) return;
		try {
			const [settingRes, storeRes] = await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_server_id'), { credentials: 'include' }).catch(() => null),
				fetch(getEnvUrl('https://api.xernerx.com/secure/store/items'), { credentials: 'include' }).catch(() => null),
			]);

			if (storeRes?.ok) {
				const itemsData = await storeRes.json();
				if (Array.isArray(itemsData)) setStoreItems(itemsData);
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
				const mappedChannels = rawChannels
					.filter((c: any) => c?.id && c?.name && (c.type === undefined || [0, 5, 15, 16].includes(Number(c.type))))
					.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
					.map((c: any) => ({ label: `#${String(c.name).replace(/^#/, '')}`, value: String(c.id) }));
				setChannels(mappedChannels);
			}

			if (rolesRes?.ok) {
				const rolesData = await rolesRes.json().catch(() => null);
				if (Array.isArray(rolesData)) {
					setRoles(
						rolesData
							.filter((r: any) => r?.name && r.name !== '@everyone')
							.sort((a: any, b: any) => (b.position ?? 0) - (a.position ?? 0))
							.map((r: any) => ({ label: `@${String(r.name).replace(/^@/, '')}`, value: String(r.id) }))
					);
				}
			}
		} catch (err) {
			console.error('Failed to fetch giveaway metadata:', err);
		}
	}, [getEnvUrl, isReady]);

	const fetchGiveaways = useCallback(
		async (isManual = false) => {
			if (!isReady) return;
			if (isManual) setRefreshing(true);
			else setLoading(true);
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/giveaways'), { credentials: 'include' });
				if (res.ok) {
					const data = await res.json();
					setGiveaways(Array.isArray(data) ? data : []);
				}
			} catch (err) {
				console.error('Failed to fetch giveaways:', err);
			} finally {
				setLoading(false);
				setRefreshing(false);
			}
		},
		[getEnvUrl, isReady]
	);

	useEffect(() => {
		fetchGiveaways();
		fetchMetadata();
	}, [fetchGiveaways, fetchMetadata]);

	const toLocalInputString = (iso?: string | null) => {
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
	};

	const handleOpenCreate = () => {
		if (channels.length === 0 || roles.length === 0) {
			fetchMetadata();
		}
		const now = new Date();
		const in3Days = new Date(now.getTime() + 3 * 24 * 3600_000);
		setEditingId(null);
		setTitle('');
		setDescription('');
		setBannerUrl('');
		setWinnerCount(1);
		setStartsAt(toLocalInputString(now.toISOString()));
		setEndsAt(toLocalInputString(in3Days.toISOString()));
		setChannelId(channels[0]?.value || '');
		setPingRoleId('');
		setShowOnWeb(true);
		setTargetApps(['all']);
		setPrize(DEFAULT_PRIZE);
		setRequirements(DEFAULT_REQUIREMENTS);
		setBonusEntries([]);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (g: GiveawayItem) => {
		if (channels.length === 0 || roles.length === 0) {
			fetchMetadata();
		}
		setEditingId(g.id);
		setTitle(g.title || '');
		setDescription(g.description || '');
		setBannerUrl(g.bannerUrl || '');
		setWinnerCount(g.winnerCount || 1);
		setStartsAt(toLocalInputString(g.startsAt));
		setEndsAt(toLocalInputString(g.endsAt));
		setChannelId(g.channelId || '');
		setPingRoleId(g.pingRoleId || '');
		setShowOnWeb(g.showOnWeb !== false);
		setTargetApps(Array.isArray(g.targetApps) && g.targetApps.length > 0 ? g.targetApps : ['all']);
		setPrize({
			type: g.prize?.type || 'credits',
			label: g.prize?.label || g.title,
			creditAmount: g.prize?.creditAmount || 0,
			storeItemId: g.prize?.storeItemId || '',
			durationDays: g.prize?.durationDays || 0,
			discordRoleId: g.prize?.discordRoleId || '',
			customPrizeValue: g.prize?.customPrizeValue || '',
		});
		setRequirements({
			...DEFAULT_REQUIREMENTS,
			...(g.requirements || {}),
		});
		setBonusEntries(Array.isArray(g.bonusEntries) ? g.bonusEntries : []);
		setIsModalOpen(true);
	};

	const handleSaveGiveaway = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const payload = {
				title,
				description,
				bannerUrl,
				winnerCount,
				startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
				endsAt: endsAt ? new Date(endsAt).toISOString() : new Date(Date.now() + 72 * 3600_000).toISOString(),
				channelId,
				pingRoleId,
				showOnWeb,
				targetApps: targetApps.length > 0 ? targetApps : ['all'],
				prize,
				requirements,
				bonusEntries,
			};

			const url = editingId ? getEnvUrl(`https://api.xernerx.com/secure/giveaways/${editingId}`) : getEnvUrl('https://api.xernerx.com/secure/giveaways');
			const res = await fetch(url, {
				method: editingId ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('admin.dashboard.giveaways.toasts.saveFailed'));
			}

			toast({
				type: 'success',
				title: editingId ? t('admin.dashboard.giveaways.toasts.updated') : t('admin.dashboard.giveaways.toasts.created'),
			});
			setIsModalOpen(false);
			fetchGiveaways(true);
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.giveaways.toasts.saveFailed'), description: err.message });
		} finally {
			setSaving(false);
		}
	};

	const handleReroll = async (g: GiveawayItem, replaceUserId?: string) => {
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/giveaways/${g.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'reroll', replaceUserId }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || t('admin.dashboard.giveaways.toasts.rerollFailed'));
			toast({ type: 'success', title: t('admin.dashboard.giveaways.toasts.rerolled') });
			fetchGiveaways(true);
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.giveaways.toasts.rerollFailed'), description: err.message });
		}
	};

	const handleFulfillWinner = async (g: GiveawayItem, winnerUserId: string) => {
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/giveaways/${g.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'fulfill_winner', winnerUserId }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || t('admin.dashboard.giveaways.toasts.fulfillFailed'));
			toast({ type: 'success', title: t('admin.dashboard.giveaways.toasts.fulfilled') });
			fetchGiveaways(true);
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.giveaways.toasts.fulfillFailed'), description: err.message });
		}
	};

	const executeConfirmedAction = async () => {
		if (!confirmAction) return;
		const { type, giveaway } = confirmAction;
		setConfirmAction(null);

		try {
			if (type === 'delete') {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/giveaways/${giveaway.id}`), {
					method: 'DELETE',
					credentials: 'include',
				});
				if (!res.ok) throw new Error('Delete failed');
				toast({ type: 'success', title: t('admin.dashboard.giveaways.toasts.deleted') });
			} else {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/giveaways/${giveaway.id}`), {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ action: type }),
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(data.error || 'Action failed');
				toast({
					type: 'success',
					title: type === 'end_now' ? t('admin.dashboard.giveaways.toasts.drawn') : t('admin.dashboard.giveaways.toasts.cancelled'),
				});
			}
			fetchGiveaways(true);
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.giveaways.toasts.actionFailed'), description: err.message });
		}
	};

	const filteredGiveaways = useMemo(() => {
		const q = search.trim().toLowerCase();
		return giveaways.filter((g) => {
			if (statusFilter !== 'all' && g.status !== statusFilter) return false;
			if (!q) return true;
			return (
				String(g.title || '')
					.toLowerCase()
					.includes(q) ||
				String(g.description || '')
					.toLowerCase()
					.includes(q) ||
				String(g.prize?.label || '')
					.toLowerCase()
					.includes(q)
			);
		});
	}, [giveaways, search, statusFilter]);

	const kpis = useMemo(() => {
		const active = giveaways.filter((g) => g.status === 'active').length;
		const scheduled = giveaways.filter((g) => g.status === 'scheduled').length;
		const ended = giveaways.filter((g) => g.status === 'ended').length;
		const totalEntrants = giveaways.reduce((sum, g) => sum + (Array.isArray(g.entries) ? g.entries.length : 0), 0);
		return { active, scheduled, ended, totalEntrants };
	}, [giveaways]);

	const inspectingGiveaway = useMemo(() => giveaways.find((g) => g.id === inspectingGiveawayId) || null, [giveaways, inspectingGiveawayId]);

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div className="flex flex-col">
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.dashboard.giveaways.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.giveaways.subtitle')}</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="secondary" onClick={() => fetchGiveaways(true)} disabled={refreshing}>
						<RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
						{t('common.refresh')}
					</Button>
					<Button variant="primary" onClick={handleOpenCreate}>
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
						onChange={(val) => setStatusFilter(val as any)}
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

			{/* Cards Grid */}
			{filteredGiveaways.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md py-16 px-6 text-center">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/15 border border-(--accent)/30 text-(--accent) mb-3">
						<Gift size={26} />
					</div>
					<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.dashboard.giveaways.emptyTitle')}
					</h3>
					<p className="text-xs text-(--text-muted) max-w-md mt-1 mb-4">{t('admin.dashboard.giveaways.emptySubtitle')}</p>
					<Button variant="primary" onClick={handleOpenCreate}>
						<Plus size={16} />
						{t('admin.dashboard.giveaways.createButton')}
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
					{filteredGiveaways.map((g) => (
						<GiveawayCard
							key={g.id}
							giveaway={g}
							channels={channels}
							roles={roles}
							onEdit={handleOpenEdit}
							onInspectEntrants={(item) => setInspectingGiveawayId(item.id)}
							onEndNow={(item) => setConfirmAction({ type: 'end_now', giveaway: item })}
							onReroll={handleReroll}
							onFulfillWinner={handleFulfillWinner}
							onCancel={(item) => setConfirmAction({ type: 'cancel', giveaway: item })}
							onDelete={(item) => setConfirmAction({ type: 'delete', giveaway: item })}
						/>
					))}
				</div>
			)}

			<GiveawayModal
				isOpen={isModalOpen}
				onOpenChange={setIsModalOpen}
				editingId={editingId}
				saving={saving}
				title={title}
				setTitle={setTitle}
				description={description}
				setDescription={setDescription}
				bannerUrl={bannerUrl}
				setBannerUrl={setBannerUrl}
				winnerCount={winnerCount}
				setWinnerCount={setWinnerCount}
				startsAt={startsAt}
				setStartsAt={setStartsAt}
				endsAt={endsAt}
				setEndsAt={setEndsAt}
				channelId={channelId}
				setChannelId={setChannelId}
				pingRoleId={pingRoleId}
				setPingRoleId={setPingRoleId}
				showOnWeb={showOnWeb}
				setShowOnWeb={setShowOnWeb}
				targetApps={targetApps}
				setTargetApps={setTargetApps}
				prize={prize}
				setPrize={setPrize}
				requirements={requirements}
				setRequirements={setRequirements}
				bonusEntries={bonusEntries}
				setBonusEntries={setBonusEntries}
				channels={channels}
				roles={roles}
				storeItems={storeItems}
				onSubmit={handleSaveGiveaway}
			/>

			<GiveawayEntrantsModal giveaway={inspectingGiveaway} onClose={() => setInspectingGiveawayId(null)} onReroll={handleReroll} onFulfillWinner={handleFulfillWinner} />

			<Confirm
				open={Boolean(confirmAction)}
				onOpenChange={(open) => !open && setConfirmAction(null)}
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
				onConfirm={executeConfirmedAction}
			/>
		</div>
	);
}
