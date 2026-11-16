/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Button, Modal } from '@xernerx/ui';
import { GiveawayChannelsStep, GiveawayDetailsStep, GiveawayPrizeStep } from './GiveawayModalCoreSteps';
import { GiveawayBonusStep, GiveawayRequirementsStep } from './GiveawayModalSteps';
import type { BonusEntryRule, GiveawayPrize, GiveawayRequirements, SelectOption } from './types';

interface GiveawayModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	editingId: string | null;
	saving: boolean;
	title: string;
	setTitle: (v: string) => void;
	description: string;
	setDescription: (v: string) => void;
	bannerUrl: string;
	setBannerUrl: (v: string) => void;
	winnerCount: number;
	setWinnerCount: (v: number) => void;
	startsAt: string;
	setStartsAt: (v: string) => void;
	endsAt: string;
	setEndsAt: (v: string) => void;
	channelId: string;
	setChannelId: (v: string) => void;
	pingRoleId: string;
	setPingRoleId: (v: string) => void;
	showOnWeb: boolean;
	setShowOnWeb: (v: boolean) => void;
	targetApps: string[];
	setTargetApps: (v: string[]) => void;
	prize: GiveawayPrize;
	setPrize: React.Dispatch<React.SetStateAction<GiveawayPrize>>;
	requirements: GiveawayRequirements;
	setRequirements: React.Dispatch<React.SetStateAction<GiveawayRequirements>>;
	bonusEntries: BonusEntryRule[];
	setBonusEntries: React.Dispatch<React.SetStateAction<BonusEntryRule[]>>;
	channels: SelectOption[];
	roles: SelectOption[];
	storeItems: Array<{ id: string; name: string; itemType?: string; creditAmount?: number; durationDays?: number }>;
	onSubmit: (e: React.FormEvent) => void;
}

