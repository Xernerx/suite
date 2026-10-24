/** @format */
'use client';

import {
	Award,
	Bell,
	BellRing,
	Bot,
	Bug,
	Coins,
	Copy,
	Cpu,
	Crown,
	ExternalLink,
	Flame,
	Gem,
	Gift,
	Heart,
	Lightbulb,
	Monitor,
	Pencil,
	QrCode,
	Rocket,
	ShieldCheck,
	Smartphone,
	Sparkles,
	Tablet,
	Trophy,
	UserIcon,
	Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHighestMilestoneBadge } from '@xernerx/lib';
import { XernerxDotLogo } from '@xernerx/feedback';
import { useDictionary, useEnvironment, usePlatform, useTheme, useUser, useToast } from '@xernerx/providers';
import { Tooltip } from '@xernerx/ui';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useWindowControlsStyle } from '../HeaderWindowControls';
import { SidebarUserDesktopSection } from './SidebarUserDesktopSection';

interface Role {
	id: string;
	name?: string;
	role?: string;
	permissions?: any;
}

const deviceIcons = { desktop: Monitor, mobile: Smartphone, tablet: Tablet } as const;
const vanityBadgeIcons: Record<string, any> = {
	dot_matrix_banner: Cpu,
	credit_patron: Coins,
	high_roller: Gem,
	vault_sovereign: Crown,
	streak_master_7: Flame,
	streak_master_30: Zap,
	streak_master_100: Trophy,
	top_voter_10: Heart,
	top_voter_50: Award,
	ecosystem_builder: Rocket,
};

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
	const { mutate, loading: userLoading } = useUser();
	const { toast } = useToast();
	const [roles, setRoles] = useState<Role[]>([]);
	const [userBots, setUserBots] = useState<any[]>([]);
	const [claiming, setClaiming] = useState(false);
	const [togglingReminder, setTogglingReminder] = useState(false);
	const [timeLeft, setTimeLeft] = useState<string>('');

	const isApplication = type === 'application';

	useEffect(() => {
		fetch(getEnvUrl('https://api.xernerx.com/secure/core'), { credentials: 'include', cache: 'no-store' })
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => setRoles(data))
			.catch(() => {});
		if (activeUser?.id) {
			fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?owner=${encodeURIComponent(activeUser.id)}`), { credentials: 'include' })
				.then((res) => (res.ok ? res.json() : []))
				.then((data) => Array.isArray(data) && setUserBots(data))
				.catch(() => {});
		}
	}, [getEnvUrl, activeUser?.id]);

	const hasLoadedCredits = !userLoading && Boolean(activeUser?.credits);
	const giftInTime = hasLoadedCredits && activeUser?.credits?.giftIn ? new Date(activeUser.credits.giftIn).getTime() : null;

	useEffect(() => {
		if (!hasLoadedCredits || giftInTime === null) {
			setTimeLeft('');
			return;
		}
		const updateCountdown = () => {
			const difference = giftInTime - Date.now();
			if (difference <= 0) return setTimeLeft('00:00:00');
			const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((difference % (1000 * 60)) / 1000);
			setTimeLeft([hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':'));
		};
		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	}, [hasLoadedCredits, giftInTime]);

	const bannerUrl = activeUser?.banner ? `https://cdn.discordapp.com/banners/${activeUser.id}/${activeUser.banner}.${activeUser.banner.startsWith('a_') ? 'gif' : 'png'}?size=600` : null;
	const avatarUrl = activeUser?.avatar
		? `https://cdn.discordapp.com/avatars/${activeUser.id}/${activeUser.avatar}.${activeUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
		: activeUser?.image;
	const decorationUrl =
		preferences.showDiscordCollectibles && activeUser?.avatar_decoration_data?.asset ? `https://cdn.discordapp.com/avatar-decoration-presets/${activeUser.avatar_decoration_data.asset}.png` : null;
	const clanBadgeUrl =
		preferences.showDiscordCollectibles && activeUser?.clan?.badge && activeUser?.clan?.identity_guild_id
			? `https://cdn.discordapp.com/clan-badges/${activeUser.clan.identity_guild_id}/${activeUser.clan.badge}.png`
			: null;

	const copyUserId = () => {
		if (!activeUser?.id) return;
		navigator.clipboard.writeText(activeUser.id);
		toast({ type: 'success', title: t('components.cards.sidebaruser.userIdCopied'), description: String(activeUser.id) });
	};

	const handleClaimDaily = async () => {
		setClaiming(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/${activeUser.id}/gift`), { method: 'POST', credentials: 'include' });
			if (res.ok) {
				const data = await res.json().catch(() => ({}));
				if (!preferences.reducedMotion) confetti({ particleCount: 100, angle: 270, spread: 180, origin: { x: 0.5, y: 0 } });
				await mutate();
				toast({ type: 'success', title: t('account.billing.credits.claimSuccess', { amount: data.rewardEarned || data.reward || 50, streak: data.streak || 1 }) });
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('components.cards.sidebaruser.giftFailedTitle'));
			}
		} catch (err: any) {
			toast({ type: 'error', title: t('components.cards.sidebaruser.giftFailedTitle'), description: err.message });
		} finally {
			setClaiming(false);
		}
	};

	const reminderAt = activeUser?.notifications?.dailyGiftReminderAt;
	const hasGiftReminder = Boolean(reminderAt && new Date(reminderAt).getTime() > Date.now());

	const handleToggleGiftReminder = async () => {
		if (!activeUser?.id || togglingReminder) return;
		setTogglingReminder(true);
		const nextReminderAt = hasGiftReminder ? null : new Date(giftInTime || Date.now() + 24 * 60 * 60 * 1000).toISOString();
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${activeUser.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ notifications: { ...(activeUser?.notifications || {}), dailyGiftReminderAt: nextReminderAt } }),
			});
			if (!res.ok) throw new Error('Failed to update reminder');
			await mutate();
			toast({ type: 'success', title: nextReminderAt ? t('components.cards.sidebaruser.giftReminderSet') : t('components.cards.sidebaruser.giftReminderCleared') });
		} catch (err: any) {
			toast({ type: 'error', title: err.message });
		} finally {
			setTogglingReminder(false);
		}
	};

	const DeviceIcon = deviceIcons[device?.toLowerCase() as keyof typeof deviceIcons];
	const iconStyles = 'text-(--accent-green) absolute bottom-0 right-0 h-[22px] w-[22px] border-(--foreground) border-[4px] rounded-full bg-(--foreground)/30 backdrop-blur-md';

	const hasActiveSub = activeUser?.staffSubscription || (Array.isArray(activeUser?.subscriptions) && activeUser.subscriptions.some((s: any) => s.status === 'active'));
	const userRoleIds = Array.isArray(activeUser?.roles) ? activeUser.roles : [];
	const activeRoles = roles.filter((r) => userRoleIds.includes(r.id));
	const hasAdminAccess = activeRoles.some((r) => r.permissions?.access === true);

	const canClaimDaily = hasLoadedCredits && (giftInTime !== null ? Number.isFinite(giftInTime) && Date.now() >= giftInTime : (activeUser?.credits?.streak ?? 0) === 0);
	const currentStreak = activeUser?.credits?.streak ?? 0;
	const currentLevel = activeUser?.level?.level ?? activeUser?.levels?.[0]?.level ?? 1;
	const totalXp = activeUser?.level?.xp ?? activeUser?.levels?.[0]?.xp ?? 0;
	const xpRequired = currentLevel * 100;
	const currentLevelXp = totalXp % xpRequired;
	const levelProgress = Math.min(100, Math.max(totalXp > 0 ? 3 : 0, Math.round((currentLevelXp / xpRequired) * 100)));

	const activeVanityBadges: string[] = Array.isArray(activeUser?.credits?.activeBadges) ? activeUser.credits.activeBadges : [];
	const hasDotMatrixBanner = activeVanityBadges.includes('dot_matrix_banner');
	const verifiedIssues = activeUser?.communityStats?.verifiedIssuesCount || 0;
	const approvedSuggestions = activeUser?.communityStats?.approvedSuggestionsCount || 0;

	const getGuilds = (b: any) => Number(b?.stats?.guildCount ?? b?.guildCount ?? 0) || 0;
	const getUsers = (b: any) => Number(b?.stats?.userCount ?? b?.userCount ?? 0) || 0;
	const maxGuildBot = userBots.length > 0 ? userBots.reduce((best, b) => (getGuilds(b) > getGuilds(best) ? b : best), userBots[0]) : null;
	const maxUserBot = userBots.length > 0 ? userBots.reduce((best, b) => (getUsers(b) > getUsers(best) ? b : best), userBots[0]) : null;
	const serverMilestone = userBots.length > 0 ? getHighestMilestoneBadge(getGuilds(maxGuildBot), 'servers') : null;
	const memberMilestone = userBots.length > 0 ? getHighestMilestoneBadge(getUsers(maxUserBot), 'members') : null;

	return (
		<motion.div
			initial={{ opacity: 0, y: placement === 'top' ? -8 : 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: placement === 'top' ? -8 : 8 }}
			transition={{ duration: 0.15, ease: 'easeOut' }}
			className={`bg-(--foreground)/30 backdrop-blur-md z-50 flex flex-col rounded-[24px] shadow-2xl text-left border border-(--border)/10
				${
					placement === 'top'
						? `absolute top-full mt-2 ${isRightAligned ? 'left-0 origin-top-left' : 'right-0 origin-top-right'} w-80 max-w-[calc(100vw-2rem)]`
						: `absolute bottom-full mb-3 ${isCollapsed ? (isRightAligned ? 'right-1 w-56 origin-bottom-right' : 'left-1 w-56 origin-bottom-left') : 'left-0 right-0 origin-bottom'}`
				}`}
			style={{ fontSize: 'var(--text-scale, 14px)' }}
		>
			<div className="h-[120px] w-full relative overflow-hidden rounded-t-[24px]" style={{ backgroundColor: activeUser?.banner_color || 'var(--foreground)' }}>
				{bannerUrl && <Image src={bannerUrl} alt={t('components.cards.sidebaruser.alt1')} fill className="object-cover" unoptimized draggable={false} />}
				{hasDotMatrixBanner && (
					<div className="absolute inset-0 opacity-70">
						<XernerxDotLogo variant={(activeUser?.credits?.dotMatrixVariant as any) || 'orbit'} backgroundMode ripple={true} vivid={true} />
					</div>
				)}
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

			<div className="relative flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
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

				{(activeUser?.clan?.tag || clanBadgeUrl || currentStreak > 0 || activeVanityBadges.length > 0 || userBots.length > 0 || verifiedIssues > 0 || approvedSuggestions > 0) && (
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
							<Tooltip content={`${t('app.users.profile.streak')}: ${t('app.users.profile.days', { count: currentStreak })}`}>
								<div className="flex items-center gap-1 text-(--accent-orange) text-[10px] font-extrabold bg-(--accent-orange)/10 px-2 py-1 rounded-lg border border-(--accent-orange)/20">
									<Flame size={12} className="fill-(--accent-orange)" />
									<span>{currentStreak}</span>
								</div>
							</Tooltip>
						)}
						{serverMilestone && maxGuildBot && (
							<Tooltip
								content={`${serverMilestone.unlocked ? t('app.users.profile.milestones.tierUnlocked', { tier: serverMilestone.tier }) : t('app.users.profile.milestones.starterTier')} • ${serverMilestone.label}`}
							>
								<Link
									href={getEnvUrl(`https://app.xernerx.com/bots/${maxGuildBot.id}`)}
									onClick={onClose}
									aria-label={serverMilestone.label}
									className="h-6 w-6 rounded-lg bg-(--foreground)/40 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/35 flex items-center justify-center transition-colors shrink-0"
								>
									<Image src={serverMilestone.badgeSvg} alt={serverMilestone.label} width={16} height={16} unoptimized className="h-4 w-4 object-contain" />
								</Link>
							</Tooltip>
						)}
						{memberMilestone && maxUserBot && (
							<Tooltip
								content={`${memberMilestone.unlocked ? t('app.users.profile.milestones.tierUnlocked', { tier: memberMilestone.tier }) : t('app.users.profile.milestones.starterTier')} • ${memberMilestone.label}`}
							>
								<Link
									href={getEnvUrl(`https://app.xernerx.com/bots/${maxUserBot.id}`)}
									onClick={onClose}
									aria-label={memberMilestone.label}
									className="h-6 w-6 rounded-lg bg-(--foreground)/40 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/35 flex items-center justify-center transition-colors shrink-0"
								>
									<Image src={memberMilestone.badgeSvg} alt={memberMilestone.label} width={16} height={16} unoptimized className="h-4 w-4 object-contain" />
								</Link>
							</Tooltip>
						)}
						{activeVanityBadges.map((badgeId: string) => {
							const BadgeIcon = vanityBadgeIcons[badgeId] || Sparkles;
							return (
								<Tooltip key={badgeId} content={t(`account.profile.showcases.badges.${badgeId}`)}>
									<div className="h-6 w-6 rounded-lg bg-(--accent)/15 border border-(--accent)/30 text-(--accent) flex items-center justify-center shrink-0">
										<BadgeIcon size={12} />
									</div>
								</Tooltip>
							);
						})}
						{userBots.length > 0 && (
							<Tooltip content={t('app.users.profile.badges.botDeveloper')}>
								<div className="h-6 w-6 rounded-lg bg-(--accent)/10 border border-(--accent)/25 text-(--accent) flex items-center justify-center shrink-0">
									<Bot size={12} />
								</div>
							</Tooltip>
						)}
						{verifiedIssues > 0 && (
							<Tooltip content={`${t('app.users.profile.badges.bugHunter')} (${verifiedIssues})`}>
								<div className="h-6 w-6 rounded-lg bg-(--accent)/10 border border-(--accent)/25 text-(--accent) flex items-center justify-center shrink-0">
									<Bug size={12} />
								</div>
							</Tooltip>
						)}
						{approvedSuggestions > 0 && (
							<Tooltip content={`${t('app.users.profile.badges.contributor')} (${approvedSuggestions})`}>
								<div className="h-6 w-6 rounded-lg bg-(--accent)/10 border border-(--accent)/25 text-(--accent) flex items-center justify-center shrink-0">
									<Lightbulb size={12} />
								</div>
							</Tooltip>
						)}
					</div>
				)}

				{activeRoles.length > 0 && (
					<div className="flex flex-wrap items-center gap-1">
						{activeRoles.map((r) => (
							<span key={r.id} className="text-[10px] px-2 py-0.5 rounded-xl bg-(--accent)/10 text-(--accent) font-semibold truncate">
								{r.name || t('components.cards.sidebaruser.unnamedRole')}
							</span>
						))}
					</div>
				)}

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

				<div className="w-full">
					{canClaimDaily ? (
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
							<div className="flex items-center gap-1.5">
								<span className="text-[11px] font-mono font-bold text-(--text) opacity-90">{hasLoadedCredits ? timeLeft || '00:00:00' : '--:--:--'}</span>
								{hasLoadedCredits && !canClaimDaily && Boolean(timeLeft) && (
									<button
										type="button"
										onClick={handleToggleGiftReminder}
										disabled={togglingReminder}
										title={hasGiftReminder ? t('components.cards.sidebaruser.disableGiftReminder') : t('components.cards.sidebaruser.enableGiftReminder')}
										aria-label={hasGiftReminder ? t('components.cards.sidebaruser.disableGiftReminder') : t('components.cards.sidebaruser.enableGiftReminder')}
										className={`p-1 rounded-lg border transition-colors cursor-pointer ${hasGiftReminder ? 'bg-(--accent)/15 text-(--accent) border-(--accent)/35' : 'bg-(--background)/50 text-(--text-muted) border-(--border)/10 hover:text-(--accent) hover:border-(--accent)/30'}`}
									>
										{hasGiftReminder ? <BellRing size={12} /> : <Bell size={12} />}
									</button>
								)}
							</div>
						</div>
					)}
				</div>

				{isApplication && <SidebarUserDesktopSection onClose={onClose} />}
			</div>
		</motion.div>
	);
}
