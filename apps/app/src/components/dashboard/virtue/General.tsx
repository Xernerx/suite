/** @format */

'use client';

import { Check, Crown, ExternalLink, Hash, Lock, Megaphone, Sparkles, Trophy } from 'lucide-react';
import { Input, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import ConfigPortabilityCard, { VirtueConfigShape, VirtueDynamicRolesConfig, VirtueLevelRole } from '@/components/virtue/ConfigPortabilityCard';
import LevelRolesSection, {
	buildConfigSnapshot,
	DEFAULT_DYNAMIC_ROLES,
	DiscordChannel,
	DiscordRole,
	normalizeDiscordChannels,
	normalizeDiscordRoles,
	normalizeDynamicRolesConfig,
	normalizeLevelRoles,
	VirtueProfile,
} from '@/components/dashboard/virtue/LevelRolesSection';

function snapshotFromApiData(data: any, hasServerPrem: boolean, fb?: VirtueConfigShape): VirtueConfigShape {
	const savedRoles = normalizeLevelRoles(data).length > 0 || !fb || fb.levelRoles?.length === 0 ? normalizeLevelRoles(data) : normalizeLevelRoles(fb);
	return buildConfigSnapshot({
		mode: hasServerPrem ? data.mode || fb?.mode || 'balanced' : 'balanced',
		cycles: hasServerPrem
			? { daily: Boolean(data.cycles?.daily ?? fb?.cycles?.daily), weekly: Boolean(data.cycles?.weekly ?? fb?.cycles?.weekly), monthly: Boolean(data.cycles?.monthly ?? fb?.cycles?.monthly) }
			: { daily: false, weekly: false, monthly: false },
		ignoredRoles: Array.isArray(data.roles?.ignored) ? data.roles.ignored.map(String).filter(Boolean) : fb?.roles?.ignored || [],
		trackedRoles: Array.isArray(data.roles?.tracked) ? data.roles.tracked.map(String).filter(Boolean) : fb?.roles?.tracked || [],
		ignoredChannels: Array.isArray(data.channels?.ignored) ? data.channels.ignored.map(String).filter(Boolean) : fb?.channels?.ignored || [],
		stackRoles: data.stackRoles !== undefined ? Boolean(data.stackRoles) : (fb?.stackRoles ?? true),
		boosterMultiplier: hasServerPrem ? Math.max(1, Number(data.boosterMultiplier ?? fb?.boosterMultiplier) || 1) : 1,
		dynamicRoles: normalizeDynamicRolesConfig(data.dynamicRoles ?? fb?.dynamicRoles, hasServerPrem),
		levelRoles: savedRoles,
		levelUp: data.levelUp ?? fb?.levelUp ?? true,
		levelMessage: data.levelMessage ?? fb?.levelMessage ?? '[@mention] reached level [@level] :tada:!',
		levelChannel: data.levelChannel || '',
		autoDelete: Number(data.autoDelete ?? fb?.autoDelete) || 0,
	});
}

export default function VirtueGeneral({ id, managedGuilds }: { id?: string; managedGuilds?: { id: string; name: string }[] }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast, remind } = useToast();

	const [profile, setProfile] = useState<VirtueProfile | null>(null);
	const [originalConfig, setOriginalConfig] = useState<VirtueConfigShape | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [mode, setMode] = useState<'easy' | 'casual' | 'balanced' | 'hard' | 'extreme'>('balanced');
	const [cycles, setCycles] = useState({ daily: false, weekly: false, monthly: false });
	const [ignoredRoles, setIgnoredRoles] = useState<string[]>([]);
	const [trackedRoles, setTrackedRoles] = useState<string[]>([]);
	const [ignoredChannels, setIgnoredChannels] = useState<string[]>([]);
	const [stackRoles, setStackRoles] = useState<boolean>(true);
	const [boosterMultiplier, setBoosterMultiplier] = useState<number>(1);
	const [dynamicRoles, setDynamicRoles] = useState<VirtueDynamicRolesConfig>(DEFAULT_DYNAMIC_ROLES);
	const [levelRoles, setLevelRoles] = useState<VirtueLevelRole[]>([]);
	const [discordRoles, setDiscordRoles] = useState<DiscordRole[]>([]);
	const [discordChannels, setDiscordChannels] = useState<DiscordChannel[]>([]);
	const [levelUp, setLevelUp] = useState(true);
	const [levelMessage, setLevelMessage] = useState('[@mention] reached level [@level] :tada:!');
	const [levelChannel, setLevelChannel] = useState('');
	const [autoDelete, setAutoDelete] = useState(0);

	const applySnapshotToState = useCallback((snap: VirtueConfigShape, hasServerPrem: boolean) => {
		setMode(hasServerPrem ? snap.mode : 'balanced');
		setCycles(hasServerPrem ? { ...snap.cycles } : { daily: false, weekly: false, monthly: false });
		setIgnoredRoles([...snap.roles.ignored]);
		setTrackedRoles([...snap.roles.tracked]);
		setIgnoredChannels([...(snap.channels?.ignored || [])]);
		setStackRoles(snap.stackRoles !== false);
		setBoosterMultiplier(hasServerPrem ? Math.max(1, Number(snap.boosterMultiplier) || 1) : 1);
		setDynamicRoles(normalizeDynamicRolesConfig(snap.dynamicRoles, hasServerPrem));
		setLevelRoles(normalizeLevelRoles(snap));
		setLevelUp(snap.levelUp);
		setLevelMessage(snap.levelMessage);
		setLevelChannel(snap.levelChannel || '');
		setAutoDelete(snap.autoDelete);
	}, []);

	const fetchProfile = useCallback(async () => {
		if (!id) return;
		setLoading(true);

		try {
			const [res, rolesRes, channelsRes] = await Promise.all([
				fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/virtue`), { credentials: 'include' }),
				fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${id}/discord/roles`), { credentials: 'include' }).catch(() => null),
				fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${id}/discord/channels`), { credentials: 'include' }).catch(() => null),
			]);

			const fetchedRoles = rolesRes && rolesRes.ok ? normalizeDiscordRoles(await rolesRes.json().catch(() => []), id) : [];
			const fetchedChannels = channelsRes && channelsRes.ok ? normalizeDiscordChannels(await channelsRes.json().catch(() => [])) : [];

			if (res.ok) {
				const data = await res.json();
				const hasServerPrem = Boolean(data.serverPremium);
				const nextSnapshot = snapshotFromApiData(data, hasServerPrem);
				setProfile(data);
				applySnapshotToState(nextSnapshot, hasServerPrem);
				setOriginalConfig(nextSnapshot);

				const profileRoles = normalizeDiscordRoles(data.serverRoles, id);
				setDiscordRoles(fetchedRoles.length > 0 ? fetchedRoles : profileRoles);
				const profileChannels = normalizeDiscordChannels(data.serverChannels);
				setDiscordChannels(fetchedChannels.length > 0 ? fetchedChannels : profileChannels);
			} else {
				setProfile(null);
				setOriginalConfig(null);
				if (fetchedRoles.length > 0) setDiscordRoles(fetchedRoles);
				if (fetchedChannels.length > 0) setDiscordChannels(fetchedChannels);
			}
		} catch (err) {
			console.error('Failed to fetch Virtue profile:', err);
			setProfile(null);
			setOriginalConfig(null);
		} finally {
			setLoading(false);
		}
	}, [id, getEnvUrl, applySnapshotToState]);

	useEffect(() => {
		fetchProfile();
	}, [fetchProfile]);

	const currentConfigObject = useMemo(
		() =>
			buildConfigSnapshot({
				mode,
				cycles,
				ignoredRoles,
				trackedRoles,
				ignoredChannels,
				stackRoles,
				boosterMultiplier,
				dynamicRoles,
				levelRoles,
				levelUp,
				levelMessage,
				levelChannel,
				autoDelete,
			}),
		[mode, cycles, ignoredRoles, trackedRoles, ignoredChannels, stackRoles, boosterMultiplier, dynamicRoles, levelRoles, levelUp, levelMessage, levelChannel, autoDelete]
	);

	const isDirty = useMemo(() => {
		if (!profile || !originalConfig) return false;
		return JSON.stringify(currentConfigObject) !== JSON.stringify(originalConfig);
	}, [profile, originalConfig, currentConfigObject]);

	const handleSave = useCallback(async () => {
		if (!id) return;
		setSaving(true);

		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/virtue`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(currentConfigObject),
			});

			if (res.ok) {
				const updated = await res.json();
				const hasServerPrem = Boolean(updated.serverPremium ?? profile?.serverPremium);
				const nextSnapshot = snapshotFromApiData(updated, hasServerPrem, currentConfigObject);
				setProfile(updated);
				setDynamicRoles(nextSnapshot.dynamicRoles || DEFAULT_DYNAMIC_ROLES);
				setLevelRoles(nextSnapshot.levelRoles || []);
				setOriginalConfig(JSON.parse(JSON.stringify(nextSnapshot)));
				remind(false);
				toast({ title: t('app.dashboard.virtue.toast.savedSuccess'), type: 'success' });
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('app.dashboard.virtue.toast.saveError'));
			}
		} catch (err: any) {
			console.error('Failed to save Virtue settings:', err);
			toast({ title: t('app.dashboard.virtue.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setSaving(false);
		}
	}, [id, getEnvUrl, currentConfigObject, profile?.serverPremium, remind, toast, t]);

	const handleReset = useCallback(() => {
		if (!originalConfig) return;
		applySnapshotToState(originalConfig, Boolean(profile?.serverPremium));
	}, [originalConfig, profile?.serverPremium, applySnapshotToState]);

	useEffect(() => {
		if (isDirty) remind(true, handleSave, handleReset, saving);
		else remind(false);
		return () => remind(false);
	}, [isDirty, saving, handleSave, handleReset, remind]);

	if (loading) return <Loading />;

	if (!profile) {
		return (
			<div className="flex flex-col items-center text-center justify-center bg-(--accent)/5 border border-(--accent)/20 rounded-3xl p-10 shadow-xl animate-in fade-in zoom-in-95 duration-300">
				<div className="w-16 h-16 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent) mb-4 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
					<Sparkles className="w-8 h-8" />
				</div>
				<h3 className="text-xl font-extrabold text-(--text) mb-2">{t('app.dashboard.virtue.notAdded')}</h3>
				<p className="text-sm text-(--text-muted) mb-6 max-w-md">{t('app.dashboard.virtue.notAddedDesc')}</p>
				<a
					href={getEnvUrl('https://xernerx.com/invite/virtue')}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center justify-center gap-2 rounded-2xl bg-(--accent) text-(--text-active) font-bold text-sm px-6 py-3 shadow-lg shadow-(--accent)/20 hover:opacity-90 transition-all hover:scale-[1.02]"
				>
					<Sparkles size={16} />
					<span>{t('app.dashboard.virtue.inviteBtn')}</span>
				</a>
			</div>
		);
	}

	const isServerPremium = Boolean(profile?.serverPremium);
	const discordStoreUrl = getEnvUrl('https://store.xernerx.com/?item=bot-virtue');

	const handleApplyPortableConfig = (cfg: Partial<VirtueConfigShape>) => {
		applySnapshotToState(snapshotFromApiData(cfg, isServerPremium, currentConfigObject), isServerPremium);
	};

	const roleSelectorOptions = discordRoles.map((role) => {
		const colorHex = role.color > 0 ? `#${role.color.toString(16).padStart(6, '0')}` : 'var(--accent)';
		return {
			value: role.id,
			label: (
				<span className="inline-flex items-center gap-2">
					<span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorHex }} />
					<span>@{role.name}</span>
				</span>
			),
		};
	});

	const multiRoleOptions = discordRoles.map((role) => ({
		label: `@${role.name}`,
		value: role.id,
		color: role.color > 0 ? `#${role.color.toString(16).padStart(6, '0')}` : undefined,
	}));

	const multiChannelOptions = discordChannels.map((channel) => ({
		label: channel.type === 2 || channel.type === 13 ? `🔊 ${channel.name}` : `#${channel.name}`,
		value: channel.id,
	}));

	const channelSelectorOptions = [
		{ value: '', label: t('app.dashboard.virtue.channelPlaceholder') },
		...discordChannels
			.filter((channel) => channel.type === 0 || channel.type === 5)
			.map((channel) => ({
				value: channel.id,
				label: (
					<span className="inline-flex items-center gap-1.5">
						{channel.type === 5 ? <Megaphone size={13} className="text-(--text-muted) shrink-0" /> : <Hash size={13} className="text-(--text-muted) shrink-0" />}
						<span>{channel.name}</span>
					</span>
				),
			})),
	];

	const modeOptions = (['easy', 'casual', 'balanced', 'hard', 'extreme'] as const).map((m) => ({ label: t(`app.dashboard.virtue.modes.${m}`), value: m }));
	const boosterOptions = [
		{ label: t('app.dashboard.virtue.boosterOptions.m1'), value: '1' },
		{ label: t('app.dashboard.virtue.boosterOptions.m125'), value: '1.25' },
		{ label: t('app.dashboard.virtue.boosterOptions.m15'), value: '1.5' },
		{ label: t('app.dashboard.virtue.boosterOptions.m2'), value: '2' },
	];

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{id && <ConfigPortabilityCard guildId={id} currentConfig={currentConfigObject} onApplyConfig={handleApplyPortableConfig} managedGuilds={managedGuilds} />}

			{/* Virtue Leveling Configuration Card */}
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
						<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
							<Trophy className="w-4 h-4" />
						</div>
						{t('app.dashboard.virtue.title')}
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<span
							className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
								isServerPremium ? 'bg-(--accent)/15 text-(--accent) border-(--accent)/30' : 'bg-(--background)/60 text-(--text-muted) border-(--border)/10'
							}`}
						>
							{isServerPremium ? <Crown size={13} className="text-(--accent)" /> : <Lock size={12} />}
							<span>{isServerPremium ? t('app.dashboard.virtue.serverPremiumActive') : t('app.dashboard.virtue.serverPremiumBadge')}</span>
						</span>
						{!isServerPremium && (
							<a
								href={discordStoreUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-(--accent) text-(--text-active) hover:bg-(--hover-accent) transition-colors shadow-sm"
							>
								<Crown size={12} />
								<span>{t('app.dashboard.virtue.serverPremiumCta')}</span>
								<ExternalLink size={11} className="opacity-80" />
							</a>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-5">
					{/* Row 1: Server Premium — Difficulty Mode, Booster Bonus & Reset Cycles */}
					<div className="flex flex-col gap-2">
						{!isServerPremium && <p className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.serverPremiumRequired')}</p>}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-(--text) inline-flex items-center gap-1.5">
									<span>{t('app.dashboard.virtue.difficultyMode')}</span>
									{!isServerPremium && <Lock size={11} className="text-(--text-muted)" />}
								</label>
								<Selector value={mode} disabled={!isServerPremium} onChange={(val: any) => isServerPremium && setMode(val)} options={modeOptions} />
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-bold text-(--text) inline-flex items-center gap-1.5">
									<span>{t('app.dashboard.virtue.boosterBonus')}</span>
									{!isServerPremium && <Lock size={11} className="text-(--text-muted)" />}
								</label>
								<Selector
									value={String(boosterMultiplier)}
									disabled={!isServerPremium}
									onChange={(val: string) => isServerPremium && setBoosterMultiplier(Math.max(1, Number(val) || 1))}
									options={boosterOptions}
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between gap-2">
									<label className="text-xs font-bold text-(--text) inline-flex items-center gap-1.5">
										<span>{t('app.dashboard.virtue.resetCycles')}</span>
										{!isServerPremium && <Lock size={11} className="text-(--text-muted)" />}
									</label>
									<span className="text-[11px] text-(--text-muted) truncate">{t('app.dashboard.virtue.resetCyclesDesc')}</span>
								</div>
								<div className="grid grid-cols-3 gap-2">
									{(['daily', 'weekly', 'monthly'] as const).map((cycleKey) => {
										const active = cycles[cycleKey];
										return (
											<button
												key={cycleKey}
												type="button"
												disabled={!isServerPremium}
												onClick={() => isServerPremium && setCycles((prev) => ({ ...prev, [cycleKey]: !active }))}
												className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border text-xs transition-all ${
													!isServerPremium
														? 'border-(--border)/10 bg-(--background)/40 text-(--text-muted) opacity-50 cursor-not-allowed'
														: active
															? 'border-(--accent) bg-(--accent)/15 text-(--text) font-bold shadow-sm cursor-pointer'
															: 'border-(--border)/10 bg-(--background)/50 text-(--text-muted) hover:border-(--border)/20 hover:text-(--text) cursor-pointer'
												}`}
											>
												<span className="capitalize truncate">{t(`app.dashboard.virtue.cycles.${cycleKey}`)}</span>
												{active && <Check size={13} className="text-(--accent) shrink-0" />}
											</button>
										);
									})}
								</div>
							</div>
						</div>
					</div>

					{/* Section 2: Level-Up Announcements */}
					<div className="flex flex-col gap-3.5 pt-4 border-t border-(--border)/10">
						<div className="flex items-center justify-between gap-3">
							<div className="flex flex-col">
								<span className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.announceLevelUps')}</span>
								<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.announceLevelUpsDesc')}</span>
							</div>
							<Toggle checked={levelUp} onChange={(e) => setLevelUp(e.target.checked)} size="sm" />
						</div>

						{levelUp && (
							<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
								<div className="lg:col-span-7 flex flex-col gap-1.5">
									<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.messageTemplate')}</label>
									<Input
										variant="textarea"
										value={levelMessage}
										onChange={(e) => setLevelMessage(e.target.value)}
										placeholder="[@mention] reached level [@level] :tada:!"
										rows={3}
										className="resize-none"
									/>
									<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
										{(['[@mention]', '[@username]', '[@level]', '[@role]', '[@credits]'] as const).map((token) => (
											<button
												key={token}
												type="button"
												onClick={() => setLevelMessage((prev) => `${prev}${prev.endsWith(' ') || !prev ? '' : ' '}${token}`)}
												className="px-2 py-0.5 rounded-xl bg-(--background)/60 border border-(--border)/10 text-[11px] font-mono text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/30 transition-colors cursor-pointer"
											>
												{token}
											</button>
										))}
									</div>
								</div>

								<div className="lg:col-span-5 flex flex-col gap-3">
									<div className="flex flex-col gap-1.5">
										<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.channelId')}</label>
										<Selector
											value={levelChannel}
											onChange={(val: string) => setLevelChannel(val)}
											placeholder={t('app.dashboard.virtue.channelPlaceholder')}
											options={channelSelectorOptions}
										/>
									</div>

									<div className="flex flex-col gap-1.5">
										<div className="flex items-center justify-between">
											<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.autoDelete')}</label>
											<span className="text-[11px] text-(--text-muted)">{autoDelete > 0 ? `${autoDelete}s` : t('app.dashboard.virtue.disabled')}</span>
										</div>
										<Input
											type="number"
											min={0}
											max={60}
											value={autoDelete.toString()}
											onChange={(e) => setAutoDelete(Number(e.target.value) || 0)}
											placeholder={t('app.dashboard.virtue.autoDeletePlaceholder')}
										/>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Section 3: Role & Channel Rules */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-(--border)/10">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.ignoredRoles')}</label>
							<MultiSelector value={ignoredRoles} onChange={setIgnoredRoles} options={multiRoleOptions} placeholder={t('app.dashboard.virtue.rolesPlaceholder')} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.ignoredRolesDesc')}</span>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.trackedRoles')}</label>
							<MultiSelector value={trackedRoles} onChange={setTrackedRoles} options={multiRoleOptions} placeholder={t('app.dashboard.virtue.rolesPlaceholder')} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.trackedRolesDesc')}</span>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.ignoredChannels')}</label>
							<MultiSelector value={ignoredChannels} onChange={setIgnoredChannels} options={multiChannelOptions} placeholder={t('app.dashboard.virtue.ignoredChannelsPlaceholder')} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.ignoredChannelsDesc')}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Level Roles Card */}
			<LevelRolesSection
				levelRoles={levelRoles}
				setLevelRoles={setLevelRoles}
				roleSelectorOptions={roleSelectorOptions}
				discordRoles={discordRoles}
				stackRoles={stackRoles}
				setStackRoles={setStackRoles}
				dynamicRoles={dynamicRoles}
				setDynamicRoles={setDynamicRoles}
				isServerPremium={isServerPremium}
			/>
		</div>
	);
}
