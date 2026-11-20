/** @format */
'use client';

import { Badge, Button, Input, MultiSelector, Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { DiscordChannelItem, DiscordRoleItem, PositionCategory, YourAppsQuestion } from './types';

export interface PositionRulesDraftState {
	pendingRoles: string[];
	rewardRoles: string[];
	removeRoles: string[];
	denyAddRoles: string[];
	denyRemoveRoles: string[];
	requiredRoles: string[];
	restrictedRoles: string[];
	cooldown: number;
	minimumJoinTime: number;
	minimumAccountAge: number;
	opensAtLocal: string;
	closesAtLocal: string;
	maxSubmissions: number;
	maxApprovals: number;
	minVotesToApprove: number;
	autoApproveVotes: number;
	autoDenyVotes: number;
	logChannelOverride: string;
	archiveChannelOverride: string;
	reviewRolesOverride: string[];
	submissionPingsOverride: string[];
	threadOverride: 'default' | 'true' | 'false';
	pollOverride: 'default' | 'true' | 'false';
}

interface PositionRulesStepProps {
	rules: PositionRulesDraftState;
	discordRoles: DiscordRoleItem[];
	discordChannels: DiscordChannelItem[];
	onPatch: (patch: Partial<PositionRulesDraftState>) => void;
}

export function PositionRulesStep({ rules, discordRoles, discordChannels, onPatch }: PositionRulesStepProps) {
	const { t } = useDictionary();

	const multiRoleOptions = discordRoles.map((r) => ({
		label: `@${r.name}`,
		value: r.id,
		color: r.color > 0 ? `#${r.color.toString(16).padStart(6, '0')}` : undefined,
	}));

	const channelOverrideOptions = [
		{ value: '', label: t('app.dashboard.applications.positions.modal.useServerDefault') },
		...discordChannels
			.filter((c) => c.type === 0 || c.type === 5)
			.map((c) => ({
				value: c.id,
				label: `#${c.name}`,
			})),
	];

	const triStateOptions = [
		{ value: 'default', label: t('app.dashboard.applications.positions.modal.useServerDefault') },
		{ value: 'true', label: t('app.dashboard.applications.positions.modal.stateEnabled') },
		{ value: 'false', label: t('app.dashboard.applications.positions.modal.stateDisabled') },
	];

	return (
		<div className="flex flex-col gap-5 max-h-[54vh] overflow-y-auto overflow-x-hidden pr-1">
			<div className="flex flex-col gap-3">
				<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('app.dashboard.applications.positions.modal.rulesTitle')}</span>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.pendingRoles')}</label>
						<MultiSelector
							value={rules.pendingRoles}
							onChange={(pendingRoles: string[]) => onPatch({ pendingRoles })}
							options={multiRoleOptions}
							placeholder={t('app.dashboard.applications.roles.placeholder')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.rewardRoles')}</label>
						<MultiSelector
							value={rules.rewardRoles}
							onChange={(rewardRoles: string[]) => onPatch({ rewardRoles })}
							options={multiRoleOptions}
							placeholder={t('app.dashboard.applications.roles.placeholder')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.removeRoles')}</label>
						<MultiSelector
							value={rules.removeRoles}
							onChange={(removeRoles: string[]) => onPatch({ removeRoles })}
							options={multiRoleOptions}
							placeholder={t('app.dashboard.applications.roles.placeholder')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.denyAddRoles')}</label>
						<MultiSelector
							value={rules.denyAddRoles}
							onChange={(denyAddRoles: string[]) => onPatch({ denyAddRoles })}
							options={multiRoleOptions}
							placeholder={t('app.dashboard.applications.roles.placeholder')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.denyRemoveRoles')}</label>
						<MultiSelector
							value={rules.denyRemoveRoles}
							onChange={(denyRemoveRoles: string[]) => onPatch({ denyRemoveRoles })}
							options={multiRoleOptions}
							placeholder={t('app.dashboard.applications.roles.placeholder')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.requiredRoles')}</label>
						<MultiSelector
							value={rules.requiredRoles}
							onChange={(requiredRoles: string[]) => onPatch({ requiredRoles })}
							options={multiRoleOptions}
							placeholder={t('app.dashboard.applications.roles.placeholder')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.restrictedRoles')}</label>
						<MultiSelector
							value={rules.restrictedRoles}
							onChange={(restrictedRoles: string[]) => onPatch({ restrictedRoles })}
							options={multiRoleOptions}
							placeholder={t('app.dashboard.applications.roles.placeholder')}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.cooldownLabel')}</label>
						<Input type="number" min={0} value={String(rules.cooldown)} onChange={(e) => onPatch({ cooldown: Math.max(0, Number(e.target.value) || 0) })} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.minJoinLabel')}</label>
						<Input type="number" min={0} value={String(rules.minimumJoinTime)} onChange={(e) => onPatch({ minimumJoinTime: Math.max(0, Number(e.target.value) || 0) })} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.minAccountAgeLabel')}</label>
						<Input type="number" min={0} value={String(rules.minimumAccountAge)} onChange={(e) => onPatch({ minimumAccountAge: Math.max(0, Number(e.target.value) || 0) })} />
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-3 pt-4 border-t border-(--border)/10">
				<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('app.dashboard.applications.positions.modal.scheduleCapsTitle')}</span>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.opensAtLabel')}</label>
						<Input type="datetime-local" value={rules.opensAtLocal} onChange={(e) => onPatch({ opensAtLocal: e.target.value })} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.closesAtLabel')}</label>
						<Input type="datetime-local" value={rules.closesAtLocal} onChange={(e) => onPatch({ closesAtLocal: e.target.value })} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.maxSubmissionsLabel')}</label>
						<Input type="number" min={0} value={String(rules.maxSubmissions)} onChange={(e) => onPatch({ maxSubmissions: Math.max(0, Number(e.target.value) || 0) })} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.maxApprovalsLabel')}</label>
						<Input type="number" min={0} value={String(rules.maxApprovals)} onChange={(e) => onPatch({ maxApprovals: Math.max(0, Number(e.target.value) || 0) })} />
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.minVotesLabel')}</label>
						<Input type="number" min={0} max={50} value={String(rules.minVotesToApprove)} onChange={(e) => onPatch({ minVotesToApprove: Math.max(0, Number(e.target.value) || 0) })} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.autoApproveVotesLabel')}</label>
						<Input type="number" min={0} max={50} value={String(rules.autoApproveVotes)} onChange={(e) => onPatch({ autoApproveVotes: Math.max(0, Number(e.target.value) || 0) })} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.autoDenyVotesLabel')}</label>
						<Input type="number" min={0} max={50} value={String(rules.autoDenyVotes)} onChange={(e) => onPatch({ autoDenyVotes: Math.max(0, Number(e.target.value) || 0) })} />
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-3 pt-4 border-t border-(--border)/10">
				<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('app.dashboard.applications.positions.modal.overridesTitle')}</span>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.logChannelOverride')}</label>
						<Selector value={rules.logChannelOverride} onChange={(logChannelOverride: string) => onPatch({ logChannelOverride })} options={channelOverrideOptions} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.archiveChannelOverride')}</label>
						<Selector value={rules.archiveChannelOverride} onChange={(archiveChannelOverride: string) => onPatch({ archiveChannelOverride })} options={channelOverrideOptions} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.reviewRolesOverride')}</label>
						<MultiSelector
							value={rules.reviewRolesOverride}
							onChange={(reviewRolesOverride: string[]) => onPatch({ reviewRolesOverride })}
							options={multiRoleOptions}
							placeholder={t('app.dashboard.applications.positions.modal.useServerDefault')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.submissionPingsOverride')}</label>
						<MultiSelector
							value={rules.submissionPingsOverride}
							onChange={(submissionPingsOverride: string[]) => onPatch({ submissionPingsOverride })}
							options={multiRoleOptions}
							placeholder={t('app.dashboard.applications.positions.modal.useServerDefault')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.threadOverride')}</label>
						<Selector value={rules.threadOverride} onChange={(v: string) => onPatch({ threadOverride: v as any })} options={triStateOptions} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.modal.pollOverride')}</label>
						<Selector value={rules.pollOverride} onChange={(v: string) => onPatch({ pollOverride: v as any })} options={triStateOptions} />
					</div>
				</div>
			</div>
		</div>
	);
}

interface PositionReviewStepProps {
	name: string;
	description: string;
	category: PositionCategory;
	state: 'open' | 'closed';
	anonymousResponses: boolean;
	validQuestions: YourAppsQuestion[];
	rules: PositionRulesDraftState;
	discordRoles: DiscordRoleItem[];
	onJumpStep: (step: 0 | 1 | 2) => void;
}

export function PositionReviewStep({ name, description, category, state, anonymousResponses, validQuestions, rules, discordRoles, onJumpStep }: PositionReviewStepProps) {
	const { t } = useDictionary();

	const roleNameById = (roleId: string) => {
		const found = discordRoles.find((r) => r.id === roleId);
		return found ? `@${found.name}` : roleId;
	};

	return (
		<div className="flex flex-col gap-3 max-h-[54vh] overflow-y-auto overflow-x-hidden pr-1">
			<p className="text-xs text-(--text-muted)">{t('app.dashboard.applications.positions.wizard.reviewSubtitle')}</p>

			<div className="flex flex-col gap-2 p-4 rounded-2xl bg-(--background)/60 border border-(--border)/10">
				<div className="flex items-center justify-between gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-base font-bold text-(--text)">{name}</span>
						<Badge variant={state === 'open' ? 'success' : 'muted'} dot>
							{state === 'open' ? t('app.dashboard.applications.positions.openBadge') : t('app.dashboard.applications.positions.closedBadge')}
						</Badge>
						<Badge variant="accent">{t(`app.dashboard.applications.positions.categories.${category}`)}</Badge>
						{anonymousResponses && <Badge variant="outline">{t('app.dashboard.applications.positions.anonymousBadge')}</Badge>}
					</div>
					<Button variant="ghost" size="sm" onClick={() => onJumpStep(0)}>
						{t('app.dashboard.applications.positions.wizard.editStepBtn')}
					</Button>
				</div>
				<p className="text-xs text-(--text-muted)">{description.trim() || t('app.dashboard.applications.positions.wizard.noDescription')}</p>
			</div>

			<div className="flex flex-col gap-2 p-4 rounded-2xl bg-(--background)/60 border border-(--border)/10">
				<div className="flex items-center justify-between gap-2">
					<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">
						{t('app.dashboard.applications.positions.wizard.stepQuestions')} ({validQuestions.length})
					</span>
					<Button variant="ghost" size="sm" onClick={() => onJumpStep(1)}>
						{t('app.dashboard.applications.positions.wizard.editStepBtn')}
					</Button>
				</div>
				<div className="flex flex-col gap-2">
					{validQuestions.map((q, idx) => {
						const choiceSummary =
							(q.type === 'select' || q.type === 'radio' || q.type === 'multiselect') && q.options?.length > 0
								? q.options.join(' • ')
								: q.type === 'boolean'
									? `${q.options?.[0]?.trim() || 'Yes'} / ${q.options?.[1]?.trim() || 'No'}`
									: '';
						return (
							<div key={q.id} className="flex flex-col gap-0.5">
								<div className="flex items-center justify-between gap-2 text-xs text-(--text)">
									<span className="truncate">
										<strong className="text-(--accent)">#{idx + 1}</strong> {q.question}
									</span>
									<div className="flex items-center gap-1.5 shrink-0">
										{q.condition?.questionId && <Badge variant="accent">{t('app.servers.applications.conditionalBadge')}</Badge>}
										<Badge variant="outline">{t(`app.dashboard.applications.positions.modal.types.${q.type}`)}</Badge>
									</div>
								</div>
								{choiceSummary && <span className="text-[11px] text-(--text-muted) pl-4 truncate">{choiceSummary}</span>}
							</div>
						);
					})}
				</div>
			</div>

			<div className="flex flex-col gap-2 p-4 rounded-2xl bg-(--background)/60 border border-(--border)/10">
				<div className="flex items-center justify-between gap-2">
					<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('app.dashboard.applications.positions.wizard.stepEligibility')}</span>
					<Button variant="ghost" size="sm" onClick={() => onJumpStep(2)}>
						{t('app.dashboard.applications.positions.wizard.editStepBtn')}
					</Button>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-(--text-muted)">
					<div>
						<strong className="text-(--text)">{t('app.dashboard.applications.positions.modal.pendingRoles')}:</strong>{' '}
						{rules.pendingRoles.length > 0 ? rules.pendingRoles.map(roleNameById).join(', ') : t('app.dashboard.applications.positions.wizard.noneConfigured')}
					</div>
					<div>
						<strong className="text-(--text)">{t('app.dashboard.applications.positions.modal.rewardRoles')}:</strong>{' '}
						{rules.rewardRoles.length > 0 ? rules.rewardRoles.map(roleNameById).join(', ') : t('app.dashboard.applications.positions.wizard.noneConfigured')}
					</div>
					<div>
						<strong className="text-(--text)">{t('app.dashboard.applications.positions.modal.requiredRoles')}:</strong>{' '}
						{rules.requiredRoles.length > 0 ? rules.requiredRoles.map(roleNameById).join(', ') : t('app.dashboard.applications.positions.wizard.noneConfigured')}
					</div>
					<div>
						<strong className="text-(--text)">{t('app.dashboard.applications.positions.modal.cooldownLabel')}:</strong>{' '}
						{rules.cooldown > 0 ? t('app.dashboard.applications.positions.wizard.secondsUnit', { count: rules.cooldown }) : t('app.dashboard.applications.positions.wizard.noneConfigured')}
					</div>
				</div>
			</div>
		</div>
	);
}
