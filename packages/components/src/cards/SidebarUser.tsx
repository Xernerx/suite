/** @format */
'use client';

import { Coins, Copy, ExternalLink, Flame, Gift, Layers, Monitor, Pencil, Plus, QrCode, ShieldAlert, ShieldCheck, Smartphone, Sparkles, Tablet, UserIcon, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, usePlatform, useTheme, useUser, useToast } from '@xernerx/providers';

import { Button } from '@xernerx/ui';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useWindowControlsStyle } from '../HeaderWindowControls';

interface Role {
	id: string;
	name?: string;
	role?: string;
	permissions?: any;
}

const deviceIcons = {
	desktop: Monitor,
	mobile: Smartphone,
	tablet: Tablet,
} as const;

export default function SidebarUserCard({
	activeUser,
	isCollapsed = false,
	placement = 'bottom',
	onClose,
}: {
	activeUser: any;
	isCollapsed?: boolean;
	placement?: 'top' | 'bottom';
	onClose?: () => void;
}) {
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const { device, type } = usePlatform();
	const { preferences } = useTheme();
	const { isRightAligned } = useWindowControlsStyle();
	const { mutate } = useUser();
	const { toast } = useToast();
	const [roles, setRoles] = useState<Role[]>([]);
	const [claiming, setClaiming] = useState(false);
	const [timeLeft, setTimeLeft] = useState<string>('');
	const [desktopAccounts, setDesktopAccounts] = useState<{ activeSlot: string; accounts: any[] } | null>(null);

	const isApplication = type === 'application';

	useEffect(() => {
		if (!isApplication || typeof window === 'undefined') return;
		const bridge = (window as any).electron;
		bridge
			?.getAccounts?.()
			?.then?.((state: any) => {
				if (state && Array.isArray(state.accounts)) {
					const unique = Array.from(new Map(state.accounts.map((a: any) => [a.slot, a])).values());
					setDesktopAccounts({ activeSlot: state.activeSlot || 'default', accounts: unique });
				}
			})
			?.catch?.(() => {});
	}, [isApplication]);

	// Fetch system roles to resolve role names and admin access permissions from IDs
	useEffect(() => {
		fetch(getEnvUrl('https://api.xernerx.com/secure/core'), { credentials: 'include', cache: 'no-store' })
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => setRoles(data))
			.catch(() => {});
	}, [getEnvUrl]);

	// Live countdown timer logic
	const giftInTime = activeUser?.credits?.giftIn ? new Date(activeUser.credits.giftIn).getTime() : 0;

	useEffect(() => {
		const updateCountdown = () => {
			const now = Date.now();
			const difference = giftInTime - now;

			if (difference <= 0) {
				setTimeLeft('00:00:00');
				return;
			}

			const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((difference % (1000 * 60)) / 1000);

			const formatted = [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');

			setTimeLeft(formatted);
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	}, [giftInTime]);

	// 1. Dynamically resolve Discord CDN URLs based on the real payload
	const bannerUrl = activeUser?.banner ? `https://cdn.discordapp.com/banners/${activeUser.id}/${activeUser.banner}.${activeUser.banner.startsWith('a_') ? 'gif' : 'png'}?size=600` : null;
	const avatarUrl = activeUser?.avatar
		? `https://cdn.discordapp.com/avatars/${activeUser.id}/${activeUser.avatar}.${activeUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
		: activeUser?.image;

	// 2. Resolve Avatar Decoration
	const decorationUrl =
		preferences.showDiscordCollectibles && activeUser?.avatar_decoration_data?.asset ? `https://cdn.discordapp.com/avatar-decoration-presets/${activeUser.avatar_decoration_data.asset}.png` : null;

	// 3. Resolve Clan Badge
	const clanBadgeUrl =
		preferences.showDiscordCollectibles && activeUser?.clan?.badge && activeUser?.clan?.identity_guild_id
			? `https://cdn.discordapp.com/clan-badges/${activeUser.clan.identity_guild_id}/${activeUser.clan.badge}.png`
			: null;

	const copyUserId = () => {
		if (activeUser?.id) {
			navigator.clipboard.writeText(activeUser.id);
			toast({ type: 'success', title: t('components.cards.sidebaruser.userIdCopied'), description: String(activeUser.id) });
		}
	};

	const handleClaimDaily = async () => {
		setClaiming(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/${activeUser.id}/gift`), {
				method: 'POST',
				credentials: 'include',
			});
			if (res.ok) {
				const data = await res.json().catch(() => ({}));
				if (!preferences.reducedMotion) {
					confetti({
						particleCount: 100,
						angle: 270,
						spread: 180,
						origin: { x: 0.5, y: 0 },
					});
				}
				await mutate();
				toast({
					type: 'success',
					title: t('account.billing.credits.claimSuccess', {
						amount: data.rewardEarned || data.reward || 50,
						streak: data.streak || 1,
					}),
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('components.cards.sidebaruser.giftFailedTitle'));
			}
		} catch (err: any) {
			console.error('Failed to claim daily reward:', err);
			toast({ type: 'error', title: t('components.cards.sidebaruser.giftFailedTitle'), description: err.message });
		} finally {
			setClaiming(false);
		}
	};

	const DeviceIcon = deviceIcons[device?.toLowerCase() as keyof typeof deviceIcons];
	const iconStyles = 'text-(--accent-green) absolute bottom-0 right-0 h-[22px] w-[22px] border-(--foreground) border-[4px] rounded-full bg-(--foreground)/30 backdrop-blur-md';

	const hasActiveSub = activeUser?.staffSubscription || (Array.isArray(activeUser?.subscriptions) && activeUser.subscriptions.some((s: any) => s.status === 'active'));
	const userRoleIds = Array.isArray(activeUser?.roles) ? activeUser.roles : [];
	const activeRoles = roles.filter((r) => userRoleIds.includes(r.id));

	// Check if any of the user's roles grant admin dashboard access (permissions.access === true)
	const hasAdminAccess = activeRoles.some((r) => r.permissions?.access === true);

	const now = Date.now();
	const isReadyToClaim = now >= giftInTime;
	const currentStreak = activeUser?.credits?.streak ?? 0;
	const currentLevel = activeUser?.level?.level ?? activeUser?.levels?.[0]?.level ?? 1;
	const totalXp = activeUser?.level?.xp ?? activeUser?.levels?.[0]?.xp ?? 0;
	const xpRequired = currentLevel * 100;
	const currentLevelXp = totalXp % xpRequired;
	const levelProgress = Math.min(100, Math.max(totalXp > 0 ? 3 : 0, Math.round((currentLevelXp / xpRequired) * 100)));

	return (
		<motion.div
			initial={{ opacity: 0, y: placement === 'top' ? -8 : 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: placement === 'top' ? -8 : 8 }}
			transition={{ duration: 0.15, ease: 'easeOut' }}
			className={`bg-(--foreground)/30 backdrop-blur-md z-50 flex flex-col rounded-[24px] shadow-2xl overflow-hidden text-left border border-(--border)/10
				${
					placement === 'top'
						? `absolute top-full mt-2 ${isRightAligned ? 'left-0 origin-top-left' : 'right-0 origin-top-right'} w-80 max-w-[calc(100vw-2rem)]`
						: `absolute bottom-full mb-3 ${isCollapsed ? (isRightAligned ? 'right-1 w-56 origin-bottom-right' : 'left-1 w-56 origin-bottom-left') : 'left-0 right-0 origin-bottom'}`
				}
            `}
			style={{ fontSize: 'var(--text-scale, 14px)' }}
		>
			{/* Banner Area */}
			<div className="h-[120px] w-full relative overflow-hidden" style={{ backgroundColor: activeUser?.banner_color || 'var(--foreground)' }}>
				{bannerUrl && <Image src={bannerUrl} alt={t('components.cards.sidebaruser.alt1')} fill className="object-cover" unoptimized draggable={false} />}

				{/* Subtle Top-Right Action Icons (QR Pairing + Edit Profile) */}
				<div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
					<Link
						href={getEnvUrl('https://account.xernerx.com/?tab=devices')}
						onClick={onClose}
						aria-label={t('account.signin.openApprovePage')}
						title={t('account.signin.openApprovePage')}
						className="h-7 w-7 rounded-full bg-(--background)/65 hover:bg-(--accent) backdrop-blur-md border border-(--border)/15 hover:border-(--accent) text-(--text) flex items-center justify-center transition-all shadow-sm"
					>
						<QrCode size={13} />
					</Link>
					<Link
						href={getEnvUrl('https://account.xernerx.com')}
						onClick={onClose}
						aria-label={t('components.cards.sidebaruser.text3')}
						title={t('components.cards.sidebaruser.text3')}
						className="h-7 w-7 rounded-full bg-(--background)/65 hover:bg-(--accent) backdrop-blur-md border border-(--border)/15 hover:border-(--accent) text-(--text) flex items-center justify-center transition-all shadow-sm"
					>
						<Pencil size={13} />
					</Link>
				</div>
			</div>

			{/* Profile Content */}
			<div className="relative flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
				{/* Avatar & Clickable Admin / Subscription Badge */}
				<div className="flex justify-between items-start gap-2">
					<div className="bg-(--foreground)/30 backdrop-blur-md border-(--foreground) relative -mt-[42px] rounded-full border-[6px] shrink-0">
						{avatarUrl ? (
							<div className="relative h-[80px] w-[80px]">
								<Image src={avatarUrl} alt={t('components.cards.sidebaruser.alt2')} fill className="rounded-full object-cover" unoptimized draggable={false} />
								{decorationUrl && (
									<Image
										src={decorationUrl}
										alt={t('components.cards.sidebaruser.alt3')}
										fill
										className="absolute -inset-[15%] max-w-[130%] max-h-[130%] scale-[1.15] z-10"
										unoptimized
										draggable={false}
									/>
								)}
							</div>
						) : (
							<div className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-(--foreground)/30 backdrop-blur-md">
								<UserIcon size={40} className="text-(--text)" />
							</div>
						)}
						{DeviceIcon ? <DeviceIcon className={iconStyles} /> : <div className={`${iconStyles} border-[4px] rounded-full`} />}
					</div>

					<div className="flex flex-wrap items-center justify-end gap-1.5 mt-1">
						{hasAdminAccess ? (
							<Link
								href={getEnvUrl('https://admin.xernerx.com')}
								onClick={onClose}
								title={t('components.cards.sidebaruser.text4')}
								className="flex items-center gap-1 bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-(--text) text-[10px] font-bold px-2.5 py-1 rounded-full border border-(--accent)/30 transition-all cursor-pointer shadow-xs"
							>
								<ShieldCheck size={12} />
								<span>{activeUser?.staffSubscription ? t('components.cards.sidebaruser.staffBadge') : t('components.cards.sidebaruser.text4')}</span>
							</Link>
						) : (
							hasActiveSub && (
								<div className="flex items-center gap-1 bg-(--accent)/10 text-(--accent) text-[10px] font-bold px-2.5 py-1 rounded-full border border-(--accent)/20">
									<ShieldCheck size={12} />
									<span>{activeUser?.staffSubscription ? t('components.cards.sidebaruser.staffBadge') : t('components.cards.sidebaruser.proBadge')}</span>
								</div>
							)
						)}
					</div>
				</div>

				{/* Name + Public Profile Link & @username + Copy User ID */}
				<div className="overflow-hidden flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
					<div className="flex items-center gap-1.5 min-w-0">
						<h2 className="text-[20px] font-black text-(--text) tracking-wide drop-shadow-sm truncate">{activeUser?.global_name || activeUser?.name}</h2>
						{activeUser?.id && (
							<Link
								href={getEnvUrl(`https://app.xernerx.com/users/${activeUser.id}`)}
								onClick={onClose}
								aria-label={t('components.cards.sidebaruser.viewPublicProfile')}
								title={t('components.cards.sidebaruser.viewPublicProfile')}
								className="p-1 rounded-full text-(--text-muted) hover:text-(--accent) hover:bg-(--accent)/10 transition-colors shrink-0"
							>
								<ExternalLink size={14} />
							</Link>
						)}
					</div>
					<div className="flex items-center gap-2 min-w-0">
						<p className="text-xs text-(--text-muted) font-medium truncate">@{activeUser?.username || activeUser?.name?.toLowerCase().replace(/\s/g, '')}</p>
						{activeUser?.id && (
							<button
								type="button"
								onClick={copyUserId}
								title={t('components.cards.sidebaruser.text5')}
								className="inline-flex items-center gap-1 rounded-full bg-(--foreground)/40 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/30 px-2 py-0.5 text-[10px] font-mono text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer shrink-0"
							>
								<Copy size={10} />
								<span>{activeUser.id}</span>
							</button>
						)}
					</div>
				</div>

				{/* Discord Badges / Clan Tag & Streak Badge Row */}
				{(activeUser?.clan?.tag || clanBadgeUrl || currentStreak > 0 || (Array.isArray(activeUser?.credits?.activeBadges) && activeUser.credits.activeBadges.length > 0)) && (
					<div className="flex flex-wrap items-center gap-1.5">
						{activeUser?.clan?.tag && (
							<div className="bg-(--foreground)/30 backdrop-blur-md text-(--text) text-[10px] font-extrabold px-2 py-1 rounded-lg flex items-center gap-1.5 border border-(--border)/5">
								{clanBadgeUrl ? (
									<Image src={clanBadgeUrl} alt={t('components.cards.sidebaruser.alt4')} width={12} height={12} unoptimized />
								) : (
									<Zap size={10} className="text-(--accent-orange)" fill="currentColor" />
								)}
								{activeUser.clan.tag}
							</div>
						)}
						{currentStreak > 0 && (
							<div className="flex items-center gap-1 text-(--accent-orange) text-[10px] font-extrabold bg-(--accent-orange)/10 px-2 py-1 rounded-lg border border-(--accent-orange)/20">
								<Flame size={12} className="fill-(--accent-orange)" />
								<span>{currentStreak}</span>
							</div>
						)}
						{Array.isArray(activeUser?.credits?.activeBadges) &&
							activeUser.credits.activeBadges.map((badgeId: string) => (
								<div key={badgeId} className="flex items-center gap-1 text-(--accent) text-[10px] font-extrabold bg-(--accent)/15 px-2 py-1 rounded-lg border border-(--accent)/30">
									<Sparkles size={11} />
									<span>{t(`account.profile.showcases.badges.${badgeId}`)}</span>
								</div>
							))}
					</div>
				)}

				{/* Resolved Roles Display */}
				{activeRoles.length > 0 && (
					<div className="flex flex-wrap items-center gap-1">
						{activeRoles.map((r) => (
							<span key={r.id} className="text-[10px] px-2 py-0.5 rounded-xl bg-(--accent)/10 text-(--accent) font-semibold truncate">
								{r.name || t('components.cards.sidebaruser.unnamedRole')}
							</span>
						))}
					</div>
				)}

				{/* Level Progress Bar Display */}
				<div className="flex flex-col gap-1.5 bg-(--foreground)/30 backdrop-blur-md px-3 py-2 rounded-xl border border-(--border)/5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1.5 text-xs font-extrabold text-(--accent)">
							<Sparkles size={13} className="text-(--accent)" />
							<span>
								{t('components.cards.sidebaruser.level')} {currentLevel}
							</span>
						</div>
						<span className="text-[10px] text-(--text-muted) font-mono font-medium">
							{currentLevelXp.toLocaleString()} / {xpRequired.toLocaleString()} XP
						</span>
					</div>
					<div className="w-full h-1.5 bg-(--border)/10 rounded-full overflow-hidden">
						<div className="h-full bg-(--accent) rounded-full transition-all duration-500 shadow-[0_0_8px_var(--accent)]" style={{ width: `${levelProgress}%` }} />
					</div>
				</div>

				{/* Credits Balance Display (Clickable link to Credit Store) */}
				<Link
					href={getEnvUrl('https://store.xernerx.com/?category=credits')}
					onClick={onClose}
					className="flex items-center justify-between bg-(--foreground)/30 hover:bg-(--accent)/10 backdrop-blur-md px-3 py-2 rounded-xl border border-(--border)/5 hover:border-(--accent)/30 transition-all"
				>
					<span className="text-xs text-(--text-muted) font-medium">{t('components.cards.sidebaruser.text1')}</span>
					<div className="flex items-center gap-1.5 text-(--accent-green) text-xs font-extrabold">
						<Coins size={14} />
						<span>{activeUser?.credits?.balance?.toLocaleString() ?? 0}</span>
					</div>
				</Link>

				{/* Daily Present Action Widget */}
				<div className="w-full">
					{isReadyToClaim ? (
						<button
							type="button"
							onClick={handleClaimDaily}
							disabled={claiming}
							className="w-full flex items-center justify-center gap-2 bg-(--accent) text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-md hover:opacity-90 transition-all animate-pulse"
						>
							<Gift size={16} />
							<span>{claiming ? t('components.cards.sidebaruser.openingGift') : t('components.cards.sidebaruser.claimGift')}</span>
						</button>
					) : (
						<div className="w-full flex items-center justify-between bg-(--foreground)/30 backdrop-blur-md text-(--text-muted) text-xs px-3 py-2 rounded-xl border border-(--border)/5">
							<span className="flex items-center gap-1.5 font-medium">
								<Gift size={14} className="opacity-50" />
								{t('components.cards.sidebaruser.text2')}
							</span>
							<span className="text-[11px] font-mono font-bold text-(--text) opacity-90">{timeLeft || '00:00:00'}</span>
						</div>
					)}
				</div>

				{/* Desktop App Controls (Overlay Monitor in Developer Mode + Account Switcher) */}
				{isApplication && (
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						{preferences.developerMode && (
							<div className="bg-(--foreground)/30 backdrop-blur-md rounded-xl flex flex-col overflow-hidden text-sm font-semibold text-(--text-muted) border border-(--border)/5">
								<Button
									onClick={() => {
										const bridge = (window as any).electron;
										if (bridge?.toggleOverlay) {
											bridge.toggleOverlay();
										} else {
											window.open(getEnvUrl('https://app.xernerx.com/overlay'), 'xernerx-overlay', 'width=380,height=520,menubar=no,toolbar=no,location=no,status=no');
										}
										onClose?.();
									}}
									className="flex"
								>
									<Layers size={16} className="shrink-0 text-(--accent)" /> <span className="truncate">{t('components.cards.sidebaruser.launchOverlay')}</span>
								</Button>
							</div>
						)}

						<div className="flex flex-col rounded-xl border border-(--border)/10 bg-(--background)/40 p-2 gap-1.5">
							<div className="flex items-center justify-between px-1">
								<span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">
									<Users size={11} className="text-(--accent)" />
									{t('components.cards.sidebaruser.switchAccount')}
								</span>
								<button
									type="button"
									onClick={() => (window as any).electron?.switchAccount?.('new')}
									className="inline-flex items-center gap-1 text-[10px] font-bold text-(--accent) hover:underline cursor-pointer"
								>
									<Plus size={11} />
									{t('components.cards.sidebaruser.addAccount')}
								</button>
							</div>

							{desktopAccounts?.accounts
								?.filter((acc) => acc.slot !== desktopAccounts.activeSlot)
								.map((acc) => (
									<button
										key={acc.slot}
										type="button"
										onClick={() => (window as any).electron?.switchAccount?.(acc.slot)}
										className="flex items-center justify-between rounded-xl bg-(--foreground)/40 hover:bg-(--foreground) px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer"
									>
										<span className="font-semibold text-(--text) truncate">{acc.globalName || acc.username || acc.slot}</span>
										<span className="text-[10px] font-bold text-(--accent)">{t('account.preferences.desktop.switchAccountButton')}</span>
									</button>
								))}
						</div>
					</div>
				)}
			</div>
		</motion.div>
	);
}
