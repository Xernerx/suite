/** @format */
'use client';

import React, { useState } from 'react';
import { Check, Crown, ExternalLink, Flame, Gem, Hexagon, Layers, Lock, Palette, Sparkles, Stars, Sun, User, Waves, Zap } from 'lucide-react';
import { Badge, Button } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { isCosmeticUnlocked } from './cosmeticUnlocks';

export type AvatarFrameId = 'none' | 'plasma_ring' | 'holo_crown' | 'cyber_hex' | 'solar_flare';
export type NameplateId = 'none' | 'aurora_wave' | 'synth_horizon' | 'nebula_shimmer' | 'cyber_circuit';
export type ProfileCardThemeId = 'default' | 'holographic' | 'celestial' | 'cyber_neon' | 'obsidian_gold';

interface ProfileCosmeticsStudioProps {
	user: any;
	avatarFrame: AvatarFrameId;
	nameplate: NameplateId;
	cardTheme: ProfileCardThemeId;
	onChangeCosmetic: (field: 'avatarFrame' | 'nameplate' | 'cardTheme', value: string) => void;
}

const AVATAR_FRAMES: Array<{ id: AvatarFrameId; icon: any; badgeReq?: string }> = [
	{ id: 'none', icon: Layers },
	{ id: 'plasma_ring', icon: Zap, badgeReq: 'frame_plasma_ring' },
	{ id: 'holo_crown', icon: Crown, badgeReq: 'frame_holo_crown' },
	{ id: 'cyber_hex', icon: Hexagon, badgeReq: 'frame_cyber_hex' },
	{ id: 'solar_flare', icon: Flame, badgeReq: 'frame_solar_flare' },
];

const NAMEPLATES: Array<{ id: NameplateId; icon: any; badgeReq?: string }> = [
	{ id: 'none', icon: Layers },
	{ id: 'aurora_wave', icon: Waves, badgeReq: 'nameplate_aurora_wave' },
	{ id: 'synth_horizon', icon: Sun, badgeReq: 'nameplate_synth_horizon' },
	{ id: 'nebula_shimmer', icon: Stars, badgeReq: 'nameplate_nebula_shimmer' },
	{ id: 'cyber_circuit', icon: Zap, badgeReq: 'nameplate_cyber_circuit' },
];

const CARD_THEMES: Array<{ id: ProfileCardThemeId; icon: any; badgeReq?: string }> = [
	{ id: 'default', icon: Layers },
	{ id: 'holographic', icon: Sparkles, badgeReq: 'nameplate_aurora_wave' },
	{ id: 'celestial', icon: Stars, badgeReq: 'nameplate_synth_horizon' },
	{ id: 'cyber_neon', icon: Zap, badgeReq: 'nameplate_nebula_shimmer' },
	{ id: 'obsidian_gold', icon: Gem, badgeReq: 'nameplate_cyber_circuit' },
];

