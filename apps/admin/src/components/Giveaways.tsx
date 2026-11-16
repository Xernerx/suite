/** @format */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import type { BonusEntryRule, GiveawayItem, GiveawayPrize, GiveawayRequirements, SelectOption } from './giveaways/types';
import { GiveawayCard } from './giveaways/GiveawayCard';
import { GiveawayModal } from './giveaways/GiveawayModal';
import { GiveawayEntrantsModal } from './giveaways/GiveawayEntrantsModal';
import {
	DEFAULT_PRIZE,
	DEFAULT_REQUIREMENTS,
	fetchGiveawayGuildAndStoreMetadata,
	GiveawayConfirmModal,
	GiveawaysEmptyState,
	GiveawaysToolbar,
	toLocalInputString,
	type GiveawayStatusFilter,
	type GiveawayStoreItemRef,
} from './giveaways/GiveawaysToolbar';

export default function Giveaways() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();

	const [giveaways, setGiveaways] = useState<GiveawayItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const [channels, setChannels] = useState<SelectOption[]>([]);
	const [roles, setRoles] = useState<SelectOption[]>([]);
	const [storeItems, setStoreItems] = useState<GiveawayStoreItemRef[]>([]);

	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<GiveawayStatusFilter>('all');

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
			const meta = await fetchGiveawayGuildAndStoreMetadata(getEnvUrl);
			if (meta.storeItems) setStoreItems(meta.storeItems);
			if (meta.channels) setChannels(meta.channels);
			if (meta.roles) setRoles(meta.roles);
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
			<GiveawaysToolbar
				refreshing={refreshing}
				onRefresh={() => fetchGiveaways(true)}
				onCreate={handleOpenCreate}
				kpis={kpis}
				search={search}
				setSearch={setSearch}
				statusFilter={statusFilter}
				setStatusFilter={setStatusFilter}
			/>

			{filteredGiveaways.length === 0 ? (
				<GiveawaysEmptyState onCreate={handleOpenCreate} />
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

			<GiveawayConfirmModal confirmAction={confirmAction} onClose={() => setConfirmAction(null)} onConfirm={executeConfirmedAction} />
		</div>
	);
}