export function GiveawayModal({
	isOpen,
	onOpenChange,
	editingId,
	saving,
	title,
	setTitle,
	description,
	setDescription,
	bannerUrl,
	setBannerUrl,
	winnerCount,
	setWinnerCount,
	startsAt,
	setStartsAt,
	endsAt,
	setEndsAt,
	channelId,
	setChannelId,
	pingRoleId,
	setPingRoleId,
	showOnWeb,
	setShowOnWeb,
	targetApps,
	setTargetApps,
	prize,
	setPrize,
	requirements,
	setRequirements,
	bonusEntries,
	setBonusEntries,
	channels,
	roles,
	storeItems,
	onSubmit,
}: GiveawayModalProps) {
	const { t } = useDictionary();
	const [step, setStep] = useState(0);

	useEffect(() => {
		if (isOpen) setStep(0);
	}, [isOpen, editingId]);

	const steps = [
		{ key: 'details', label: t('admin.dashboard.giveaways.modal.steps.details') },
		{ key: 'channels', label: t('admin.dashboard.giveaways.modal.steps.channels') },
		{ key: 'prize', label: t('admin.dashboard.giveaways.modal.steps.prize') },
		{ key: 'requirements', label: t('admin.dashboard.giveaways.modal.steps.requirements') },
		{ key: 'bonus', label: t('admin.dashboard.giveaways.modal.steps.bonus') },
	];

	const applyDurationPreset = (hours: number) => {
		const base = startsAt ? new Date(startsAt).getTime() : Date.now();
		const target = new Date(base + hours * 3600_000);
		const isoLocal = new Date(target.getTime() - target.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
		setEndsAt(isoLocal);
	};

	const addBonusRule = (type: BonusEntryRule['type']) => {
		const defaultLabels: Record<BonusEntryRule['type'], string> = {
			active_pass: t('admin.dashboard.giveaways.modal.bonusTypes.activePass'),
			verified: t('admin.dashboard.giveaways.modal.bonusTypes.verified'),
			global_level: t('admin.dashboard.giveaways.requirements.levelPreset', { level: 10 }),
			discord_role: t('admin.dashboard.giveaways.modal.bonusTypes.discordRole'),
			badge_or_item: t('admin.dashboard.giveaways.modal.bonusTypes.storeItem'),
		};
		setBonusEntries((prev) => [
			...prev,
			{
				type,
				targetId: type === 'discord_role' ? roles[0]?.value || '' : type === 'badge_or_item' ? storeItems[0]?.id || '' : type === 'global_level' ? '10' : '',
				label: defaultLabels[type],
				extraEntries: 1,
			},
		]);
	};

	const updateBonusRule = (idx: number, patch: Partial<BonusEntryRule>) => {
		setBonusEntries((prev) => prev.map((rule, i) => (i === idx ? { ...rule, ...patch } : rule)));
	};

	const removeBonusRule = (idx: number) => {
		setBonusEntries((prev) => prev.filter((_, i) => i !== idx));
	};

	const storeItemOptions: SelectOption[] = [
		{ label: t('admin.dashboard.giveaways.modal.selectStoreItem'), value: '' },
		...storeItems.map((item) => ({
			label: `${item.name} (${item.id})`,
			value: item.id,
		})),
	];

	const badgeAndItemMultiOptions: SelectOption[] = [
		...storeItems.map((item) => ({ label: item.name, value: item.id })),
		{ label: 'Credit Patron Badge (2,500+ spent)', value: 'credit_patron' },
		{ label: 'High Roller Badge (10,000+ spent)', value: 'high_roller' },
		{ label: 'Vault Sovereign Badge (25,000+ spent)', value: 'vault_sovereign' },
		{ label: 'Custom Vanity URL Unlocked', value: 'vanity_url' },
		{ label: 'Active Streak Shield', value: 'streak_shield' },
	];

	const pingRoleOptions: SelectOption[] = [
		{ label: t('admin.dashboard.giveaways.modal.noPing'), value: '' },
		{ label: '@everyone', value: '@everyone' },
		{ label: '@here', value: '@here' },
		...roles,
	];

	const canProceedFromStep = () => {
		if (step === 0) return Boolean(title.trim() && endsAt);
		if (step === 2) return Boolean(prize.label.trim());
		return true;
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (step < steps.length - 1) {
			if (canProceedFromStep()) setStep((s) => s + 1);
			return;
		}
		onSubmit(e);
	};

	const progressPercent = ((step + 1) / steps.length) * 100;

	return (
		<Modal
			open={isOpen}
			onOpenChange={onOpenChange}
			maxWidth="max-w-2xl"
			title={editingId ? t('admin.dashboard.giveaways.modal.editTitle') : t('admin.dashboard.giveaways.modal.createTitle')}
			description={t('admin.dashboard.giveaways.modal.subtitle')}
		>
			<form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
				{/* Step Progress Bar Header */}
				<div className="flex flex-col gap-2.5">
					<div className="grid grid-cols-5 gap-1.5">
						{steps.map((s, idx) => {
							const isActive = idx === step;
							const isCompleted = idx < step;
							return (
								<button
									key={s.key}
									type="button"
									onClick={() => setStep(idx)}
									className={`flex items-center justify-center gap-1.5 rounded-2xl border px-2 py-2 text-xs font-bold transition-all cursor-pointer ${
										isActive
											? 'bg-(--accent) border-(--accent) text-(--accent-contrast) shadow-sm'
											: isCompleted
												? 'bg-(--accent)/15 border-(--accent)/30 text-(--accent)'
												: 'bg-(--foreground)/25 border-(--border)/10 text-(--text-muted) hover:text-(--text)'
									}`}
								>
									<span
										className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
											isActive
												? 'bg-(--accent-contrast)/20 text-(--accent-contrast)'
												: isCompleted
													? 'bg-(--accent) text-(--accent-contrast)'
													: 'bg-(--background)/60 text-(--text-muted)'
										}`}
									>
										{isCompleted ? <Check size={10} /> : idx + 1}
									</span>
									<span className="truncate hidden sm:inline">{s.label}</span>
								</button>
							);
						})}
					</div>

					<div className="h-1.5 w-full rounded-full bg-(--foreground)/40 overflow-hidden">
						<div className="h-full rounded-full bg-(--accent) transition-all duration-300" style={{ width: `${progressPercent}%` }} />
					</div>
				</div>

				{step === 0 && (
					<GiveawayDetailsStep
						title={title}
						setTitle={setTitle}
						winnerCount={winnerCount}
						setWinnerCount={setWinnerCount}
						startsAt={startsAt}
						setStartsAt={setStartsAt}
						endsAt={endsAt}
						setEndsAt={setEndsAt}
						applyDurationPreset={applyDurationPreset}
						description={description}
						setDescription={setDescription}
						bannerUrl={bannerUrl}
						setBannerUrl={setBannerUrl}
					/>
				)}

				{step === 1 && (
					<GiveawayChannelsStep
						channelId={channelId}
						setChannelId={setChannelId}
						channels={channels}
						pingRoleId={pingRoleId}
						setPingRoleId={setPingRoleId}
						pingRoleOptions={pingRoleOptions}
						showOnWeb={showOnWeb}
						setShowOnWeb={setShowOnWeb}
						targetApps={targetApps}
						setTargetApps={setTargetApps}
					/>
				)}

				{step === 2 && <GiveawayPrizeStep prize={prize} setPrize={setPrize} storeItems={storeItems} storeItemOptions={storeItemOptions} roles={roles} />}

				{step === 3 && <GiveawayRequirementsStep requirements={requirements} setRequirements={setRequirements} roles={roles} badgeAndItemMultiOptions={badgeAndItemMultiOptions} />}

				{step === 4 && (
					<GiveawayBonusStep
						bonusEntries={bonusEntries}
						addBonusRule={addBonusRule}
						updateBonusRule={updateBonusRule}
						removeBonusRule={removeBonusRule}
						roles={roles}
						badgeAndItemMultiOptions={badgeAndItemMultiOptions}
					/>
				)}

				{/* Footer Navigation */}
				<div className="flex items-center justify-between gap-3 pt-3 border-t border-(--border)/10">
					<div className="flex items-center gap-2">
						{step > 0 && (
							<Button variant="secondary" type="button" onClick={() => setStep((s) => s - 1)}>
								<ArrowLeft size={14} />
								{t('admin.dashboard.giveaways.modal.steps.back')}
							</Button>
						)}
						<span className="text-xs font-semibold text-(--text-muted)">
							{t('admin.dashboard.giveaways.modal.steps.stepCounter', {
								current: step + 1,
								total: steps.length,
							})}
						</span>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
							{t('common.cancel')}
						</Button>

						{editingId && step < steps.length - 1 && (
							<Button variant="secondary" type="button" onClick={(e) => onSubmit(e as any)} disabled={saving}>
								{saving ? t('common.saving') : t('admin.dashboard.giveaways.modal.saveChanges')}
							</Button>
						)}

						{step < steps.length - 1 ? (
							<Button variant="primary" type="button" disabled={!canProceedFromStep()} onClick={() => setStep((s) => s + 1)}>
								{t('admin.dashboard.giveaways.modal.steps.next')}
								<ArrowRight size={14} />
							</Button>
						) : (
							<Button variant="primary" type="submit" disabled={saving}>
								{saving ? t('common.saving') : editingId ? t('admin.dashboard.giveaways.modal.saveChanges') : t('admin.dashboard.giveaways.modal.launchGiveaway')}
							</Button>
						)}
					</div>
				</div>
			</form>
		</Modal>
	);
}
