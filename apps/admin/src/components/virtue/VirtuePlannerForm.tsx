/** @format */
'use client';

import { Calendar, CheckCircle2, Flame, Loader2, Save, Sparkles, Timer, Trophy } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
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

export const DEFAULT_CONFIG: VirtueGlobalXpConfig = {
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

export function toDatetimeLocalValue(isoStr?: string | null): string {
	if (!isoStr) return '';
	const d = new Date(isoStr);
	if (Number.isNaN(d.getTime())) return '';
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseSettingValue(raw: unknown): VirtueGlobalXpConfig {
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

interface VirtueStatusBannerProps {
	effectivelyActive: boolean;
	effectivelyScheduled: boolean;
	isExpired: boolean;
	enabled: boolean;
	label: string;
	multiplier: number;
	syncDiscordEvent: boolean;
	discordEventId: string | null;
	statusBannerDescription: string;
}

export function VirtueStatusBanner({
	effectivelyActive,
	effectivelyScheduled,
	isExpired,
	enabled,
	label,
	multiplier,
	syncDiscordEvent,
	discordEventId,
	statusBannerDescription,
}: VirtueStatusBannerProps) {
	const { t } = useDictionary();

	return (
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
	);
}

interface VirtuePlannerFormProps {
	enabled: boolean;
	setEnabled: (v: boolean) => void;
	syncDiscordEvent: boolean;
	setSyncDiscordEvent: (v: boolean) => void;
	label: string;
	setLabel: (v: string) => void;
	multiplier: number;
	setMultiplier: (v: number) => void;
	scope: GlobalXpScope;
	setScope: (v: GlobalXpScope) => void;
	startsAt: string;
	setStartsAt: (v: string) => void;
	expiresAt: string;
	setExpiresAt: (v: string) => void;
	onSetStartPreset: (preset: 'now' | '1h' | '6h' | 'tomorrow' | 'weekend') => void;
	onSetDurationPreset: (hours: number | null) => void;
	isSaving: boolean;
	isDirty: boolean;
	isScheduled: boolean;
	onSave: () => void;
}

export function VirtuePlannerForm({
	enabled,
	setEnabled,
	syncDiscordEvent,
	setSyncDiscordEvent,
	label,
	setLabel,
	multiplier,
	setMultiplier,
	scope,
	setScope,
	startsAt,
	setStartsAt,
	expiresAt,
	setExpiresAt,
	onSetStartPreset,
	onSetDurationPreset,
	isSaving,
	isDirty,
	isScheduled,
	onSave,
}: VirtuePlannerFormProps) {
	const { t } = useDictionary();

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
		<motion.form
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			onSubmit={(e) => {
				e.preventDefault();
				onSave();
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
							<button key={p.id} type="button" onClick={() => onSetStartPreset(p.id)} className={presetBtnClass}>
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
							<button key={String(p.hours)} type="button" onClick={() => onSetDurationPreset(p.hours)} className={presetBtnClass}>
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
	);
}
