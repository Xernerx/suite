/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
	Bell,
	ChevronLeft,
	Clock,
	Download,
	Gift,
	LayoutGrid,
	Megaphone,
	Monitor,
	RefreshCw,
	Search,
	SidebarClose,
	SidebarOpen,
	Smartphone,
	Sparkles,
	Tablet,
	User as UserIcon,
	X,
} from 'lucide-react';
import { headerSubdomainsCatalog } from '@xernerx/lib';
import { DEFAULT_HEADER_SUBDOMAINS, useDictionary, useEnvironment, useNotifications, usePermissions, usePlatform, useShortcuts, useSidebar, useTheme, useUser } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import BannerCanary from '../../public/banner-canary.svg';
import BannerDev from '../../public/banner-dev.svg';
import BannerPublic from '../../public/banner.svg';
import Image from 'next/image';
import Link from 'next/link';
import SidebarNotifications, { getReadyCooldownReminders } from './cards/SidebarNotifications';
import SidebarUserCard from './cards/SidebarUser';
import { HeaderOmnibar, SubSelector } from './HeaderOmnibar';
import { HeaderWindowControls, useWindowControlsStyle } from './HeaderWindowControls';
export { SubSelector };
const deviceIcons = { desktop: Monitor, mobile: Smartphone, tablet: Tablet } as const;

