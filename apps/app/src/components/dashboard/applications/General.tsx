/** @format */
'use client';

import { CheckCircle2, ClipboardCheck, Clock, ExternalLink, FileSpreadsheet, Hash, Megaphone, Shield, XCircle } from 'lucide-react';
import { MultiSelector, Selector, Tabs, Toggle } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
	const [saving, setSaving] = useState(false);
	const [subView, setSubView] = useState<'overview' | 'positions' | 'submissions'>(
		deepLinkSubmissionId || initialSubParam === 'submissions' ? 'submissions' : initialSubParam === 'overview' ? 'overview' : 'positions'
	);

	useEffect(() => {
		if (deepLinkSubmissionId || initialSubParam === 'submissions') {
			setSubView('submissions');
		}
	}, [deepLinkSubmissionId, initialSubParam]);

	const [originalConfig, setOriginalConfig] = useState<YourAppsConfigSnapshot | null>(null);
	const [logChannel, setLogChannel] = useState('');
	const [archiveChannel, setArchiveChannel] = useState('');
	const [panelChannel, setPanelChannel] = useState('');
	const [submissionPings, setSubmissionPings] = useState<string[]>([]);
	const [adminRoles, setAdminRoles] = useState<string[]>([]);
	const [reviewRoles, setReviewRoles] = useState<string[]>([]);
	const [blacklistRoles, setBlacklistRoles] = useState<string[]>([]);
	const [dmNotifications, setDmNotifications] = useState(true);
	const [threadPerSubmission, setThreadPerSubmission] = useState(false);

	const [discordRoles, setDiscordRoles] = useState<DiscordRoleItem[]>([]);
	const [discordChannels, setDiscordChannels] = useState<DiscordChannelItem[]>([]);

	const applySnapshot = useCallback((snap: YourAppsConfigSnapshot) => {
		setLogChannel(snap.logChannel);
		setArchiveChannel(snap.archiveChannel);
		setPanelChannel(snap.panelChannel);
		setSubmissionPings([...snap.submissionPings]);
		setAdminRoles([...snap.adminRoles]);
		setReviewRoles([...snap.reviewRoles]);
		setBlacklistRoles([...snap.blacklistRoles]);
		setDmNotifications(snap.dmNotifications);
		setThreadPerSubmission(snap.threadPerSubmission);
	}, []);

	const fetchProfile = useCallback(async () => {
		if (!id) return;
		setLoading(true);
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
				applySnapshot(snap);
				setOriginalConfig(snap);
				const pRoles = normalizeRoles(data.serverRoles, id);
				const pChannels = normalizeChannels(data.serverChannels);
				setDiscordRoles(fetchedRoles.length > 0 ? fetchedRoles : pRoles);
				setDiscordChannels(fetchedChannels.length > 0 ? fetchedChannels : pChannels);
			} else {
				setProfile(null);
				setOriginalConfig(null);
				if (fetchedRoles.length > 0) setDiscordRoles(fetchedRoles);
				if (fetchedChannels.length > 0) setDiscordChannels(fetchedChannels);
			}
		} catch {
			setProfile(null);
			setOriginalConfig(null);
		} finally {
			setLoading(false);
		}
	}, [id, getEnvUrl, applySnapshot]);

	useEffect(() => {
		fetchProfile();
	}, [fetchProfile]);

	const currentSnapshot = useMemo<YourAppsConfigSnapshot>(
		() => ({
			logChannel,
			archiveChannel,
			panelChannel,
			submissionPings,
			adminRoles,
			reviewRoles,
			blacklistRoles,
			dmNotifications,
			threadPerSubmission,
		}),
		[logChannel, archiveChannel, panelChannel, submissionPings, adminRoles, reviewRoles, blacklistRoles, dmNotifications, threadPerSubmission]
	);

	const isDirty = useMemo(() => {
		if (!profile || !originalConfig) return false;
		return JSON.stringify(currentSnapshot) !== JSON.stringify(originalConfig);
	}, [profile, originalConfig, currentSnapshot]);

	const handleSave = useCallback(async () => {
		if (!id) return;
		setSaving(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/applications`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(currentSnapshot),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || t('app.dashboard.applications.toast.saveError'));

			const snap = extractSnapshot(data);
			applySnapshot(snap);
			setOriginalConfig(snap);
			remind(false);
			toast({ title: t('app.dashboard.applications.toast.savedSuccess'), type: 'success' });
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setSaving(false);
		}
	}, [id, getEnvUrl, currentSnapshot, applySnapshot, remind, toast, t]);

	const handleReset = useCallback(() => {
		if (!originalConfig) return;
		applySnapshot(originalConfig);
	}, [originalConfig, applySnapshot]);

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

	const channelSelectorOptions = [
		{ value: '', label: t('app.dashboard.applications.channels.placeholder') },
		...discordChannels
			.filter((c) => c.type === 0 || c.type === 5)
			.map((c) => ({
				value: c.id,
				label: (
					<span className="inline-flex items-center gap-1.5">
						{c.type === 5 ? <Megaphone size={13} className="text-(--text-muted) shrink-0" /> : <Hash size={13} className="text-(--text-muted) shrink-0" />}
						<span>{c.name}</span>
					</span>
				),
			})),
	];

	const multiRoleOptions = discordRoles.map((r) => ({
		label: `@${r.name}`,
		value: r.id,
		color: r.color > 0 ? `#${r.color.toString(16).padStart(6, '0')}` : undefined,
	}));

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				{[
					{
						label: t('app.dashboard.applications.stats.openPositions'),
						value: `${profile.stats?.positionsOpen ?? 0}/${profile.stats?.positionsTotal ?? 0}`,
						icon: FileSpreadsheet,
						tone: 'text-(--accent)',
					},
					{ label: t('app.dashboard.applications.stats.pending'), value: profile.stats?.pending ?? 0, icon: Clock, tone: 'text-(--accent-orange)' },
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
					discordRoles={discordRoles}
					discordChannels={discordChannels}
					defaultPanelChannel={panelChannel}
					onChanged={fetchProfile}
				/>
			)}

			{subView === 'submissions' && id && <SubmissionsSection guildId={id} positions={profile.positions || []} initialSubmissionId={deepLinkSubmissionId} onCountsChanged={fetchProfile} />}

			{subView === 'overview' && (
				<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className="flex items-center gap-2.5 text-(--text) font-extrabold text-sm tracking-widest uppercase">
						<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
							<Shield className="w-4 h-4" />
						</div>
						<span>{t('app.dashboard.applications.title')}</span>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.channels.logChannel')}</label>
							<Selector value={logChannel} onChange={setLogChannel} options={channelSelectorOptions} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.channels.logChannelDesc')}</span>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.channels.archiveChannel')}</label>
							<Selector value={archiveChannel} onChange={setArchiveChannel} options={channelSelectorOptions} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.channels.archiveChannelDesc')}</span>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.channels.panelChannel')}</label>
							<Selector value={panelChannel} onChange={setPanelChannel} options={channelSelectorOptions} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.channels.panelChannelDesc')}</span>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-(--border)/10">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.roles.submissionPings')}</label>
							<MultiSelector value={submissionPings} onChange={setSubmissionPings} options={multiRoleOptions} placeholder={t('app.dashboard.applications.roles.placeholder')} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.roles.submissionPingsDesc')}</span>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.roles.reviewRoles')}</label>
							<MultiSelector value={reviewRoles} onChange={setReviewRoles} options={multiRoleOptions} placeholder={t('app.dashboard.applications.roles.placeholder')} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.roles.reviewRolesDesc')}</span>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.roles.adminRoles')}</label>
							<MultiSelector value={adminRoles} onChange={setAdminRoles} options={multiRoleOptions} placeholder={t('app.dashboard.applications.roles.placeholder')} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.roles.adminRolesDesc')}</span>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.roles.blacklistRoles')}</label>
							<MultiSelector value={blacklistRoles} onChange={setBlacklistRoles} options={multiRoleOptions} placeholder={t('app.dashboard.applications.roles.placeholder')} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.roles.blacklistRolesDesc')}</span>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-(--border)/10">
						<div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
							<div className="flex flex-col">
								<span className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.behavior.dmNotifications')}</span>
								<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.behavior.dmNotificationsDesc')}</span>
							</div>
							<Toggle checked={dmNotifications} onChange={(e) => setDmNotifications(e.target.checked)} size="sm" />
						</div>
						<div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
							<div className="flex flex-col">
								<span className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.behavior.threadPerSubmission')}</span>
								<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.behavior.threadPerSubmissionDesc')}</span>
							</div>
							<Toggle checked={threadPerSubmission} onChange={(e) => setThreadPerSubmission(e.target.checked)} size="sm" />
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
