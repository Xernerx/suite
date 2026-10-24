/** @format */
'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
	Award,
	Bot,
	Bug,
	Clock,
	Coins,
	Copy,
	Cpu,
	Crown,
	ExternalLink,
	Flame,
	Gem,
	Heart,
	Lightbulb,
	Lock,
	Rocket,
	ShieldCheck,
	Sparkles,
	Trophy,
	User as UserIcon,
	Users,
	X,
	Zap,
} from 'lucide-react';
import { getHighestMilestoneBadge } from '@xernerx/lib';
import { XernerxDotLogo } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useSession, useTheme, useToast } from '@xernerx/providers';
import { Tooltip } from '@xernerx/ui';

const VANITY_BADGE_ICONS: Record<string, any> = {
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

export interface UserProfilePopoverInitialUser {
	id?: string;
	username?: string;
	global_name?: string;
	globalName?: string;
	name?: string;
	avatar?: string | null;
	avatarUrl?: string | null;
	icon?: string | null;
	discriminator?: string;
	banner?: string | null;
	bannerUrl?: string | null;
}

export interface UserProfilePopoverProps {
	userId: string;
	initialUser?: UserProfilePopoverInitialUser | null;
	children: React.ReactNode;
	className?: string;
	asChild?: boolean;
}

interface CachedUserBundle {
	discord: any;
	dbUser: any;
	bots: any[];
	fetchedAt: number;
}
const userBundleCache = new Map<string, CachedUserBundle>();
let cachedSystemRoles: any[] | null = null;

export function UserProfilePopover({ userId, initialUser, children, className = '' }: UserProfilePopoverProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { preferences } = useTheme();
	const { toast } = useToast();
	const { data: session } = useSession();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [bundle, setBundle] = useState<CachedUserBundle | null>(() => (userId ? userBundleCache.get(String(userId)) || null : null));
	const [roles, setRoles] = useState<any[]>(cachedSystemRoles || []);
	const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({ top: 0, left: 0, placement: 'bottom' });
	const triggerRef = useRef<HTMLDivElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const cleanId = String(userId || '').trim();
	const viewerId = (session as any)?.user?.id;

	const updatePosition = () => {
		if (!triggerRef.current || typeof window === 'undefined') return;
		const rect = triggerRef.current.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		const placement: 'top' | 'bottom' = spaceBelow < 430 && rect.top > spaceBelow ? 'top' : 'bottom';
		const left = Math.max(12, Math.min(rect.left + rect.width / 2 - 170, window.innerWidth - 352));
		const top = placement === 'bottom' ? Math.min(rect.bottom + 8, window.innerHeight - 80) : Math.max(12, rect.top - 8);
		setCoords({ top, left, placement });
	};

	useLayoutEffect(() => {
		if (!open) return;
		updatePosition();
		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);
		return () => {
			window.removeEventListener('scroll', updatePosition, true);
			window.removeEventListener('resize', updatePosition);
		};
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const handleMouseDown = (e: MouseEvent) => {
			const target = e.target as Node;
			if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false);
		};
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [open]);

	useEffect(() => {
		if (!open || !isReady || !cleanId) return;

		if (!cachedSystemRoles) {
			fetch(getEnvUrl('https://api.xernerx.com/secure/core'), { credentials: 'include' })
				.then((r) => (r.ok ? r.json() : []))
				.then((data) => {
					if (Array.isArray(data)) {
						cachedSystemRoles = data;
						setRoles(data);
					}
				})
				.catch(() => {});
		}

		const cached = userBundleCache.get(cleanId);
		if (cached && Date.now() - cached.fetchedAt < 60_000) {
			setBundle(cached);
			return;
		}

		let cancelled = false;
		setLoading(true);

		Promise.all([
			fetch(getEnvUrl(`https://api.xernerx.com/core/users/${encodeURIComponent(cleanId)}/discord`))
				.then((r) => (r.ok ? r.json() : null))
				.catch(() => null),
			fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${encodeURIComponent(cleanId)}`), { credentials: 'include' })
				.then((r) => (r.ok ? r.json() : null))
				.catch(() => null),
			fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?owner=${encodeURIComponent(cleanId)}`))
				.then((r) => (r.ok ? r.json() : []))
				.catch(() => []),
		])
			.then(([discord, dbUser, rawBots]) => {
				if (cancelled) return;
				const publicBots = Array.isArray(rawBots) ? rawBots.filter((b: any) => b.privacy !== 'private' || viewerId === cleanId) : [];
				const nextBundle: CachedUserBundle = { discord, dbUser, bots: publicBots, fetchedAt: Date.now() };
				userBundleCache.set(cleanId, nextBundle);
				setBundle(nextBundle);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [open, isReady, cleanId, getEnvUrl, viewerId]);

	if (!cleanId) return <>{children}</>;

	const discord = bundle?.discord;
	const dbUser = bundle?.dbUser;
	const bots = bundle?.bots || [];
	const isPrivateBlocked = dbUser?.privacy === 'private' && viewerId !== cleanId;
	const displayName =
		discord?.global_name ||
		discord?.globalName ||
		initialUser?.global_name ||
		initialUser?.globalName ||
		discord?.username ||
		dbUser?.name ||
		initialUser?.name ||
		initialUser?.username ||
		cleanId;
	const username = discord?.username || initialUser?.username || dbUser?.username || null;
	const avatarUrl =
		discord?.avatarUrl ||
		(discord?.avatar ? `https://cdn.discordapp.com/avatars/${cleanId}/${discord.avatar}.${discord.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128` : null) ||
		initialUser?.avatarUrl ||
		initialUser?.icon ||
		(initialUser?.avatar ? `https://cdn.discordapp.com/avatars/${cleanId}/${initialUser.avatar}.png?size=128` : null) ||
		dbUser?.icon ||
		null;
	const bannerUrl =
		discord?.bannerUrl ||
		(discord?.banner ? `https://cdn.discordapp.com/banners/${cleanId}/${discord.banner}.${discord.banner.startsWith('a_') ? 'gif' : 'png'}?size=600` : null) ||
		initialUser?.bannerUrl ||
		null;
	const decorationUrl =
		preferences.showDiscordCollectibles && discord?.avatar_decoration_data?.asset ? `https://cdn.discordapp.com/avatar-decoration-presets/${discord.avatar_decoration_data.asset}.png` : null;
	const clanBadgeUrl =
		preferences.showDiscordCollectibles && discord?.clan?.badge && discord?.clan?.identity_guild_id
			? `https://cdn.discordapp.com/clan-badges/${discord.clan.identity_guild_id}/${discord.clan.badge}.png`
			: null;
	const activeVanityBadges: string[] = Array.isArray(dbUser?.credits?.activeBadges) ? dbUser.credits.activeBadges : [];
	const hasDotMatrixBanner = activeVanityBadges.includes('dot_matrix_banner');
	const userRoleIds: string[] = Array.isArray(dbUser?.roles) ? dbUser.roles.map((r: any) => (typeof r === 'string' ? r : r?.id)).filter(Boolean) : [];
	const activeRoles = roles.filter((r) => userRoleIds.includes(r.id));
	const hasActiveSub = dbUser?.staffSubscription || (Array.isArray(dbUser?.subscriptions) && dbUser.subscriptions.some((s: any) => s.status === 'active'));
	const currentStreak = dbUser?.credits?.streak ?? 0;
	const currentLevel = typeof dbUser?.level === 'number' ? dbUser.level : (dbUser?.level?.level ?? dbUser?.levels?.[0]?.level ?? 1);
	const totalXp = dbUser?.level?.xp ?? dbUser?.levels?.[0]?.xp ?? 0;
	const xpRequired = Math.max(100, currentLevel * 100);
	const currentLevelXp = totalXp % xpRequired;
	const levelProgress = Math.min(100, Math.max(totalXp > 0 ? 4 : 0, Math.round((currentLevelXp / xpRequired) * 100)));
	const verifiedIssues = dbUser?.communityStats?.verifiedIssuesCount || 0;
	const approvedSuggestions = dbUser?.communityStats?.approvedSuggestionsCount || 0;
	const maxGuildCount = bots.reduce((max, b) => Math.max(max, Number(b?.stats?.guildCount ?? b?.guildCount ?? 0) || 0), 0);
	const maxUserCount = bots.reduce((max, b) => Math.max(max, Number(b?.stats?.userCount ?? b?.userCount ?? 0) || 0), 0);
	const serverMilestone = bots.length > 0 ? getHighestMilestoneBadge(maxGuildCount, 'servers') : null;
	const memberMilestone = bots.length > 0 ? getHighestMilestoneBadge(maxUserCount, 'members') : null;

	const copyUserId = (e: React.MouseEvent) => {
		e.stopPropagation();
		navigator.clipboard.writeText(cleanId);
		toast({ type: 'success', title: t('components.cards.sidebaruser.userIdCopied'), description: cleanId });
	};

	const profileUrl = getEnvUrl(`https://app.xernerx.com/users/${cleanId}`);

	return (
		<>
			<div
				ref={triggerRef}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setOpen((prev) => !prev);
				}}
				className={`inline-flex cursor-pointer ${className}`}
			>
				{children}
			</div>

			{typeof document !== 'undefined' &&
				createPortal(
					<AnimatePresence>
						{open && (
							<motion.div
								ref={popoverRef}
								initial={{ opacity: 0, scale: 0.95, y: coords.placement === 'bottom' ? -6 : 6 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: coords.placement === 'bottom' ? -6 : 6 }}
								transition={{ duration: 0.16, ease: 'easeOut' }}
								onClick={(e) => e.stopPropagation()}
								style={{
									position: 'fixed',
									top: coords.top,
									left: coords.left,
									transform: coords.placement === 'top' ? 'translateY(-100%)' : undefined,
									width: 340,
									maxWidth: 'calc(100vw - 24px)',
									zIndex: 99999,
									fontSize: 'var(--text-scale, 14px)',
								}}
								className="flex flex-col rounded-3xl border border-(--border)/15 bg-(--background)/95 backdrop-blur-xl shadow-2xl text-left"
							>
								<div className="h-24 w-full relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-(--accent)/30 via-(--foreground) to-(--background)">
									{bannerUrl && <Image src={bannerUrl} alt={displayName} fill className="object-cover" unoptimized draggable={false} />}
									{hasDotMatrixBanner && (
										<div className="absolute inset-0 opacity-75">
											<XernerxDotLogo variant={(dbUser?.credits?.dotMatrixVariant as any) || 'orbit'} backgroundMode ripple={true} vivid={true} />
										</div>
									)}

									<div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
										<Link
											href={profileUrl}
											onClick={() => setOpen(false)}
											title={t('components.cards.sidebaruser.viewPublicProfile')}
											className="h-7 w-7 rounded-full bg-(--background)/70 hover:bg-(--accent) backdrop-blur-md border border-(--border)/15 hover:border-(--accent) text-(--text) hover:text-white flex items-center justify-center transition-all shadow-sm"
										>
											<ExternalLink size={13} />
										</Link>
										<button
											type="button"
											onClick={() => setOpen(false)}
											aria-label={t('common.buttons.close')}
											className="h-7 w-7 rounded-full bg-(--background)/70 hover:bg-(--foreground) backdrop-blur-md border border-(--border)/15 text-(--text-muted) hover:text-(--text) flex items-center justify-center transition-all shadow-sm cursor-pointer"
										>
											<X size={13} />
										</button>
									</div>
								</div>

								<div className="p-4 flex flex-col gap-3">
									<div className="flex items-start justify-between gap-2">
										<div className="relative -mt-11 rounded-full border-4 border-(--background) bg-(--foreground) shrink-0 shadow-md">
											{avatarUrl ? (
												<div className="relative h-16 w-16">
													<Image src={avatarUrl} alt={displayName} fill className="rounded-full object-cover" unoptimized draggable={false} />
													{decorationUrl && !isPrivateBlocked && (
														<Image
															src={decorationUrl}
															alt=""
															fill
															className="absolute -inset-[15%] max-w-[130%] max-h-[130%] scale-[1.15] z-10 pointer-events-none"
															unoptimized
															draggable={false}
														/>
													)}
												</div>
											) : (
												<div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--foreground)/50">
													<UserIcon size={28} className="text-(--text-muted)" />
												</div>
											)}
										</div>

										{hasActiveSub && (
											<div className="flex items-center gap-1 bg-(--accent)/15 text-(--accent) text-[10px] font-bold px-2.5 py-1 rounded-full border border-(--accent)/30">
												<ShieldCheck size={12} />
												<span>{dbUser?.staffSubscription ? t('components.cards.sidebaruser.staffBadge') : t('components.cards.sidebaruser.proBadge')}</span>
											</div>
										)}
									</div>

									<div className="flex flex-col gap-0.5 min-w-0">
										<h3 className="text-lg font-black text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{displayName}
										</h3>
										<div className="flex items-center gap-2 min-w-0">
											{username && <span className="text-xs text-(--text-muted) font-medium truncate">@{username}</span>}
											<button
												type="button"
												onClick={copyUserId}
												title={t('components.cards.sidebaruser.text5')}
												className="inline-flex items-center gap-1 rounded-full bg-(--foreground)/50 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/30 px-2 py-0.5 text-[10px] font-mono text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer shrink-0"
											>
												<Copy size={9} />
												<span>{cleanId}</span>
											</button>
										</div>
									</div>

									{(discord?.clan?.tag ||
										currentStreak > 0 ||
										serverMilestone ||
										memberMilestone ||
										activeVanityBadges.length > 0 ||
										bots.length > 0 ||
										verifiedIssues > 0 ||
										approvedSuggestions > 0) && (
										<div className="flex flex-wrap items-center gap-1.5">
											{discord?.clan?.tag && (
												<span className="bg-(--foreground)/50 text-(--text) text-[10px] font-extrabold px-2 py-1 rounded-lg flex items-center gap-1 border border-(--border)/10">
													{clanBadgeUrl ? <Image src={clanBadgeUrl} alt="" width={11} height={11} unoptimized /> : <Zap size={10} className="text-(--accent-orange)" />}
													{discord.clan.tag}
												</span>
											)}
											{currentStreak > 0 && (
												<Tooltip content={`${t('app.users.profile.streak')}: ${t('app.users.profile.days', { count: currentStreak })}`}>
													<span className="inline-flex items-center gap-1 text-(--accent-orange) text-[10px] font-extrabold bg-(--accent-orange)/10 px-2 py-1 rounded-lg border border-(--accent-orange)/25">
														<Flame size={11} className="fill-(--accent-orange)" />
														{currentStreak}
													</span>
												</Tooltip>
											)}
											{[serverMilestone, memberMilestone].filter(Boolean).map((ms, idx) => (
												<Tooltip
													key={idx}
													content={`${ms!.unlocked ? t('app.users.profile.milestones.tierUnlocked', { tier: ms!.tier }) : t('app.users.profile.milestones.starterTier')} • ${ms!.label}`}
												>
													<span className="h-6 w-6 rounded-lg bg-(--foreground)/50 border border-(--border)/10 flex items-center justify-center shrink-0">
														<Image src={ms!.badgeSvg} alt={ms!.label} width={16} height={16} unoptimized className="h-4 w-4 object-contain" />
													</span>
												</Tooltip>
											))}
											{activeVanityBadges.map((badgeId) => {
												const BadgeIcon = VANITY_BADGE_ICONS[badgeId] || Sparkles;
												return (
													<Tooltip key={badgeId} content={t(`account.profile.showcases.badges.${badgeId}`)}>
														<span className="h-6 w-6 rounded-lg text-(--accent) bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center shrink-0">
															<BadgeIcon size={12} />
														</span>
													</Tooltip>
												);
											})}
											{[
												bots.length > 0 ? { key: 'dev', label: t('app.users.profile.badges.botDeveloper'), Icon: Bot } : null,
												verifiedIssues > 0 ? { key: 'bug', label: `${t('app.users.profile.badges.bugHunter')} (${verifiedIssues})`, Icon: Bug } : null,
												approvedSuggestions > 0 ? { key: 'contrib', label: `${t('app.users.profile.badges.contributor')} (${approvedSuggestions})`, Icon: Lightbulb } : null,
											]
												.filter(Boolean)
												.map((item) => {
													const Icon = item!.Icon;
													return (
														<Tooltip key={item!.key} content={item!.label}>
															<span className="h-6 w-6 rounded-lg text-(--accent) bg-(--accent)/10 border border-(--accent)/25 flex items-center justify-center shrink-0">
																<Icon size={12} />
															</span>
														</Tooltip>
													);
												})}
										</div>
									)}

									{activeRoles.length > 0 && (
										<div className="flex flex-wrap items-center gap-1">
											{activeRoles.map((r) => (
												<span key={r.id} className="text-[10px] px-2 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) font-semibold border border-(--accent)/25">
													{r.name}
												</span>
											))}
										</div>
									)}

									{isPrivateBlocked ? (
										<div className="flex items-center gap-2.5 rounded-2xl bg-(--foreground)/40 border border-(--border)/10 p-3 text-xs text-(--text-muted)">
											<Lock size={15} className="text-(--accent) shrink-0" />
											<span>{t('app.users.notFoundDesc')}</span>
										</div>
									) : (
										<>
											{dbUser?.description && <p className="text-xs text-(--text-muted) line-clamp-2 leading-relaxed">{dbUser.description}</p>}

											{(dbUser?.pronouns || dbUser?.timezone) && (
												<div className="flex flex-wrap items-center gap-2 text-[11px] text-(--text-muted)">
													{dbUser?.pronouns && (
														<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-(--foreground)/40 border border-(--border)/10 font-semibold text-(--text)">
															<UserIcon size={11} className="text-(--accent)" />
															{dbUser.pronouns}
														</span>
													)}
													{dbUser?.timezone && (
														<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-(--foreground)/40 border border-(--border)/10 font-mono text-(--text)">
															<Clock size={11} className="text-(--accent)" />
															{dbUser.timezone}
														</span>
													)}
												</div>
											)}

											<div className="flex flex-col gap-1 bg-(--foreground)/40 px-3 py-2 rounded-2xl border border-(--border)/10">
												<div className="flex items-center justify-between">
													<span className="inline-flex items-center gap-1 text-xs font-extrabold text-(--accent)">
														<Sparkles size={12} />
														{t('components.cards.sidebaruser.level')} {currentLevel}
													</span>
													<span className="text-[10px] font-mono text-(--text-muted)">
														{currentLevelXp.toLocaleString()} / {xpRequired.toLocaleString()} XP
													</span>
												</div>
												<div className="w-full h-1.5 bg-(--border)/15 rounded-full overflow-hidden">
													<div className="h-full bg-(--accent) rounded-full transition-all duration-500" style={{ width: `${levelProgress}%` }} />
												</div>
											</div>
										</>
									)}

									<Link
										href={profileUrl}
										onClick={() => setOpen(false)}
										className="w-full flex items-center justify-center gap-2 rounded-2xl bg-(--accent) hover:bg-(--hover-accent) text-white text-xs font-bold py-2.5 px-4 shadow-sm transition-all"
									>
										<UserIcon size={14} />
										<span>{t('components.cards.sidebaruser.viewPublicProfile')}</span>
										<ExternalLink size={12} />
									</Link>
								</div>
							</motion.div>
						)}
					</AnimatePresence>,
					document.body
				)}
		</>
	);
}

export default UserProfilePopover;
