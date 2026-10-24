/** @format */

'use client';

import { AlertCircle, Check, Info, Loader2, Save, Sparkles, Trophy } from 'lucide-react';
import { Button, Input, Selector, Toggle } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useCallback, useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import ConfigPortabilityCard, { VirtueConfigShape } from '@/components/virtue/ConfigPortabilityCard';

interface VirtueProfile {
	id: string;
	mode: 'easy' | 'casual' | 'balanced' | 'hard' | 'extreme';
	cycles: {
		daily: boolean;
		weekly: boolean;
		monthly: boolean;
	};
	roles: {
		ignored: string[];
		tracked: string[];
	};
	levelUp: boolean;
	levelMessage: string;
	levelChannel: string | null;
	autoDelete: number;
}

export default function VirtueGeneral({ id }: { id?: string }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [profile, setProfile] = useState<VirtueProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [mode, setMode] = useState<'easy' | 'casual' | 'balanced' | 'hard' | 'extreme'>('balanced');
	const [cycles, setCycles] = useState({ daily: false, weekly: false, monthly: false });
	const [ignoredRoles, setIgnoredRoles] = useState('');
	const [trackedRoles, setTrackedRoles] = useState('');
	const [levelUp, setLevelUp] = useState(true);
	const [levelMessage, setLevelMessage] = useState('[@mention] reached level [@level] :tada:!');
	const [levelChannel, setLevelChannel] = useState('');
	const [autoDelete, setAutoDelete] = useState(0);

	const fetchProfile = useCallback(async () => {
		if (!id) return;
		setLoading(true);

		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/virtue`), {
				credentials: 'include',
			});

			if (res.ok) {
				const data = await res.json();
				setProfile(data);
				setMode(data.mode || 'balanced');
				setCycles(data.cycles || { daily: false, weekly: false, monthly: false });
				setIgnoredRoles(Array.isArray(data.roles?.ignored) ? data.roles.ignored.join(', ') : '');
				setTrackedRoles(Array.isArray(data.roles?.tracked) ? data.roles.tracked.join(', ') : '');
				setLevelUp(data.levelUp ?? true);
				setLevelMessage(data.levelMessage || '[@mention] reached level [@level] :tada:!');
				setLevelChannel(data.levelChannel || '');
				setAutoDelete(data.autoDelete || 0);
			} else {
				setProfile(null);
			}
		} catch (err) {
			console.error('Failed to fetch Virtue profile:', err);
			setProfile(null);
		} finally {
			setLoading(false);
		}
	}, [id, getEnvUrl]);

	useEffect(() => {
		fetchProfile();
	}, [fetchProfile]);

	const handleSave = async () => {
		if (!id) return;
		setSaving(true);

		const payload = {
			mode,
			cycles,
			roles: {
				ignored: ignoredRoles
					.split(',')
					.map((r) => r.trim())
					.filter(Boolean),
				tracked: trackedRoles
					.split(',')
					.map((r) => r.trim())
					.filter(Boolean),
			},
			levelUp,
			levelMessage,
			levelChannel: levelChannel.trim() || null,
			autoDelete: Number(autoDelete) || 0,
		};

		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/virtue`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				const updated = await res.json();
				setProfile(updated);
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
	};

	if (loading) {
		return <Loading />;
	}

	if (!profile) {
		return (
			<div className="flex flex-col items-center text-center justify-center bg-(--accent)/5 border border-(--accent)/20 rounded-[2rem] p-10 shadow-xl animate-in fade-in zoom-in-95 duration-300">
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

	const currentConfigObject: VirtueConfigShape = {
		mode,
		cycles,
		roles: {
			ignored: ignoredRoles
				.split(',')
				.map((r) => r.trim())
				.filter(Boolean),
			tracked: trackedRoles
				.split(',')
				.map((r) => r.trim())
				.filter(Boolean),
		},
		levelUp,
		levelMessage,
		levelChannel: levelChannel.trim() || null,
		autoDelete: Number(autoDelete) || 0,
	};

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
			if (Array.isArray(cfg.roles.ignored)) setIgnoredRoles(cfg.roles.ignored.join(', '));
			if (Array.isArray(cfg.roles.tracked)) setTrackedRoles(cfg.roles.tracked.join(', '));
		}
		if (typeof cfg.levelUp === 'boolean') setLevelUp(cfg.levelUp);
		if (typeof cfg.levelMessage === 'string') setLevelMessage(cfg.levelMessage);
		if (cfg.levelChannel !== undefined) setLevelChannel(cfg.levelChannel || '');
		if (typeof cfg.autoDelete === 'number') setAutoDelete(cfg.autoDelete);
	};

	return (
		<div className="flex flex-col gap-8">
			{id && <ConfigPortabilityCard guildId={id} currentConfig={currentConfigObject} onApplyConfig={handleApplyPortableConfig} />}

			{/* Virtue Leveling Configuration Card */}
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3 text-(--text) font-extrabold text-sm tracking-widest uppercase">
						<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
							<Trophy className="w-4 h-4" />
						</div>
						{t('app.dashboard.virtue.title')}
					</div>
					<Button
						onClick={handleSave}
						disabled={saving}
						className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--accent) text-white text-xs font-bold shadow-md hover:opacity-90 transition-all"
					>
						{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
						<span>{saving ? t('app.dashboard.virtue.saving') : t('app.dashboard.virtue.saveChanges')}</span>
					</Button>
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
										className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
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
									{t('app.dashboard.virtue.variables')} <code>[@mention]</code>, <code>[@level]</code>, <code>[@username]</code>
								</span>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<label className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.channelId')}</label>
									<Input value={levelChannel} onChange={(e) => setLevelChannel(e.target.value)} placeholder={t('app.dashboard.virtue.channelPlaceholder')} />
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

					{/* Role Rules */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col gap-2">
							<label className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.ignoredRoles')}</label>
							<Input value={ignoredRoles} onChange={(e) => setIgnoredRoles(e.target.value)} placeholder={t('app.dashboard.virtue.rolesPlaceholder')} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.ignoredRolesDesc')}</span>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.trackedRoles')}</label>
							<Input value={trackedRoles} onChange={(e) => setTrackedRoles(e.target.value)} placeholder={t('app.dashboard.virtue.rolesPlaceholder')} />
							<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.trackedRolesDesc')}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
