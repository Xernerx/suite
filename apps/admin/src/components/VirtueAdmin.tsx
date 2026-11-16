/** @format */
'use client';

import { RotateCcw, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import { parseSettingValue, VirtuePlannerForm, VirtueStatusBanner, type GlobalXpScope, type VirtueGlobalXpConfig } from './virtue/VirtuePlannerForm';

export type { GlobalXpScope, VirtueGlobalXpConfig } from './virtue/VirtuePlannerForm';

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

			<VirtueStatusBanner
				effectivelyActive={effectivelyActive}
				effectivelyScheduled={effectivelyScheduled}
				isExpired={isExpired}
				enabled={enabled}
				label={label}
				multiplier={multiplier}
				syncDiscordEvent={syncDiscordEvent}
				discordEventId={discordEventId}
				statusBannerDescription={statusBannerDescription}
			/>

			<VirtuePlannerForm
				enabled={enabled}
				setEnabled={setEnabled}
				syncDiscordEvent={syncDiscordEvent}
				setSyncDiscordEvent={setSyncDiscordEvent}
				label={label}
				setLabel={setLabel}
				multiplier={multiplier}
				setMultiplier={setMultiplier}
				scope={scope}
				setScope={setScope}
				startsAt={startsAt}
				setStartsAt={setStartsAt}
				expiresAt={expiresAt}
				setExpiresAt={setExpiresAt}
				onSetStartPreset={setStartPreset}
				onSetDurationPreset={setDurationPreset}
				isSaving={isSaving}
				isDirty={isDirty}
				isScheduled={isScheduled}
				onSave={() => saveConfig()}
			/>
		</div>
	);
}
