/** @format */
// Force recompile
'use client';

import { Bell, Gift, LayoutGrid, LogIn, Monitor, Smartphone, Sparkles, Tablet, User as UserIcon, X } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useDictionary, useEnvironment, useNotifications, usePlatform, useShortcuts, useSidebar, useTheme, useUser } from '@xernerx/providers';

import { AnimatePresence } from 'framer-motion';
import { Divider } from '@xernerx/ui';
import Image from 'next/image';
import Link from 'next/link';
import SidebarNotifications, { getReadyCooldownReminders } from './cards/SidebarNotifications';
import SidebarUserCard from './cards/SidebarUser';
import { useWindowControlsStyle } from './HeaderWindowControls';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const deviceIcons = {
	desktop: Monitor,
	mobile: Smartphone,
	tablet: Tablet,
} as const;

export function Sidebar() {
	const { data: session } = useSession();
	const { state, isMobileOpen, setMobileOpen, navItems, view, setView } = useSidebar();
	const { user: discordUser, loading: userLoading } = useUser();
	const { device } = usePlatform();
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { unreadCount } = useNotifications();
	const { setNavOpen } = useShortcuts();
	const { preferences } = useTheme();
	const { isRightAligned } = useWindowControlsStyle();
	const pathname = usePathname();
	const [isMounted, setIsMounted] = useState(false);
	const [localTourPostponed, setLocalTourPostponed] = useState(false);

	// Manage which dropdown is active
	const [activeMenu, setActiveMenu] = useState<'none' | 'user' | 'notifications'>('none');
	const [onboardingStage, setOnboardingStage] = useState<{
		active: boolean;
		phase?: string;
		sidebarStepId?: string;
		revealedSidebarItems?: string[];
		pageTourTarget?: string;
	}>({ active: false });
	const menuRef = useRef<HTMLDivElement>(null);
	const touchStartRef = useRef<{ x: number; y: number } | null>(null);

	useEffect(() => {
		if (typeof window === 'undefined' || state === 'hidden' || onboardingStage.active) return;
		let startX = 0;
		let startY = 0;
		let trackingEdge = false;

		const onDocTouchStart = (e: TouchEvent) => {
			if (isMobileOpen || window.innerWidth >= 768) {
				trackingEdge = false;
				return;
			}
			const t0 = e.touches[0];
			if (!t0) return;
			const fromEdge = isRightAligned ? window.innerWidth - t0.clientX <= 28 : t0.clientX <= 28;
			if (fromEdge) {
				startX = t0.clientX;
				startY = t0.clientY;
				trackingEdge = true;
			} else {
				trackingEdge = false;
			}
		};

		const onDocTouchEnd = (e: TouchEvent) => {
			if (!trackingEdge) return;
			trackingEdge = false;
			const t0 = e.changedTouches[0];
			if (!t0) return;
			const dx = t0.clientX - startX;
			const dy = t0.clientY - startY;
			if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
				if ((!isRightAligned && dx > 50) || (isRightAligned && dx < -50)) {
					setMobileOpen(true);
				}
			}
		};

		window.addEventListener('touchstart', onDocTouchStart, { passive: true });
		window.addEventListener('touchend', onDocTouchEnd, { passive: true });
		return () => {
			window.removeEventListener('touchstart', onDocTouchStart);
			window.removeEventListener('touchend', onDocTouchEnd);
		};
	}, [state, isMobileOpen, isRightAligned, onboardingStage.active, setMobileOpen]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if ((window as any).__xernerxOnboardingStage) {
			setOnboardingStage((window as any).__xernerxOnboardingStage);
		}
		const onOnboardingStage = (e: Event) => {
			const detail = (
				e as CustomEvent<{
					active: boolean;
					phase?: string;
					sidebarStepId?: string;
					revealedSidebarItems?: string[];
					pageTourTarget?: string;
				}>
			).detail;
			if (detail && typeof detail.active === 'boolean') {
				setOnboardingStage(detail);
			}
		};
		window.addEventListener('xernerx:onboarding-stage', onOnboardingStage);
		return () => window.removeEventListener('xernerx:onboarding-stage', onOnboardingStage);
	}, []);

	const isSidebarBuildMode = onboardingStage.active && onboardingStage.phase === 'sidebar';
	const hasSidebarRevealedList = Array.isArray(onboardingStage.revealedSidebarItems) && onboardingStage.revealedSidebarItems.length > 0;
	const isSidebarItemRevealed = (id: string) => !isSidebarBuildMode || !hasSidebarRevealedList || onboardingStage.revealedSidebarItems!.includes(id);
	const isSidebarItemHighlighted = (id: string) =>
		(isSidebarBuildMode && onboardingStage.sidebarStepId === id) ||
		(id === 'views' && onboardingStage.active && (onboardingStage.pageTourTarget === 'dash-sidebar' || onboardingStage.pageTourTarget === 'portal-orgs'));

	const isCollapsed = state === 'closed' && !isMobileOpen;
	const activeUser = discordUser || session?.user;
	const readyReminders = isMounted && !userLoading && discordUser ? getReadyCooldownReminders(discordUser, getEnvUrl, t) : [];
	const totalUnread = unreadCount + readyReminders.length;
	const hasLoadedCredits = !userLoading && Boolean(discordUser?.credits);
	const isTourPostponed =
		isMounted &&
		Boolean(activeUser) &&
		!userLoading &&
		Boolean(localTourPostponed || (discordUser as any)?.onboarding?.tourPostponed || (discordUser?.agreedTerms && discordUser?.agreedPrivacy && !(discordUser as any)?.onboarding?.completedAt));
	const giftInTime = hasLoadedCredits && discordUser?.credits?.giftIn ? new Date(discordUser.credits.giftIn).getTime() : null;
	const isGiftReady =
		preferences.showGiftBadge && isMounted && hasLoadedCredits && (giftInTime !== null ? Number.isFinite(giftInTime) && Date.now() >= giftInTime : (discordUser?.credits?.streak ?? 0) === 0);

	// Resolve Discord CDN URLs for Avatar, Decoration, and Nameplate
	const avatarUrl = activeUser?.avatar
		? `https://cdn.discordapp.com/avatars/${activeUser.id}/${activeUser.avatar}.${activeUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
		: activeUser?.image;
	const decorationUrl =
		preferences.showDiscordCollectibles && activeUser?.avatar_decoration_data?.asset ? `https://cdn.discordapp.com/avatar-decoration-presets/${activeUser.avatar_decoration_data.asset}.png` : null;
	const nameplateUrl =
		preferences.showDiscordCollectibles && activeUser?.collectibles?.nameplate?.asset
			? `https://cdn.discordapp.com/assets/collectibles/${activeUser.collectibles.nameplate.asset}asset.webm`
			: null;
	const customNameplate = (discordUser as any)?.credits?.profileCosmetics?.nameplate || 'none';
	const customAvatarFrame = (discordUser as any)?.credits?.profileCosmetics?.avatarFrame || 'none';

	const DeviceIcon = deviceIcons[device?.toLowerCase() as keyof typeof deviceIcons];
	const iconStyles = 'text-(--accent-green) absolute -bottom-0.5 -right-0.5 h-[14px] w-[14px] border-2 border-(--background) rounded-full bg-(--foreground)/30 backdrop-blur-md z-20';

	useEffect(() => {
		setIsMounted(true);
		try {
			setLocalTourPostponed(Boolean(localStorage.getItem('xernerx_tour_postponed')));
		} catch {}
		const onTourPostponedChange = (e: Event) => {
			const detail = (e as CustomEvent<{ postponed?: boolean }>)?.detail;
			if (detail && typeof detail.postponed === 'boolean') {
				setLocalTourPostponed(detail.postponed);
			} else {
				try {
					setLocalTourPostponed(Boolean(localStorage.getItem('xernerx_tour_postponed')));
				} catch {}
			}
		};
		window.addEventListener('xernerx:tour-postponed-change', onTourPostponedChange);
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setActiveMenu('none');
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			window.removeEventListener('xernerx:tour-postponed-change', onTourPostponedChange);
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	useEffect(() => {
		if (!activeUser || state === 'hidden' || onboardingStage.active) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
			if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'i' || e.key === 'I') && !isInput) {
				e.preventDefault();
				setActiveMenu((prev) => (prev === 'notifications' ? 'none' : 'notifications'));
			} else if (e.key === 'Escape') {
				setActiveMenu('none');
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [activeUser, state, onboardingStage.active]);

	const loginHref = (() => {
		if (!isMounted || typeof window === 'undefined') return '/login';
		const base = getEnvUrl('https://account.xernerx.com/login');
		const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/logout');
		return !isAuthRoute && window.location.href ? `${base}?redirect=${encodeURIComponent(window.location.href)}` : base;
	})();

	if (state === 'hidden') return null;

	return (
		<>
			{/* Mobile Backdrop */}
			{isMobileOpen && !onboardingStage.active && (
				<div className="fixed inset-0 top-[calc(50px+env(safe-area-inset-top,0px))] z-40 bg-(--background)/60 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
			)}

			<aside
				onTouchStart={(e) => {
					const t0 = e.touches[0];
					if (t0) touchStartRef.current = { x: t0.clientX, y: t0.clientY };
				}}
				onTouchEnd={(e) => {
					if (!touchStartRef.current || !isMobileOpen || onboardingStage.active) return;
					const t0 = e.changedTouches[0];
					const start = touchStartRef.current;
					touchStartRef.current = null;
					if (!t0) return;
					const dx = t0.clientX - start.x;
					const dy = t0.clientY - start.y;
					if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
						if ((!isRightAligned && dx < -45) || (isRightAligned && dx > 45)) {
							setMobileOpen(false);
						}
					}
				}}
				className={`
                    fixed top-[calc(50px+env(safe-area-inset-top,0px))] bottom-0 ${isRightAligned ? 'right-0 max-md:border-l' : 'left-0 max-md:border-r'} w-[86vw] max-w-[320px] max-md:border-(--border)/15 max-md:shadow-2xl pt-2 ${
						onboardingStage.active ? 'pb-52 z-20 md:z-50' : 'pb-4 z-50'
					} ${isMobileOpen ? 'translate-x-0' : isRightAligned ? 'translate-x-full' : '-translate-x-full'}
                    flex flex-col bg-(--background) transition-all duration-300 ease-in-out
                    md:w-80 md:max-w-none md:top-0 md:bottom-auto md:sticky md:h-full md:pt-0 md:pb-0
                    md:translate-x-0 
                    ${isCollapsed ? 'md:w-[80px]' : ''}
                    ${isSidebarItemHighlighted('collapse') ? 'ring-2 ring-inset ring-(--accent) shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_45%,transparent)]' : ''}
                    ${onboardingStage.active ? 'pointer-events-none select-none' : ''}
                `}
				style={{
					paddingLeft: 'calc(var(--ui-gap) + env(safe-area-inset-left, 0px))',
					paddingRight: 'calc(var(--ui-gap) + env(safe-area-inset-right, 0px))',
					fontSize: 'var(--text-scale, 14px)',
				}}
			>
				{/* Mobile Header Bar with Close Button */}
				{!onboardingStage.active && (
					<div className="flex items-center justify-between px-3 pt-2 pb-1 md:hidden">
						<span className="text-xs font-extrabold uppercase tracking-wider text-(--text-muted)">{t('components.sidebar.title')}</span>
						<button
							type="button"
							onClick={() => setMobileOpen(false)}
							aria-label={t('common.buttons.close')}
							className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--foreground)/50 border border-(--border)/15 text-(--text-muted) hover:text-(--text) hover:bg-(--accent)/15 transition-colors cursor-pointer"
						>
							<X size={16} />
						</button>
					</div>
				)}

				{/* Navigation Items */}
				<nav
					aria-label={t('components.sidebar.title')}
					className={`flex flex-1 flex-col overflow-y-auto overflow-x-hidden pt-4 rounded-2xl transition-all duration-300 ${
						isSidebarItemHighlighted('views') ? 'ring-2 ring-(--accent) bg-(--accent)/10 p-1.5 shadow-[0_0_22px_color-mix(in_srgb,var(--accent)_50%,transparent)]' : ''
					}`}
					style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}
				>
					{isSidebarItemRevealed('views') &&
						navItems.map((item, idx) => {
							const Icon = item.icon;
							const active = item.view && view === item.view;
							const shortcutLabel = preferences.showShortcutHints && idx < 9 ? `Alt + ${idx + 1}` : undefined;
							const itemTitle = shortcutLabel ? `${item.label} (${shortcutLabel})` : item.label;

							const prevItem = idx > 0 ? navItems[idx - 1] : null;
							const showCategory = item.category && item.category !== prevItem?.category;

							return (
								<Fragment key={idx}>
									{showCategory && (
										<div className={`mt-4 mb-1 transition-all duration-300 ${isCollapsed ? 'flex justify-center' : 'px-4'}`}>
											{isCollapsed ? (
												<div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-(--border) to-transparent" />
											) : (
												<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{item.category}</span>
											)}
										</div>
									)}

									{!item.href || item.href === '#' ? (
										<button
											type="button"
											aria-label={itemTitle}
											title={itemTitle}
											onClick={() => {
												if (item.view) setView(item.view);
												if (item.onClick) item.onClick();
												setMobileOpen(false);
											}}
											className={`w-full group relative flex items-center text-left rounded-xl transition-all duration-200 
											${active ? 'bg-(--active-accent)/50 text-(--text) font-semibold shadow-xs' : 'text-(--text-muted) hover:bg-(--foreground)/30 backdrop-blur-md hover:text-(--text)'}
											${isCollapsed ? 'justify-center px-0' : 'justify-start'}
										`}
											style={{
												padding: isCollapsed ? 'calc(var(--ui-gap) * 0.75) 0' : 'calc(var(--ui-gap) * 0.75) var(--ui-gap)',
												gap: isCollapsed ? 0 : 'var(--ui-gap)',
											}}
										>
											{active && !isCollapsed && (
												<div className={`absolute ${isRightAligned ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} h-5 w-1 bg-(--accent-readable,var(--accent))`} />
											)}
											{Icon && <Icon size={14} strokeWidth={2} className={`shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-(--accent)' : ''}`} />}
											<span
												className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium text-[14px] 
											${isCollapsed ? 'w-0 opacity-0' : 'flex-1 min-w-0 opacity-100'}`}
											>
												{item.label}
											</span>
											{!isCollapsed && shortcutLabel && (
												<kbd className="hidden md:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-(--text-muted) bg-(--background)/95 backdrop-blur-md px-1.5 py-0.5 rounded-xl border border-(--border)/15 shadow-xs z-10">
													{shortcutLabel}
												</kbd>
											)}
										</button>
									) : (
										<Link
											href={item.href}
											aria-label={itemTitle}
											title={itemTitle}
											onClick={() => {
												if (item.view) setView(item.view);
												if (item.onClick) item.onClick();
												setMobileOpen(false);
											}}
											className={`group relative flex items-center text-left rounded-xl transition-all duration-200 
											${active ? 'bg-(--active-accent)/50 text-(--text) font-semibold shadow-xs' : 'text-(--text-muted) hover:bg-(--foreground)/30 backdrop-blur-md hover:text-(--text)'}
											${isCollapsed ? 'justify-center px-0' : 'justify-start'}
										`}
											style={{
												padding: isCollapsed ? 'calc(var(--ui-gap) * 0.75) 0' : 'calc(var(--ui-gap) * 0.75) var(--ui-gap)',
												gap: isCollapsed ? 0 : 'var(--ui-gap)',
											}}
										>
											{active && !isCollapsed && (
												<div className={`absolute ${isRightAligned ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} h-5 w-1 bg-(--accent-readable,var(--accent))`} />
											)}
											{Icon && <Icon size={14} strokeWidth={2} className={`shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-(--accent)' : ''}`} />}
											<span
												className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium text-[14px] 
											${isCollapsed ? 'w-0 opacity-0' : 'flex-1 min-w-0 opacity-100'}`}
											>
												{item.label}
											</span>
											{!isCollapsed && shortcutLabel && (
												<kbd className="hidden md:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-(--text-muted) bg-(--background)/95 backdrop-blur-md px-1.5 py-0.5 rounded-xl border border-(--border)/15 shadow-xs z-10">
													{shortcutLabel}
												</kbd>
											)}
										</Link>
									)}
								</Fragment>
							);
						})}
				</nav>

				{isSidebarItemRevealed('moved-dock') && <Divider />}
				{/* Bottom Ecosystem & User Section */}

				{isSidebarItemRevealed('moved-dock') && (
					<div
						ref={menuRef}
						className={`relative flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-300 ${isCollapsed ? 'items-center' : ''}`}
						style={{ paddingBottom: 'calc(var(--ui-gap) + env(safe-area-inset-bottom, 0px))', gap: 'calc(var(--ui-gap) * 0.5)' }}
					>
						{!activeUser ? (
							<Link
								href={loginHref}
								title={t('common.sidebar.login')}
								className={`flex items-center justify-center rounded-xl bg-(--accent) text-(--accent-contrast) border border-(--border)/15 transition-colors hover:bg-(--hover-accent) mt-1
                                ${isCollapsed ? 'h-10 w-10 p-0' : 'w-full font-medium text-sm'}
                            `}
								style={!isCollapsed ? { padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.5)' } : {}}
							>
								<LogIn size={18} />
								{!isCollapsed && <span>{t('common.sidebar.login')}</span>}
							</Link>
						) : (
							<div className="relative w-full mt-1 flex flex-col gap-2">
								{!onboardingStage.active && isTourPostponed && (
									<button
										type="button"
										onClick={() => {
											setMobileOpen(false);
											window.dispatchEvent(new CustomEvent('xernerx:open-suite-tutorial', { detail: { resume: true } }));
										}}
										title={t('components.header.continueTourTooltip')}
										className={`flex items-center justify-center gap-2 rounded-2xl bg-(--accent)/15 hover:bg-(--accent) border border-(--accent)/35 text-xs font-extrabold text-(--accent) hover:text-white transition-all cursor-pointer shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_18%,transparent)] ${
											isCollapsed ? 'h-10 w-10 p-0 mx-auto' : 'w-full px-3 py-2'
										}`}
									>
										<Sparkles size={14} className="shrink-0" />
										{!isCollapsed && <span className="truncate">{t('components.header.continueTour')}</span>}
									</button>
								)}
								{/* Menus */}
								<AnimatePresence>
									{activeMenu === 'user' && <SidebarUserCard activeUser={activeUser} isCollapsed={isCollapsed} onClose={() => setActiveMenu('none')} />}
								</AnimatePresence>
								<AnimatePresence>{activeMenu === 'notifications' && <SidebarNotifications isCollapsed={isCollapsed} onClose={() => setActiveMenu('none')} />}</AnimatePresence>

								{/* Combined Trigger Card Wrapper */}
								<div
									className={`group relative overflow-hidden flex w-full items-center rounded-2xl transition-all 
                                ${customNameplate !== 'none' ? `xrx-nameplate-${customNameplate} border border-(--accent)/35 shadow-sm` : !nameplateUrl ? 'hover:bg-(--foreground)/30 backdrop-blur-md' : 'shadow-inner'}
                                ${customNameplate === 'none' && !nameplateUrl && activeMenu !== 'none' ? 'bg-(--foreground)/30 backdrop-blur-md' : ''}
                                ${isCollapsed ? 'flex-col justify-center' : 'justify-between'}
                                ${isSidebarItemHighlighted('moved-dock') ? 'ring-2 ring-(--accent) shadow-[0_0_22px_color-mix(in_srgb,var(--accent)_60%,transparent)] bg-(--accent)/15' : ''}
                            `}
									style={{ padding: 'calc(var(--ui-gap) * 0.75)', gap: 'var(--ui-gap)' }}
								>
									{/* Root Nameplate Video Background */}
									{nameplateUrl && customNameplate === 'none' && (
										<>
											<video src={nameplateUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-fill z-0 pointer-events-none opacity-90" />
											<div className="absolute inset-0 bg-(--background)/10 z-0 pointer-events-none" />
										</>
									)}

									{/* User Info Trigger (Left Side) */}
									<button
										type="button"
										aria-label={isGiftReady ? t('components.cards.sidebaruser.giftReadyTooltip') : activeUser.global_name || activeUser.name}
										title={isGiftReady ? t('components.cards.sidebaruser.giftReadyTooltip') : activeUser.global_name || activeUser.name}
										onClick={() => setActiveMenu(activeMenu === 'user' ? 'none' : 'user')}
										className="relative z-10 flex flex-1 items-center overflow-hidden text-left rounded-lg"
										style={{ gap: 'var(--ui-gap)' }}
									>
										{/* Avatar */}
										<div className="relative shrink-0">
											{avatarUrl ? (
												<div className="relative h-9 w-9">
													<Image
														src={avatarUrl}
														alt={t('components.sidebar.alt1')}
														fill
														className={`rounded-full border border-(--border) object-cover ${customAvatarFrame !== 'none' ? `xrx-avatar-frame-${customAvatarFrame}` : ''}`}
														unoptimized
														draggable={false}
														loading="eager"
													/>

													{decorationUrl && (
														<Image
															src={decorationUrl}
															alt={t('components.sidebar.alt2')}
															fill
															className="absolute -inset-[15%] max-w-[130%] max-h-[130%] scale-[1.15] z-10 pointer-events-none"
															unoptimized
															draggable={false}
														/>
													)}
												</div>
											) : (
												<div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--border)">
													<UserIcon size={16} className="text-(--text-muted)" />
												</div>
											)}
											{/* Daily Gift Ready Indicator */}
											{isGiftReady && (
												<span
													title={t('components.cards.sidebaruser.giftReadyTooltip')}
													className="absolute -top-1 -left-1 z-30 flex h-4 w-4 items-center justify-center rounded-full bg-(--accent-orange) text-white shadow-sm animate-bounce"
												>
													<Gift size={10} />
												</span>
											)}
											{/* Status Indicator */}
											{DeviceIcon ? <DeviceIcon className={iconStyles} /> : <div className={`${iconStyles} rounded-full`} />}
										</div>

										{/* Names */}
										<div
											className={`flex flex-col overflow-hidden transition-all duration-300 relative ${isCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}
											style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}
										>
											<span className={`truncate text-sm font-bold tracking-wide ${nameplateUrl ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-(--text)'}`}>
												{activeUser.global_name || activeUser.name}
											</span>
											<span className={`truncate text-xs ${nameplateUrl ? 'text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' : 'text-(--text-muted)'}`}>
												@{activeUser.username || activeUser.name?.toLowerCase().replace(/\s/g, '')}
											</span>
										</div>
									</button>

									{/* Action Buttons (Right Side) */}
									<div className={`relative z-10 flex ${isCollapsed ? 'flex-col' : 'items-center'} gap-1`}>
										{/* Notifications Trigger */}
										<button
											type="button"
											aria-label={t('components.header.notifications')}
											title={t('components.header.notifications')}
											onClick={() => setActiveMenu(activeMenu === 'notifications' ? 'none' : 'notifications')}
											className={`shrink-0 flex items-center justify-center rounded-xl transition-colors 
                                            ${nameplateUrl ? 'hover:bg-(--background)/30 text-white drop-shadow-md' : 'hover:bg-(--background) text-(--text-muted) hover:text-(--text)'}
                                            ${activeMenu === 'notifications' ? (nameplateUrl ? 'bg-(--background)/40 text-white' : 'bg-(--background) text-(--text)') : ''}
                                        `}
											style={{ padding: 'calc(var(--ui-gap) * 0.5)' }}
										>
											<div className="relative">
												<Bell
													size={isCollapsed ? 20 : 18}
													className={`transition-transform duration-200 ${activeMenu === 'notifications' && !nameplateUrl ? 'text-(--accent)' : ''}`}
												/>

												{totalUnread > 0 && (
													<span className="absolute -top-1.5 -right-1.5 flex min-w-[16px] h-[16px] px-1 items-center justify-center rounded-full bg-(--accent-red) text-[9px] font-extrabold leading-none text-white border-2 border-(--background) shadow-xs">
														{totalUnread > 9 ? '9+' : totalUnread}
													</span>
												)}
											</div>
										</button>

										{/* App Drawer Trigger (Replaces Suite) */}
										<button
											type="button"
											aria-label={t('components.header.title1')}
											title={t('components.header.title1')}
											onClick={() => {
												setActiveMenu('none');
												setNavOpen(true);
											}}
											className={`shrink-0 flex items-center justify-center rounded-xl transition-colors 
                                            ${nameplateUrl ? 'hover:bg-(--background)/30 text-white drop-shadow-md' : 'hover:bg-(--background) text-(--text-muted) hover:text-(--text)'}
                                        `}
											style={{ padding: 'calc(var(--ui-gap) * 0.5)' }}
										>
											<LayoutGrid size={isCollapsed ? 20 : 18} className="transition-transform duration-200" />
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</aside>
		</>
	);
}
