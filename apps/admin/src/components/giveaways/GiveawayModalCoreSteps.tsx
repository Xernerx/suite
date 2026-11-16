/** @format */
'use client';

import React from 'react';
import { Coins, Gift, Shield, ShoppingBag } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Input, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import type { GiveawayPrize, SelectOption } from './types';

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

interface GiveawayDetailsStepProps {
	title: string;
	setTitle: (v: string) => void;
	winnerCount: number;
	setWinnerCount: (v: number) => void;
	startsAt: string;
	setStartsAt: (v: string) => void;
	endsAt: string;
	setEndsAt: (v: string) => void;
	applyDurationPreset: (hours: number) => void;
	description: string;
	setDescription: (v: string) => void;
	bannerUrl: string;
	setBannerUrl: (v: string) => void;
}

export function GiveawayDetailsStep({
	title,
	setTitle,
	winnerCount,
	setWinnerCount,
	startsAt,
	setStartsAt,
	endsAt,
	setEndsAt,
	applyDurationPreset,
	description,
	setDescription,
	bannerUrl,
	setBannerUrl,
}: GiveawayDetailsStepProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
				<div className="sm:col-span-3 flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.titleLabel')}</label>
					<Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('admin.dashboard.giveaways.modal.titlePlaceholder')} required />
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.winnerCountLabel')}</label>
					<Input variant="number" value={String(winnerCount)} onChange={(e) => setWinnerCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} min={1} max={100} required />
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
				<Input variant="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('admin.dashboard.giveaways.modal.descriptionPlaceholder')} rows={2} />
			</div>

			<div className="flex flex-col gap-1.5">
				<label className="text-xs font-semibold text-(--text-muted)">{t('admin.dashboard.giveaways.modal.bannerUrlLabel')}</label>
				<Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://cdn.xernerx.com/..." />
			</div>
		</div>
	);
}

interface GiveawayChannelsStepProps {
	channelId: string;
	setChannelId: (v: string) => void;
	channels: SelectOption[];
	pingRoleId: string;
	setPingRoleId: (v: string) => void;
	pingRoleOptions: SelectOption[];
	showOnWeb: boolean;
	setShowOnWeb: (v: boolean) => void;
	targetApps: string[];
	setTargetApps: (v: string[]) => void;
}

export function GiveawayChannelsStep({ channelId, setChannelId, channels, pingRoleId, setPingRoleId, pingRoleOptions, showOnWeb, setShowOnWeb, targetApps, setTargetApps }: GiveawayChannelsStepProps) {
	const { t } = useDictionary();

	return (
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
	);
}

interface GiveawayPrizeStepProps {
	prize: GiveawayPrize;
	setPrize: React.Dispatch<React.SetStateAction<GiveawayPrize>>;
	storeItems: Array<{ id: string; name: string; itemType?: string; creditAmount?: number; durationDays?: number }>;
	storeItemOptions: SelectOption[];
	roles: SelectOption[];
}

export function GiveawayPrizeStep({ prize, setPrize, storeItems, storeItemOptions, roles }: GiveawayPrizeStepProps) {
	const { t } = useDictionary();

	return (
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
	);
}
