/** @format */
'use client';

import React from 'react';
import { Award, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Button, Input, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import type { BonusEntryRule, GiveawayRequirements, SelectOption } from './types';

interface GiveawayRequirementsStepProps {
	requirements: GiveawayRequirements;
	setRequirements: React.Dispatch<React.SetStateAction<GiveawayRequirements>>;
	roles: SelectOption[];
	badgeAndItemMultiOptions: SelectOption[];
}

export function GiveawayRequirementsStep({ requirements, setRequirements, roles, badgeAndItemMultiOptions }: GiveawayRequirementsStepProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col gap-4">
			{/* Prominent Global User Level Requirement */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-(--accent)/10 border border-(--accent)/25 p-4">
				<div className="flex items-start gap-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/20 text-(--accent) mt-0.5">
						<Award size={18} />
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-sm font-extrabold text-(--text)">{t('admin.dashboard.giveaways.requirements.minGlobalLevel')}</span>
						<span className="text-xs text-(--text-muted)">{t('admin.dashboard.giveaways.requirements.minGlobalLevelDesc')}</span>
						<div className="flex flex-wrap items-center gap-1.5 pt-1">
							{[0, 5, 10, 25, 50, 100].map((lvl) => {
								const isSelected = (Number(requirements.minGlobalLevel) || 0) === lvl;
								return (
									<button
										key={lvl}
										type="button"
										onClick={() => setRequirements((prev) => ({ ...prev, minGlobalLevel: lvl }))}
										className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
											isSelected
												? 'bg-(--accent) border-(--accent) text-(--accent-contrast)'
												: 'bg-(--background)/70 border-(--border)/10 text-(--text-muted) hover:text-(--accent)'
										}`}
									>
										{lvl === 0 ? t('admin.dashboard.giveaways.requirements.anyLevelPreset') : t('admin.dashboard.giveaways.requirements.levelPreset', { level: lvl })}
									</button>
								);
							})}
						</div>
					</div>
				</div>
				<div className="w-full sm:w-28 shrink-0">
					<Input
						variant="number"
						className="text-center font-bold"
						value={String(requirements.minGlobalLevel || 0)}
						onChange={(e) =>
							setRequirements((prev) => ({
								...prev,
								minGlobalLevel: Math.max(0, Number(e.target.value) || 0),
							}))
						}
						min={0}
					/>
				</div>
			</div>

			{/* Account / Verified / Active Pass Switches */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<label className="flex items-center justify-between gap-2.5 rounded-2xl bg-(--foreground)/25 border border-(--border)/10 px-3.5 py-3 cursor-pointer">
					<span className="text-xs font-bold text-(--text)">{t('admin.dashboard.giveaways.requirements.requireAccount')}</span>
					<Toggle size="sm" checked={requirements.requireAccount} onChange={(e) => setRequirements((prev) => ({ ...prev, requireAccount: e.target.checked }))} />
				</label>
				<label className="flex items-center justify-between gap-2.5 rounded-2xl bg-(--foreground)/25 border border-(--border)/10 px-3.5 py-3 cursor-pointer">
					<span className="text-xs font-bold text-(--text)">{t('admin.dashboard.giveaways.requirements.requireVerified')}</span>
					<Toggle size="sm" checked={requirements.requireVerified} onChange={(e) => setRequirements((prev) => ({ ...prev, requireVerified: e.target.checked }))} />
				</label>
				<label className="flex items-center justify-between gap-2.5 rounded-2xl bg-(--foreground)/25 border border-(--border)/10 px-3.5 py-3 cursor-pointer">
					<span className="text-xs font-bold text-(--text)">{t('admin.dashboard.giveaways.requirements.requireActivePass')}</span>
					<Toggle size="sm" checked={requirements.requireActivePass} onChange={(e) => setRequirements((prev) => ({ ...prev, requireActivePass: e.target.checked }))} />
				</label>
			</div>

			{/* Streak & Credits Spent */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.requirements.minStreak')}</label>
					<Input
						variant="number"
						value={String(requirements.minStreak || 0)}
						onChange={(e) => setRequirements((prev) => ({ ...prev, minStreak: Math.max(0, Number(e.target.value) || 0) }))}
						min={0}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.requirements.minTotalSpent')}</label>
					<Input
						variant="number"
						value={String(requirements.minTotalSpent || 0)}
						onChange={(e) => setRequirements((prev) => ({ ...prev, minTotalSpent: Math.max(0, Number(e.target.value) || 0) }))}
						min={0}
					/>
				</div>
			</div>

			{/* Discord Roles & Store Items */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.requirements.requiredDiscordRoles')}</label>
					<MultiSelector
						toggleClassName="!min-w-0"
						value={requirements.requiredDiscordRoleIds}
						onChange={(vals) => setRequirements((prev) => ({ ...prev, requiredDiscordRoleIds: vals }))}
						options={roles}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.requirements.roleMatchMode')}</label>
					<Selector
						toggleClassName="!min-w-0"
						value={requirements.roleMatchMode || 'any'}
						onChange={(val) => setRequirements((prev) => ({ ...prev, roleMatchMode: val as 'any' | 'all' }))}
						options={[
							{ label: t('admin.dashboard.giveaways.requirements.matchAnyRole'), value: 'any' },
							{ label: t('admin.dashboard.giveaways.requirements.matchAllRoles'), value: 'all' },
						]}
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.requirements.excludedDiscordRoles')}</label>
					<MultiSelector
						toggleClassName="!min-w-0"
						value={requirements.excludedDiscordRoleIds}
						onChange={(vals) => setRequirements((prev) => ({ ...prev, excludedDiscordRoleIds: vals }))}
						options={roles}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.requirements.requiredItemsOrBadges')}</label>
					<MultiSelector
						toggleClassName="!min-w-0"
						value={requirements.requiredBadgeOrItemIds}
						onChange={(vals) => setRequirements((prev) => ({ ...prev, requiredBadgeOrItemIds: vals }))}
						options={badgeAndItemMultiOptions}
					/>
				</div>
			</div>
		</div>
	);
}

interface GiveawayBonusStepProps {
	bonusEntries: BonusEntryRule[];
	addBonusRule: (type: BonusEntryRule['type']) => void;
	updateBonusRule: (idx: number, patch: Partial<BonusEntryRule>) => void;
	removeBonusRule: (idx: number) => void;
	roles: SelectOption[];
	badgeAndItemMultiOptions: SelectOption[];
}

export function GiveawayBonusStep({ bonusEntries, addBonusRule, updateBonusRule, removeBonusRule, roles, badgeAndItemMultiOptions }: GiveawayBonusStepProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2.5 rounded-2xl bg-(--foreground)/25 border border-(--border)/10 p-4">
				<span className="text-xs font-bold text-(--text)">{t('admin.dashboard.giveaways.modal.bonusEntriesTitle')}</span>
				<div className="flex flex-wrap items-center gap-1.5">
					{(
						[
							{ type: 'active_pass', label: t('admin.dashboard.giveaways.modal.bonusTypes.activePass') },
							{ type: 'verified', label: t('admin.dashboard.giveaways.modal.bonusTypes.verified') },
							{ type: 'global_level', label: t('admin.dashboard.giveaways.modal.bonusTypes.globalLevel') },
							{ type: 'discord_role', label: t('admin.dashboard.giveaways.modal.bonusTypes.discordRole') },
							{ type: 'badge_or_item', label: t('admin.dashboard.giveaways.modal.bonusTypes.storeItem') },
						] as const
					).map((bOpt) => (
						<button
							key={bOpt.type}
							type="button"
							onClick={() => addBonusRule(bOpt.type)}
							className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 hover:bg-(--accent)/25 border border-(--accent)/30 px-3 py-1.5 text-xs font-bold text-(--accent) transition-colors cursor-pointer"
						>
							<Plus size={12} />
							{bOpt.label}
						</button>
					))}
				</div>
			</div>

			{bonusEntries.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl bg-(--foreground)/20 border border-(--border)/10 py-10 px-4 text-center">
					<Sparkles size={22} className="text-(--accent) mb-2" />
					<p className="text-xs text-(--text-muted) max-w-md">{t('admin.dashboard.giveaways.modal.noBonusRules')}</p>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{bonusEntries.map((rule, idx) => (
						<div key={idx} className="flex flex-col gap-3 rounded-2xl bg-(--foreground)/25 border border-(--border)/10 p-3.5">
							<div className="grid grid-cols-1 sm:grid-cols-12 items-end gap-3">
								<div className="sm:col-span-5 flex flex-col gap-1.5">
									<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.bonusRuleLabel')}</label>
									<Input value={rule.label || ''} onChange={(e) => updateBonusRule(idx, { label: e.target.value })} />
								</div>

								<div className="sm:col-span-4 flex flex-col gap-1.5">
									{rule.type === 'discord_role' ? (
										<>
											<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.bonusTypes.discordRole')}</label>
											<Selector
												toggleClassName="!min-w-0 h-[46px]"
												value={rule.targetId || ''}
												onChange={(val) => {
													const matched = roles.find((r) => r.value === val);
													updateBonusRule(idx, { targetId: val, label: matched ? matched.label : rule.label });
												}}
												options={roles}
											/>
										</>
									) : rule.type === 'badge_or_item' ? (
										<>
											<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.bonusTypes.storeItem')}</label>
											<Selector
												toggleClassName="!min-w-0 h-[46px]"
												value={rule.targetId || ''}
												onChange={(val) => {
													const matched = badgeAndItemMultiOptions.find((i) => i.value === val);
													updateBonusRule(idx, { targetId: val, label: matched ? matched.label : rule.label });
												}}
												options={badgeAndItemMultiOptions}
											/>
										</>
									) : rule.type === 'global_level' ? (
										<>
											<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.minGlobalLevelBonusLabel')}</label>
											<Input
												variant="number"
												value={String(rule.targetId || 10)}
												onChange={(e) => {
													const lvl = Math.max(1, Number(e.target.value) || 1);
													updateBonusRule(idx, {
														targetId: String(lvl),
														label: t('admin.dashboard.giveaways.requirements.levelPreset', { level: lvl }),
													});
												}}
												min={1}
											/>
										</>
									) : (
										<div className="flex items-center h-[46px] px-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 text-xs font-semibold text-(--text-muted)">
											{rule.type === 'active_pass' ? t('admin.dashboard.giveaways.modal.bonusTypes.activePass') : t('admin.dashboard.giveaways.modal.bonusTypes.verified')}
										</div>
									)}
								</div>

								<div className="sm:col-span-2 flex flex-col gap-1.5">
									<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.extraEntriesLabel')}</label>
									<Input
										variant="number"
										value={String(rule.extraEntries || 1)}
										onChange={(e) => updateBonusRule(idx, { extraEntries: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
										min={1}
										max={50}
									/>
								</div>

								<div className="sm:col-span-1 flex justify-end">
									<Button variant="danger" type="button" onClick={() => removeBonusRule(idx)} className="h-[46px] w-[46px] p-0 rounded-2xl flex items-center justify-center">
										<Trash2 size={15} />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
