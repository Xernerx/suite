/** @format */

'use client';

import { Palette } from 'lucide-react';
import { Input, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { VirtueDynamicRolesConfig, VirtueLevelRoleTrack } from '@/components/virtue/ConfigPortabilityCard';

const HEX_COLOR_RE = /^#?[0-9a-fA-F]{6}$/;

export function normalizeRoleTrack(rawTrack?: unknown): VirtueLevelRoleTrack {
	const val = String(rawTrack || '')
		.trim()
		.toLowerCase();
	if (val === 'text') return 'text';
	if (val === 'voice') return 'voice';
	return 'server';
}

export function normalizeHex(raw: unknown, fallback: string): string {
	const trimmed = String(raw || '').trim();
	if (!HEX_COLOR_RE.test(trimmed)) return fallback;
	return trimmed.startsWith('#') ? trimmed.toLowerCase() : `#${trimmed.toLowerCase()}`;
}

export const DEFAULT_DYNAMIC_ROLES: VirtueDynamicRolesConfig = {
	enabled: false,
	anchorRoleId: null,
	nameTemplate: 'Level [@level]',
	maxRoles: 250,
	track: 'server',
	gradientEnabled: false,
	colorStart: '#7c5cff',
	colorEnd: '#00e5ff',
	managed: [],
};

export function normalizeDynamicRolesConfig(raw: unknown, hasServerPrem = true): VirtueDynamicRolesConfig {
	const obj = raw && typeof raw === 'object' ? (raw as Record<string, any>) : {};
	const managed = Array.isArray(obj.managed)
		? obj.managed
				.map((m: any) => ({ level: Math.max(1, Math.floor(Number(m?.level) || 1)), roleId: String(m?.roleId || '').trim() }))
				.filter((m: { level: number; roleId: string }) => Boolean(m.roleId))
				.sort((a: { level: number }, b: { level: number }) => a.level - b.level)
		: [];
	return {
		enabled: hasServerPrem ? Boolean(obj.enabled) : false,
		anchorRoleId: obj.anchorRoleId ? String(obj.anchorRoleId).trim() || null : null,
		nameTemplate:
			String(obj.nameTemplate || 'Level [@level]')
				.trim()
				.slice(0, 64) || 'Level [@level]',
		maxRoles: Math.min(250, Math.max(2, Math.floor(Number(obj.maxRoles) || 250))),
		track: normalizeRoleTrack(obj.track),
		gradientEnabled: Boolean(obj.gradientEnabled),
		colorStart: normalizeHex(obj.colorStart, '#7c5cff'),
		colorEnd: normalizeHex(obj.colorEnd, '#00e5ff'),
		managed,
	};
}

export function interpolatePreviewHex(colorStart: string, colorEnd: string, t: number): string {
	const c1 = normalizeHex(colorStart, '#7c5cff').slice(1);
	const c2 = normalizeHex(colorEnd, '#00e5ff').slice(1);
	const r1 = parseInt(c1.slice(0, 2), 16);
	const g1 = parseInt(c1.slice(2, 4), 16);
	const b1 = parseInt(c1.slice(4, 6), 16);
	const r2 = parseInt(c2.slice(0, 2), 16);
	const g2 = parseInt(c2.slice(2, 4), 16);
	const b2 = parseInt(c2.slice(4, 6), 16);
	const ratio = Math.min(1, Math.max(0, t));
	const r = Math.round(r1 + (r2 - r1) * ratio);
	const g = Math.round(g1 + (g2 - g1) * ratio);
	const b = Math.round(b1 + (b2 - b1) * ratio);
	return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface DynamicRolesPanelProps {
	dynamicRoles: VirtueDynamicRolesConfig;
	updateDynamic: (updates: Partial<VirtueDynamicRolesConfig>) => void;
	roleSelectorOptions: { value: string; label: React.ReactNode }[];
	trackSelectorOptions: { value: VirtueLevelRoleTrack; label: React.ReactNode }[];
	getRoleDisplay: (roleId: string) => { name: string | null; labelNode?: React.ReactNode; colorHex: string };
}

const PREVIEW_LEVELS = [1, 5, 10, 25, 50];

export default function DynamicRolesPanel({ dynamicRoles, updateDynamic, roleSelectorOptions, trackSelectorOptions, getRoleDisplay }: DynamicRolesPanelProps) {
	const { t } = useDictionary();
	const anchorDisplay = dynamicRoles?.anchorRoleId ? getRoleDisplay(dynamicRoles.anchorRoleId) : null;
	const managedEntries = Array.isArray(dynamicRoles?.managed) ? dynamicRoles.managed : [];

	return (
		<div className="flex flex-col gap-4">
			{/* Row 1: Anchor Role, Track, Name Template, Max Roles Budget */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 p-4 rounded-2xl border border-(--border)/10 bg-(--background)/40">
				<div className="lg:col-span-4 flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.dynamicRoles.anchorLabel')}</label>
					<Selector
						value={dynamicRoles.anchorRoleId || ''}
						onChange={(val: string) => updateDynamic({ anchorRoleId: val || null })}
						placeholder={t('app.dashboard.virtue.selectRolePlaceholder')}
						options={roleSelectorOptions}
					/>
					<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.dynamicRoles.anchorDesc')}</span>
				</div>

				<div className="lg:col-span-2 flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.dynamicRoles.trackLabel')}</label>
					<Selector value={dynamicRoles.track || 'server'} onChange={(val: string) => updateDynamic({ track: normalizeRoleTrack(val) })} options={trackSelectorOptions} />
					<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.dynamicRoles.trackDesc')}</span>
				</div>

				<div className="lg:col-span-3 flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.dynamicRoles.templateLabel')}</label>
					<Input value={dynamicRoles.nameTemplate || 'Level [@level]'} onChange={(e) => updateDynamic({ nameTemplate: e.target.value })} placeholder="Level [@level]" />
					<div className="flex items-center gap-1.5">
						<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.dynamicRoles.templateUsePrefix')}</span>
						<button
							type="button"
							onClick={() =>
								updateDynamic({
									nameTemplate: `${dynamicRoles.nameTemplate || ''}${(dynamicRoles.nameTemplate || '').endsWith(' ') || !dynamicRoles.nameTemplate ? '' : ' '}[@level]`,
								})
							}
							className="px-2 py-0.5 rounded-xl bg-(--background)/70 border border-(--border)/10 text-[10px] font-mono text-(--accent) cursor-pointer"
						>
							[@level]
						</button>
						<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.dynamicRoles.templateUseSuffix')}</span>
					</div>
				</div>

				<div className="lg:col-span-3 flex flex-col gap-1.5">
					<div className="flex items-center justify-between">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.dynamicRoles.maxRolesLabel')}</label>
						<span className="text-[11px] font-mono font-bold text-(--accent)">
							{dynamicRoles.maxRoles >= 250
								? t('app.dashboard.virtue.dynamicRoles.maxRolesAuto')
								: t('app.dashboard.virtue.dynamicRoles.maxRolesCount', { count: dynamicRoles.maxRoles })}
						</span>
					</div>
					<Input
						type="number"
						min={2}
						max={250}
						value={String(dynamicRoles.maxRoles || 250)}
						onChange={(e) => updateDynamic({ maxRoles: Math.min(250, Math.max(2, Number(e.target.value) || 2)) })}
						placeholder="250"
					/>
					<div className="flex flex-wrap items-center gap-1">
						{[10, 20, 50, 100, 250].map((preset) => (
							<button
								key={preset}
								type="button"
								onClick={() => updateDynamic({ maxRoles: preset })}
								className={`px-2 py-0.5 rounded-xl border text-[10px] font-mono font-bold transition-colors cursor-pointer ${
									dynamicRoles.maxRoles === preset
										? 'bg-(--accent)/20 border-(--accent) text-(--accent)'
										: 'bg-(--background)/60 border-(--border)/10 text-(--text-muted) hover:text-(--text)'
								}`}
							>
								{preset === 250 ? t('app.dashboard.virtue.dynamicRoles.maxRolesAuto') : preset}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Row 2: Color Gradient (Color A -> Color B) */}
			<div className="flex flex-col gap-3.5 p-4 rounded-2xl border border-(--border)/10 bg-(--background)/40">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-2.5">
						<div className="w-7 h-7 rounded-2xl bg-(--accent)/15 flex items-center justify-center text-(--accent) shrink-0">
							<Palette size={14} />
						</div>
						<div className="flex flex-col">
							<span className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.dynamicRoles.gradientTitle')}</span>
							<span className="text-[11px] text-(--text-muted)">
								{dynamicRoles.gradientEnabled ? t('app.dashboard.virtue.dynamicRoles.gradientEnabledDesc') : t('app.dashboard.virtue.dynamicRoles.gradientDisabledDesc')}
							</span>
						</div>
					</div>
					<Toggle checked={Boolean(dynamicRoles.gradientEnabled)} onChange={(e: any) => updateDynamic({ gradientEnabled: Boolean(e?.target ? e.target.checked : e) })} size="sm" />
				</div>

				{dynamicRoles.gradientEnabled && (
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-2 border-t border-(--border)/10">
						<div className="lg:col-span-3 flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.dynamicRoles.colorStartLabel')}</label>
							<div className="flex items-center gap-2">
								<input
									type="color"
									value={normalizeHex(dynamicRoles.colorStart, '#7c5cff')}
									onChange={(e) => updateDynamic({ colorStart: e.target.value })}
									aria-label={t('app.dashboard.virtue.dynamicRoles.colorStartLabel')}
									className="h-9 w-11 rounded-2xl border border-(--border)/15 bg-transparent cursor-pointer shrink-0"
								/>
								<Input
									value={dynamicRoles.colorStart || '#7c5cff'}
									onChange={(e) => updateDynamic({ colorStart: e.target.value })}
									placeholder="#7c5cff"
									className="font-mono text-xs"
								/>
							</div>
						</div>

						<div className="lg:col-span-3 flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.dynamicRoles.colorEndLabel')}</label>
							<div className="flex items-center gap-2">
								<input
									type="color"
									value={normalizeHex(dynamicRoles.colorEnd, '#00e5ff')}
									onChange={(e) => updateDynamic({ colorEnd: e.target.value })}
									aria-label={t('app.dashboard.virtue.dynamicRoles.colorEndLabel')}
									className="h-9 w-11 rounded-2xl border border-(--border)/15 bg-transparent cursor-pointer shrink-0"
								/>
								<Input value={dynamicRoles.colorEnd || '#00e5ff'} onChange={(e) => updateDynamic({ colorEnd: e.target.value })} placeholder="#00e5ff" className="font-mono text-xs" />
							</div>
						</div>

						<div className="lg:col-span-6 flex flex-col gap-1.5">
							<span className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.dynamicRoles.previewLabel')}</span>
							<div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl border border-(--border)/10 bg-(--background)/60">
								{PREVIEW_LEVELS.map((lvl, idx) => {
									const ratio = PREVIEW_LEVELS.length > 1 ? idx / (PREVIEW_LEVELS.length - 1) : 0;
									const pillColor = interpolatePreviewHex(dynamicRoles.colorStart, dynamicRoles.colorEnd, ratio);
									const formattedName = (dynamicRoles.nameTemplate || 'Level [@level]').replace(/\[@level\]|\{level\}/gi, String(lvl)).trim();
									return (
										<span
											key={lvl}
											className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-(--background)/80 border border-(--border)/10 text-xs font-bold text-(--text)"
										>
											<span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pillColor }} />
											<span>@{formattedName || `Level ${lvl}`}</span>
										</span>
									);
								})}
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Row 3: Active Managed Roles Summary */}
			<div className="flex flex-col gap-2 p-3.5 rounded-2xl border border-(--border)/10 bg-(--background)/30">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
					<span className="text-xs font-bold text-(--text)">{t('app.dashboard.virtue.dynamicRoles.activeRolesTitle')}</span>
					<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.virtue.dynamicRoles.activeRolesDesc', { max: dynamicRoles.maxRoles })}</span>
				</div>
				{!dynamicRoles.anchorRoleId ? (
					<div className="text-xs text-(--text-muted) py-1">{t('app.dashboard.virtue.dynamicRoles.selectAnchorPrompt')}</div>
				) : (
					<div className="flex flex-wrap items-center gap-2 pt-1">
						<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 text-xs font-bold text-(--text)">
							<span className="text-[10px] font-mono text-(--accent)">{t('app.dashboard.virtue.dynamicRoles.anchorBadge')}</span>
							<span>{anchorDisplay?.name || dynamicRoles.anchorRoleId}</span>
						</span>
						{managedEntries
							.filter((m) => m.level > 1 && m.roleId !== dynamicRoles.anchorRoleId)
							.map((m) => {
								const disp = getRoleDisplay(m.roleId);
								return (
									<span
										key={`${m.level}-${m.roleId}`}
										className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-(--background)/70 border border-(--border)/10 text-xs font-bold text-(--text)"
									>
										<span className="text-[10px] font-mono text-(--accent)">L{m.level}</span>
										{disp.name ? (
											<>
												<span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: disp.colorHex }} />
												<span>{disp.name}</span>
											</>
										) : (
											<span>{(dynamicRoles.nameTemplate || 'Level [@level]').replace(/\[@level\]|\{level\}/gi, String(m.level))}</span>
										)}
									</span>
								);
							})}
					</div>
				)}
			</div>
		</div>
	);
}
