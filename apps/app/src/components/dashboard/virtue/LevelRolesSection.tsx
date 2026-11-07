/** @format */

'use client';

import { useState } from 'react';
import { ArrowRight, Award, Check, Crown, Layers, Lock, MessageSquare, Mic, Pencil, Plus, Sparkles, Trash2, Trophy } from 'lucide-react';
import { Button, Input, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import type { VirtueConfigShape, VirtueDynamicRolesConfig, VirtueLevelRole, VirtueLevelRoleTrack } from '@/components/virtue/ConfigPortabilityCard';
import DynamicRolesPanel, { DEFAULT_DYNAMIC_ROLES, normalizeDynamicRolesConfig, normalizeRoleTrack } from './DynamicRolesPanel';

export { DEFAULT_DYNAMIC_ROLES, normalizeDynamicRolesConfig, normalizeRoleTrack };

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
	channels?: { ignored: string[]; tracked?: string[] };
	stackRoles?: boolean;
	boosterMultiplier?: number;
	dynamicRoles?: VirtueDynamicRolesConfig;
	levelRoles?: VirtueLevelRole[];
	textLevelRoles?: { level: number; roleId: string }[];
	voiceLevelRoles?: { level: number; roleId: string }[];
	serverRoles?: DiscordRole[];
	serverChannels?: DiscordChannel[];
	levelUp: boolean;
	levelMessage: string;
	levelChannel: string | null;
	autoDelete: number;
	serverPremium?: boolean;
	serverPremiumSkuId?: string | null;
	applicationId?: string | null;
}

const TRACK_SORT_ORDER: Record<VirtueLevelRoleTrack, number> = { server: 0, text: 1, voice: 2 };