export function Header() {
	const { state, toggle, setMobileOpen, isMobileOpen, view } = useSidebar();
	const { t } = useDictionary();
	const { type, device } = usePlatform();
	const { getEnvUrl, isDev, isCanary } = useEnvironment();
	const { preferences } = useTheme();
	const { hasPermission } = usePermissions();
	const hasAdminAccess = hasPermission('access');
	const hasHostingAccess = hasPermission('hosting');
	const { effectiveControls, isRightAligned } = useWindowControlsStyle();
	const [isElectron, setIsElectron] = useState(false);
	const [isDesktopRunning, setIsDesktopRunning] = useState(false);
	const [desktopBridgePort, setDesktopBridgePort] = useState<number>(41990);

	const { data: session } = useSession();
	const { user: discordUser, loading: userLoading } = useUser();
	const activeUser = discordUser || session?.user;

	const [isMounted, setIsMounted] = useState(false);
	const [localTourPostponed, setLocalTourPostponed] = useState(false);
	const { notifications } = useNotifications();
	const readyReminders = isMounted && !userLoading && discordUser ? getReadyCooldownReminders(discordUser, getEnvUrl, t) : [];
	const totalUnreadCount = notifications.filter((n) => !n.read).length + readyReminders.length;
	const hasUnread = totalUnreadCount > 0;

	useEffect(() => {
		if (!isMounted || typeof window === 'undefined') return;
		const bridge = (window as any).electron;
		if (bridge?.setBadgeCount) bridge.setBadgeCount(activeUser ? totalUnreadCount : 0);
	}, [isMounted, activeUser, totalUnreadCount]);

	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const notificationsRef = useRef<HTMLDivElement>(null);
	const [optionsOpen, setOptionsOpen] = useState(false);
	const [isExpanded, setIsExpanded] = useState(true);
	const [onboardingStage, setOnboardingStage] = useState<{
		active: boolean;
		phase?: string;
		headerStepId?: string;
		revealedHeaderItems?: string[];
		sidebarStepId?: string;
		revealedSidebarItems?: string[];
	}>({
		active: false,
		phase: 'welcome',
		headerStepId: 'logo',
		revealedHeaderItems: [],
	});
	const [desktopUpdateState, setDesktopUpdateState] = useState<{
		checking?: boolean;
		outdated?: boolean;
		downloaded?: boolean;
		downloading?: boolean;
		latestVersion?: string;
		downloadUrl?: string | null;
	} | null>(null);

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
					headerStepId?: string;
					revealedHeaderItems?: string[];
					sidebarStepId?: string;
					revealedSidebarItems?: string[];
				}>
			).detail;
			if (detail && typeof detail.active === 'boolean') {
				setOnboardingStage(detail);
			}
		};
		window.addEventListener('xernerx:onboarding-stage', onOnboardingStage);
		return () => window.removeEventListener('xernerx:onboarding-stage', onOnboardingStage);
	}, []);

	const isHeaderBuildMode = onboardingStage.active && onboardingStage.phase === 'header';
	const isSidebarBuildMode = onboardingStage.active && onboardingStage.phase === 'sidebar';
	const isSidebarBeforeDockMove = isSidebarBuildMode && Array.isArray(onboardingStage.revealedSidebarItems) && !onboardingStage.revealedSidebarItems.includes('moved-dock');
	const showControlsInHeader = state === 'hidden' || isHeaderBuildMode || isSidebarBeforeDockMove;
	const hasRevealedList = Array.isArray(onboardingStage.revealedHeaderItems) && onboardingStage.revealedHeaderItems.length > 0;
	const isItemRevealed = (id: string) => !isHeaderBuildMode || !hasRevealedList || onboardingStage.revealedHeaderItems!.includes(id);
	const isItemHighlighted = (id: string) => isHeaderBuildMode && onboardingStage.headerStepId === id;
	const isShortcutHighlighted = (subId: string) => isHeaderBuildMode && (onboardingStage.headerStepId === subId || (onboardingStage.headerStepId === 'store' && isItemRevealed(subId)));
	const effectiveOptionsOpen = isHeaderBuildMode ? isItemRevealed('search') : optionsOpen;
	const activeRingClass = 'ring-2 ring-(--accent) shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_70%,transparent)] scale-110 transition-all duration-300';

	const { setNavOpen, setSearchOpen, isUrlPlacerOpen, setUrlPlacerOpen } = useShortcuts();
	const pathname = usePathname();

	const resolveOmnibarUrl = (pre: string, env: string, rawPath: string) => {
		let fullPath = rawPath.trim();
		if (fullPath && !fullPath.startsWith('/')) fullPath = '/' + fullPath;
		const host = typeof window !== 'undefined' ? window.location.hostname : '';
		const isLocalHost = host === 'localhost' || host === '127.0.0.1' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
		if (env === 'dev' && isLocalHost) return getEnvUrl(`https://${pre}.xernerx.com${fullPath}`);
		return `https://${pre}.${env === 'public' ? '' : env + '.'}xernerx.com${fullPath}`;
	};

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
		const detectedElectron = Boolean((window as any).electron) || navigator.userAgent.toLowerCase().includes('electron');
		setIsElectron(detectedElectron);
		if (detectedElectron) document.documentElement.classList.add('is-electron');
		if ((window as any).__xernerxDesktopUpdateState) setDesktopUpdateState((window as any).__xernerxDesktopUpdateState);
		const handleDesktopUpdateState = (e: Event) => {
			const detail = (e as CustomEvent).detail;
			if (detail) setDesktopUpdateState(detail);
		};
		window.addEventListener('xernerx:desktop-update-state', handleDesktopUpdateState);
		const timer = setTimeout(() => setIsExpanded(false), 2000);
		return () => {
			clearTimeout(timer);
			window.removeEventListener('xernerx:tour-postponed-change', onTourPostponedChange);
			window.removeEventListener('xernerx:desktop-update-state', handleDesktopUpdateState);
		};
	}, []);

	const isApp = type === 'application' || isElectron;

	useEffect(() => {
		if (!isMounted || isApp || device !== 'desktop' || typeof window === 'undefined' || typeof navigator === 'undefined') {
			setIsDesktopRunning(false);
			return;
		}
		const ua = navigator.userAgent || '';
		const isMobileOrTabletUa =
			/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(ua) ||
			Boolean((navigator as any).userAgentData?.mobile) ||
			(ua.toLowerCase().includes('mac') && navigator.maxTouchPoints > 2);
		if (isMobileOrTabletUa) {
			setIsDesktopRunning(false);
			return;
		}

		let cancelled = false;
		const ports = [41990, 41991, 41992];

		const checkDesktopRunning = async () => {
			for (const port of ports) {
				try {
					const controller = new AbortController();
					const timeout = setTimeout(() => controller.abort(), 1200);
					const res = await fetch(`http://127.0.0.1:${port}/status`, {
						method: 'GET',
						cache: 'no-store',
						signal: controller.signal,
					});
					clearTimeout(timeout);
					if (res.ok) {
						const data = await res.json();
						if (data?.running && data?.app === 'xernerx-desktop') {
							if (!cancelled) {
								setIsDesktopRunning(true);
								setDesktopBridgePort(port);
							}
							return;
						}
					}
				} catch {}
			}
			if (!cancelled) setIsDesktopRunning(false);
		};

		void checkDesktopRunning();
		const handleFocusOrVis = () => {
			if (document.visibilityState === 'visible') void checkDesktopRunning();
		};
		window.addEventListener('focus', handleFocusOrVis);
		document.addEventListener('visibilitychange', handleFocusOrVis);
		const interval = setInterval(() => {
			if (document.visibilityState === 'visible') void checkDesktopRunning();
		}, 12000);

		return () => {
			cancelled = true;
			window.removeEventListener('focus', handleFocusOrVis);
			document.removeEventListener('visibilitychange', handleFocusOrVis);
			clearInterval(interval);
		};
	}, [isMounted, isApp, device]);

	const handleOpenInDesktop = async () => {
		if (typeof window === 'undefined') return;
		const currentUrl = window.location.href;
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 1200);
			const res = await fetch(`http://127.0.0.1:${desktopBridgePort}/open?url=${encodeURIComponent(currentUrl)}`, {
				method: 'GET',
				cache: 'no-store',
				signal: controller.signal,
			});
			clearTimeout(timeout);
			if (res.ok) return;
		} catch {}
		window.location.href = `xernerx://open?url=${encodeURIComponent(currentUrl)}`;
	};

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuOpen(false);
			if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setNotificationsOpen(false);
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		if (state !== 'hidden' || !activeUser || onboardingStage.active) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
				e.preventDefault();
				setOptionsOpen(true);
				setNotificationsOpen((prev) => (!prev && setUserMenuOpen(false), !prev));
			}
			if (e.key === 'Escape') {
				setNotificationsOpen(false);
				setUserMenuOpen(false);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [state, activeUser, onboardingStage.active]);

	useEffect(() => {
		setUserMenuOpen(false);
		setNotificationsOpen(false);
		const electronBridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (electronBridge?.setActivity) {
			const host = window.location.hostname;
			const port = window.location.port;
			const activityMap: Array<[boolean, string]> = [
				[port === '4003' || host.startsWith('account.'), 'Account Settings'],
				[port === '4005' || host.startsWith('docs.'), 'Developer Docs'],
				[port === '4006' || host.startsWith('admin.'), 'Admin Portal'],
				[port === '4007' || host.startsWith('info.'), 'Support & Roadmap'],
				[port === '4008' || host.startsWith('store.'), 'Xernerx Store'],
				[port === '4009' || host.startsWith('portal.') || Boolean(pathname?.startsWith('/portal')), 'Developer Portal'],
				[port === '4010' || host.startsWith('hosting.'), 'Server Hosting'],
				[port === '4011' || host.startsWith('haste.'), 'Xernerx Haste'],
				[port === '4012' || host.startsWith('blog.'), 'Xernerx Blog'],
				[Boolean(pathname?.startsWith('/dashboard')), 'Server Dashboard'],
				[Boolean(pathname?.startsWith('/overlay')), 'Live Overlay Monitor'],
			];
			const isHosting = port === '4010' || host.startsWith('hosting.');
			const isAdmin = port === '4006' || host.startsWith('admin.');
			const appLabel = activityMap.find(([cond]) => cond)?.[1] || 'Xernerx App';
			const stateLabel = isHosting ? 'Managing Infrastructure' : isAdmin ? 'Staff Workspace' : view ? `Viewing ${view.replace(/[-_]+/g, ' ')}` : 'Exploring Xernerx Suite';
			electronBridge.setActivity({ details: appLabel, state: stateLabel });
		}
	}, [pathname, view]);

	const avatarUrl = activeUser?.avatar
		? `https://cdn.discordapp.com/avatars/${activeUser.id}/${activeUser.avatar}.${activeUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
		: activeUser?.image;
	const decorationUrl =
		preferences.showDiscordCollectibles && activeUser?.avatar_decoration_data?.asset ? `https://cdn.discordapp.com/avatar-decoration-presets/${activeUser.avatar_decoration_data.asset}.png` : null;

	useEffect(() => {
		if (!activeUser?.id) return;
		(window as any).electron?.syncAccountProfile?.({
			id: String(activeUser.id),
			username: activeUser.username || activeUser.name,
			globalName: activeUser.global_name || activeUser.name,
			avatar: avatarUrl,
		});
	}, [activeUser, avatarUrl]);

	const hasLoadedCredits = !userLoading && Boolean(discordUser?.credits);
	const isTourPostponed =
		isMounted &&
		Boolean(activeUser) &&
		!userLoading &&
		Boolean(localTourPostponed || (discordUser as any)?.onboarding?.tourPostponed || (discordUser?.agreedTerms && discordUser?.agreedPrivacy && !(discordUser as any)?.onboarding?.completedAt));
	const giftInTime = hasLoadedCredits && discordUser?.credits?.giftIn ? new Date(discordUser.credits.giftIn).getTime() : null;
	const isGiftReady =
		preferences.showGiftBadge && isMounted && hasLoadedCredits && (giftInTime !== null ? Number.isFinite(giftInTime) && Date.now() >= giftInTime : (discordUser?.credits?.streak ?? 0) === 0);

	useEffect(() => {
		if (!hasLoadedCredits || !isGiftReady || !discordUser?.id || typeof window === 'undefined') return;
		const bridge = (window as any).electron;
		if (!bridge?.notify) return;
		try {
			const storageKey = `xernerx-gift-notified:${discordUser.id}`;
			const cycleStamp = giftInTime !== null ? String(giftInTime) : 'streak-0';
			if (localStorage.getItem(storageKey) === cycleStamp) return;
			localStorage.setItem(storageKey, cycleStamp);
			bridge.notify({ title: t('www.download.preview.dailyRewardReady'), body: t('components.cards.sidebaruser.text1'), link: getEnvUrl('https://account.xernerx.com/?tab=billing') });
		} catch {}
	}, [hasLoadedCredits, isGiftReady, discordUser?.id, giftInTime, t, getEnvUrl]);

	const DeviceIcon = deviceIcons[device?.toLowerCase() as keyof typeof deviceIcons];
	const iconStyles = 'text-(--accent-green) absolute -bottom-0.5 -right-0.5 h-[12px] w-[12px] border-2 border-(--background) rounded-full bg-(--foreground)/30 backdrop-blur-md z-20';

	const effectiveIsDev = isMounted ? isDev : false;
	const effectiveIsCanary = isMounted ? isCanary : false;

	const renderBanner = () => {
		if (effectiveIsDev) return <BannerDev className="h-10 text-(--accent) hover:text-(--accent-orange) transition-colors" />;
		if (effectiveIsCanary) return <BannerCanary className="h-10 text-(--accent) hover:text-(--hover-accent) transition-colors" />;
		return <BannerPublic className="h-10 text-(--accent) hover:text-(--hover-accent) transition-colors" />;
	};

	const getInitialUrlState = () => {
		if (typeof window === 'undefined') return { pre: 'app', env: 'public', path: '/' };
		const host = window.location.hostname;
		const port = window.location.port;
		const isLocalHost = host === 'localhost' || host === '127.0.0.1' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
		const env = host.includes('.dev.') || isLocalHost ? 'dev' : host.includes('.canary.') ? 'canary' : 'public';
		let pre = 'app';
		const pairs = '4000:www,4001:api,4002:cdn,4003:account,4004:app,4005:docs,4006:admin,4007:info,4008:store,4009:portal,4010:hosting,4011:haste,4012:blog'.split(',').map((s) => s.split(':'));
		const matchedPort = pairs.find(([p]) => p === port)?.[1];
		if (isLocalHost && matchedPort) pre = matchedPort;
		else pairs.forEach(([, p]) => host.startsWith(`${p}.`) && (pre = p));

		const params = new URLSearchParams(window.location.search);
		if (state !== 'hidden' && view && !params.has('view')) params.set('view', view);
		const queryStr = params.toString();
		return { pre, env, path: pathname + (queryStr ? `?${queryStr}` : '') + (window.location.hash || '') };
	};

	const urlState = getInitialUrlState();

	const btnClassMap: Record<string, string> = {
		xernerx:
			'h-8 w-8 rounded-full bg-(--foreground)/50 border border-(--border)/15 flex items-center justify-center text-(--text-muted) hover:bg-(--accent)/20 hover:border-(--accent)/40 hover:text-(--accent) transition-all cursor-pointer',
		squircle:
			'h-8 w-8 rounded-xl bg-(--foreground)/50 border border-(--border)/15 flex items-center justify-center text-(--text-muted) hover:bg-(--accent)/20 hover:border-(--accent)/40 hover:text-(--accent) transition-all cursor-pointer',
		capsule: 'h-7 w-7 rounded-full flex items-center justify-center text-(--text-muted) hover:bg-(--accent)/20 hover:text-(--accent) transition-all cursor-pointer',
		minimal:
			'h-8 w-8 rounded-full bg-(--accent)/8 hover:bg-(--accent)/20 border border-(--accent)/20 flex items-center justify-center text-(--text-muted) hover:text-(--accent) transition-all cursor-pointer',
		macos: 'h-8 w-8 rounded-xl bg-(--foreground)/25 hover:bg-(--foreground)/60 border border-(--border)/10 flex items-center justify-center text-(--text-muted) hover:text-(--accent) transition-all cursor-pointer',
	};
	const headerIconBtnClass = btnClassMap[effectiveControls] || 'flex items-center text-(--text) cursor-pointer hover:text-(--accent) transition-colors';

	return (
		<div className="relative flex flex-col w-full z-[9999] shrink-0 bg-(--background)" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
			<header
				className={`relative flex ${isRightAligned ? 'flex-row-reverse' : ''} h-[50px] shrink-0 items-center justify-between w-full bg-(--background) touch-none transition-all duration-300 ${
					isItemHighlighted('logo') ? 'border-b border-(--accent)/60 shadow-[0_4px_24px_color-mix(in_srgb,var(--accent)_30%,transparent)]' : ''
				}`}
				style={{
					paddingLeft: 'calc(var(--ui-gap) + env(safe-area-inset-left, 0px))',
					paddingRight: 'calc(var(--ui-gap) + env(safe-area-inset-right, 0px))',
					fontSize: 'var(--text-scale, 14px)',
				}}
			>
				{effectiveIsDev && <div className="absolute inset-x-0 top-0 h-[2px] bg-(--accent-orange) shadow-[0_0_12px_color-mix(in_srgb,var(--accent-orange)_80%,transparent)]" />}
				{effectiveIsCanary && <div className="absolute inset-x-0 top-0 h-[2px] bg-(--accent) shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_80%,transparent)]" />}

				<div className={`flex ${isRightAligned ? 'flex-row-reverse' : ''} items-center shrink-0`} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
					{!isRightAligned && effectiveControls === 'macos' && (
						<div style={{ marginRight: 'var(--ui-gap)' }}>
							<HeaderWindowControls isApp={isApp} effectiveControls={effectiveControls} />
						</div>
					)}

					{state !== 'hidden' && !isHeaderBuildMode && (
						<button
							type="button"
							disabled={onboardingStage.active}
							aria-label={t('components.sidebar.title')}
							title={t('components.sidebar.title')}
							onClick={() => (window.innerWidth < 768 ? setMobileOpen(!isMobileOpen) : toggle())}
							className={`relative z-10 ${effectiveControls === 'windows' ? 'p-2' : ''} ${headerIconBtnClass} ${
								(isSidebarBuildMode && (onboardingStage.sidebarStepId === 'toggle' || onboardingStage.sidebarStepId === 'collapse')) ||
								(onboardingStage.active && ((onboardingStage as any).pageTourTarget === 'dash-sidebar' || (onboardingStage as any).pageTourTarget === 'portal-orgs'))
									? activeRingClass
									: ''
							} ${onboardingStage.active ? 'pointer-events-none select-none' : ''}`}
							style={isRightAligned ? { marginLeft: 'var(--ui-gap)' } : { marginRight: 'var(--ui-gap)' }}
						>
							{state == 'open' ? (
								<SidebarOpen size={effectiveControls === 'windows' ? 20 : 16} strokeWidth={2.5} className={isRightAligned ? 'scale-x-[-1]' : ''} />
							) : (
								<SidebarClose size={effectiveControls === 'windows' ? 20 : 16} strokeWidth={2.5} className={isRightAligned ? 'scale-x-[-1]' : ''} />
							)}
						</button>
					)}

					<Link
						href={'/'}
						aria-label="Xernerx Studios"
						onClick={(e) => {
							if (onboardingStage.active) e.preventDefault();
						}}
						className={`${
							effectiveOptionsOpen ? 'static translate-x-0 left-auto' : 'absolute left-1/2 -translate-x-1/2'
						} md:static md:translate-x-0 md:left-auto [.is-electron_&]:static [.is-electron_&]:translate-x-0 [.is-electron_&]:left-auto flex items-center transition-all duration-300 ${
							isItemHighlighted('logo') ? 'drop-shadow-[0_0_12px_var(--accent)] scale-105' : ''
						} ${onboardingStage.active ? 'pointer-events-none select-none' : ''}`}
						draggable={false}
					>
						{renderBanner()}
						<span className="sr-only">Xernerx Studios</span>
					</Link>
				</div>

				<div style={{ flex: 1, WebkitAppRegion: 'drag' } as React.CSSProperties} className="h-full min-w-4" />

				<div
					className={`flex ${isRightAligned ? 'flex-row-reverse' : ''} items-center ${effectiveControls === 'windows' ? 'gap-4' : 'gap-2'} shrink-0 relative z-10`}
					style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
				>
					{!onboardingStage.active && isTourPostponed && (
						<button
							type="button"
							onClick={() => window.dispatchEvent(new CustomEvent('xernerx:open-suite-tutorial', { detail: { resume: true } }))}
							title={t('components.header.continueTourTooltip')}
							className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-(--accent)/15 hover:bg-(--accent) border border-(--accent)/35 text-xs font-extrabold text-(--accent) hover:text-white transition-all cursor-pointer whitespace-nowrap shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_20%,transparent)] shrink-0"
						>
							<Sparkles size={13} className="shrink-0" />
							<span>{t('components.header.continueTour')}</span>
						</button>
					)}

					<div
						className={`${effectiveOptionsOpen ? 'flex animate-in fade-in slide-in-from-right-2 duration-150' : 'hidden md:flex'} ${isRightAligned ? 'flex-row-reverse' : ''} items-center ${
							effectiveControls === 'windows' ? 'gap-4' : effectiveControls === 'capsule' ? 'gap-1.5 rounded-full bg-(--foreground)/50 border border-(--border)/15 px-2 py-0.5' : 'gap-2'
						} shrink-0 ${onboardingStage.active ? 'pointer-events-none select-none' : ''}`}
					>
						{!onboardingStage.active && !isApp && preferences.showHeaderDownload && (
							<div className="hidden sm:flex [.is-electron_&]:!hidden items-center gap-2">
								{isDesktopRunning && (
									<button
										type="button"
										onClick={handleOpenInDesktop}
										title={t('components.header.openInDesktop')}
										className="flex items-center gap-1.5 rounded-full bg-(--accent)/10 hover:bg-(--accent)/20 border border-(--accent)/30 px-2.5 py-1 text-xs font-bold text-(--accent) transition-colors cursor-pointer whitespace-nowrap"
									>
										<Monitor size={13} className="shrink-0" />
										<span className="hidden lg:inline">{t('components.header.openInDesktop')}</span>
									</button>
								)}
								<motion.div
									animate={{ width: isExpanded ? 'auto' : '20px' }}
									onHoverStart={() => setIsExpanded(true)}
									onHoverEnd={() => setIsExpanded(false)}
									className="flex items-center overflow-hidden"
								>
									<Link
										suppressHydrationWarning
										href={getEnvUrl('https://www.xernerx.com/download')}
										className="flex items-center gap-2 text-(--text) cursor-pointer hover:text-(--accent) transition-colors whitespace-nowrap"
									>
										<Download size={20} className="shrink-0" />
										<motion.span animate={{ opacity: isExpanded ? 1 : 0 }} className="font-medium">
											{t('components.header.text1')}
										</motion.span>
									</Link>
								</motion.div>
							</div>
						)}

						{!onboardingStage.active &&
							isMounted &&
							isApp &&
							desktopUpdateState?.outdated &&
							(desktopUpdateState.downloaded || (!desktopUpdateState.downloading && Boolean(desktopUpdateState.downloadUrl))) && (
								<button
									type="button"
									onClick={() => window.dispatchEvent(new CustomEvent('xernerx:open-desktop-updater'))}
									aria-label={
										desktopUpdateState.downloaded
											? t('components.header.updateReady', { version: desktopUpdateState.latestVersion || '' })
											: t('components.header.updateAvailable', { version: desktopUpdateState.latestVersion || '' })
									}
									title={
										desktopUpdateState.downloaded
											? t('components.header.updateReady', { version: desktopUpdateState.latestVersion || '' })
											: t('components.header.updateAvailable', { version: desktopUpdateState.latestVersion || '' })
									}
									className={`relative ${headerIconBtnClass} ${desktopUpdateState.downloaded ? 'text-(--accent-green)' : 'text-(--accent-orange)'}`}
								>
									{desktopUpdateState.checking ? (
										<RefreshCw size={effectiveControls === 'windows' ? 20 : 16} className="animate-spin text-(--accent)" />
									) : (
										<Download size={effectiveControls === 'windows' ? 20 : 16} />
									)}
									<span
										className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${
											desktopUpdateState.downloaded ? 'bg-(--accent-green)' : 'bg-(--accent-orange)'
										} border-2 border-(--background) animate-pulse`}
									/>
								</button>
							)}

						{(preferences.showHeaderCommandPalette || isHeaderBuildMode) && isItemRevealed('search') && (
							<button
								type="button"
								onClick={() => setSearchOpen(true)}
								aria-label={t('components.header.commandPalette')}
								title={t('components.header.commandPalette')}
								className={`${
									effectiveControls === 'xernerx'
										? 'flex items-center gap-2 h-8 px-3 rounded-full bg-(--foreground)/50 border border-(--border)/15 text-(--text-muted) hover:bg-(--accent)/20 hover:border-(--accent)/40 hover:text-(--text) transition-all cursor-pointer'
										: effectiveControls === 'squircle'
											? 'flex items-center gap-2 h-8 px-3 rounded-xl bg-(--foreground)/50 border border-(--border)/15 text-(--text-muted) hover:bg-(--accent)/20 hover:border-(--accent)/40 hover:text-(--text) transition-all cursor-pointer'
											: effectiveControls === 'capsule'
												? 'flex items-center gap-2 h-7 px-2.5 rounded-full hover:bg-(--accent)/20 text-(--text-muted) hover:text-(--text) transition-all cursor-pointer'
												: effectiveControls === 'minimal'
													? 'flex items-center gap-2 h-8 px-3 rounded-full bg-(--accent)/8 hover:bg-(--accent)/20 border border-(--accent)/20 text-(--text-muted) hover:text-(--text) transition-all cursor-pointer'
													: effectiveControls === 'macos'
														? 'flex items-center gap-2 h-8 px-3 rounded-xl bg-(--foreground)/25 hover:bg-(--foreground)/60 border border-(--border)/10 text-(--text-muted) hover:text-(--text) transition-all cursor-pointer'
														: 'flex items-center gap-2 px-2.5 py-1 rounded-full bg-(--foreground)/40 hover:bg-(--foreground) border border-(--border)/10 hover:border-(--accent)/40 text-(--text-muted) hover:text-(--text) transition-all cursor-pointer'
								} animate-in fade-in zoom-in-75 duration-300 ${isItemHighlighted('search') ? activeRingClass : ''}`}
							>
								<Search size={15} className="text-(--accent)" />
								{preferences.showShortcutHints && <kbd className="hidden md:inline-flex items-center text-[10px] font-mono font-bold text-(--text-muted)">Ctrl K</kbd>}
							</button>
						)}

						{headerSubdomainsCatalog
							.filter(
								(sub) =>
									(!sub.adminOnly || hasPermission(sub.requiredPermission || 'access')) &&
									(isHeaderBuildMode
										? isItemRevealed(sub.id)
										: (Array.isArray(preferences.headerSubdomains) ? preferences.headerSubdomains : DEFAULT_HEADER_SUBDOMAINS).includes(sub.id))
							)
							.map((sub) => {
								const SubIcon = sub.icon;
								const label = t(sub.label);
								const resolvedHref = getEnvUrl(sub.href);
								const isCurrent =
									isMounted &&
									(sub.id === 'dashboard'
										? urlState.pre === 'app' && Boolean(pathname?.startsWith('/dashboard'))
										: sub.id === 'app'
											? urlState.pre === 'app' && !pathname?.startsWith('/dashboard')
											: urlState.pre === sub.id);
								const openCompanionIfModified = (e: React.MouseEvent, isMiddle = false) => {
									const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
									if (bridge?.openCompanionWindow && (isMiddle ? e.button === 1 : e.ctrlKey || e.metaKey || e.shiftKey)) {
										e.preventDefault();
										bridge.openCompanionWindow(resolvedHref);
									}
								};
								return (
									<Link
										key={sub.id}
										suppressHydrationWarning
										href={resolvedHref}
										aria-label={label}
										title={label}
										onClick={(e) => openCompanionIfModified(e, false)}
										onAuxClick={(e) => openCompanionIfModified(e, true)}
										className={`${headerIconBtnClass} ${isCurrent ? 'text-(--accent)' : ''} animate-in fade-in zoom-in-75 duration-300 ${
											isShortcutHighlighted(sub.id) ? activeRingClass : ''
										}`}
									>
										<SubIcon size={effectiveControls === 'windows' ? 20 : 16} />
										<span className="sr-only">{label}</span>
									</Link>
								);
							})}

						{showControlsInHeader && (preferences.showHeaderAppDrawer || isHeaderBuildMode || isSidebarBeforeDockMove) && isItemRevealed('drawer') && (
							<button
								type="button"
								className={`${headerIconBtnClass} animate-in fade-in zoom-in-75 duration-300 ${isItemHighlighted('drawer') ? activeRingClass : ''}`}
								onClick={() => setNavOpen(true)}
								aria-label={t('components.header.title1')}
								title={t('components.header.title1')}
							>
								<LayoutGrid size={effectiveControls === 'windows' ? 20 : 16} />
							</button>
						)}

						{isMounted && showControlsInHeader && activeUser && (preferences.showHeaderNotifications || isHeaderBuildMode || isSidebarBeforeDockMove) && isItemRevealed('alerts') && (
							<div ref={notificationsRef} className="relative flex items-center animate-in fade-in zoom-in-75 duration-300">
								<button
									type="button"
									onClick={() => setNotificationsOpen((prev) => (!prev && setUserMenuOpen(false), !prev))}
									aria-label={t('components.header.notifications')}
									title={t('components.header.notifications')}
									className={`relative ${headerIconBtnClass} ${notificationsOpen ? 'text-(--accent)' : ''} ${isItemHighlighted('alerts') ? activeRingClass : ''}`}
								>
									<Bell size={effectiveControls === 'windows' ? 20 : 16} />
									{hasUnread && (
										<span className="absolute -top-1.5 -right-1.5 flex min-w-[16px] h-[16px] px-1 items-center justify-center rounded-full bg-(--accent-red) text-[9px] font-extrabold leading-none text-white border-2 border-(--background) shadow-xs">
											{totalUnreadCount > 9 ? '9+' : totalUnreadCount}
										</span>
									)}
								</button>
								<AnimatePresence>{notificationsOpen && <SidebarNotifications isCollapsed={false} placement="top" onClose={() => setNotificationsOpen(false)} />}</AnimatePresence>
							</div>
						)}

						{isMounted && showControlsInHeader && activeUser && isItemRevealed('profile') && (
							<div ref={userMenuRef} className="relative flex items-center animate-in fade-in zoom-in-75 duration-300">
								<button
									type="button"
									onClick={() => setUserMenuOpen((prev) => (!prev && setNotificationsOpen(false), !prev))}
									className={`relative flex items-center justify-center rounded-full transition-transform hover:scale-105 cursor-pointer focus:outline-hidden ${
										isItemHighlighted('profile') ? activeRingClass : ''
									}`}
									aria-label={activeUser?.global_name || activeUser?.name || t('components.sidebar.alt')}
									title={activeUser?.global_name || activeUser?.name || t('components.sidebar.alt')}
								>
									<div className="relative shrink-0">
										{avatarUrl ? (
											<div className="relative h-8 w-8">
												<Image
													src={avatarUrl}
													alt={t('components.sidebar.alt')}
													fill
													className="rounded-full border border-(--border)/20 object-cover"
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
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--foreground)/30 border border-(--border)/20">
												<UserIcon size={16} className="text-(--text-muted)" />
											</div>
										)}
										{DeviceIcon ? <DeviceIcon className={iconStyles} /> : <div className={`${iconStyles} rounded-full`} />}
										{isGiftReady && (
											<span
												title={t('components.cards.sidebaruser.text1')}
												className="absolute -top-1 -left-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-(--accent-orange) text-white shadow-md border border-(--background) animate-pulse"
											>
												<Gift size={10} />
											</span>
										)}
									</div>
								</button>
								<AnimatePresence>{userMenuOpen && <SidebarUserCard activeUser={activeUser} placement="top" onClose={() => setUserMenuOpen(false)} />}</AnimatePresence>
							</div>
						)}
					</div>

					{(!isHeaderBuildMode || isItemRevealed('mobile-tray')) && (
						<button
							type="button"
							disabled={onboardingStage.active}
							aria-label={t('components.header.title1')}
							title={t('components.header.title1')}
							onClick={() => setOptionsOpen((prev) => (prev && (setNotificationsOpen(false), setUserMenuOpen(false)), !prev))}
							className={`relative md:hidden ${headerIconBtnClass} ${isItemHighlighted('mobile-tray') ? activeRingClass : ''} ${
								onboardingStage.active ? 'pointer-events-none select-none' : ''
							}`}
						>
							<ChevronLeft
								size={effectiveControls === 'windows' ? 20 : 16}
								strokeWidth={2.5}
								className={`transition-transform duration-200 ${
									isRightAligned ? (effectiveOptionsOpen ? 'text-(--accent)' : 'rotate-180') : effectiveOptionsOpen ? 'rotate-180 text-(--accent)' : ''
								}`}
							/>
							{isMounted && !effectiveOptionsOpen && state === 'hidden' && (hasUnread || isGiftReady) && (
								<span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-(--accent) border-2 border-(--background)" />
							)}
						</button>
					)}

					{(isRightAligned || effectiveControls !== 'macos') && <HeaderWindowControls isApp={isApp} effectiveControls={effectiveControls} />}
				</div>
			</header>
			<HeaderOmnibar
				isOpen={isUrlPlacerOpen}
				onClose={() => setUrlPlacerOpen(false)}
				urlState={urlState}
				resolveOmnibarUrl={resolveOmnibarUrl}
				hasAdminAccess={hasAdminAccess}
				hasHostingAccess={hasHostingAccess}
			/>
		</div>
	);
}
