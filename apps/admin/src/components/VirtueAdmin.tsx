/** @format */
'use client';

import { Calendar, CheckCircle2, Flame, Loader2, RotateCcw, Save, Sparkles, Timer, Trophy, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Input, Selector, Toggle } from '@xernerx/ui';
import { motion } from 'framer-motion';

export type GlobalXpScope = 'global_and_servers' | 'global_only' | 'everything';

export interface VirtueGlobalXpConfig {
	enabled: boolean;
	multiplier: number;
	scope: GlobalXpScope;
	label: string;
	startsAt: string | null;
	expiresAt: string | null;
	syncDiscordEvent?: boolean;
	targetGuildId?: string | null;
	discordEventId?: string | null;
	discordEventGuildId?: string | null;
	updatedAt?: string;
}

const DEFAULT_CONFIG: VirtueGlobalXpConfig = {
	enabled: false,
	multiplier: 2,
	scope: 'global_and_servers',
	label: 'Double XP Event',
	startsAt: null,
	expiresAt: null,
	syncDiscordEvent: true,
	targetGuildId: null,
	discordEventId: null,
	discordEventGuildId: null,
};

function toDatetimeLocalValue(isoStr?: string | null): string {
	if (!isoStr) return '';
	const d = new Date(isoStr);
	if (Number.isNaN(d.getTime())) return '';
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseSettingValue(raw: unknown): VirtueGlobalXpConfig {
	if (!raw) return { ...DEFAULT_CONFIG };
	try {
		const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
		if (!obj || typeof obj !== 'object') return { ...DEFAULT_CONFIG };
		const parsed = obj as Record<string, any>;
		return {
			enabled: Boolean(parsed.enabled),
			multiplier: Math.min(10, Math.max(1, Number(parsed.multiplier) || 2)),
			scope: ['global_and_servers', 'global_only', 'everything'].includes(parsed.scope) ? parsed.scope : 'global_and_servers',
			label: typeof parsed.label === 'string' && parsed.label.trim() ? parsed.label.trim() : 'Double XP Event',
			startsAt: typeof parsed.startsAt === 'string' && parsed.startsAt.trim() ? parsed.startsAt.trim() : null,
			expiresAt: typeof parsed.expiresAt === 'string' && parsed.expiresAt.trim() ? parsed.expiresAt.trim() : null,
			syncDiscordEvent: parsed.syncDiscordEvent !== false,
			targetGuildId: parsed.targetGuildId || null,
			discordEventId: parsed.discordEventId || null,
			discordEventGuildId: parsed.discordEventGuildId || null,
		};
	} catch {
		return { ...DEFAULT_CONFIG };
	}
}

export default function VirtueAdmin({ avatarUrl, adminServerId }: { avatarUrl?: string | null; adminServerId?: string | null }) {
	const { getEnvUrl } = useEnvironment();
	const { toast, remind } = useToast();
	const { t } = useDictionary();

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const [enabled, setEnabled] = useState(false);
	const [multiplier, setMultiplier] = useState<number>(2);
	const [scope, setScope] = useState<GlobalXpScope>('global_and_servers');
	const [label, setLabel] = useState('Double XP Event');
	const [startsAt, setStartsAt] = useState<string>('');
	const [expiresAt, setExpiresAt] = useState<string>('');
	const [syncDiscordEvent, setSyncDiscordEvent] = useState<boolean>(true);
	const [discordEventId, setDiscordEventId] = useState<string | null>(null);
	const [initialSnapshot, setInitialSnapshot] = useState<string>('');

	const applyConfigState = useCallback((cfg: VirtueGlobalXpConfig) => {
		setEnabled(cfg.enabled);
		setMultiplier(cfg.multiplier);
		setScope(cfg.scope);
		setLabel(cfg.label);
		setStartsAt(cfg.startsAt || '');
		setExpiresAt(cfg.expiresAt || '');
		setSyncDiscordEvent(cfg.syncDiscordEvent !== false);
		setDiscordEventId(cfg.discordEventId || null);
		setInitialSnapshot(
			JSON.stringify({
				enabled: cfg.enabled,
				multiplier: cfg.multiplier,
				scope: cfg.scope,
				label: cfg.label,
				startsAt: cfg.startsAt || '',
				expiresAt: cfg.expiresAt || '',
				syncDiscordEvent: cfg.syncDiscordEvent !== false,
			})
		);
	}, []);

	const fetchGlobalXpConfig = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/virtue_global_xp'), { credentials: 'include' });
			if (res.ok) applyConfigState(parseSettingValue((await res.json())?.value));
		} catch (err) {
			console.error('Failed to fetch Virtue global XP config:', err);
		} finally {
			setIsLoading(false);
		}
	}, [getEnvUrl, applyConfigState]);

	useEffect(() => {
		fetchGlobalXpConfig();
	}, [fetchGlobalXpConfig]);

	const currentSnapshot = useMemo(
		() => JSON.stringify({ enabled, multiplier, scope, label: label.trim() || 'Double XP Event', startsAt: startsAt.trim(), expiresAt: expiresAt.trim(), syncDiscordEvent }),
		[enabled, multiplier, scope, label, startsAt, expiresAt, syncDiscordEvent]
	);

	const isDirty = Boolean(initialSnapshot && currentSnapshot !== initialSnapshot);
	const isScheduled = useMemo(() => Boolean(startsAt && !Number.isNaN(new Date(startsAt).getTime()) && new Date(startsAt).getTime() > Date.now()), [startsAt]);
	const isExpired = useMemo(() => Boolean(expiresAt && !Number.isNaN(new Date(expiresAt).getTime()) && new Date(expiresAt).getTime() <= Date.now()), [expiresAt]);

	const effectivelyActive = enabled && !isScheduled && !isExpired && multiplier > 1;
	const effectivelyScheduled = enabled && isScheduled && !isExpired && multiplier > 1;

	const saveConfig = useCallback(
		async (override?: Partial<VirtueGlobalXpConfig>) => {
			setIsSaving(true);
			try {
				const rawStartsAt = override?.startsAt !== undefined ? override.startsAt : startsAt.trim();
				const rawExpiresAt = override?.expiresAt !== undefined ? override.expiresAt : expiresAt.trim();
				const normalizedStartsAt = rawStartsAt && !Number.isNaN(new Date(rawStartsAt).getTime()) ? new Date(rawStartsAt).toISOString() : null;
				const normalizedExpiresAt = rawExpiresAt && !Number.isNaN(new Date(rawExpiresAt).getTime()) ? new Date(rawExpiresAt).toISOString() : null;

				const payload: VirtueGlobalXpConfig = {
					enabled: override?.enabled ?? enabled,
					multiplier: Math.min(10, Math.max(1, Number(override?.multiplier ?? multiplier) || 2)),
					scope: override?.scope ?? scope,
					label: (override?.label ?? label).trim() || t('admin.virtue.defaultEventLabel'),
					startsAt: normalizedStartsAt,
					expiresAt: normalizedExpiresAt,
					syncDiscordEvent: override?.syncDiscordEvent ?? syncDiscordEvent,
					targetGuildId: adminServerId || null,
					discordEventId: discordEventId || null,
					updatedAt: new Date().toISOString(),
				};

				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/virtue_global_xp'), {
					method: 'PATCH',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: 'Virtue Global XP Multiplier', value: JSON.stringify(payload) }),
				});

				if (!res.ok) {
					const errData = await res.json().catch(() => ({}));
					throw new Error(errData.error || t('admin.virtue.toasts.saveError'));
				}

				const savedDoc = await res.json().catch(() => null);
				const savedCfg = savedDoc?.value ? parseSettingValue(savedDoc.value) : payload;
				applyConfigState(savedCfg);
				remind(false);

				const scheduledInFuture = savedCfg.startsAt && new Date(savedCfg.startsAt).getTime() > Date.now();
				toast({
					type: 'success',
					title: !savedCfg.enabled
						? t('admin.virtue.toasts.endedTitle')
						: scheduledInFuture
							? t('admin.virtue.toasts.scheduledTitle', { multiplier: savedCfg.multiplier })
							: t('admin.virtue.toasts.activeTitle', { multiplier: savedCfg.multiplier }),
					description: !savedCfg.enabled
						? t('admin.virtue.toasts.endedDesc')
						: scheduledInFuture
							? t(savedCfg.syncDiscordEvent ? 'admin.virtue.toasts.scheduledDescSynced' : 'admin.virtue.toasts.scheduledDescUnsynced', {
									label: savedCfg.label,
									startsAt: new Date(savedCfg.startsAt!).toLocaleString(),
								})
							: t(savedCfg.syncDiscordEvent ? 'admin.virtue.toasts.activeDescSynced' : 'admin.virtue.toasts.activeDescUnsynced', {
									label: savedCfg.label,
								}),
				});
			} catch (err: any) {
				toast({ type: 'error', title: t('admin.virtue.toasts.saveError'), description: err.message });
			} finally {
				setIsSaving(false);
			}
		},
		[enabled, multiplier, scope, label, startsAt, expiresAt, syncDiscordEvent, adminServerId, discordEventId, getEnvUrl, applyConfigState, remind, toast, t]
	);

	const handleReset = useCallback(() => {
		if (!initialSnapshot) return;
		try {
			const parsed = JSON.parse(initialSnapshot);
			setEnabled(Boolean(parsed.enabled));
			setMultiplier(Number(parsed.multiplier) || 2);
			setScope(parsed.scope || 'global_and_servers');
			setLabel(parsed.label || 'Double XP Event');
			setStartsAt(parsed.startsAt || '');
			setExpiresAt(parsed.expiresAt || '');
			setSyncDiscordEvent(parsed.syncDiscordEvent !== false);
		} catch {}
	}, [initialSnapshot]);

	useEffect(() => {
		if (isDirty) remind(true, () => saveConfig(), handleReset, isSaving);
		else remind(false);
		return () => remind(false);
	}, [isDirty, isSaving, remind, saveConfig, handleReset]);

	const setStartPreset = (preset: 'now' | '1h' | '6h' | 'tomorrow' | 'weekend') => {
		const now = new Date();
		if (preset === 'now') return setStartsAt('');
		if (preset === '1h') return setStartsAt(new Date(now.getTime() + 3600 * 1000).toISOString());
		if (preset === '6h') return setStartsAt(new Date(now.getTime() + 6 * 3600 * 1000).toISOString());
		if (preset === 'tomorrow') {
			const d = new Date(now);
			d.setDate(d.getDate() + 1);
			d.setHours(18, 0, 0, 0);
			return setStartsAt(d.toISOString());
		}
		const d = new Date(now);
		const daysUntilFri = (5 - d.getDay() + 7) % 7 || 7;
		d.setDate(d.getDate() + daysUntilFri);
		d.setHours(18, 0, 0, 0);
		setStartsAt(d.toISOString());
		setExpiresAt(new Date(d.getTime() + 48 * 3600 * 1000).toISOString());
	};

	const setDurationPreset = (hours: number | null) => {
		if (!hours) return setExpiresAt('');
		const baseMs = startsAt && !Number.isNaN(new Date(startsAt).getTime()) ? new Date(startsAt).getTime() : Date.now();
		setExpiresAt(new Date(baseMs + hours * 3600 * 1000).toISOString());
	};

	if (isLoading) return <Loading />;

	const scopeSummary =
		scope === 'everything' ? t('admin.virtue.scopeSummaryEverything') : scope === 'global_only' ? t('admin.virtue.scopeSummaryGlobalOnly') : t('admin.virtue.scopeSummaryGlobalAndServers');

	const statusBannerDescription = effectivelyActive
		? expiresAt
			? t('admin.virtue.activeDescWithExpiry', { scope: scopeSummary, multiplier, expiresAt: new Date(expiresAt).toLocaleString() })
			: t('admin.virtue.activeDescNoExpiry', { scope: scopeSummary, multiplier })
		: effectivelyScheduled
			? expiresAt
				? t('admin.virtue.scheduledDescWithExpiry', { startsAt: new Date(startsAt).toLocaleString(), expiresAt: new Date(expiresAt).toLocaleString() })
				: t('admin.virtue.scheduledDescNoExpiry', { startsAt: new Date(startsAt).toLocaleString() })
			: t('admin.virtue.inactiveDesc');

	const presetBtnClass =
		'rounded-xl border border-(--border)/15 bg-(--background)/60 px-3 py-1.5 text-xs font-bold text-(--text-muted) hover:text-(--text) hover:border-(--accent)/40 transition-all cursor-pointer';

	const startPresets: { id: 'now' | '1h' | '6h' | 'tomorrow' | 'weekend'; label: string }[] = [
		{ id: 'now', label: t('admin.virtue.startPresets.now') },
		{ id: '1h', label: t('admin.virtue.startPresets.in1h') },
		{ id: '6h', label: t('admin.virtue.startPresets.in6h') },
		{ id: 'tomorrow', label: t('admin.virtue.startPresets.tomorrow') },
		{ id: 'weekend', label: t('admin.virtue.startPresets.weekend') },
	];

	const endPresets: { hours: number | null; label: string }[] = [
		{ hours: null, label: t('admin.virtue.endPresets.none') },
		{ hours: 12, label: t('admin.virtue.endPresets.h12') },
		{ hours: 24, label: t('admin.virtue.endPresets.h24') },
		{ hours: 48, label: t('admin.virtue.endPresets.h48') },
		{ hours: 24 * 7, label: t('admin.virtue.endPresets.d7') },
	];

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full relative" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex items-center" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{avatarUrl && <img src={avatarUrl} alt={t('admin.virtue.title')} className="w-12 h-12 rounded-2xl object-cover border border-(--border)/10 shadow-sm shrink-0" />}
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('admin.virtue.title')}
						</h1>
						<p className="text-sm text-(--text-muted)">{t('admin.virtue.subtitle')}</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{effectivelyActive || effectivelyScheduled ? (
						<Button variant="secondary" disabled={isSaving} onClick={() => saveConfig({ enabled: false })}>
							<RotateCcw size={16} />
							{effectivelyScheduled ? t('admin.virtue.cancelScheduledBtn') : t('admin.virtue.endEventBtn')}
						</Button>
					) : (
						<Button
							variant="primary"
							disabled={isSaving}
							onClick={() =>
								saveConfig({
									enabled: true,
									multiplier: 2,
									label: label.trim() || t('admin.virtue.weekendEventLabel'),
									startsAt: null,
									expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
								})
							}
						>
							<Zap size={16} />
							{t('admin.virtue.quickStartBtn')}
						</Button>
					)}
				</div>
			</div>

			{/* Live / Scheduled Status Banner */}
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border p-6 shadow-sm ${
					effectivelyActive || effectivelyScheduled ? 'border-(--accent)/40 bg-(--accent)/10' : 'border-(--border)/10 bg-(--foreground)/30'
				}`}
				style={{ gap: 'var(--ui-gap)' }}
			>
				<div className="flex items-center gap-4">
					<div
						className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
							effectivelyActive || effectivelyScheduled ? 'bg-(--accent) text-white shadow-lg' : 'bg-(--foreground)/60 text-(--text-muted)'
						}`}
					>
						{effectivelyActive ? <Flame size={28} /> : effectivelyScheduled ? <Calendar size={26} /> : <Trophy size={26} />}
					</div>
					<div className="flex flex-col gap-1">
						<div className="flex flex-wrap items-center gap-2.5">
							<span className="text-lg font-extrabold text-(--text)">
								{effectivelyActive || effectivelyScheduled
									? t('admin.virtue.activeRateTitle', { label: label || t('admin.virtue.globalBoostFallback'), multiplier })
									: t('admin.virtue.standardRateTitle')}
							</span>
							<span
								className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider ${
									effectivelyActive || effectivelyScheduled ? 'bg-(--accent) text-white' : 'bg-(--foreground)/60 text-(--text-muted)'
								}`}
							>
								{effectivelyActive
									? t('admin.virtue.statusLive')
									: effectivelyScheduled
										? t('admin.virtue.statusScheduled')
										: isExpired && enabled
											? t('admin.virtue.statusExpired')
											: t('admin.virtue.statusInactive')}
							</span>
							{(effectivelyActive || effectivelyScheduled) && syncDiscordEvent && (
								<span className="inline-flex items-center gap-1 rounded-full bg-(--accent-green)/15 px-2.5 py-0.5 text-xs font-bold text-(--accent-green)">
									<CheckCircle2 size={12} />
									{discordEventId ? t('admin.virtue.discordSynced') : t('admin.virtue.discordSyncing')}
								</span>
							)}
						</div>
						<p className="text-xs text-(--text-muted)">{statusBannerDescription}</p>
					</div>
				</div>
			</motion.div>

			{/* Configuration Form */}
			<motion.form
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				onSubmit={(e) => {
					e.preventDefault();
					saveConfig();
				}}
				className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'calc(var(--ui-gap) * 1.5)', gap: 'var(--ui-gap)' }}
			>
				<h3 className="text-lg font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
					<Sparkles size={18} className="text-(--accent)" />
					{t('admin.virtue.plannerTitle')}
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--background)/40 p-4">
						<div className="flex flex-col gap-0.5 pr-3">
							<span className="text-sm font-bold text-(--text)">{t('admin.virtue.enableToggleTitle')}</span>
							<span className="text-xs text-(--text-muted)">{t('admin.virtue.enableToggleDesc')}</span>
						</div>
						<Toggle checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
					</div>

					<div className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--background)/40 p-4">
						<div className="flex flex-col gap-0.5 pr-3">
							<span className="text-sm font-bold text-(--text)">{t('admin.virtue.syncToggleTitle')}</span>
							<span className="text-xs text-(--text-muted)">{t('admin.virtue.syncToggleDesc')}</span>
						</div>
						<Toggle checked={syncDiscordEvent} onChange={(e) => setSyncDiscordEvent(e.target.checked)} />
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="flex flex-col gap-2">
						<label className="text-xs font-semibold text-(--text)">{t('admin.virtue.labelFieldTitle')}</label>
						<p className="text-xs text-(--text-muted)">{t('admin.virtue.labelFieldDesc')}</p>
						<Input value={label} onChange={(e: any) => setLabel(e.target?.value ?? e)} placeholder={t('admin.virtue.labelFieldPlaceholder')} />
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-xs font-semibold text-(--text)">{t('admin.virtue.multiplierFieldTitle')}</label>
						<p className="text-xs text-(--text-muted)">{t('admin.virtue.multiplierFieldDesc')}</p>
						<Selector
							value={String(multiplier)}
							onChange={(val: string) => setMultiplier(Number(val) || 2)}
							options={[
								{ value: '1.25', label: t('admin.virtue.multiplierOptions.m125') },
								{ value: '1.5', label: t('admin.virtue.multiplierOptions.m15') },
								{ value: '2', label: t('admin.virtue.multiplierOptions.m2') },
								{ value: '2.5', label: t('admin.virtue.multiplierOptions.m25') },
								{ value: '3', label: t('admin.virtue.multiplierOptions.m3') },
								{ value: '5', label: t('admin.virtue.multiplierOptions.m5') },
							]}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-xs font-semibold text-(--text)">{t('admin.virtue.scopeFieldTitle')}</label>
						<p className="text-xs text-(--text-muted)">{t('admin.virtue.scopeFieldDesc')}</p>
						<Selector
							value={scope}
							onChange={(val: string) => setScope(val as GlobalXpScope)}
							options={[
								{ value: 'global_and_servers', label: t('admin.virtue.scopeOptions.globalAndServers') },
								{ value: 'global_only', label: t('admin.virtue.scopeOptions.globalOnly') },
								{ value: 'everything', label: t('admin.virtue.scopeOptions.everything') },
							]}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="flex flex-col gap-2">
						<label className="text-xs font-semibold text-(--text) flex items-center gap-1.5">
							<Calendar size={14} className="text-(--accent)" />
							{t('admin.virtue.startFieldTitle')}
						</label>
						<p className="text-xs text-(--text-muted)">{t('admin.virtue.startFieldDesc')}</p>
						<Input
							type="datetime-local"
							value={toDatetimeLocalValue(startsAt)}
							onChange={(e: any) => {
								const raw = e.target?.value ?? e;
								setStartsAt(raw ? new Date(raw).toISOString() : '');
							}}
						/>
						<div className="flex flex-wrap gap-2 mt-1">
							{startPresets.map((p) => (
								<button key={p.id} type="button" onClick={() => setStartPreset(p.id)} className={presetBtnClass}>
									{p.label}
								</button>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-xs font-semibold text-(--text) flex items-center gap-1.5">
							<Timer size={14} className="text-(--accent)" />
							{t('admin.virtue.endFieldTitle')}
						</label>
						<p className="text-xs text-(--text-muted)">{t('admin.virtue.endFieldDesc')}</p>
						<Input
							type="datetime-local"
							value={toDatetimeLocalValue(expiresAt)}
							onChange={(e: any) => {
								const raw = e.target?.value ?? e;
								setExpiresAt(raw ? new Date(raw).toISOString() : '');
							}}
						/>
						<div className="flex flex-wrap gap-2 mt-1">
							{endPresets.map((p) => (
								<button key={String(p.hours)} type="button" onClick={() => setDurationPreset(p.hours)} className={presetBtnClass}>
									{p.label}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="flex justify-end pt-4 border-t border-(--border)/10 mt-2">
					<Button type="submit" variant="primary" disabled={isSaving || !isDirty}>
						{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
						{isScheduled && enabled ? t('admin.virtue.scheduleBtn') : t('admin.virtue.saveBtn')}
					</Button>
				</div>
			</motion.form>
		</div>
	);
}
