/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Coins, Gift, Shield, ShoppingBag } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Button, Input, Modal, MultiSelector, Selector, Toggle } from '@xernerx/ui';
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

const TARGET_APP_OPTIONS: SelectOption[] = [
	{ label: 'All Suite Apps', value: 'all' },
	{ label: 'Dashboard (app)', value: 'app' },
	{ label: 'Store (store)', value: 'store' },
	{ label: 'Account (account)', value: 'account' },
	{ label: 'Info & Feedback (info)', value: 'info' },
	{ label: 'Developer Portal (portal)', value: 'portal' },
	{ label: 'Main Site (www)', value: 'www' },
	{ label: 'Blog (blog)', value: 'blog' },
];

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

				{/* STEP 1: DETAILS & SCHEDULE */}
				{step === 0 && (
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
							<div className="sm:col-span-3 flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.titleLabel')}</label>
								<Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('admin.dashboard.giveaways.modal.titlePlaceholder')} required />
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.winnerCountLabel')}</label>
								<Input
									variant="number"
									value={String(winnerCount)}
									onChange={(e) => setWinnerCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
									min={1}
									max={100}
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.startsAtLabel')}</label>
								<Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
							</div>
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between gap-2">
									<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.endsAtLabel')}</label>
									<div className="flex items-center gap-1">
										{[
											{ label: '+1h', hours: 1 },
											{ label: '+24h', hours: 24 },
											{ label: '+3d', hours: 72 },
											{ label: '+7d', hours: 168 },
										].map((preset) => (
											<button
												key={preset.label}
												type="button"
												onClick={() => applyDurationPreset(preset.hours)}
												className="rounded-lg bg-(--foreground)/40 hover:bg-(--accent)/15 border border-(--border)/10 px-2 py-0.5 text-[10px] font-bold text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
											>
												{preset.label}
											</button>
										))}
									</div>
								</div>
								<Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.descriptionLabel')}</label>
							<Input
								variant="textarea"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder={t('admin.dashboard.giveaways.modal.descriptionPlaceholder')}
								rows={2}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.bannerUrlLabel')}</label>
							<Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://cdn.xernerx.com/..." />
						</div>
					</div>
				)}

				{/* STEP 2: CHANNELS & DISTRIBUTION */}
				{step === 1 && (
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.discordChannelLabel')}</label>
								<Selector
									toggleClassName="!min-w-0"
									value={channelId}
									onChange={setChannelId}
									options={[{ label: t('admin.dashboard.giveaways.modal.webOnlyNoChannel'), value: '' }, ...channels]}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.pingRoleLabel')}</label>
								<Selector toggleClassName="!min-w-0" value={pingRoleId} onChange={setPingRoleId} options={pingRoleOptions} />
							</div>
						</div>

						<div className="flex flex-col gap-3.5 rounded-2xl bg-(--foreground)/25 border border-(--border)/10 p-4">
							<div className="flex items-center justify-between gap-3">
								<div className="flex flex-col gap-0.5">
									<span className="text-sm font-bold text-(--text)">{t('admin.dashboard.giveaways.modal.showOnWebLabel')}</span>
									<span className="text-xs text-(--text-muted)">{t('admin.dashboard.giveaways.modal.showOnWebDesc')}</span>
								</div>
								<Toggle checked={showOnWeb} onChange={(e) => setShowOnWeb(e.target.checked)} />
							</div>

							{showOnWeb && (
								<div className="flex flex-col gap-1.5 pt-2 border-t border-(--border)/10">
									<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.targetAppsLabel')}</label>
									<MultiSelector
										toggleClassName="!min-w-0"
										value={targetApps}
										onChange={(vals) => setTargetApps(vals.length > 0 ? vals : ['all'])}
										options={TARGET_APP_OPTIONS}
										searchable={false}
									/>
								</div>
							)}
						</div>
					</div>
				)}

				{/* STEP 3: PRIZE & AUTO-FULFILLMENT */}
				{step === 2 && (
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
							{(
								[
									{ type: 'credits', icon: Coins, label: t('admin.dashboard.giveaways.prizeTypes.credits') },
									{ type: 'store_item', icon: ShoppingBag, label: t('admin.dashboard.giveaways.prizeTypes.store_item') },
									{ type: 'discord_role', icon: Shield, label: t('admin.dashboard.giveaways.prizeTypes.discord_role') },
									{ type: 'custom', icon: Gift, label: t('admin.dashboard.giveaways.prizeTypes.custom') },
								] as const
							).map((opt) => {
								const Icon = opt.icon;
								const active = prize.type === opt.type;
								return (
									<button
										key={opt.type}
										type="button"
										onClick={() => setPrize((prev) => ({ ...prev, type: opt.type }))}
										className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-xs font-bold transition-all cursor-pointer ${
											active
												? 'bg-(--accent) border-(--accent) text-(--accent-contrast) shadow-sm'
												: 'bg-(--foreground)/25 border-(--border)/10 text-(--text-muted) hover:text-(--text) hover:border-(--accent)/30'
										}`}
									>
										<Icon size={18} />
										<span className="truncate max-w-full">{opt.label}</span>
									</button>
								);
							})}
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.prizeLabelField')}</label>
							<Input
								value={prize.label}
								onChange={(e) => setPrize((prev) => ({ ...prev, label: e.target.value }))}
								placeholder={t('admin.dashboard.giveaways.modal.prizeLabelPlaceholder')}
								required
							/>
						</div>

						{prize.type === 'credits' && (
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between gap-2">
									<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.creditAmountLabel')}</label>
									<div className="flex items-center gap-1.5">
										{[500, 1000, 2500, 5000].map((amt) => (
											<button
												key={amt}
												type="button"
												onClick={() =>
													setPrize((prev) => ({
														...prev,
														creditAmount: amt,
														label: `${amt.toLocaleString()} Xernerx Credits`,
													}))
												}
												className="rounded-lg bg-(--foreground)/40 hover:bg-(--accent)/15 border border-(--border)/10 px-2 py-0.5 text-[10px] font-bold text-(--text-muted) hover:text-(--accent) cursor-pointer"
											>
												{amt.toLocaleString()}
											</button>
										))}
									</div>
								</div>
								<Input
									variant="number"
									value={String(prize.creditAmount || 0)}
									onChange={(e) => {
										const amt = Math.max(0, Number(e.target.value) || 0);
										setPrize((prev) => ({
											...prev,
											creditAmount: amt,
											label: !prev.label || prev.label.endsWith('Xernerx Credits') ? `${amt.toLocaleString()} Xernerx Credits` : prev.label,
										}));
									}}
									min={1}
								/>
							</div>
						)}

						{prize.type === 'store_item' && (
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="sm:col-span-2 flex flex-col gap-1.5">
									<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.storeItemLabel')}</label>
									<Selector
										toggleClassName="!min-w-0 h-[46px]"
										value={prize.storeItemId || ''}
										onChange={(val) => {
											const matched = storeItems.find((i) => i.id === val);
											setPrize((prev) => ({
												...prev,
												storeItemId: val,
												durationDays: matched?.durationDays || prev.durationDays || 30,
												label: matched ? matched.name : prev.label,
											}));
										}}
										options={storeItemOptions}
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.durationDaysLabel')}</label>
									<Input
										variant="number"
										value={String(prize.durationDays || 0)}
										onChange={(e) => setPrize((prev) => ({ ...prev, durationDays: Math.max(0, Number(e.target.value) || 0) }))}
										min={0}
									/>
								</div>
							</div>
						)}

						{prize.type === 'discord_role' && (
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.discordRoleRewardLabel')}</label>
								<Selector
									toggleClassName="!min-w-0"
									value={prize.discordRoleId || ''}
									onChange={(val) => {
										const matched = roles.find((r) => r.value === val);
										setPrize((prev) => ({
											...prev,
											discordRoleId: val,
											label: matched ? `${matched.label.replace(/^@/, '')} Role` : prev.label,
										}));
									}}
									options={[{ label: t('admin.dashboard.giveaways.modal.selectDiscordRole'), value: '' }, ...roles]}
								/>
							</div>
						)}

						{prize.type === 'custom' && (
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.customPrizeValueLabel')}</label>
								<Input
									variant="textarea"
									value={prize.customPrizeValue || ''}
									onChange={(e) => setPrize((prev) => ({ ...prev, customPrizeValue: e.target.value }))}
									placeholder={t('admin.dashboard.giveaways.modal.customPrizeValuePlaceholder')}
									rows={3}
								/>
							</div>
						)}
					</div>
				)}

				{/* STEP 4: ENTRY REQUIREMENTS (INCLUDING GLOBAL USER LEVEL) */}
				{step === 3 && <GiveawayRequirementsStep requirements={requirements} setRequirements={setRequirements} roles={roles} badgeAndItemMultiOptions={badgeAndItemMultiOptions} />}

				{/* STEP 5: BONUS ENTRY MULTIPLIERS */}
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
