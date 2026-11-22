/** @format */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Coins, Copy, ExternalLink, Flame, Gamepad2, Gift, Layers, Monitor, Pencil, Plus, QrCode, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { XernerxDotLogo } from '@xernerx/feedback';
import { useDictionary } from '@xernerx/providers';
import { Button, Toggle } from '@xernerx/ui';

export interface PreviewSidebarUserData {
	userId: string;
	displayName: string;
	handle: string;
	initial: string;
	avatarUrl: string | null;
	bannerUrl: string | null;
	bannerColor: string | null;
	decorationUrl: string | null;
	nameplateUrl: string | null;
	nameplateGradient: string;
	customNameplate: string;
	customAvatarFrame: string;
	customCardTheme: string;
	hasDotMatrixBanner: boolean;
	dotMatrixVariant: string;
	clanTag: string | null;
	clanBadgeUrl: string | null;
	currentLevel: number;
	currentLevelXp: number;
	xpRequired: number;
	levelProgress: number;
	creditsBalance: number;
	streakDays: number;
	unreadCount: number;
	hasAdminAccess: boolean;
	hasActiveSub: boolean;
	staffSubscription: boolean;
}

interface DesktopPreviewUserPopoverProps {
	sidebarCollapsed: boolean;
	isRightAligned: boolean;
	placement?: 'top' | 'bottom';
	activeAccount: 'main' | 'alt';
	onSwitchAccount: () => void;
	rpcEnabled: boolean;
	setRpcEnabled: (val: boolean) => void;
	claimed: boolean;
	setClaimed: (fn: boolean | ((prev: boolean) => boolean)) => void;
	setOverlayOpen: (fn: boolean | ((prev: boolean) => boolean)) => void;
	onClose: () => void;
	userData: PreviewSidebarUserData;
}

