/** @format */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, RefreshCw, Save, Sparkles, Trash2 } from 'lucide-react';
import { Button, Confirm, Input, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import type { ServerBotProfilesResponse } from './types';
import { ServerYourAppsBotSection } from './ServerYourAppsBotSection';

interface ServerBotProfilesTabProps {
	serverId: string;
	serverName: string;
	getEnvUrl: (url: string) => string;
}

export function ServerBotProfilesTab({ serverId, serverName, getEnvUrl }: ServerBotProfilesTabProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const [data, setData] = useState<ServerBotProfilesResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedBot, setSelectedBot] = useState<'virtue' | 'yourapps'>('virtue');

	// Virtue Server Config State
	const [mode, setMode] = useState<'easy' | 'casual' | 'balanced' | 'hard' | 'extreme'>('balanced');
	const [xpMultiplier, setXpMultiplier] = useState(1);
	const [boosterMultiplier, setBoosterMultiplier] = useState(1);
	const [autoDelete, setAutoDelete] = useState(0);
	const [levelMessage, setLevelMessage] = useState('');
	const [stackRoles, setStackRoles] = useState(true);
	const [levelUp, setLevelUp] = useState(true);
	const [dynamicRolesEnabled, setDynamicRolesEnabled] = useState(false);
	const [cycleDaily, setCycleDaily] = useState(false);
	const [cycleWeekly, setCycleWeekly] = useState(false);
	const [cycleMonthly, setCycleMonthly] = useState(false);
	const [savingConfig, setSavingConfig] = useState(false);

	const [confirmWipeVirtue, setConfirmWipeVirtue] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${serverId}/bots`), {
				credentials: 'include',
				cache: 'no-store',
			});
			if (!res.ok) throw new Error('Failed to load server bot profiles');
			const json: ServerBotProfilesResponse = await res.json();
			setData(json);
			setSelectedBot((prev) => {
				if (json.bots.includes(prev)) return prev;
				return json.bots[0] || 'virtue';
			});
			setMode(json.virtue.config.mode || 'balanced');
			setXpMultiplier(json.virtue.config.xpMultiplier ?? 1);
			setBoosterMultiplier(json.virtue.config.boosterMultiplier ?? 1);
			setAutoDelete(json.virtue.config.autoDelete ?? 0);
			setLevelMessage(json.virtue.config.levelMessage || '');
			setStackRoles(json.virtue.config.stackRoles);
			setLevelUp(json.virtue.config.levelUp);
			setDynamicRolesEnabled(json.virtue.config.dynamicRolesEnabled);
			setCycleDaily(Boolean(json.virtue.config.cycles?.daily));
			setCycleWeekly(Boolean(json.virtue.config.cycles?.weekly));
			setCycleMonthly(Boolean(json.virtue.config.cycles?.monthly));
		} catch {
			toast({ type: 'error', title: t('admin.servers.botProfiles.loadError') });
		} finally {
			setLoading(false);
		}
	}, [serverId, getEnvUrl, toast, t]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const botOptions = useMemo(() => {
		const vActive = Boolean(data?.virtue?.hasData);
		const yActive = Boolean(data?.yourapps?.hasData);
		return [
			{
				value: 'virtue',
				label: t('admin.servers.botProfiles.virtueOptionLabel'),
				badge: (
					<span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${vActive ? 'bg-(--accent-green)/15 text-(--accent-green)' : 'bg-(--border)/15 text-(--text-muted)'}`}>
						{vActive ? t('admin.servers.botProfiles.membersCountBadge', { count: data?.virtue?.membersCount ?? 0 }) : t('admin.servers.botProfiles.inactiveBadge')}
					</span>
				),
			},
			{
				value: 'yourapps',
				label: t('admin.servers.botProfiles.yourappsOptionLabel'),
				badge: (
					<span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${yActive ? 'bg-(--accent-green)/15 text-(--accent-green)' : 'bg-(--border)/15 text-(--text-muted)'}`}>
						{yActive ? t('admin.servers.botProfiles.formsCountBadge', { count: data?.yourapps?.forms.length ?? 0 }) : t('admin.servers.botProfiles.inactiveBadge')}
					</span>
				),
			},
		];
	}, [data, t]);

	const handleSaveVirtueConfig = async () => {
		setSavingConfig(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${serverId}/bots`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					action: 'update_virtue_config',
					mode,
					xpMultiplier,
					boosterMultiplier,
					autoDelete,
					levelMessage,
					stackRoles,
					levelUp,
					dynamicRolesEnabled,
					cycles: {
						daily: cycleDaily,
						weekly: cycleWeekly,
						monthly: cycleMonthly,
					},
				}),
			});
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('admin.servers.botProfiles.saveSuccess') });
			await loadData();
		} catch {
			toast({ type: 'error', title: t('admin.servers.botProfiles.saveError') });
		} finally {
			setSavingConfig(false);
		}
	};

	const handleConfirmWipeVirtue = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${serverId}/bots?bot=virtue`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('admin.servers.botProfiles.deleteSuccess') });
			setConfirmWipeVirtue(false);
			await loadData();
		} catch {
			toast({ type: 'error', title: t('admin.servers.botProfiles.deleteError') });
		} finally {
			setDeleting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center py-10">
				<Loading variant="small" />
			</div>
		);
	}

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* Bot Selector Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 rounded-3xl border border-(--border)/10 bg-(--background)/50 p-4">
				<div className="flex-1 flex flex-col gap-1.5 min-w-0">
					<label className="text-xs font-bold text-(--text) flex items-center gap-1.5">
						<Bot size={14} className="text-(--accent)" />
						{t('admin.servers.botProfiles.selectBotLabel')}
					</label>
					<Selector value={selectedBot} onChange={(val) => setSelectedBot(val as 'virtue' | 'yourapps')} options={botOptions} />
				</div>
				<Button type="button" variant="secondary" size="sm" onClick={loadData} className="flex items-center gap-1.5 h-10 shrink-0">
					<RefreshCw size={13} />
					<span>{t('admin.users.refresh')}</span>
				</Button>
			</div>

			{selectedBot === 'virtue' && data && (
				<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-4" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent)">
								<Sparkles size={16} />
							</span>
							<div>
								<h4 className="text-sm font-extrabold text-(--text)">{t('admin.servers.botProfiles.virtueConfigTitle')}</h4>
								<p className="text-xs text-(--text-muted)">
									{t('admin.servers.botProfiles.virtueConfigSummary', {
										members: data.virtue.membersCount,
										roles: data.virtue.config.levelRolesCount,
									})}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							{data.virtue.hasData && (
								<Button type="button" variant="danger" size="sm" onClick={() => setConfirmWipeVirtue(true)} className="flex items-center gap-1.5">
									<Trash2 size={13} />
									<span>{t('admin.servers.botProfiles.wipeBotData')}</span>
								</Button>
							)}
							<Button type="button" variant="primary" size="sm" loading={savingConfig} onClick={handleSaveVirtueConfig} className="flex items-center gap-1.5">
								<Save size={13} />
								<span>{t('common.actions.saveChanges')}</span>
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text)">{t('admin.servers.botProfiles.difficultyModeLabel')}</label>
							<Selector
								value={mode}
								onChange={(val) => setMode(val as any)}
								options={[
									{ value: 'easy', label: 'Easy' },
									{ value: 'casual', label: 'Casual' },
									{ value: 'balanced', label: 'Balanced' },
									{ value: 'hard', label: 'Hard' },
									{ value: 'extreme', label: 'Extreme' },
								]}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text)">{t('admin.servers.botProfiles.xpMultiplierLabel')}</label>
							<Input type="number" step="0.1" value={xpMultiplier} onChange={(e) => setXpMultiplier(Math.max(0.1, Number(e.target.value) || 1))} />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text)">{t('admin.servers.botProfiles.boosterMultiplierLabel')}</label>
							<Input type="number" step="0.1" value={boosterMultiplier} onChange={(e) => setBoosterMultiplier(Math.max(0.1, Number(e.target.value) || 1))} />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text)">{t('admin.servers.botProfiles.autoDeleteLabel')}</label>
							<Input type="number" value={autoDelete} onChange={(e) => setAutoDelete(Math.max(0, Number(e.target.value) || 0))} />
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text)">{t('admin.servers.botProfiles.levelMessageLabel')}</label>
						<Input value={levelMessage} onChange={(e) => setLevelMessage(e.target.value)} />
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
						<label className="flex items-center justify-between gap-2 cursor-pointer">
							<span className="text-xs font-bold text-(--text)">{t('admin.servers.botProfiles.stackRolesLabel')}</span>
							<Toggle checked={stackRoles} onChange={(e) => setStackRoles(e.target.checked)} />
						</label>
						<label className="flex items-center justify-between gap-2 cursor-pointer">
							<span className="text-xs font-bold text-(--text)">{t('admin.servers.botProfiles.levelUpAnnouncementsLabel')}</span>
							<Toggle checked={levelUp} onChange={(e) => setLevelUp(e.target.checked)} />
						</label>
						<label className="flex items-center justify-between gap-2 cursor-pointer">
							<span className="text-xs font-bold text-(--text)">{t('admin.servers.botProfiles.dynamicRolesLabel')}</span>
							<Toggle checked={dynamicRolesEnabled} onChange={(e) => setDynamicRolesEnabled(e.target.checked)} />
						</label>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
						<label className="flex items-center justify-between gap-2 cursor-pointer">
							<span className="text-xs font-bold text-(--text)">{t('admin.servers.botProfiles.cycleDailyLabel')}</span>
							<Toggle checked={cycleDaily} onChange={(e) => setCycleDaily(e.target.checked)} />
						</label>
						<label className="flex items-center justify-between gap-2 cursor-pointer">
							<span className="text-xs font-bold text-(--text)">{t('admin.servers.botProfiles.cycleWeeklyLabel')}</span>
							<Toggle checked={cycleWeekly} onChange={(e) => setCycleWeekly(e.target.checked)} />
						</label>
						<label className="flex items-center justify-between gap-2 cursor-pointer">
							<span className="text-xs font-bold text-(--text)">{t('admin.servers.botProfiles.cycleMonthlyLabel')}</span>
							<Toggle checked={cycleMonthly} onChange={(e) => setCycleMonthly(e.target.checked)} />
						</label>
					</div>
				</div>
			)}

			{selectedBot === 'yourapps' && data && <ServerYourAppsBotSection serverId={serverId} serverName={serverName} yourapps={data.yourapps} getEnvUrl={getEnvUrl} onReload={loadData} />}

			<Confirm
				open={confirmWipeVirtue}
				onOpenChange={setConfirmWipeVirtue}
				title={t('admin.users.botProfiles.confirmDeleteTitle')}
				description={t('admin.users.botProfiles.confirmDeleteDesc', { target: serverName })}
				confirmText={t('admin.roles.confirmDelete')}
				cancelText={t('admin.roles.cancel')}
				variant="danger"
				loading={deleting}
				onConfirm={handleConfirmWipeVirtue}
			/>
		</div>
	);
}
