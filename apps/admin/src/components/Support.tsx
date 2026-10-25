/** @format */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bot, CheckSquare, Hash, LifeBuoy, MessageSquare, RefreshCw } from 'lucide-react';
import { Button, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import type { BotDiscordProfile, DiscordChannelOption, DiscordRoleOption, RegisteredBotOption, SupportBotItem, SupportChannelItem, SupportServerOption, SupportTicketItem } from './support/types';
import { SupportTicketsTab } from './support/SupportTicketsTab';
import { SupportBotsTab, SupportChannelsTab, SupportChecklistTab } from './support/SupportConfigTabs';

type SupportTabId = 'tickets' | 'channels' | 'bots' | 'checklist';

export default function Support() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [activeTab, setActiveTab] = useState<SupportTabId>('tickets');
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

	const [servers, setServers] = useState<SupportServerOption[]>([]);
	const [activeGuildId, setActiveGuildId] = useState<string>('');
	const [channels, setChannels] = useState<SupportChannelItem[]>([]);
	const [bots, setBots] = useState<SupportBotItem[]>([]);
	const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
	const [checklist, setChecklist] = useState<string[]>([]);
	const [availableBots, setAvailableBots] = useState<RegisteredBotOption[]>([]);
	const [botProfiles, setBotProfiles] = useState<Record<string, BotDiscordProfile>>({});
	const [discordChannels, setDiscordChannels] = useState<DiscordChannelOption[]>([]);
	const [discordRoles, setDiscordRoles] = useState<DiscordRoleOption[]>([]);

	const hydrateBotProfiles = useCallback(
		async (botIds: string[]) => {
			const uniqueIds = Array.from(new Set(botIds.filter((id) => id && id.length >= 15)));
			if (uniqueIds.length === 0) return;

			const results = await Promise.all(
				uniqueIds.map(async (id) => {
					try {
						const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${id}/discord`));
						if (!res.ok) return null;
						const data = await res.json();
						if (!data || !data.id) return null;
						const avatarUrl =
							data.avatarUrl || (data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.${String(data.avatar).startsWith('a_') ? 'gif' : 'png'}?size=256` : null);
						const name = data.global_name || data.username || data.id;
						return {
							id: String(data.id),
							name: String(name),
							username: String(data.username || name),
							avatarUrl,
						} as BotDiscordProfile;
					} catch {
						return null;
					}
				})
			);

			setBotProfiles((prev) => {
				const next = { ...prev };
				for (const item of results) {
					if (item) next[item.id] = item;
				}
				return next;
			});
		},
		[getEnvUrl]
	);

	const fetchSupportData = useCallback(
		async (guildIdOverride?: string, isManual = false) => {
			if (isManual) setRefreshing(true);
			else setLoading(true);

			try {
				const query = guildIdOverride ? `?guildId=${encodeURIComponent(guildIdOverride)}` : '';
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/support${query}`), {
					credentials: 'include',
					cache: 'no-store',
				});

				if (!res.ok) {
					const err = await res.json().catch(() => ({}));
					throw new Error(err?.error || 'Failed to load support configuration');
				}

				const data = await res.json();
				const fetchedChannels: SupportChannelItem[] = Array.isArray(data.channels) ? data.channels : [];
				const fetchedBots: SupportBotItem[] = Array.isArray(data.bots) ? data.bots : [];
				const fetchedTickets: SupportTicketItem[] = Array.isArray(data.tickets) ? data.tickets : [];
				const fetchedAvailableBots: RegisteredBotOption[] = Array.isArray(data.availableBots) ? data.availableBots : [];

				setChannels(fetchedChannels);
				setBots(fetchedBots);
				setTickets(fetchedTickets);
				setChecklist(Array.isArray(data.checklist) ? data.checklist : []);
				setAvailableBots(fetchedAvailableBots);
				setServers(Array.isArray(data.servers) ? data.servers : []);

				if (data.activeGuild) {
					setActiveGuildId(data.activeGuild.id || '');
					setDiscordChannels(Array.isArray(data.activeGuild.channels) ? data.activeGuild.channels : []);
					setDiscordRoles(Array.isArray(data.activeGuild.roles) ? data.activeGuild.roles : []);
				}

				const allBotIds = [...fetchedBots.map((b) => b.id), ...fetchedAvailableBots.map((b) => b.id), ...fetchedTickets.map((tk) => tk.bot || '').filter(Boolean)];
				hydrateBotProfiles(allBotIds);
			} catch (error: any) {
				toast({
					type: 'error',
					title: t('admin.support.toasts.loadError'),
					description: error?.message,
				});
			} finally {
				setLoading(false);
				setRefreshing(false);
			}
		},
		[getEnvUrl, hydrateBotProfiles, t, toast]
	);

	useEffect(() => {
		fetchSupportData();
	}, [fetchSupportData]);

	const handleServerChange = (nextGuildId: string) => {
		setActiveGuildId(nextGuildId);
		fetchSupportData(nextGuildId, true);
	};

	const handleSaveChannel = async (payload: { id: string; guild: string; name?: string; role?: string; type: 'support' | 'status' }) => {
		setSaving(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/support'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ entity: 'channel', ...payload }),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err?.error || 'Failed to save support channel');
			}
			toast({ type: 'success', title: t('admin.support.toasts.channelSaved') });
			await fetchSupportData(activeGuildId, true);
		} catch (error: any) {
			toast({ type: 'error', title: t('admin.support.toasts.saveError'), description: error?.message });
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteChannel = async (channelId: string) => {
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/support/${encodeURIComponent(channelId)}?entity=channel`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed to remove support channel');
			toast({ type: 'success', title: t('admin.support.toasts.channelRemoved') });
			setChannels((prev) => prev.filter((c) => c.id !== channelId));
		} catch (error: any) {
			toast({ type: 'error', title: t('admin.support.toasts.deleteError'), description: error?.message });
		}
	};

	const handleAddBot = async (payload: { id: string; guild: string; name?: string; avatar?: string }) => {
		setSaving(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/support'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ entity: 'bot', ...payload }),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err?.error || 'Failed to add support bot');
			}
			toast({ type: 'success', title: t('admin.support.toasts.botAdded') });
			await fetchSupportData(activeGuildId, true);
		} catch (error: any) {
			toast({ type: 'error', title: t('admin.support.toasts.saveError'), description: error?.message });
		} finally {
			setSaving(false);
		}
	};

	const handleRemoveBot = async (botId: string, guildId: string) => {
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/support/${encodeURIComponent(botId)}?entity=bot&guild=${encodeURIComponent(guildId)}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed to remove support bot');
			toast({ type: 'success', title: t('admin.support.toasts.botRemoved') });
			setBots((prev) => prev.filter((b) => !(b.id === botId && b.guild === guildId)));
		} catch (error: any) {
			toast({ type: 'error', title: t('admin.support.toasts.deleteError'), description: error?.message });
		}
	};

	const handleSaveChecklist = async (items: string[]) => {
		setSaving(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/support'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ entity: 'checklist', items }),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err?.error || 'Failed to update checklist');
			}
			setChecklist(items);
			toast({ type: 'success', title: t('admin.support.toasts.checklistSaved') });
		} catch (error: any) {
			toast({ type: 'error', title: t('admin.support.toasts.saveError'), description: error?.message });
		} finally {
			setSaving(false);
		}
	};

	const handleUpdateTicketStatus = async (ticketId: string, status: SupportTicketItem['status']) => {
		setUpdatingTicketId(ticketId);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/support/${encodeURIComponent(ticketId)}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ entity: 'ticket', status }),
			});
			if (!res.ok) throw new Error('Failed to update ticket status');
			setTickets((prev) => prev.map((tk) => (tk.id === ticketId ? { ...tk, status } : tk)));
			toast({ type: 'success', title: t('admin.support.toasts.ticketUpdated') });
		} catch (error: any) {
			toast({ type: 'error', title: t('admin.support.toasts.saveError'), description: error?.message });
		} finally {
			setUpdatingTicketId(null);
		}
	};

	const handleDeleteTicket = async (ticketId: string) => {
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/support/${encodeURIComponent(ticketId)}?entity=ticket`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed to delete ticket');
			setTickets((prev) => prev.filter((tk) => tk.id !== ticketId));
			toast({ type: 'success', title: t('admin.support.toasts.ticketDeleted') });
		} catch (error: any) {
			toast({ type: 'error', title: t('admin.support.toasts.deleteError'), description: error?.message });
		}
	};

	if (loading) return <Loading />;

	const openTicketCount = tickets.filter((tk) => tk.status === 'open' || tk.status === 'on-hold').length;

	const tabs: { id: SupportTabId; label: string; count?: number; icon: any }[] = [
		{ id: 'tickets', label: t('admin.support.tabs.tickets'), count: openTicketCount, icon: MessageSquare },
		{ id: 'channels', label: t('admin.support.tabs.channels'), count: channels.length, icon: Hash },
		{ id: 'bots', label: t('admin.support.tabs.bots'), count: bots.length, icon: Bot },
		{ id: 'checklist', label: t('admin.support.tabs.checklist'), count: checklist.length, icon: CheckSquare },
	];

	return (
		<div className="flex flex-col w-full" style={{ gap: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col lg:flex-row lg:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex items-start gap-3.5">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shadow-sm">
						<LifeBuoy size={24} />
					</div>
					<div className="flex flex-col">
						<h1 className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('admin.support.title')}
						</h1>
						<p className="text-xs sm:text-sm text-(--text-muted)">{t('admin.support.description')}</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					{servers.length > 0 && (
						<div className="w-60">
							<Selector
								value={activeGuildId}
								onChange={handleServerChange}
								options={servers.map((s) => ({
									label: `${s.name} (${s.id})`,
									value: s.id,
								}))}
							/>
						</div>
					)}
					<Button variant="secondary" onClick={() => fetchSupportData(activeGuildId, true)} disabled={refreshing}>
						<RefreshCw size={15} className={`mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
						{t('admin.support.refreshButton')}
					</Button>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
								isActive ? 'bg-(--accent) text-white border-(--accent) shadow-sm' : 'bg-(--foreground)/30 text-(--text-muted) border-(--border)/10 hover:text-(--text)'
							}`}
						>
							<Icon size={16} />
							<span>{tab.label}</span>
							{tab.count !== undefined && (
								<span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-(--background)/60 text-(--text)'}`}>{tab.count}</span>
							)}
						</button>
					);
				})}
			</div>

			{activeTab === 'tickets' && (
				<SupportTicketsTab
					tickets={tickets}
					bots={bots}
					botProfiles={botProfiles}
					checklist={checklist}
					updatingTicketId={updatingTicketId}
					onUpdateStatus={handleUpdateTicketStatus}
					onDeleteTicket={handleDeleteTicket}
				/>
			)}

			{activeTab === 'channels' && (
				<SupportChannelsTab
					activeGuildId={activeGuildId}
					channels={channels}
					discordChannels={discordChannels}
					discordRoles={discordRoles}
					saving={saving}
					onSaveChannel={handleSaveChannel}
					onDeleteChannel={handleDeleteChannel}
				/>
			)}

			{activeTab === 'bots' && (
				<SupportBotsTab
					activeGuildId={activeGuildId}
					bots={bots}
					availableBots={availableBots}
					botProfiles={botProfiles}
					getEnvUrl={getEnvUrl}
					saving={saving}
					onAddBot={handleAddBot}
					onRemoveBot={handleRemoveBot}
				/>
			)}

			{activeTab === 'checklist' && <SupportChecklistTab checklist={checklist} saving={saving} onSaveChecklist={handleSaveChecklist} />}
		</div>
	);
}
