/** @format */

'use client';

import { useState } from 'react';
import { Award, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Selector } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import type { VirtueConfigShape, VirtueLevelRole } from '@/components/virtue/ConfigPortabilityCard';

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
	roles: { ignored: string[]; tracked: string[]; levels?: VirtueLevelRole[] };
	levelRoles?: VirtueLevelRole[];
	serverRoles?: DiscordRole[];
	serverChannels?: DiscordChannel[];
	levelUp: boolean;
	levelMessage: string;
	levelChannel: string | null;
	autoDelete: number;
}

export function normalizeLevelRoles(raw: unknown): VirtueLevelRole[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((entry: any) => ({
			level: Math.max(1, Number(entry?.level) || 1),
			roleId: String(entry?.roleId || entry?.role || '').trim(),
		}))
		.filter((entry) => Boolean(entry.roleId))
		.sort((a, b) => a.level - b.level);
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
		.filter((c: any) => c && c.id && (Number(c.type) === 0 || Number(c.type) === 5))
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
	levelRoles: VirtueLevelRole[];
	levelUp: boolean;
	levelMessage: string;
	levelChannel: string;
	autoDelete: number;
}): VirtueConfigShape {
	const cleanedRoles = normalizeLevelRoles(cfg.levelRoles);
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
		},
		levelRoles: cleanedRoles,
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
}

export default function LevelRolesSection({ levelRoles, setLevelRoles, roleSelectorOptions }: LevelRolesSectionProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [newRoleLevel, setNewRoleLevel] = useState<string>('5');
	const [newRoleId, setNewRoleId] = useState<string>('');

	const handleAddLevelRole = () => {
		const trimmedRoleId = newRoleId.trim();
		const parsedLevel = Math.max(1, Number(newRoleLevel) || 1);
		if (!trimmedRoleId) return;

		if (levelRoles.some((item) => item.roleId === trimmedRoleId)) {
			toast({ type: 'warning', title: t('app.dashboard.virtue.duplicateRoleWarning') });
		}

		setLevelRoles((prev) => {
			const filtered = prev.filter((item) => item.roleId !== trimmedRoleId && !(item.level === parsedLevel && item.roleId === trimmedRoleId));
			return [...filtered, { level: parsedLevel, roleId: trimmedRoleId }].sort((a, b) => a.level - b.level);
		});
		setNewRoleId('');
	};

	const handleUpdateLevelRole = (index: number, updates: Partial<VirtueLevelRole>) => {
		setLevelRoles((prev) =>
			prev.map((item, idx) => (idx === index ? { ...item, ...updates, level: Math.max(1, Number(updates.level ?? item.level) || 1) } : item)).sort((a, b) => a.level - b.level)
		);
	};

	const handleRemoveLevelRole = (index: number) => {
		setLevelRoles((prev) => prev.filter((_, idx) => idx !== index));
	};

	return (
		<div className="flex flex-col gap-4 p-5 rounded-2xl border border-(--border)/10 bg-(--background)/40">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2.5">
					<div className="w-7 h-7 rounded-xl bg-(--accent)/15 flex items-center justify-center text-(--accent)">
						<Award size={15} />
					</div>
					<div className="flex flex-col">
						<span className="text-sm font-bold text-(--text)">{t('app.dashboard.virtue.levelRoles')}</span>
						<span className="text-xs text-(--text-muted)">{t('app.dashboard.virtue.levelRolesDesc')}</span>
					</div>
				</div>
				<span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-(--accent)/15 text-(--accent)">{levelRoles.length}</span>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
				<div className="sm:col-span-3 flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text-muted)">{t('app.dashboard.virtue.levelLabel')}</label>
					<Input type="number" min={1} max={1000} value={newRoleLevel} onChange={(e) => setNewRoleLevel(e.target.value)} placeholder="5" />
				</div>

				<div className="sm:col-span-6 flex flex-col gap-1.5">
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

			{levelRoles.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-(--border)/15 bg-(--background)/30 p-4 text-center text-xs text-(--text-muted)">{t('app.dashboard.virtue.noLevelRoles')}</div>
			) : (
				<div className="flex flex-col gap-2">
					{levelRoles.map((entry, idx) => (
						<div
							key={`${entry.level}-${entry.roleId}-${idx}`}
							className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-(--border)/10 bg-(--background)/60"
						>
							<div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
								<div className="flex items-center gap-2 shrink-0 w-28">
									<span className="text-xs font-bold text-(--text-muted) shrink-0">{t('app.dashboard.virtue.levelLabel')}</span>
									<Input type="number" min={1} max={1000} value={String(entry.level)} onChange={(e) => handleUpdateLevelRole(idx, { level: Number(e.target.value) || 1 })} />
								</div>
								<span className="hidden sm:inline text-(--text-muted) text-xs">→</span>
								<div className="flex-1 max-w-xs">
									<Selector
										value={entry.roleId}
										onChange={(val: string) => handleUpdateLevelRole(idx, { roleId: val })}
										placeholder={t('app.dashboard.virtue.selectRolePlaceholder')}
										options={roleSelectorOptions}
									/>
								</div>
							</div>

							<button
								type="button"
								onClick={() => handleRemoveLevelRole(idx)}
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