export function DesktopPreviewUserPopover({
	sidebarCollapsed,
	isRightAligned,
	placement = 'bottom',
	activeAccount,
	onSwitchAccount,
	rpcEnabled,
	setRpcEnabled,
	claimed,
	setClaimed,
	setOverlayOpen,
	onClose,
	userData,
}: DesktopPreviewUserPopoverProps) {
	const { t } = useDictionary();
	const [avatarFailed, setAvatarFailed] = useState(false);
	const [bannerFailed, setBannerFailed] = useState(false);
	const [decorationFailed, setDecorationFailed] = useState(false);
	const [clanBadgeFailed, setClanBadgeFailed] = useState(false);
	const [copiedUserId, setCopiedUserId] = useState(false);

	useEffect(() => {
		setAvatarFailed(false);
		setBannerFailed(false);
		setDecorationFailed(false);
		setClanBadgeFailed(false);
	}, [userData.avatarUrl, userData.bannerUrl, userData.decorationUrl, userData.clanBadgeUrl]);

	const isMainSlot = activeAccount === 'main';
	const currentName = isMainSlot ? userData.displayName : 'CozyAlt';
	const currentHandle = isMainSlot ? userData.handle : '@cozyalt';
	const otherSlotLabel = isMainSlot ? 'CozyAlt (@cozyalt)' : `${userData.displayName} (${userData.handle})`;

	const showRealAvatar = Boolean(isMainSlot && userData.avatarUrl && !avatarFailed);
	const showDecoration = Boolean(isMainSlot && userData.decorationUrl && !decorationFailed);
	const activeCustomNameplate = isMainSlot ? userData.customNameplate : 'none';
	const activeCustomFrame = isMainSlot ? userData.customAvatarFrame : 'none';
	const shownStreak = claimed ? userData.streakDays + 1 : userData.streakDays;

	const handleCopyUserId = () => {
		navigator.clipboard?.writeText?.(userData.userId).catch(() => {});
		setCopiedUserId(true);
		setTimeout(() => setCopiedUserId(false), 1600);
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.94, y: placement === 'top' ? -8 : 8 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.94, y: placement === 'top' ? -8 : 8 }}
			transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
			className={`bg-(--foreground)/85 backdrop-blur-xl z-50 flex flex-col rounded-[24px] shadow-2xl text-left border border-(--border)/15 absolute ${
				isMainSlot && userData.customCardTheme !== 'default' ? `xrx-profile-card-${userData.customCardTheme}` : ''
			} ${
				placement === 'top'
					? `top-full mt-2 w-[280px] ${isRightAligned ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`
					: `bottom-full mb-3 ${sidebarCollapsed ? (isRightAligned ? 'right-0 w-[276px] origin-bottom-right' : 'left-0 w-[276px] origin-bottom-left') : 'left-0 right-0 origin-bottom'}`
			}`}
		>
			{/* Profile Banner */}
			<div
				className={`h-[76px] w-full relative overflow-hidden rounded-t-[24px] ${
					activeCustomNameplate !== 'none'
						? `xrx-nameplate-${activeCustomNameplate}`
						: !isMainSlot || (!userData.bannerColor && (!userData.bannerUrl || bannerFailed))
							? 'bg-gradient-to-br from-(--accent)/30 via-(--foreground) to-(--background)'
							: ''
				}`}
				style={activeCustomNameplate === 'none' && isMainSlot && userData.bannerColor ? { backgroundColor: userData.bannerColor } : undefined}
			>
				{isMainSlot && userData.bannerUrl && !bannerFailed && activeCustomNameplate === 'none' && (
					<img
						src={userData.bannerUrl}
						alt={`${currentName} profile banner`}
						onError={() => setBannerFailed(true)}
						className="absolute inset-0 w-full h-full object-cover object-center"
						draggable={false}
					/>
				)}
				{isMainSlot && userData.hasDotMatrixBanner && (
					<div className="absolute inset-0 opacity-70 pointer-events-none">
						<XernerxDotLogo variant={userData.dotMatrixVariant as any} width={276} height={76} ripple={false} vivid />
					</div>
				)}
				<div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
					<span className="h-6 w-6 rounded-full bg-(--background)/65 backdrop-blur-md border border-(--border)/15 text-(--text) flex items-center justify-center shadow-sm">
						<QrCode size={12} />
					</span>
					<span className="h-6 w-6 rounded-full bg-(--background)/65 backdrop-blur-md border border-(--border)/15 text-(--text) flex items-center justify-center shadow-sm">
						<Pencil size={12} />
					</span>
				</div>
			</div>

			{/* Popover Body */}
			<div className="relative flex flex-col p-3 gap-2">
				<div className="flex justify-between items-start gap-2">
					<div
						className={`bg-(--foreground) border-(--foreground) relative -mt-[34px] rounded-full border-[5px] shrink-0 ${
							activeCustomFrame !== 'none' ? `xrx-avatar-frame-${activeCustomFrame}` : ''
						}`}
					>
						{showRealAvatar ? (
							<div className="relative h-14 w-14">
								<img
									src={userData.avatarUrl!}
									alt={`${currentName} profile avatar`}
									onError={() => setAvatarFailed(true)}
									className="h-full w-full rounded-full object-cover"
									draggable={false}
								/>
								{showDecoration && (
									<img
										src={userData.decorationUrl!}
										alt={`${currentName} avatar decoration`}
										onError={() => setDecorationFailed(true)}
										className="absolute -inset-[15%] w-[130%] h-[130%] max-w-none scale-[1.12] z-10 pointer-events-none"
										draggable={false}
									/>
								)}
							</div>
						) : (
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--accent) text-lg font-black text-(--accent-contrast)">
								{isMainSlot ? userData.initial : 'C'}
							</div>
						)}
						<Monitor className="text-(--accent-green) absolute bottom-0 right-0 h-[18px] w-[18px] border-(--foreground) border-[3px] rounded-full bg-(--foreground)" />
					</div>

					{isMainSlot && (userData.hasAdminAccess || userData.hasActiveSub) && (
						<span className="flex items-center gap-1 bg-(--accent)/15 text-(--accent) text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-(--accent)/30 mt-0.5">
							<ShieldCheck size={11} />
							<span>{userData.staffSubscription ? t('components.cards.sidebaruser.staffBadge') : t('components.cards.sidebaruser.proBadge')}</span>
						</span>
					)}
				</div>

				{/* Name + Copy ID */}
				<div className="flex flex-col gap-0.5 min-w-0">
					<div className="flex items-center gap-1.5 min-w-0">
						<span className="text-base font-black text-(--text) truncate">{currentName}</span>
						<ExternalLink size={12} className="text-(--text-muted) shrink-0" />
					</div>
					<div className="flex items-center gap-1.5 min-w-0 flex-wrap">
						<span className="text-xs text-(--text-muted) font-medium truncate">{currentHandle}</span>
						<button
							type="button"
							onClick={handleCopyUserId}
							className="inline-flex items-center gap-1 rounded-full bg-(--background)/60 hover:bg-(--accent)/15 border border-(--border)/10 px-2 py-0.5 text-[10px] font-mono text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
						>
							{copiedUserId ? <Check size={9} className="text-(--accent-green)" /> : <Copy size={9} />}
							<span>{userData.userId.slice(0, 10)}…</span>
						</button>
						{isMainSlot && userData.clanTag && (
							<span className="inline-flex items-center gap-1 rounded-lg bg-(--background)/60 border border-(--border)/10 px-1.5 py-0.5 text-[10px] font-extrabold text-(--text)">
								{userData.clanBadgeUrl && !clanBadgeFailed ? (
									<img src={userData.clanBadgeUrl} alt={`${userData.clanTag} guild badge`} onError={() => setClanBadgeFailed(true)} className="h-3 w-3 object-contain" />
								) : (
									<Zap size={9} className="text-(--accent-orange)" />
								)}
								{userData.clanTag}
							</span>
						)}
						{shownStreak > 0 && (
							<span className="inline-flex items-center gap-0.5 text-(--accent-orange) text-[10px] font-extrabold bg-(--accent-orange)/10 px-1.5 py-0.5 rounded-lg border border-(--accent-orange)/20">
								<Flame size={10} className="fill-(--accent-orange)" />
								{shownStreak}
							</span>
						)}
					</div>
				</div>

				{/* Level & Credits Compact Stack */}
				<div className="flex flex-col gap-1 bg-(--background)/50 px-2.5 py-1.5 rounded-xl border border-(--border)/10">
					<div className="flex items-center justify-between text-[11px]">
						<span className="inline-flex items-center gap-1 font-extrabold text-(--accent)">
							<Sparkles size={11} />
							{t('components.cards.sidebaruser.level')} {userData.currentLevel}
						</span>
						<span className="text-[10px] text-(--text-muted) font-mono">
							{userData.currentLevelXp} / {userData.xpRequired} XP
						</span>
					</div>
					<div className="w-full h-1.5 bg-(--border)/15 rounded-full overflow-hidden">
						<div className="h-full bg-(--accent) rounded-full" style={{ width: `${userData.levelProgress}%` }} />
					</div>
				</div>

				<div className="flex items-center justify-between bg-(--background)/50 px-2.5 py-1.5 rounded-xl border border-(--border)/10 text-xs">
					<span className="text-(--text-muted) font-medium">{t('components.cards.sidebaruser.text1')}</span>
					<span className="inline-flex items-center gap-1 text-(--accent-green) font-extrabold">
						<Coins size={13} />
						{(claimed ? userData.creditsBalance + 150 : userData.creditsBalance).toLocaleString()}
					</span>
				</div>

				{/* Daily Gift Button */}
				<button
					type="button"
					onClick={() => setClaimed((v) => !v)}
					className={`w-full flex items-center justify-between text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
						!claimed ? 'bg-(--accent) text-(--accent-contrast) shadow-sm justify-center gap-2' : 'bg-(--background)/50 text-(--text-muted) border border-(--border)/10'
					}`}
				>
					{!claimed ? (
						<>
							<Gift size={14} />
							<span>{t('components.cards.sidebaruser.claimGift')}</span>
						</>
					) : (
						<>
							<span className="inline-flex items-center gap-1.5">
								<Gift size={13} className="opacity-60" />
								{t('components.cards.sidebaruser.text2')}
							</span>
							<span className="font-mono text-[11px] font-bold text-(--text)">23:59:42</span>
						</>
					)}
				</button>

				{/* Literal SidebarUserDesktopSection (Overlay + Discord RPC + 1-Click Account Switcher) */}
				<div className="flex flex-col gap-1.5 pt-1 border-t border-(--border)/10">
					<Button
						size="sm"
						variant="secondary"
						onClick={() => {
							setOverlayOpen((v) => !v);
							onClose();
						}}
						className="w-full justify-center gap-2"
					>
						<Layers size={14} className="text-(--accent)" />
						<span className="truncate">{t('components.cards.sidebaruser.launchOverlay')}</span>
					</Button>

					<div className="flex items-center justify-between rounded-xl border border-(--border)/10 bg-(--background)/50 px-2.5 py-1.5">
						<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--text)">
							<Gamepad2 size={13} className="text-(--accent)" />
							{t('account.preferences.desktopItems.discordRpc.title')}
						</span>
						<Toggle checked={rpcEnabled} onChange={(val) => setRpcEnabled(typeof val === 'boolean' ? val : val.target.checked)} />
					</div>

					<div className="flex flex-col rounded-xl border border-(--border)/10 bg-(--background)/50 p-2 gap-1.5">
						<div className="flex items-center justify-between px-0.5">
							<span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">
								<Users size={11} className="text-(--accent)" />
								{t('components.cards.sidebaruser.switchAccount')}
							</span>
							<span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-(--accent)">
								<Plus size={10} />
								{t('components.cards.sidebaruser.addAccount')}
							</span>
						</div>
						<button
							type="button"
							onClick={onSwitchAccount}
							className="flex items-center justify-between rounded-xl bg-(--foreground)/60 hover:bg-(--foreground) border border-(--border)/10 px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
						>
							<span className="font-semibold text-(--text) truncate">{otherSlotLabel}</span>
							<span className="text-[10px] font-bold text-(--accent) shrink-0 ml-2">{t('account.preferences.desktop.switchAccountButton')}</span>
						</button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
