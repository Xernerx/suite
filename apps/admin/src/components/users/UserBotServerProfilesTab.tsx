/** @format */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Bot, ExternalLink, Globe, MessageSquare, Mic, RefreshCw, Save, Server as ServerIcon, Sparkles, Trash2 } from 'lucide-react';
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import type { UserBotProfilesResponse, UserBotServerEntry } from './types';
import { UserYourAppsServerSection } from './UserYourAppsServerSection';

interface UserBotServerProfilesTabProps {
	userId: string;
	getEnvUrl: (url: string) => string;
	onNavigateEntity?: (tab: string, query: string) => void;
}

function formatVoiceDuration(seconds: number): string {
	const totalSec = Math.max(0, Math.floor(seconds || 0));
	const hrs = Math.floor(totalSec / 3600);
	const mins = Math.floor((totalSec % 3600) / 60);
	if (hrs > 0) return `${hrs}h ${mins}m`;
	return `${mins}m`;
}

export function UserBotServerProfilesTab({ userId, getEnvUrl, onNavigateEntity }: UserBotServerProfilesTabProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const [data, setData] = useState<UserBotProfilesResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedGuildId, setSelectedGuildId] = useState<string>('');
	const [savingVirtue, setSavingVirtue] = useState(false);
	const [confirmResetVirtue, setConfirmResetVirtue] = useState(false);
	const [resettingVirtue, setResettingVirtue] = useState(false);

	const [uLevel, setULevel] = useState(0);
	const [uXp, setUXp] = useState(0);
	const [tLevel, setTLevel] = useState(0);
	const [tXp, setTXp] = useState(0);
	const [tMessages, setTMessages] = useState(0);
	const [vLevel, setVLevel] = useState(0);
	const [vXp, setVXp] = useState(0);
	const [vTimeSpent, setVTimeSpent] = useState(0);

	const loadBotProfiles = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}/bots`), {
				credentials: 'include',
				cache: 'no-store',
			});
			if (!res.ok) throw new Error('Failed to load bot profiles');
			const json: UserBotProfilesResponse = await res.json();
			setData(json);
			setSelectedGuildId((prev) => {
				if (prev && json.servers.some((s) => s.guildId === prev)) return prev;
				return json.servers[0]?.guildId || '';
			});
		} catch {
			toast({ type: 'error', title: t('admin.users.botProfiles.loadError') });
		} finally {
			setLoading(false);
		}
	}, [userId, getEnvUrl, toast, t]);

	useEffect(() => {
		loadBotProfiles();
	}, [loadBotProfiles]);

	const selectedServer: UserBotServerEntry | null = useMemo(() => {
		if (!data?.servers?.length) return null;
		return data.servers.find((s) => s.guildId === selectedGuildId) || data.servers[0] || null;
	}, [data, selectedGuildId]);

	useEffect(() => {
		if (!selectedServer) return;
		setULevel(selectedServer.virtue.unified?.level ?? 0);
		setUXp(selectedServer.virtue.unified?.xp ?? 0);
		setTLevel(selectedServer.virtue.text?.level ?? 0);
		setTXp(selectedServer.virtue.text?.xp ?? 0);
		setTMessages(selectedServer.virtue.text?.messages ?? 0);
		setVLevel(selectedServer.virtue.voice?.level ?? 0);
		setVXp(selectedServer.virtue.voice?.xp ?? 0);
		setVTimeSpent(selectedServer.virtue.voice?.timeSpent ?? 0);
	}, [selectedServer]);

	const serverOptions = useMemo(() => {
		return (data?.servers || []).map((srv) => ({
			value: srv.guildId,
			label: `${srv.name} (${srv.guildId})`,
			badge: (
				<span className="inline-flex items-center gap-1">
					{srv.bots.includes('virtue') && <span className="text-[10px] px-2 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) font-bold">Virtue</span>}
					{srv.bots.includes('yourapps') && <span className="text-[10px] px-2 py-0.5 rounded-full bg-(--accent-green)/15 text-(--accent-green) font-bold">YourApps</span>}
				</span>
			),
		}));
	}, [data]);

	const handleSaveVirtueStats = async () => {
		if (!selectedServer) return;
		setSavingVirtue(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}/bots`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					action: 'update_virtue_server',
					guildId: selectedServer.guildId,
					unified: { level: Math.max(0, Number(uLevel) || 0), xp: Math.max(0, Number(uXp) || 0) },
					text: { level: Math.max(0, Number(tLevel) || 0), xp: Math.max(0, Number(tXp) || 0), messages: Math.max(0, Number(tMessages) || 0) },
					voice: { level: Math.max(0, Number(vLevel) || 0), xp: Math.max(0, Number(vXp) || 0), timeSpent: Math.max(0, Number(vTimeSpent) || 0) },
				}),
			});
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('admin.users.botProfiles.virtueSaveSuccess') });
			await loadBotProfiles();
		} catch {
			toast({ type: 'error', title: t('admin.users.botProfiles.updateError') });
		} finally {
			setSavingVirtue(false);
		}
	};

	const handleResetVirtueServer = async () => {
		if (!selectedServer) return;
		setResettingVirtue(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}/bots?guildId=${encodeURIComponent(selectedServer.guildId)}&bot=virtue`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('admin.users.botProfiles.resetSuccess') });
			setConfirmResetVirtue(false);
			await loadBotProfiles();
		} catch {
			toast({ type: 'error', title: t('admin.users.botProfiles.resetError') });
		} finally {
			setResettingVirtue(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center py-10">
				<Loading variant="small" />
			</div>
		);
	}

	const servers = data?.servers || [];

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* Global Bot Profile Summary Strip */}
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-4">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent)">
						<Bot size={20} />
					</div>
					<div>
						<h3 className="text-sm font-extrabold text-(--text)">{t('admin.users.botProfiles.heading')}</h3>
						<p className="text-xs text-(--text-muted)">
							{(() => {
								if (servers.length === 1) {
									const singular = t('admin.users.botProfiles.subheadingSingular', { count: 1 });
									return singular === 'admin.users.botProfiles.subheadingSingular'
										? t('admin.users.botProfiles.subheading', { count: 1 }).replace(/\b1 servers\b/i, '1 server')
										: singular;
								}
								return t('admin.users.botProfiles.subheading', { count: servers.length });
							})()}
						</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<span className="inline-flex items-center gap-1.5 rounded-full border border-(--border)/10 bg-(--background)/60 px-3 py-1 text-xs font-semibold text-(--text)">
						<Globe size={12} className="text-(--accent)" />
						<span>
							{data?.virtueGlobal?.found ? t('admin.users.botProfiles.virtueLocaleBadge', { locale: data.virtueGlobal.locale || 'en-GB' }) : t('admin.users.botProfiles.noVirtueGlobal')}
						</span>
					</span>
					<Button type="button" variant="secondary" size="sm" onClick={loadBotProfiles} className="flex items-center gap-1.5">
						<RefreshCw size={13} />
						<span>{t('admin.users.refresh')}</span>
					</Button>
				</div>
			</div>

			{servers.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--background)/50 py-12 px-6 text-center gap-2">
					<ServerIcon size={28} className="text-(--text-muted)" />
					<p className="text-sm font-bold text-(--text)">{t('admin.users.botProfiles.emptyServersTitle')}</p>
					<p className="text-xs text-(--text-muted) max-w-md">{t('admin.users.botProfiles.emptyServersDesc')}</p>
				</div>
			) : (
				<>
					{/* Server Selector Bar */}
					<div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-3xl border border-(--border)/10 bg-(--background)/50 p-4">
						<div className="flex-1 flex flex-col gap-1.5 min-w-0">
							<label className="text-xs font-bold text-(--text)">{t('admin.users.botProfiles.selectServerLabel')}</label>
							<Selector value={selectedServer?.guildId || ''} onChange={setSelectedGuildId} options={serverOptions} placeholder={t('admin.users.botProfiles.selectServerPlaceholder')} />
						</div>
						{selectedServer && onNavigateEntity && (
							<Button type="button" variant="secondary" size="sm" onClick={() => onNavigateEntity('servers', selectedServer.guildId)} className="flex items-center gap-1.5 h-10 shrink-0">
								<ExternalLink size={14} />
								<span>{t('admin.users.botProfiles.inspectServer')}</span>
							</Button>
						)}
					</div>

					{selectedServer && (
						<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
							{/* Selected Server Banner */}
							<div className="flex items-center justify-between gap-3 rounded-2xl border border-(--border)/10 bg-(--foreground)/25 px-4 py-3">
								<div className="flex items-center gap-3 min-w-0">
									{selectedServer.iconUrl ? (
										<Image
											src={selectedServer.iconUrl}
											alt={selectedServer.name}
											width={40}
											height={40}
											className="h-10 w-10 rounded-2xl border border-(--border)/10 object-cover shrink-0"
											unoptimized
										/>
									) : (
										<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--border)/15 text-(--text-muted) shrink-0">
											<ServerIcon size={18} />
										</div>
									)}
									<div className="min-w-0">
										<p className="text-sm font-extrabold text-(--text) truncate">{selectedServer.name}</p>
										<p className="text-[11px] font-mono text-(--text-muted)">{selectedServer.guildId}</p>
									</div>
								</div>
								<div className="flex flex-wrap items-center gap-1.5">
									{selectedServer.bots.map((b) => (
										<span key={b} className="text-[11px] px-2.5 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/25 font-bold capitalize">
											{b === 'yourapps' ? 'YourApps' : 'Virtue'}
										</span>
									))}
								</div>
							</div>

							{/* Virtue Server Data Card */}
							<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-4" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										<span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent)">
											<Sparkles size={16} />
										</span>
										<div>
											<h4 className="text-sm font-extrabold text-(--text)">{t('admin.users.botProfiles.virtueTitle')}</h4>
											<p className="text-xs text-(--text-muted)">{t('admin.users.botProfiles.virtueDesc')}</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{selectedServer.virtue.hasData && (
											<Button type="button" variant="danger" size="sm" onClick={() => setConfirmResetVirtue(true)} className="flex items-center gap-1.5">
												<Trash2 size={13} />
												<span>{t('admin.users.botProfiles.resetVirtue')}</span>
											</Button>
										)}
										<Button type="button" variant="primary" size="sm" loading={savingVirtue} onClick={handleSaveVirtueStats} className="flex items-center gap-1.5">
											<Save size={13} />
											<span>{t('admin.users.botProfiles.saveVirtue')}</span>
										</Button>
									</div>
								</div>

								<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
									{/* Unified Server Track */}
									<div className="flex flex-col gap-2.5 rounded-2xl border border-(--border)/10 bg-(--background)/50 p-3.5">
										<div className="flex items-center justify-between">
											<span className="text-xs font-extrabold text-(--text) flex items-center gap-1.5">
												<Sparkles size={13} className="text-(--accent)" />
												{t('admin.users.botProfiles.unifiedTrack')}
											</span>
										</div>
										<div className="grid grid-cols-2 gap-2">
											<div className="flex flex-col gap-1">
												<label className="text-[11px] font-semibold text-(--text-muted)">{t('admin.users.botProfiles.levelField')}</label>
												<Input type="number" value={uLevel} onChange={(e) => setULevel(Math.max(0, Number(e.target.value) || 0))} />
											</div>
											<div className="flex flex-col gap-1">
												<label className="text-[11px] font-semibold text-(--text-muted)">{t('admin.users.botProfiles.xpField')}</label>
												<Input type="number" value={uXp} onChange={(e) => setUXp(Math.max(0, Number(e.target.value) || 0))} />
											</div>
										</div>
									</div>

									{/* Text Track */}
									<div className="flex flex-col gap-2.5 rounded-2xl border border-(--border)/10 bg-(--background)/50 p-3.5">
										<span className="text-xs font-extrabold text-(--text) flex items-center gap-1.5">
											<MessageSquare size={13} className="text-(--accent)" />
											{t('admin.users.botProfiles.textTrack')}
										</span>
										<div className="grid grid-cols-3 gap-2">
											<div className="flex flex-col gap-1">
												<label className="text-[11px] font-semibold text-(--text-muted)">{t('admin.users.botProfiles.levelField')}</label>
												<Input type="number" value={tLevel} onChange={(e) => setTLevel(Math.max(0, Number(e.target.value) || 0))} />
											</div>
											<div className="flex flex-col gap-1">
												<label className="text-[11px] font-semibold text-(--text-muted)">{t('admin.users.botProfiles.xpField')}</label>
												<Input type="number" value={tXp} onChange={(e) => setTXp(Math.max(0, Number(e.target.value) || 0))} />
											</div>
											<div className="flex flex-col gap-1">
												<label className="text-[11px] font-semibold text-(--text-muted)">{t('admin.users.botProfiles.messagesField')}</label>
												<Input type="number" value={tMessages} onChange={(e) => setTMessages(Math.max(0, Number(e.target.value) || 0))} />
											</div>
										</div>
									</div>

									{/* Voice Track */}
									<div className="flex flex-col gap-2.5 rounded-2xl border border-(--border)/10 bg-(--background)/50 p-3.5">
										<div className="flex items-center justify-between">
											<span className="text-xs font-extrabold text-(--text) flex items-center gap-1.5">
												<Mic size={13} className="text-(--accent)" />
												{t('admin.users.botProfiles.voiceTrack')}
											</span>
											<span className="text-[11px] font-mono text-(--accent)">{formatVoiceDuration(vTimeSpent)}</span>
										</div>
										<div className="grid grid-cols-3 gap-2">
											<div className="flex flex-col gap-1">
												<label className="text-[11px] font-semibold text-(--text-muted)">{t('admin.users.botProfiles.levelField')}</label>
												<Input type="number" value={vLevel} onChange={(e) => setVLevel(Math.max(0, Number(e.target.value) || 0))} />
											</div>
											<div className="flex flex-col gap-1">
												<label className="text-[11px] font-semibold text-(--text-muted)">{t('admin.users.botProfiles.xpField')}</label>
												<Input type="number" value={vXp} onChange={(e) => setVXp(Math.max(0, Number(e.target.value) || 0))} />
											</div>
											<div className="flex flex-col gap-1">
												<label className="text-[11px] font-semibold text-(--text-muted)">{t('admin.users.botProfiles.voiceSecondsField')}</label>
												<Input type="number" value={vTimeSpent} onChange={(e) => setVTimeSpent(Math.max(0, Number(e.target.value) || 0))} />
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* YourApps Server Data Card */}
							<UserYourAppsServerSection
								userId={userId}
								guildId={selectedServer.guildId}
								serverName={selectedServer.name}
								hasData={selectedServer.yourapps.hasData}
								submissions={selectedServer.yourapps.submissions}
								drafts={selectedServer.yourapps.drafts}
								getEnvUrl={getEnvUrl}
								onReload={loadBotProfiles}
							/>
						</div>
					)}
				</>
			)}

			<Confirm
				open={confirmResetVirtue}
				onOpenChange={setConfirmResetVirtue}
				title={t('admin.users.botProfiles.resetVirtueConfirmTitle')}
				description={t('admin.users.botProfiles.resetVirtueConfirmDesc', { server: selectedServer?.name || '' })}
				confirmText={t('admin.roles.confirmDelete')}
				cancelText={t('admin.roles.cancel')}
				variant="danger"
				loading={resettingVirtue}
				onConfirm={handleResetVirtueServer}
			/>
		</div>
	);
}
