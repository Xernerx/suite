/** @format */
'use client';

import { AlertTriangle, CheckCircle2, ClipboardCheck, Clock, ExternalLink, FileSpreadsheet, MessageSquare, RefreshCw, XCircle } from 'lucide-react';
import { Button, Tabs } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ApplicationsSettingsPanel from './ApplicationsSettingsPanel';
import PositionsSection from './PositionsSection';
import SubmissionsSection from './SubmissionsSection';
import { normalizeChannels, normalizeRoles, type DiscordChannelItem, type DiscordRoleItem, type YourAppsConfigSnapshot, type YourAppsProfile } from './types';

function extractSnapshot(data: any): YourAppsConfigSnapshot {
	const cleanIds = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
	return {
		logChannel: data?.logChannel ? String(data.logChannel) : '',
		archiveChannel: data?.archiveChannel ? String(data.archiveChannel) : '',
		panelChannel: data?.panelChannel ? String(data.panelChannel) : '',
		submissionPings: cleanIds(data?.submissionPings),
		adminRoles: cleanIds(data?.adminRoles),
		reviewRoles: cleanIds(data?.reviewRoles),
		blacklistRoles: cleanIds(data?.blacklistRoles),
		dmNotifications: data?.dmNotifications !== false,
		threadPerSubmission: Boolean(data?.threadPerSubmission),
		selfReviewAllowed: Boolean(data?.selfReviewAllowed),
		pollOnSubmission: Boolean(data?.pollOnSubmission),
		pollDurationHours: Math.max(1, Math.min(168, Number(data?.pollDurationHours) || 48)),
		interviewMode: data?.interviewMode === 'channel' ? 'channel' : 'thread',
		interviewCategoryId: data?.interviewCategoryId ? String(data.interviewCategoryId) : '',
	};
}

