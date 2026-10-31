/** @format */

'use client';

import { useState } from 'react';
import { Award, Layers, MessageSquare, Mic, Plus, Trash2, Trophy } from 'lucide-react';
import { Button, Input, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import type { VirtueConfigShape, VirtueLevelRole, VirtueLevelRoleTrack } from '@/components/virtue/ConfigPortabilityCard';

export interface DiscordRole {
	id: string;
	name: string;
	color: number;
	position: number;
	managed?: boolean;
}

export interface DiscordChannel {
	id: string;
	name: string;
	type: number;
	position?: number;
}

export interface VirtueProfile {
	id: string;
	mode: 'easy' | 'casual' | 'balanced' | 'hard' | 'extreme';
	cycles: { daily: boolean; weekly: boolean; monthly: boolean };
	roles: {
		ignored: string[];
		tracked: string[];
		levels?: VirtueLevelRole[];
		textLevels?: { level: number; roleId: string }[];
		voiceLevels?: { level: number; roleId: string }[];
	};
	channels?: {
		ignored: string[];
		tracked?: string[];
	};
	stackRoles?: boolean;
	boosterMultiplier?: number;
	levelRoles?: VirtueLevelRole[];
	textLevelRoles?: { level: number; roleId: string }[];
	voiceLevelRoles?: { level: number; roleId: string }[];
	serverRoles?: DiscordRole[];
	serverChannels?: DiscordChannel[];
	levelUp: boolean;
	levelMessage: string;
	levelChannel: string | null;
	autoDelete: number;
}

export function normalizeRoleTrack(rawTrack?: unknown): VirtueLevelRoleTrack {
	const val = String(rawTrack || '')
		.trim()
		.toLowerCase();
	if (val === 'text') return 'text';
	if (val === 'voice') return 'voice';
	return 'server';
}

const TRACK_SORT_ORDER: Record<VirtueLevelRoleTrack, number> = {
	server: 0,
	text: 1,
	voice: 2,
};

export function normalizeLevelRoles(raw: unknown, extraTextRaw?: unknown, extraVoiceRaw?: unknown): VirtueLevelRole[] {
	const combined: VirtueLevelRole[] = [];

	const pushEntries = (arr: unknown, fallbackTrack: VirtueLevelRoleTrack) => {
		if (!Array.isArray(arr)) return;
		for (const entry of arr) {
			const roleId = String((entry as any)?.roleId || (entry as any)?.role || (entry as any)?.id || '').trim();
			const level = Math.max(1, Number((entry as any)?.level) || 1);
			if (!roleId) continue;
			const rawTrack = (entry as any)?.track ?? (entry as any)?.type;
			const track = rawTrack ? normalizeRoleTrack(rawTrack) : fallbackTrack;
			combined.push({ level, roleId, track });
		}
	};

	if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
		const obj = raw as Record<string, any>;
		const mainArr = Array.isArray(obj.levelRoles) && obj.levelRoles.length > 0 ? obj.levelRoles : obj.roles?.levels;
		const textArr = Array.isArray(obj.textLevelRoles) && obj.textLevelRoles.length > 0 ? obj.textLevelRoles : obj.roles?.textLevels;
		const voiceArr = Array.isArray(obj.voiceLevelRoles) && obj.voiceLevelRoles.length > 0 ? obj.voiceLevelRoles : obj.roles?.voiceLevels;
		pushEntries(mainArr, 'server');
		pushEntries(textArr, 'text');
		pushEntries(voiceArr, 'voice');
	} else {
		pushEntries(raw, 'server');
		pushEntries(extraTextRaw, 'text');
		pushEntries(extraVoiceRaw, 'voice');
	}

	const seen = new Set<string>();
	return combined
		.filter((entry) => {
			const track = entry.track || 'server';
			const key = `${track}:${entry.level}:${entry.roleId}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		})
		.sort((a, b) => {
			if (a.level !== b.level) return a.level - b.level;
			return TRACK_SORT_ORDER[a.track || 'server'] - TRACK_SORT_ORDER[b.track || 'server'];
		});
}

export function normalizeDiscordRoles(raw: unknown, guildId?: string): DiscordRole[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter((r: any) => r && r.id && r.id !== guildId && !r.managed)
		.map((r: any) => ({
			id: String(r.id),
			name: String(r.name),
			color: Number(r.color) || 0,
			position: Number(r.position) || 0,
			managed: Boolean(r.managed),
		}))
		.sort((a, b) => (b.position || 0) - (a.position || 0));
}

export function normalizeDiscordChannels(raw: unknown): DiscordChannel[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter((c: any) => c && c.id && (Number(c.type) === 0 || Number(c.type) === 5 || Number(c.type) === 2 || Number(c.type) === 13))
		.map((c: any) => ({
			id: String(c.id),
			name: String(c.name),
			type: Number(c.type) || 0,
			position: Number(c.position ?? c.rawPosition) || 0,
		}))
		.sort((a, b) => (a.position || 0) - (b.position || 0));
}

export function buildConfigSnapshot(cfg: {
	mode: 'easy' | 'casual' | 'balanced' | 'hard' | 'extreme';
	cycles: { daily: boolean; weekly: boolean; monthly: boolean };
	ignoredRoles: string[];
	trackedRoles: string[];
	ignoredChannels?: string[];
	stackRoles?: boolean;
	boosterMultiplier?: number;
	levelRoles: VirtueLevelRole[];
	levelUp: boolean;
	levelMessage: string;
	levelChannel: string;
	autoDelete: number;
}): VirtueConfigShape {
	const cleanedRoles = normalizeLevelRoles(cfg.levelRoles).map((r) => ({
		level: r.level,
		roleId: r.roleId,
		track: normalizeRoleTrack(r.track),
	}));
	const textOnlyRoles = cleanedRoles.filter((r) => r.track === 'text').map(({ level, roleId }) => ({ level, roleId }));
	const voiceOnlyRoles = cleanedRoles.filter((r) => r.track === 'voice').map(({ level, roleId }) => ({ level, roleId }));

	return {
		mode: cfg.mode || 'balanced',
		cycles: {
			daily: Boolean(cfg.cycles?.daily),
			weekly: Boolean(cfg.cycles?.weekly),
			monthly: Boolean(cfg.cycles?.monthly),
		},
		roles: {
			ignored: (cfg.ignoredRoles || []).map(String).filter(Boolean),
			tracked: (cfg.trackedRoles || []).map(String).filter(Boolean),
			levels: cleanedRoles,
			textLevels: textOnlyRoles,
			voiceLevels: voiceOnlyRoles,
		},
		channels: {
			ignored: (cfg.ignoredChannels || []).map(String).filter(Boolean),
			tracked: [],
		},
		stackRoles: cfg.stackRoles !== false,
		boosterMultiplier: Math.max(1, Number(cfg.boosterMultiplier) || 1),
		levelRoles: cleanedRoles,
		textLevelRoles: textOnlyRoles,
		voiceLevelRoles: voiceOnlyRoles,
		levelUp: Boolean(cfg.levelUp),
		levelMessage: cfg.levelMessage ?? '[@mention] reached level [@level] :tada:!',
		levelChannel: (cfg.levelChannel || '').trim() || null,
		autoDelete: Number(cfg.autoDelete) || 0,
	};
}

interface LevelRolesSectionProps {
	levelRoles: VirtueLevelRole[];
	setLevelRoles: React.Dispatch<React.SetStateAction<VirtueLevelRole[]>>;
	roleSelectorOptions: { value: string; label: React.ReactNode }[];
	stackRoles?: boolean;
	setStackRoles?: (val: boolean) => void;
}

export default function LevelRolesSection({ levelRoles, setLevelRoles, roleSelectorOptions, stackRoles = true, setStackRoles }: LevelRolesSectionProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [activeTrackFilter, setActiveTrackFilter] = useState<'all' | VirtueLevelRoleTrack>('all');
	const [newRoleTrack, setNewRoleTrack] = useState<VirtueLevelRoleTrack>('server');
	const [newRoleLevel, setNewRoleLevel] = useState<string>('5');
	const [newRoleId, setNewRoleId] = useState<string>('');

	const trackSelectorOptions: { value: VirtueLevelRoleTrack; label: React.ReactNode }[] = [
		{
			value: 'server',
			label: (
				<span className="inline-flex items-center gap-1.5">
					<Trophy size={13} className="text-(--accent) shrink-0" />
					<span>{t('app.dashboard.virtue.tracks.server')}</span>
				</span>
			),
		},
		{
			value: 'text',
			label: (
				<span className="inline-flex items-center gap-1.5">
					<MessageSquare size={13} className="text-(--accent) shrink-0" />
					<span>{t('app.dashboard.virtue.tracks.text')}</span>
				</span>
			),
		},
		{
			value: 'voice',
			label: (
				<span className="inline-flex items-center gap-1.5">
					<Mic size={13} className="text-(--accent) shrink-0" />
					<span>{t('app.dashboard.virtue.tracks.voice')}</span>
				</span>
			),
		},
	];

	const handleSelectFilterTab = (tab: 'all' | VirtueLevelRoleTrack) => {
		setActiveTrackFilter(tab);
		if (tab !== 'all') {
			setNewRoleTrack(tab);
		}
	};

	const handleAddLevelRole = () => {
		const trimmedRoleId = newRoleId.trim();
		const parsedLevel = Math.max(1, Number(newRoleLevel) || 1);
		const targetTrack = normalizeRoleTrack(newRoleTrack);
		if (!trimmedRoleId) return;

		if (levelRoles.some((item) => item.roleId === trimmedRoleId && normalizeRoleTrack(item.track) === targetTrack)) {
			toast({ type: 'warning', title: t('app.dashboard.virtue.duplicateRoleWarning') });
		}

		setLevelRoles((prev) => {
			const filtered = prev.filter((item) => !(item.roleId === trimmedRoleId && normalizeRoleTrack(item.track) === targetTrack));
			return normalizeLevelRoles([...filtered, { level: parsedLevel, roleId: trimmedRoleId, track: targetTrack }]);
		});
		setNewRoleId('');
	};

	const handleUpdateLevelRole = (index: number, updates: Partial<VirtueLevelRole>) => {
		setLevelRoles((prev) =>
			normalizeLevelRoles(
				prev.map((item, idx) =>
					idx === index
						? {
								...item,
								...updates,
								level: Math.max(1, Number(updates.level ?? item.level) || 1),
								track: normalizeRoleTrack(updates.track ?? item.track),
							}
						: item
				)
			)
		);
	};

	const handleRemoveLevelRole = (index: number) => {
		setLevelRoles((prev) => prev.filter((_, idx) => idx !== index));
	};

	const counts = {
		all: levelRoles.length,
		server: levelRoles.filter((r) => normalizeRoleTrack(r.track) === 'server').length,
		text: levelRoles.filter((r) => normalizeRoleTrack(r.track) === 'text').length,
		voice: levelRoles.filter((r) => normalizeRoleTrack(r.track) === 'voice').length,
	};

	const visibleEntries = levelRoles
		.map((entry, originalIndex) => ({ entry: { ...entry, track: normalizeRoleTrack(entry.track) }, originalIndex }))
		.filter(({ entry }) => activeTrackFilter === 'all' || entry.track === activeTrackFilter);

	const filterTabs: { id: 'all' | VirtueLevelRoleTrack; label: string; icon: React.ReactNode; count: number }[] = [
		{ id: 'all', label: t('app.dashboard.virtue.tracks.all'), icon: <Layers size={13} />, count: counts.all },
		{ id: 'server', label: t('app.dashboard.virtue.tracks.serverShort'), icon: <Trophy size={13} />, count: counts.server },
		{ id: 'text', label: t('app.dashboard.virtue.tracks.textShort'), icon: <MessageSquare size={13} />, count: counts.text },
		{ id: 'voice', label: t('app.dashboard.virtue.tracks.voiceShort'), icon: <Mic size={13} />, count: counts.voice },
	];

	return (
		<div className="flex flex-col gap-4 p-5 rounded-2xl border border-(--border)/10 bg-(--background)/40">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="flex items-center gap-2.5">
					<div className="w-7 h-7 rounded-xl bg-(--accent)/15 flex items-center justify-center text-(--accent) shrink-0">
						<Award size={15} />
					</div>
					<div className="flex flex-col">
						<span className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.levelRoles')}</span>
						<span className="text-xs text-(--text-muted)">{t('app.dashboard.virtue.levelRolesDesc')}</span>
					</div>
				</div>
				<span className="self-start sm:self-auto text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-(--accent)/15 text-(--accent)">{levelRoles.length}</span>
			</div>

			{setStackRoles && (
				<div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-(--border)/10 bg-(--background)/50">
					<div className="flex flex-col">
						<span className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.stackRoles')}</span>
						<span className="text-[11px] text-(--text-muted)">{stackRoles ? t('app.dashboard.virtue.stackRolesEnabledDesc') : t('app.dashboard.virtue.stackRolesDisabledDesc')}</span>
					</div>
					<Toggle checked={stackRoles} onChange={(e: any) => setStackRoles(Boolean(e?.target ? e.target.checked : e))} size="sm" />
				</div>
			)}

			{/* Track Filter Pills */}
			<div className="flex flex-wrap items-center gap-2">
				{filterTabs.map((tab) => {
					const isActive = activeTrackFilter === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => handleSelectFilterTab(tab.id)}
							className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
								isActive
									? 'bg-(--accent) text-white border-(--accent) shadow-sm'
									: 'bg-(--background)/60 text-(--text-muted) border-(--border)/10 hover:text-(--text) hover:border-(--accent)/30'
							}`}
						>
							{tab.icon}
							<span>{tab.label}</span>
							<span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-(--background)/25 text-white' : 'bg-(--foreground)/50 text-(--text-muted)'}`}>
								{tab.count}
							</span>
						</button>
					);
				})}
			</div>

			<div className="rounded-2xl border border-(--border)/10 bg-(--background)/50 px-3.5 py-2.5 text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.tracks.helperHint')}</div>

			{/* Add New Level Role Form */}
			<div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
				<div className="sm:col-span-3 flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text-muted)">{t('app.dashboard.virtue.trackLabel')}</label>
					<Selector value={newRoleTrack} onChange={(val: string) => setNewRoleTrack(normalizeRoleTrack(val))} options={trackSelectorOptions} />
				</div>

				<div className="sm:col-span-2 flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text-muted)">{t('app.dashboard.virtue.levelLabel')}</label>
					<Input type="number" min={1} max={1000} value={newRoleLevel} onChange={(e) => setNewRoleLevel(e.target.value)} placeholder="5" />
				</div>

				<div className="sm:col-span-4 flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text-muted)">{t('app.dashboard.virtue.roleLabel')}</label>
					<Selector value={newRoleId} onChange={(val: string) => setNewRoleId(val)} placeholder={t('app.dashboard.virtue.selectRolePlaceholder')} options={roleSelectorOptions} />
				</div>

				<div className="sm:col-span-3">
					<Button type="button" variant="primary" onClick={handleAddLevelRole} disabled={!newRoleId.trim() || !newRoleLevel} className="w-full justify-center gap-1.5">
						<Plus size={14} />
						<span>{t('app.dashboard.virtue.addLevelRole')}</span>
					</Button>
				</div>
			</div>

			{visibleEntries.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-(--border)/15 bg-(--background)/30 p-4 text-center text-xs text-(--text-muted)">{t('app.dashboard.virtue.noLevelRoles')}</div>
			) : (
				<div className="flex flex-col gap-2">
					{visibleEntries.map(({ entry, originalIndex }) => (
						<div
							key={`${entry.track}-${entry.level}-${entry.roleId}-${originalIndex}`}
							className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-(--border)/10 bg-(--background)/60"
						>
							<div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 flex-1">
								<div className="sm:col-span-4">
									<Selector
										value={entry.track || 'server'}
										onChange={(val: string) => handleUpdateLevelRole(originalIndex, { track: normalizeRoleTrack(val) })}
										options={trackSelectorOptions}
									/>
								</div>

								<div className="sm:col-span-3 flex items-center gap-2">
									<span className="text-xs font-bold text-(--text-muted) shrink-0">{t('app.dashboard.virtue.levelLabel')}</span>
									<Input
										type="number"
										min={1}
										max={1000}
										value={String(entry.level)}
										onChange={(e) => handleUpdateLevelRole(originalIndex, { level: Number(e.target.value) || 1 })}
									/>
								</div>

								<div className="sm:col-span-5">
									<Selector
										value={entry.roleId}
										onChange={(val: string) => handleUpdateLevelRole(originalIndex, { roleId: val })}
										placeholder={t('app.dashboard.virtue.selectRolePlaceholder')}
										options={roleSelectorOptions}
									/>
								</div>
							</div>

							<button
								type="button"
								onClick={() => handleRemoveLevelRole(originalIndex)}
								className="self-end sm:self-auto inline-flex items-center justify-center p-1.5 rounded-xl text-(--text-muted) hover:text-(--accent-red) hover:bg-(--accent-red)/10 transition-colors cursor-pointer"
								aria-label="Remove level role"
							>
								<Trash2 size={14} />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