export function normalizeLevelRoles(raw: unknown, extraTextRaw?: unknown, extraVoiceRaw?: unknown): VirtueLevelRole[] {
	const combined: VirtueLevelRole[] = [];
	const pushEntries = (arr: unknown, fallbackTrack: VirtueLevelRoleTrack) => {
		if (!Array.isArray(arr)) return;
		for (const entry of arr) {
			const roleId = String((entry as any)?.roleId || (entry as any)?.role || (entry as any)?.id || '').trim();
			const level = Math.max(1, Number((entry as any)?.level) || 1);
			if (!roleId) continue;
			const rawTrack = (entry as any)?.track ?? (entry as any)?.type;
			combined.push({ level, roleId, track: rawTrack ? normalizeRoleTrack(rawTrack) : fallbackTrack });
		}
	};

	if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
		const obj = raw as Record<string, any>;
		pushEntries(Array.isArray(obj.levelRoles) && obj.levelRoles.length > 0 ? obj.levelRoles : obj.roles?.levels, 'server');
		pushEntries(Array.isArray(obj.textLevelRoles) && obj.textLevelRoles.length > 0 ? obj.textLevelRoles : obj.roles?.textLevels, 'text');
		pushEntries(Array.isArray(obj.voiceLevelRoles) && obj.voiceLevelRoles.length > 0 ? obj.voiceLevelRoles : obj.roles?.voiceLevels, 'voice');
	} else {
		pushEntries(raw, 'server');
		pushEntries(extraTextRaw, 'text');
		pushEntries(extraVoiceRaw, 'voice');
	}

	const seen = new Set<string>();
	return combined
		.filter((entry) => {
			const key = `${entry.track || 'server'}:${entry.level}:${entry.roleId}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		})
		.sort((a, b) => (a.level !== b.level ? a.level - b.level : TRACK_SORT_ORDER[a.track || 'server'] - TRACK_SORT_ORDER[b.track || 'server']));
}

export function normalizeDiscordRoles(raw: unknown, guildId?: string): DiscordRole[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter((r: any) => r && r.id && r.id !== guildId && !r.managed)
		.map((r: any) => ({ id: String(r.id), name: String(r.name), color: Number(r.color) || 0, position: Number(r.position) || 0, managed: Boolean(r.managed) }))
		.sort((a, b) => (b.position || 0) - (a.position || 0));
}

export function normalizeDiscordChannels(raw: unknown): DiscordChannel[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter((c: any) => c && c.id && (Number(c.type) === 0 || Number(c.type) === 5 || Number(c.type) === 2 || Number(c.type) === 13))
		.map((c: any) => ({ id: String(c.id), name: String(c.name), type: Number(c.type) || 0, position: Number(c.position ?? c.rawPosition) || 0 }))
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
	dynamicRoles?: VirtueDynamicRolesConfig;
	levelRoles: VirtueLevelRole[];
	levelUp: boolean;
	levelMessage: string;
	levelChannel: string;
	autoDelete: number;
}): VirtueConfigShape {
	const cleanedRoles = normalizeLevelRoles(cfg.levelRoles).map((r) => ({ level: r.level, roleId: r.roleId, track: normalizeRoleTrack(r.track) }));
	const textOnlyRoles = cleanedRoles.filter((r) => r.track === 'text').map(({ level, roleId }) => ({ level, roleId }));
	const voiceOnlyRoles = cleanedRoles.filter((r) => r.track === 'voice').map(({ level, roleId }) => ({ level, roleId }));
	const dyn = normalizeDynamicRolesConfig(cfg.dynamicRoles, true);

	return {
		mode: cfg.mode || 'balanced',
		cycles: { daily: Boolean(cfg.cycles?.daily), weekly: Boolean(cfg.cycles?.weekly), monthly: Boolean(cfg.cycles?.monthly) },
		roles: {
			ignored: (cfg.ignoredRoles || []).map(String).filter(Boolean),
			tracked: (cfg.trackedRoles || []).map(String).filter(Boolean),
			levels: cleanedRoles,
			textLevels: textOnlyRoles,
			voiceLevels: voiceOnlyRoles,
		},
		channels: { ignored: (cfg.ignoredChannels || []).map(String).filter(Boolean), tracked: [] },
		stackRoles: cfg.stackRoles !== false,
		boosterMultiplier: Math.max(1, Number(cfg.boosterMultiplier) || 1),
		dynamicRoles: dyn,
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
	discordRoles?: DiscordRole[];
	stackRoles?: boolean;
	setStackRoles?: (val: boolean) => void;
	dynamicRoles?: VirtueDynamicRolesConfig;
	setDynamicRoles?: React.Dispatch<React.SetStateAction<VirtueDynamicRolesConfig>>;
	isServerPremium?: boolean;
}

export default function LevelRolesSection({
	levelRoles,
	setLevelRoles,
	roleSelectorOptions,
	discordRoles = [],
	stackRoles = true,
	setStackRoles,
	dynamicRoles = DEFAULT_DYNAMIC_ROLES,
	setDynamicRoles,
	isServerPremium = false,
}: LevelRolesSectionProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [newRoleTrack, setNewRoleTrack] = useState<VirtueLevelRoleTrack>('server');
	const [newRoleLevel, setNewRoleLevel] = useState<string>('5');
	const [newRoleId, setNewRoleId] = useState<string>('');
	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	const getTrackBadgeMeta = (track: VirtueLevelRoleTrack) => {
		if (track === 'text') return { label: t('app.dashboard.virtue.tracks.textShort'), icon: <MessageSquare size={12} className="text-(--accent) shrink-0" /> };
		if (track === 'voice') return { label: t('app.dashboard.virtue.tracks.voiceShort'), icon: <Mic size={12} className="text-(--accent) shrink-0" /> };
		return { label: t('app.dashboard.virtue.tracks.serverShort'), icon: <Trophy size={12} className="text-(--accent) shrink-0" /> };
	};

	const trackSelectorOptions: { value: VirtueLevelRoleTrack; label: React.ReactNode }[] = (['server', 'text', 'voice'] as VirtueLevelRoleTrack[]).map((val) => {
		const meta = getTrackBadgeMeta(val);
		return {
			value: val,
			label: (
				<span className="inline-flex items-center gap-1.5">
					{meta.icon}
					<span>{meta.label}</span>
				</span>
			),
		};
	});

	const getRoleDisplay = (roleId: string) => {
		const matched = discordRoles.find((r) => r.id === roleId);
		if (matched) return { name: `@${matched.name}`, colorHex: matched.color > 0 ? `#${matched.color.toString(16).padStart(6, '0')}` : 'var(--accent)' };
		const fallbackOpt = roleSelectorOptions.find((opt) => opt.value === roleId);
		return { name: fallbackOpt ? null : roleId, labelNode: fallbackOpt?.label, colorHex: 'var(--accent)' };
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
					idx === index ? { ...item, ...updates, level: Math.max(1, Number(updates.level ?? item.level) || 1), track: normalizeRoleTrack(updates.track ?? item.track) } : item
				)
			)
		);
	};

	const handleRemoveLevelRole = (index: number) => {
		if (editingIndex === index) setEditingIndex(null);
		setLevelRoles((prev) => prev.filter((_, idx) => idx !== index));
	};

	const visibleEntries = levelRoles.map((entry, originalIndex) => ({ entry: { ...entry, track: normalizeRoleTrack(entry.track) }, originalIndex }));
	const isDynamicMode = Boolean(dynamicRoles?.enabled && isServerPremium);

	const updateDynamic = (updates: Partial<VirtueDynamicRolesConfig>) => {
		if (!setDynamicRoles) return;
		setDynamicRoles((prev) => ({ ...(prev || DEFAULT_DYNAMIC_ROLES), ...updates }));
	};

	const managedEntries = Array.isArray(dynamicRoles?.managed) ? dynamicRoles.managed : [];

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			{/* Header Row + Mode Switch + Inline Stack Roles Switch */}
			<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
				<div className="flex items-center gap-3 min-w-0">
					<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent) shrink-0">
						<Award className="w-4 h-4" />
					</div>
					<div className="flex flex-col min-w-0">
						<div className="flex items-center gap-2">
							<span className="text-sm font-extrabold text-(--text) tracking-widest uppercase">{t('app.dashboard.virtue.levelRoles')}</span>
							<span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-(--accent)/15 text-(--accent)">
								{isDynamicMode ? `${managedEntries.length || 1} / ${dynamicRoles.maxRoles}` : levelRoles.length}
							</span>
						</div>
						<span className="text-xs text-(--text-muted) line-clamp-1">{t('app.dashboard.virtue.levelRolesDesc')}</span>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 shrink-0">
					{setDynamicRoles && (
						<div className="inline-flex items-center p-1 rounded-2xl border border-(--border)/10 bg-(--background)/50 gap-1">
							<button
								type="button"
								onClick={() => updateDynamic({ enabled: false })}
								className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
									!isDynamicMode ? 'bg-(--accent) text-(--text-active) shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
								}`}
							>
								<Layers size={13} />
								<span>{t('app.dashboard.virtue.dynamicRoles.manualModeTab')}</span>
							</button>

							<button
								type="button"
								disabled={!isServerPremium}
								onClick={() => isServerPremium && updateDynamic({ enabled: true })}
								className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
									!isServerPremium
										? 'text-(--text-muted) opacity-50 cursor-not-allowed'
										: isDynamicMode
											? 'bg-(--accent) text-(--text-active) shadow-sm cursor-pointer'
											: 'text-(--text-muted) hover:text-(--text) cursor-pointer'
								}`}
							>
								<Sparkles size={13} />
								<span>{t('app.dashboard.virtue.dynamicRoles.dynamicModeTab')}</span>
								{isServerPremium ? <Crown size={11} className={isDynamicMode ? 'text-(--text-active)' : 'text-(--accent)'} /> : <Lock size={11} />}
							</button>
						</div>
					)}

					{!isDynamicMode && setStackRoles && (
						<div className="flex items-center justify-between sm:justify-end gap-3 px-3.5 py-2 rounded-2xl border border-(--border)/10 bg-(--background)/50 shrink-0">
							<div className="flex flex-col">
								<span className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.stackRoles')}</span>
								<span className="text-[11px] text-(--text-muted)">
									{stackRoles ? t('app.dashboard.virtue.stackRolesEnabledDesc') : t('app.dashboard.virtue.stackRolesDisabledDesc')}
								</span>
							</div>
							<Toggle checked={stackRoles} onChange={(e: any) => setStackRoles(Boolean(e?.target ? e.target.checked : e))} size="sm" />
						</div>
					)}
				</div>
			</div>

			{isDynamicMode ? (
				<DynamicRolesPanel
					dynamicRoles={dynamicRoles}
					updateDynamic={updateDynamic}
					roleSelectorOptions={roleSelectorOptions}
					trackSelectorOptions={trackSelectorOptions}
					getRoleDisplay={getRoleDisplay}
				/>
			) : (
				<>
					{/* Compact Single-Row Add Level Role Bar */}
					<div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-2.5 rounded-2xl border border-(--border)/10 bg-(--background)/40">
						<div className="sm:col-span-3">
							<Selector value={newRoleTrack} onChange={(val: string) => setNewRoleTrack(normalizeRoleTrack(val))} options={trackSelectorOptions} />
						</div>

						<div className="sm:col-span-2">
							<Input type="number" min={1} max={1000} value={newRoleLevel} onChange={(e) => setNewRoleLevel(e.target.value)} placeholder="5" />
						</div>

						<div className="sm:col-span-4">
							<Selector value={newRoleId} onChange={(val: string) => setNewRoleId(val)} placeholder={t('app.dashboard.virtue.selectRolePlaceholder')} options={roleSelectorOptions} />
						</div>

						<div className="sm:col-span-3">
							<Button type="button" variant="primary" onClick={handleAddLevelRole} disabled={!newRoleId.trim() || !newRoleLevel} className="w-full justify-center gap-1.5">
								<Plus size={14} />
								<span>{t('app.dashboard.virtue.addLevelRole')}</span>
							</Button>
						</div>
					</div>

					{/* Clean Unified Milestone List */}
					{visibleEntries.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-(--border)/15 bg-(--background)/30 p-4 text-center text-xs text-(--text-muted)">
							{t('app.dashboard.virtue.noLevelRoles')}
						</div>
					) : (
						<div className="rounded-2xl border border-(--border)/10 bg-(--background)/40 divide-y divide-(--border)/10 overflow-hidden">
							{visibleEntries.map(({ entry, originalIndex }) => {
								const isEditing = editingIndex === originalIndex;
								const trackMeta = getTrackBadgeMeta(entry.track || 'server');
								const roleDisplay = getRoleDisplay(entry.roleId);

								if (isEditing) {
									return (
										<div
											key={`${entry.track}-${entry.level}-${entry.roleId}-${originalIndex}`}
											className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 bg-(--background)/70"
										>
											<div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2.5 flex-1">
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

											<div className="flex items-center justify-end gap-1.5 shrink-0">
												<button
													type="button"
													onClick={() => setEditingIndex(null)}
													className="inline-flex items-center justify-center p-2 rounded-xl bg-(--accent)/15 text-(--accent) hover:bg-(--accent) hover:text-(--text-active) transition-colors cursor-pointer"
													aria-label={t('app.dashboard.virtue.doneEditingRoleAria')}
												>
													<Check size={14} />
												</button>
												<button
													type="button"
													onClick={() => handleRemoveLevelRole(originalIndex)}
													className="inline-flex items-center justify-center p-2 rounded-xl text-(--text-muted) hover:text-(--accent-red) hover:bg-(--accent-red)/10 transition-colors cursor-pointer"
													aria-label={t('app.dashboard.virtue.removeLevelRoleAria')}
												>
													<Trash2 size={14} />
												</button>
											</div>
										</div>
									);
								}

								return (
									<div
										key={`${entry.track}-${entry.level}-${entry.roleId}-${originalIndex}`}
										className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-(--background)/60 transition-colors"
									>
										<div className="flex items-center gap-3 min-w-0">
											<span className="inline-flex items-center justify-center min-w-16 px-2.5 py-1 rounded-xl bg-(--accent)/15 text-(--accent) font-mono text-xs font-extrabold shrink-0">
												{t('app.dashboard.virtue.levelLabel')} {entry.level}
											</span>
											<ArrowRight size={13} className="text-(--text-muted) shrink-0" />
											<span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-(--background)/70 border border-(--border)/10 text-xs font-bold text-(--text) truncate">
												{roleDisplay.name ? (
													<>
														<span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: roleDisplay.colorHex }} />
														<span className="truncate">{roleDisplay.name}</span>
													</>
												) : (
													roleDisplay.labelNode || entry.roleId
												)}
											</span>
										</div>

										<div className="flex items-center gap-2 shrink-0">
											<span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-[11px] font-semibold text-(--text-muted)">
												{trackMeta.icon}
												<span>{trackMeta.label}</span>
											</span>
											<button
												type="button"
												onClick={() => setEditingIndex(originalIndex)}
												className="inline-flex items-center justify-center p-1.5 rounded-xl text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)/50 transition-colors cursor-pointer"
												aria-label={t('app.dashboard.virtue.editLevelRoleAria')}
											>
												<Pencil size={13} />
											</button>
											<button
												type="button"
												onClick={() => handleRemoveLevelRole(originalIndex)}
												className="inline-flex items-center justify-center p-1.5 rounded-xl text-(--text-muted) hover:text-(--accent-red) hover:bg-(--accent-red)/10 transition-colors cursor-pointer"
												aria-label={t('app.dashboard.virtue.removeLevelRoleAria')}
											>
												<Trash2 size={14} />
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</>
			)}
		</div>
	);
}
