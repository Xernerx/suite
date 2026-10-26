/** @format */

'use client';

import { Check, Hash, Megaphone, Sparkles, Trophy } from 'lucide-react';
import { Input, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import ConfigPortabilityCard, { VirtueConfigShape, VirtueLevelRole } from '@/components/virtue/ConfigPortabilityCard';
import LevelRolesSection, {
	buildConfigSnapshot,
	DiscordChannel,
	DiscordRole,
	normalizeDiscordChannels,
	normalizeDiscordRoles,
	normalizeLevelRoles,
	VirtueProfile,
} from '@/components/dashboard/virtue/LevelRolesSection';

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
	const [levelRoles, setLevelRoles] = useState<VirtueLevelRole[]>([]);
	const [discordRoles, setDiscordRoles] = useState<DiscordRole[]>([]);
	const [discordChannels, setDiscordChannels] = useState<DiscordChannel[]>([]);
	const [levelUp, setLevelUp] = useState(true);
	const [levelMessage, setLevelMessage] = useState('[@mention] reached level [@level] :tada:!');
	const [levelChannel, setLevelChannel] = useState('');
	const [autoDelete, setAutoDelete] = useState(0);

	const fetchProfile = useCallback(async () => {
		if (!id) return;
		setLoading(true);

		try {
			const [res, rolesRes, channelsRes] = await Promise.all([
				fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/virtue`), { credentials: 'include' }),
				fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${id}/discord/roles`), { credentials: 'include' }).catch(() => null),
				fetch(getEnvUrl(`https://api.xernerx.com/core/guilds/${id}/discord/channels`), { credentials: 'include' }).catch(() => null),
			]);

			let fetchedRoles: DiscordRole[] = [];
			if (rolesRes && rolesRes.ok) {
				const rolesData = await rolesRes.json().catch(() => []);
				fetchedRoles = normalizeDiscordRoles(rolesData, id);
			}

			let fetchedChannels: DiscordChannel[] = [];
			if (channelsRes && channelsRes.ok) {
				const channelsData = await channelsRes.json().catch(() => []);
				fetchedChannels = normalizeDiscordChannels(channelsData);
			}

			if (res.ok) {
				const data = await res.json();
				const nextMode = data.mode || 'balanced';
				const nextCycles = {
					daily: Boolean(data.cycles?.daily),
					weekly: Boolean(data.cycles?.weekly),
					monthly: Boolean(data.cycles?.monthly),
				};
				const nextIgnored = Array.isArray(data.roles?.ignored) ? data.roles.ignored.map(String).filter(Boolean) : [];
				const nextTracked = Array.isArray(data.roles?.tracked) ? data.roles.tracked.map(String).filter(Boolean) : [];
				const nextLevelRoles = normalizeLevelRoles(data.levelRoles ?? data.roles?.levels);
				const nextLevelUp = data.levelUp ?? true;
				const nextLevelMessage = data.levelMessage || '[@mention] reached level [@level] :tada:!';
				const nextLevelChannel = data.levelChannel || '';
				const nextAutoDelete = Number(data.autoDelete) || 0;

				setProfile(data);
				setMode(nextMode);
				setCycles(nextCycles);
				setIgnoredRoles(nextIgnored);
				setTrackedRoles(nextTracked);
				setLevelRoles(nextLevelRoles);
				setLevelUp(nextLevelUp);
				setLevelMessage(nextLevelMessage);
				setLevelChannel(nextLevelChannel);
				setAutoDelete(nextAutoDelete);
				setOriginalConfig(
					buildConfigSnapshot({
						mode: nextMode,
						cycles: nextCycles,
						ignoredRoles: nextIgnored,
						trackedRoles: nextTracked,
						levelRoles: nextLevelRoles,
						levelUp: nextLevelUp,
						levelMessage: nextLevelMessage,
						levelChannel: nextLevelChannel,
						autoDelete: nextAutoDelete,
					})
				);

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
	}, [id, getEnvUrl]);

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
				levelRoles,
				levelUp,
				levelMessage,
				levelChannel,
				autoDelete,
			}),
		[mode, cycles, ignoredRoles, trackedRoles, levelRoles, levelUp, levelMessage, levelChannel, autoDelete]
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
				const savedRoles = normalizeLevelRoles(updated.levelRoles ?? updated.roles?.levels ?? currentConfigObject.levelRoles);
				const nextSnapshot = buildConfigSnapshot({
					mode: updated.mode || currentConfigObject.mode,
					cycles: updated.cycles || currentConfigObject.cycles,
					ignoredRoles: Array.isArray(updated.roles?.ignored) ? updated.roles.ignored : currentConfigObject.roles.ignored,
					trackedRoles: Array.isArray(updated.roles?.tracked) ? updated.roles.tracked : currentConfigObject.roles.tracked,
					levelRoles: savedRoles,
					levelUp: updated.levelUp ?? currentConfigObject.levelUp,
					levelMessage: updated.levelMessage ?? currentConfigObject.levelMessage,
					levelChannel: updated.levelChannel || '',
					autoDelete: updated.autoDelete ?? currentConfigObject.autoDelete,
				});
				setProfile(updated);
				setLevelRoles(savedRoles);
				setOriginalConfig(JSON.parse(JSON.stringify(nextSnapshot)));
				remind(false);
				toast({
					title: t('app.dashboard.virtue.toast.savedSuccess'),
					type: 'success',
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('app.dashboard.virtue.toast.saveError'));
			}
		} catch (err: any) {
			console.error('Failed to save Virtue settings:', err);
			toast({
				title: t('app.dashboard.virtue.toast.saveError'),
				description: err.message,
				type: 'error',
			});
		} finally {
			setSaving(false);
		}
	}, [id, getEnvUrl, currentConfigObject, remind, toast, t]);

	const handleReset = useCallback(() => {
		if (!originalConfig) return;
		setMode(originalConfig.mode);
		setCycles({ ...originalConfig.cycles });
		setIgnoredRoles([...originalConfig.roles.ignored]);
		setTrackedRoles([...originalConfig.roles.tracked]);
		setLevelRoles(normalizeLevelRoles(originalConfig.levelRoles ?? originalConfig.roles.levels));
		setLevelUp(originalConfig.levelUp);
		setLevelMessage(originalConfig.levelMessage);
		setLevelChannel(originalConfig.levelChannel || '');
		setAutoDelete(originalConfig.autoDelete);
	}, [originalConfig]);

	useEffect(() => {
		if (isDirty) {
			remind(true, handleSave, handleReset, saving);
		} else {
			remind(false);
		}
		return () => remind(false);
	}, [isDirty, saving, handleSave, handleReset, remind]);

	if (loading) {
		return <Loading />;
	}

	if (!profile) {
		return (
			<div className="flex flex-col items-center text-center justify-center bg-(--accent)/5 border border-(--accent)/20 rounded-3xl p-10 shadow-xl animate-in fade-in zoom-in-95 duration-300">
				<div className="w-16 h-16 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent) mb-4 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
					<Sparkles className="w-8 h-8" />
				</div>
				<h3 className="text-xl font-extrabold text-(--text) mb-2">{t('app.dashboard.virtue.notAdded')}</h3>
				<p className="text-sm text-(--text-muted) mb-6 max-w-md">{t('app.dashboard.virtue.notAddedDesc')}</p>
				<a
					href={getEnvUrl('https://www.xernerx.com/invites/virtue')}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center justify-center gap-2 rounded-2xl bg-(--accent) text-white font-bold text-sm px-6 py-3 shadow-lg shadow-(--accent)/20 hover:opacity-90 transition-all hover:scale-[1.02]"
				>
					<Sparkles size={16} />
					<span>{t('app.dashboard.virtue.inviteBtn')}</span>
				</a>
			</div>
		);
	}

	const handleApplyPortableConfig = (cfg: Partial<VirtueConfigShape>) => {
		if (cfg.mode && ['easy', 'casual', 'balanced', 'hard', 'extreme'].includes(cfg.mode)) {
			setMode(cfg.mode);
		}
		if (cfg.cycles && typeof cfg.cycles === 'object') {
			setCycles({
				daily: Boolean(cfg.cycles.daily),
				weekly: Boolean(cfg.cycles.weekly),
				monthly: Boolean(cfg.cycles.monthly),
			});
		}
		if (cfg.roles && typeof cfg.roles === 'object') {
			if (Array.isArray(cfg.roles.ignored)) setIgnoredRoles(cfg.roles.ignored.map(String).filter(Boolean));
			if (Array.isArray(cfg.roles.tracked)) setTrackedRoles(cfg.roles.tracked.map(String).filter(Boolean));
			if (Array.isArray(cfg.roles.levels)) setLevelRoles(normalizeLevelRoles(cfg.roles.levels));
		}
		if (Array.isArray(cfg.levelRoles)) {
			setLevelRoles(normalizeLevelRoles(cfg.levelRoles));
		}
		if (typeof cfg.levelUp === 'boolean') setLevelUp(cfg.levelUp);
		if (typeof cfg.levelMessage === 'string') setLevelMessage(cfg.levelMessage);
		if (cfg.levelChannel !== undefined) setLevelChannel(cfg.levelChannel || '');
		if (typeof cfg.autoDelete === 'number') setAutoDelete(cfg.autoDelete);
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

	const channelSelectorOptions = [
		{ value: '', label: t('app.dashboard.virtue.channelPlaceholder') },
		...discordChannels.map((channel) => ({
			value: channel.id,
			label: (
				<span className="inline-flex items-center gap-1.5">
					{channel.type === 5 ? <Megaphone size={13} className="text-(--text-muted) shrink-0" /> : <Hash size={13} className="text-(--text-muted) shrink-0" />}
					<span>{channel.name}</span>
				</span>
			),
		})),
	];

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{id && <ConfigPortabilityCard guildId={id} currentConfig={currentConfigObject} onApplyConfig={handleApplyPortableConfig} managedGuilds={managedGuilds} />}

			{/* Virtue Leveling Configuration Card */}
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
					<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
						<Trophy className="w-4 h-4" />
					</div>
					{t('app.dashboard.virtue.title')}
				</div>

				<div className="flex flex-col gap-6">
					{/* Level Mode Selector */}
					<div className="flex flex-col gap-2">
						<label className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.difficultyMode')}</label>
						<Selector
							value={mode}
							onChange={(val: any) => setMode(val)}
							options={[
								{ label: t('app.dashboard.virtue.modes.easy'), value: 'easy' },
								{ label: t('app.dashboard.virtue.modes.casual'), value: 'casual' },
								{ label: t('app.dashboard.virtue.modes.balanced'), value: 'balanced' },
								{ label: t('app.dashboard.virtue.modes.hard'), value: 'hard' },
								{ label: t('app.dashboard.virtue.modes.extreme'), value: 'extreme' },
							]}
						/>
					</div>

					{/* Reset Cycles */}
					<div className="flex flex-col gap-2">
						<label className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.resetCycles')}</label>
						<p className="text-xs text-(--text-muted)">{t('app.dashboard.virtue.resetCyclesDesc')}</p>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
							{(['daily', 'weekly', 'monthly'] as const).map((cycleKey) => {
								const active = cycles[cycleKey];
								return (
									<button
										key={cycleKey}
										type="button"
										onClick={() => setCycles((prev) => ({ ...prev, [cycleKey]: !active }))}
										className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all cursor-pointer ${
											active
												? 'border-(--accent) bg-(--accent)/10 text-(--text) font-bold shadow-sm'
												: 'border-(--border)/10 bg-(--background)/50 text-(--text-muted) hover:border-(--border)/20'
										}`}
									>
										<span className="capitalize text-sm">{t(`app.dashboard.virtue.cycles.${cycleKey}`)}</span>
										{active && <Check size={16} className="text-(--accent)" />}
									</button>
								);
							})}
						</div>
					</div>

					{/* Level Up Announcement Toggle */}
					<div className="flex items-center justify-between p-4 rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md">
						<div className="flex flex-col">
							<span className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.announceLevelUps')}</span>
							<span className="text-xs text-(--text-muted)">{t('app.dashboard.virtue.announceLevelUpsDesc')}</span>
						</div>
						<Toggle checked={levelUp} onChange={(e) => setLevelUp(e.target.checked)} size="sm" />
					</div>

					{/* Conditional Message Settings */}
					{levelUp && (
						<div className="flex flex-col gap-4 p-5 rounded-2xl border border-(--border)/10 bg-(--background)/30">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.messageTemplate')}</label>
								<Input
									variant="textarea"
									value={levelMessage}
									onChange={(e) => setLevelMessage(e.target.value)}
									placeholder="[@mention] reached level [@level] :tada:!"
									rows={3}
									className="resize-none"
								/>
								<span className="text-[11px] text-(--text-muted)">
									{t('app.dashboard.virtue.variables')} <code>[@mention]</code>, <code>[@level]</code>, <code>[@username]</code>, <code>[@role]</code>
								</span>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<label className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.channelId')}</label>
									<Selector
										value={levelChannel}
										onChange={(val: string) => setLevelChannel(val)}
										placeholder={t('app.dashboard.virtue.channelPlaceholder')}
										options={channelSelectorOptions}
									/>
								</div>

								<div className="flex flex-col gap-2">
									<div className="flex items-center justify-between">
										<label className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.autoDelete')}</label>
										<span className="text-xs text-(--text-muted)">{autoDelete > 0 ? `${autoDelete}s` : t('app.dashboard.virtue.disabled')}</span>
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

					{/* Level Roles (Link Roles to Specific Levels) */}
					<LevelRolesSection levelRoles={levelRoles} setLevelRoles={setLevelRoles} roleSelectorOptions={roleSelectorOptions} />

					{/* Role Rules */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col gap-2">
							<label className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.ignoredRoles')}</label>
							<MultiSelector value={ignoredRoles} onChange={setIgnoredRoles} options={multiRoleOptions} placeholder={t('app.dashboard.virtue.rolesPlaceholder')} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.ignoredRolesDesc')}</span>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.trackedRoles')}</label>
							<MultiSelector value={trackedRoles} onChange={setTrackedRoles} options={multiRoleOptions} placeholder={t('app.dashboard.virtue.rolesPlaceholder')} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.trackedRolesDesc')}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