export function ProfileCosmeticsStudio({ user, avatarFrame, nameplate, cardTheme, onChangeCosmetic }: ProfileCosmeticsStudioProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [previewFrame, setPreviewFrame] = useState<AvatarFrameId | null>(null);
	const [previewNameplate, setPreviewNameplate] = useState<NameplateId | null>(null);
	const [previewCardTheme, setPreviewCardTheme] = useState<ProfileCardThemeId | null>(null);

	const framesUnlocked = isCosmeticUnlocked(user, false, 'profile_frames_pack');
	const nameplatesUnlocked = isCosmeticUnlocked(user, false, 'profile_nameplates_pack');

	const showLockedCosmeticToast = () => {
		toast({
			type: 'info',
			title: t('account.appearance.dotMatrix.lockedToastTitle'),
			description: t('account.profile.cosmeticsStudio.lockedToastDesc'),
			action: {
				label: t('account.appearance.dotMatrix.openCreditStore'),
				onClick: () => {
					window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits');
				},
			},
		});
	};

	const handleSelectFrame = (item: (typeof AVATAR_FRAMES)[number]) => {
		if (!isCosmeticUnlocked(user, false, item.badgeReq)) {
			setPreviewFrame(item.id);
			showLockedCosmeticToast();
			return;
		}
		setPreviewFrame(null);
		onChangeCosmetic('avatarFrame', item.id);
	};

	const handleSelectNameplate = (item: (typeof NAMEPLATES)[number]) => {
		if (!isCosmeticUnlocked(user, false, item.badgeReq)) {
			setPreviewNameplate(item.id);
			showLockedCosmeticToast();
			return;
		}
		setPreviewNameplate(null);
		onChangeCosmetic('nameplate', item.id);
	};

	const handleSelectCardTheme = (item: (typeof CARD_THEMES)[number]) => {
		if (!isCosmeticUnlocked(user, false, item.badgeReq)) {
			setPreviewCardTheme(item.id);
			showLockedCosmeticToast();
			return;
		}
		setPreviewCardTheme(null);
		onChangeCosmetic('cardTheme', item.id);
	};

	const activeFrame = previewFrame || avatarFrame;
	const activeNameplate = previewNameplate || nameplate;
	const activeCardTheme = previewCardTheme || cardTheme;
	const hasLockedPreview = Boolean(previewFrame || previewNameplate || previewCardTheme);

	const avatarUrl = user?.avatar
		? user.avatar.startsWith('http')
			? user.avatar
			: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
		: '';

	return (
		<div className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4 sm:p-5 gap-4">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 flex-wrap">
						<Palette size={17} className="text-(--accent)" />
						<h4 className="text-base font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('account.profile.cosmeticsStudio.title')}
						</h4>
						<Badge variant="accent" size="sm">
							{t('account.profile.cosmeticsStudio.badge')}
						</Badge>
					</div>
					<p className="text-xs text-(--text-muted)">{t('account.profile.cosmeticsStudio.subtitle')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2 shrink-0">
					{(!framesUnlocked || !nameplatesUnlocked) && (
						<Button size="sm" variant="secondary" onClick={() => (window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits'))} className="flex items-center gap-1.5">
							<ExternalLink size={13} className="text-(--accent)" />
							{t('account.profile.cosmeticsStudio.unlockInStore')}
						</Button>
					)}
				</div>
			</div>

			{/* Live Interactive Profile Identity Card Preview */}
			<div
				className={`relative flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-(--border)/15 bg-(--foreground)/35 p-4 transition-all ${
					activeCardTheme !== 'default' ? `xrx-profile-card-${activeCardTheme}` : ''
				}`}
			>
				<div className="flex items-center gap-3.5 min-w-0">
					<div className={`relative h-14 w-14 rounded-full shrink-0 ${activeFrame !== 'none' ? `xrx-avatar-frame-${activeFrame}` : ''}`}>
						{avatarUrl ? (
							<img src={avatarUrl} alt={user?.username || 'Avatar'} className="h-full w-full rounded-full object-cover border border-(--border)/20" />
						) : (
							<div className="flex h-full w-full items-center justify-center rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
								<User size={22} />
							</div>
						)}
					</div>
					<div className="flex flex-col gap-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<span className={activeNameplate !== 'none' ? `xrx-nameplate-${activeNameplate}` : 'text-base font-extrabold text-(--text)'}>
								{user?.displayName || user?.globalName || user?.username || 'Xernerx Member'}
							</span>
							{hasLockedPreview && (
								<span className="inline-flex items-center gap-1 rounded-full bg-(--background)/80 border border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--accent)">
									<Lock size={10} />
									{t('account.profile.cosmeticsStudio.previewOnly')}
								</span>
							)}
						</div>
						<span className="text-xs text-(--text-muted) truncate">@{user?.username || 'username'}</span>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-1.5 text-[11px] text-(--text-muted)">
					<span className="px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 font-semibold">{t(`account.profile.cosmeticsStudio.frames.${activeFrame}`)}</span>
					<span className="px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 font-semibold">
						{t(`account.profile.cosmeticsStudio.nameplates.${activeNameplate}`)}
					</span>
					<span className="px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 font-semibold">
						{t(`account.profile.cosmeticsStudio.cardThemes.${activeCardTheme}`)}
					</span>
				</div>
			</div>

			{/* 3 Cosmetic Category Pickers */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{/* 1. Avatar Frame Shaders */}
				<div className="flex flex-col gap-2 rounded-2xl border border-(--border)/10 bg-(--foreground)/25 p-3.5">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold text-(--text)">{t('account.profile.cosmeticsStudio.framesHeading')}</span>
						{!framesUnlocked && <Lock size={12} className="text-(--accent)" />}
					</div>
					<div className="grid grid-cols-1 gap-1.5">
						{AVATAR_FRAMES.map((item) => {
							const Icon = item.icon;
							const unlocked = isCosmeticUnlocked(user, false, item.badgeReq);
							const active = avatarFrame === item.id && !previewFrame;
							const previewed = previewFrame === item.id;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => handleSelectFrame(item)}
									className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
										active
											? 'bg-(--accent)/15 border-(--accent) text-(--text)'
											: previewed
												? 'bg-(--accent)/10 border-(--accent)/50 text-(--text)'
												: 'bg-(--background)/50 border-(--border)/10 text-(--text-muted) hover:border-(--accent)/35 hover:text-(--text)'
									}`}
								>
									<div className="flex items-center gap-2.5">
										<span
											className={`flex h-6 w-6 items-center justify-center rounded-full bg-(--foreground)/60 text-(--accent) ${
												item.id !== 'none' ? `xrx-avatar-frame-${item.id}` : ''
											}`}
										>
											<Icon size={12} />
										</span>
										<span className="text-xs font-bold">{t(`account.profile.cosmeticsStudio.frames.${item.id}`)}</span>
									</div>
									{active ? <Check size={13} className="text-(--accent)" /> : !unlocked ? <Lock size={11} className="text-(--accent)/75" /> : null}
								</button>
							);
						})}
					</div>
				</div>

				{/* 2. Animated Nameplates */}
				<div className="flex flex-col gap-2 rounded-2xl border border-(--border)/10 bg-(--foreground)/25 p-3.5">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold text-(--text)">{t('account.profile.cosmeticsStudio.nameplatesHeading')}</span>
						{!nameplatesUnlocked && <Lock size={12} className="text-(--accent)" />}
					</div>
					<div className="grid grid-cols-1 gap-1.5">
						{NAMEPLATES.map((item) => {
							const Icon = item.icon;
							const unlocked = isCosmeticUnlocked(user, false, item.badgeReq);
							const active = nameplate === item.id && !previewNameplate;
							const previewed = previewNameplate === item.id;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => handleSelectNameplate(item)}
									className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
										active
											? 'bg-(--accent)/15 border-(--accent) text-(--text)'
											: previewed
												? 'bg-(--accent)/10 border-(--accent)/50 text-(--text)'
												: 'bg-(--background)/50 border-(--border)/10 text-(--text-muted) hover:border-(--accent)/35 hover:text-(--text)'
									}`}
								>
									<div className="flex items-center gap-2 min-w-0">
										<Icon size={13} className="text-(--accent) shrink-0" />
										<span className={item.id !== 'none' ? `xrx-nameplate-${item.id} !text-[11px] !py-0.5 !px-2 truncate` : 'text-xs font-bold truncate'}>
											{t(`account.profile.cosmeticsStudio.nameplates.${item.id}`)}
										</span>
									</div>
									{active ? <Check size={13} className="text-(--accent) shrink-0" /> : !unlocked ? <Lock size={11} className="text-(--accent)/75 shrink-0" /> : null}
								</button>
							);
						})}
					</div>
				</div>

				{/* 3. Profile Card Themes */}
				<div className="flex flex-col gap-2 rounded-2xl border border-(--border)/10 bg-(--foreground)/25 p-3.5">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold text-(--text)">{t('account.profile.cosmeticsStudio.cardThemesHeading')}</span>
						{!nameplatesUnlocked && <Lock size={12} className="text-(--accent)" />}
					</div>
					<div className="grid grid-cols-1 gap-1.5">
						{CARD_THEMES.map((item) => {
							const Icon = item.icon;
							const unlocked = isCosmeticUnlocked(user, false, item.badgeReq);
							const active = cardTheme === item.id && !previewCardTheme;
							const previewed = previewCardTheme === item.id;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => handleSelectCardTheme(item)}
									className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
										item.id !== 'default' ? `xrx-profile-card-${item.id}` : ''
									} ${
										active
											? 'bg-(--accent)/15 border-(--accent) text-(--text) ring-1 ring-(--accent)'
											: previewed
												? 'bg-(--accent)/10 border-(--accent)/50 text-(--text)'
												: 'bg-(--background)/50 border-(--border)/10 text-(--text-muted) hover:border-(--accent)/35 hover:text-(--text)'
									}`}
								>
									<div className="flex items-center gap-2.5">
										<Icon size={13} className="text-(--accent)" />
										<span className="text-xs font-bold">{t(`account.profile.cosmeticsStudio.cardThemes.${item.id}`)}</span>
									</div>
									{active ? <Check size={13} className="text-(--accent)" /> : !unlocked ? <Lock size={11} className="text-(--accent)/75" /> : null}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