export default function ApplicationsGeneral({ id, isActive = true }: { id?: string; isActive?: boolean }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast, remind } = useToast();

	const searchParams = useSearchParams();
	const initialSubParam = searchParams.get('subView');
	const deepLinkSubmissionId = searchParams.get('submission');

	const [profile, setProfile] = useState<YourAppsProfile | null>(null);
	const [applicationId, setApplicationId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [syncingPanelNow, setSyncingPanelNow] = useState(false);
	const [subView, setSubView] = useState<'overview' | 'positions' | 'submissions'>(
		deepLinkSubmissionId || initialSubParam === 'submissions' ? 'submissions' : initialSubParam === 'overview' ? 'overview' : 'positions'
	);

	useEffect(() => {
		if (deepLinkSubmissionId || initialSubParam === 'submissions') {
			setSubView('submissions');
		}
	}, [deepLinkSubmissionId, initialSubParam]);

	const [originalConfig, setOriginalConfig] = useState<YourAppsConfigSnapshot | null>(null);
	const [config, setConfig] = useState<YourAppsConfigSnapshot>(() => extractSnapshot(null));

	const [discordRoles, setDiscordRoles] = useState<DiscordRoleItem[]>([]);
	const [discordChannels, setDiscordChannels] = useState<DiscordChannelItem[]>([]);

	const patchConfig = useCallback((patch: Partial<YourAppsConfigSnapshot>) => {
		setConfig((prev) => ({ ...prev, ...patch }));
	}, []);

	const fetchProfile = useCallback(async () => {
		if (!id) return;
		setLoading(true);
		setLoadError(null);
		try {
			const [res, rolesRes, channelsRes] = await Promise.all([
				fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/applications`), { credentials: 'include' }),
				fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${id}/discord/roles`), { credentials: 'include' }).catch(() => null),
				fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${id}/discord/channels`), { credentials: 'include' }).catch(() => null),
			]);

			const fetchedRoles = rolesRes && rolesRes.ok ? normalizeRoles(await rolesRes.json().catch(() => []), id) : [];
			const fetchedChannels = channelsRes && channelsRes.ok ? normalizeChannels(await channelsRes.json().catch(() => [])) : [];

			const data = await res.json().catch(() => ({}));
			if (data?.applicationId) setApplicationId(String(data.applicationId));

			if (res.ok && data?.found !== false) {
				const snap = extractSnapshot(data);
				setProfile(data);
				setConfig(snap);
				setOriginalConfig(snap);
				const pRoles = normalizeRoles(data.serverRoles, id);
				const pChannels = normalizeChannels(data.serverChannels);
				setDiscordRoles(fetchedRoles.length > 0 ? fetchedRoles : pRoles);
				setDiscordChannels(fetchedChannels.length > 0 ? fetchedChannels : pChannels);
			} else {
				setProfile(null);
				setOriginalConfig(null);
				if (res.status !== 404 && data?.found !== false) {
					setLoadError(String(data?.error || `HTTP ${res.status}`));
				}
				if (fetchedRoles.length > 0) setDiscordRoles(fetchedRoles);
				if (fetchedChannels.length > 0) setDiscordChannels(fetchedChannels);
			}
		} catch (err: any) {
			setProfile(null);
			setOriginalConfig(null);
			setLoadError(err?.message || t('app.dashboard.applications.toast.saveError'));
		} finally {
			setLoading(false);
		}
	}, [id, getEnvUrl, t]);

	useEffect(() => {
		fetchProfile();
	}, [fetchProfile]);

	const isDirty = useMemo(() => {
		if (!profile || !originalConfig) return false;
		return JSON.stringify(config) !== JSON.stringify(originalConfig);
	}, [profile, originalConfig, config]);

	const handleSave = useCallback(async () => {
		if (!id) return;
		setSaving(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/applications`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(config),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || t('app.dashboard.applications.toast.saveError'));

			const snap = extractSnapshot(data);
			setConfig(snap);
			setOriginalConfig(snap);
			if (Array.isArray(data?.panels)) {
				setProfile((prev) => (prev ? { ...prev, panels: data.panels } : prev));
			}
			remind(false);
			if (data?.panelError) {
				toast({ title: t('app.dashboard.applications.toast.saveError'), description: String(data.panelError), type: 'error' });
			} else {
				toast({ title: t('app.dashboard.applications.toast.savedSuccess'), type: 'success' });
			}
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setSaving(false);
		}
	}, [id, getEnvUrl, config, remind, toast, t]);

	const handleSyncPanelNow = useCallback(async () => {
		if (!id) return;
		setSyncingPanelNow(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/applications/panels`), {
				method: 'PUT',
				credentials: 'include',
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || t('app.dashboard.applications.toast.saveError'));
			if (Array.isArray(data?.panels)) {
				setProfile((prev) => (prev ? { ...prev, panels: data.panels } : prev));
			}
			toast({ title: t('app.dashboard.applications.toast.panelsSynced'), type: 'success' });
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setSyncingPanelNow(false);
		}
	}, [id, getEnvUrl, toast, t]);

	const handleReset = useCallback(() => {
		if (!originalConfig) return;
		setConfig(originalConfig);
	}, [originalConfig]);

	useEffect(() => {
		if (!isActive) return;
		if (isDirty) remind(true, handleSave, handleReset, saving);
		else remind(false);
		return () => remind(false);
	}, [isActive, isDirty, saving, handleSave, handleReset, remind]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-16 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm">
				<Loading variant="small" />
			</div>
		);
	}

	if (loadError) {
		return (
			<div className="flex flex-col items-center text-center justify-center bg-(--foreground)/30 backdrop-blur-md border border-(--accent-red)/30 rounded-3xl p-10 shadow-sm gap-3">
				<div className="w-14 h-14 rounded-full bg-(--accent-red)/15 flex items-center justify-center text-(--accent-red)">
					<AlertTriangle className="w-7 h-7" />
				</div>
				<h3 className="text-xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.dashboard.applications.toast.saveError')}
				</h3>
				<p className="text-xs font-mono text-(--text-muted) max-w-md">{loadError}</p>
				<Button variant="secondary" size="sm" onClick={fetchProfile} className="mt-2">
					<RefreshCw className="w-3.5 h-3.5" />
					<span>{t('app.dashboard.applications.refreshBtn')}</span>
				</Button>
			</div>
		);
	}

	if (!profile) {
		const inviteHref = applicationId
			? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(applicationId)}&permissions=395137256448&scope=bot+applications.commands${id ? `&guild_id=${encodeURIComponent(id)}&disable_guild_select=true` : ''}`
			: getEnvUrl('https://xernerx.com/invite/yourapps');

		return (
			<div className="flex flex-col items-center text-center justify-center bg-(--accent)/5 border border-(--accent)/20 rounded-3xl p-10 shadow-xl">
				<div className="w-16 h-16 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent) mb-4 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
					<ClipboardCheck className="w-8 h-8" />
				</div>
				<h3 className="text-xl font-extrabold text-(--text) mb-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.dashboard.applications.notAdded')}
				</h3>
				<p className="text-sm text-(--text-muted) mb-6 max-w-md">{t('app.dashboard.applications.notAddedDesc')}</p>
				<a
					href={inviteHref}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center justify-center gap-2 rounded-2xl bg-(--accent) hover:bg-(--hover-accent) text-(--accent-contrast) font-bold text-sm px-6 py-3 shadow-sm transition-all"
				>
					<ClipboardCheck size={16} />
					<span>{t('app.dashboard.applications.inviteBtn')}</span>
					<ExternalLink size={14} className="opacity-80" />
				</a>
			</div>
		);
	}

	const activePendingCount = (profile.stats?.pending ?? 0) + (profile.stats?.needsInfo ?? 0);

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
				{[
					{
						label: t('app.dashboard.applications.stats.openPositions'),
						value: `${profile.stats?.positionsOpen ?? 0}/${profile.stats?.positionsTotal ?? 0}`,
						icon: FileSpreadsheet,
						tone: 'text-(--accent)',
					},
					{ label: t('app.dashboard.applications.stats.pending'), value: activePendingCount, icon: Clock, tone: 'text-(--accent-orange)' },
					{ label: t('app.dashboard.applications.stats.interview'), value: profile.stats?.interview ?? 0, icon: MessageSquare, tone: 'text-(--accent)' },
					{ label: t('app.dashboard.applications.stats.approved'), value: profile.stats?.approved ?? 0, icon: CheckCircle2, tone: 'text-(--accent-green)' },
					{ label: t('app.dashboard.applications.stats.denied'), value: profile.stats?.denied ?? 0, icon: XCircle, tone: 'text-(--accent-red)' },
				].map((item) => {
					const Icon = item.icon;
					return (
						<div key={item.label} className="flex items-center justify-between p-4 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm">
							<div className="flex flex-col gap-0.5">
								<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{item.label}</span>
								<span className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{item.value}
								</span>
							</div>
							<div className={`w-10 h-10 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex items-center justify-center ${item.tone}`}>
								<Icon className="w-5 h-5" />
							</div>
						</div>
					);
				})}
			</div>

			<Tabs
				activeTab={subView}
				onChange={(val) => setSubView(val as any)}
				tabs={[
					{ id: 'positions', label: t('app.dashboard.applications.sections.positions') },
					{ id: 'submissions', label: t('app.dashboard.applications.sections.submissions') },
					{ id: 'overview', label: t('app.dashboard.applications.sections.overview') },
				]}
			/>

			{subView === 'positions' && id && (
				<PositionsSection
					guildId={id}
					positions={profile.positions || []}
					panels={profile.panels || []}
					discordRoles={discordRoles}
					discordChannels={discordChannels}
					defaultPanelChannel={config.panelChannel}
					onChanged={fetchProfile}
				/>
			)}

			{subView === 'submissions' && id && <SubmissionsSection guildId={id} positions={profile.positions || []} initialSubmissionId={deepLinkSubmissionId} onCountsChanged={fetchProfile} />}

			{subView === 'overview' && (
				<ApplicationsSettingsPanel
					config={config}
					discordRoles={discordRoles}
					discordChannels={discordChannels}
					isDirty={isDirty}
					syncingPanelNow={syncingPanelNow}
					onSyncPanelNow={handleSyncPanelNow}
					onPatch={patchConfig}
				/>
			)}
		</div>
	);
}
