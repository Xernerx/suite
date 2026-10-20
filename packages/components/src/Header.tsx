/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Copy, Download, Gift, LayoutGrid, Minus, Monitor, Search, SidebarClose, SidebarOpen, Smartphone, Square, Store, Tablet, User as UserIcon, X } from 'lucide-react';
import { useDictionary, useEnvironment, useNotifications, usePlatform, useShortcuts, useSidebar, useUser } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

import BannerCanary from '../../public/banner-canary.svg';
import BannerDev from '../../public/banner-dev.svg';
import BannerPublic from '../../public/banner.svg';
import Image from 'next/image';
import Link from 'next/link';
import SidebarNotifications from './cards/SidebarNotifications';
import SidebarUserCard from './cards/SidebarUser';
import { HeaderOmnibar, SubSelector } from './HeaderOmnibar';

export { SubSelector };

const deviceIcons = {
	desktop: Monitor,
	mobile: Smartphone,
	tablet: Tablet,
} as const;

export function Header() {
	const { state, toggle, setMobileOpen, isMobileOpen, view } = useSidebar();
	const { t } = useDictionary();
	const { type, device } = usePlatform();
	const { getEnvUrl, isDev, isCanary } = useEnvironment();
	const [maximized, setMaximized] = useState(false);
	const [isElectron, setIsElectron] = useState(false);

	const { data: session } = useSession();
	const { user: discordUser } = useUser();
	const activeUser = discordUser || session?.user;

	const { notifications } = useNotifications();
	const hasUnread = notifications.some((n) => !n.read);

	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);

	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const notificationsRef = useRef<HTMLDivElement>(null);

	const [isExpanded, setIsExpanded] = useState(true);

	async function toggleMaximize() {
		const electron = (window as any).electron;
		await electron?.maximize?.();
		setMaximized(Boolean(await electron?.isMaximized?.()));
	}

	const { setNavOpen, setSearchOpen, isUrlPlacerOpen, setUrlPlacerOpen } = useShortcuts();
	const pathname = usePathname();

	const resolveOmnibarUrl = (pre: string, env: string, rawPath: string) => {
		let fullPath = rawPath.trim();
		if (fullPath && !fullPath.startsWith('/')) {
			fullPath = '/' + fullPath;
		}
		if (env === 'dev' && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
			return getEnvUrl(`https://${pre}.xernerx.com${fullPath}`);
		}
		return `https://${pre}.${env === 'public' ? '' : env + '.'}xernerx.com${fullPath}`;
	};

	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
		const electronBridge = (window as any).electron;
		const detectedElectron = Boolean(electronBridge) || navigator.userAgent.toLowerCase().includes('electron');
		setIsElectron(detectedElectron);
		if (detectedElectron) {
			document.documentElement.classList.add('is-electron');
		}
		electronBridge?.isMaximized?.()?.then?.((val: boolean) => setMaximized(Boolean(val)));

		const timer = setTimeout(() => setIsExpanded(false), 2000);
		return () => clearTimeout(timer);
	}, []);

	const isApp = type === 'application' || isElectron;

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setUserMenuOpen(false);
			}
			if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
				setNotificationsOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		if (state !== 'hidden' || !activeUser) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
				e.preventDefault();
				setNotificationsOpen((prev) => {
					const next = !prev;
					if (next) setUserMenuOpen(false);
					return next;
				});
			}
			if (e.key === 'Escape') {
				setNotificationsOpen(false);
				setUserMenuOpen(false);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [state, activeUser]);

	useEffect(() => {
		setUserMenuOpen(false);
		setNotificationsOpen(false);
	}, [pathname]);

	const avatarUrl = activeUser?.avatar
		? `https://cdn.discordapp.com/avatars/${activeUser.id}/${activeUser.avatar}.${activeUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
		: activeUser?.image;
	const decorationUrl = activeUser?.avatar_decoration_data?.asset ? `https://cdn.discordapp.com/avatar-decoration-presets/${activeUser.avatar_decoration_data.asset}.png` : null;

	const giftInTime = activeUser?.credits?.giftIn ? new Date(activeUser.credits.giftIn).getTime() : 0;
	const isGiftReady = isMounted && Boolean(activeUser) && Date.now() >= giftInTime;

	const DeviceIcon = deviceIcons[device?.toLowerCase() as keyof typeof deviceIcons];
	const iconStyles = 'text-(--accent-green) absolute -bottom-0.5 -right-0.5 h-[12px] w-[12px] border-2 border-(--background) rounded-full bg-(--foreground)/30 backdrop-blur-md z-20';

	const effectiveIsDev = isMounted ? isDev : false;
	const effectiveIsCanary = isMounted ? isCanary : false;

	const renderBanner = () => {
		if (effectiveIsDev) {
			return <BannerDev className="h-10 text-(--accent) hover:text-orange-400 transition-colors" />;
		}
		if (effectiveIsCanary) {
			return <BannerCanary className="h-10 text-(--accent) hover:text-blue-400 transition-colors" />;
		}
		return <BannerPublic className="h-10 text-(--accent) hover:text-(--hover-accent) transition-colors" />;
	};

	const getInitialUrlState = () => {
		if (typeof window === 'undefined') return { pre: 'app', env: 'public', path: '/' };
		const host = window.location.hostname;
		const port = window.location.port;
		const env = host.includes('.dev.') || host === 'localhost' || host === '127.0.0.1' ? 'dev' : host.includes('.canary.') ? 'canary' : 'public';

		let pre = 'app';
		const portMap: Record<string, string> = {
			'4000': 'www',
			'4001': 'api',
			'4002': 'cdn',
			'4003': 'account',
			'4004': 'app',
			'4005': 'docs',
			'4006': 'admin',
			'4007': 'info',
			'4008': 'store',
		};
		if ((host === 'localhost' || host === '127.0.0.1') && portMap[port]) {
			pre = portMap[port];
		} else {
			['www', 'api', 'cdn', 'docs', 'admin', 'account', 'store', 'info'].forEach((p) => {
				if (host.startsWith(`${p}.`)) pre = p;
			});
		}

		const params = new URLSearchParams(window.location.search);
		if (state !== 'hidden' && view && !params.has('view')) {
			params.set('view', view);
		}
		const queryStr = params.toString();
		return { pre, env, path: pathname + (queryStr ? `?${queryStr}` : '') + (window.location.hash || '') };
	};

	const urlState = getInitialUrlState();

	return (
		<div className="relative flex flex-col w-full z-[9999] shrink-0">
			<header
				className="relative flex h-[50px] shrink-0 items-center justify-between w-full bg-(--background)"
				style={{
					paddingLeft: 'var(--ui-gap)',
					paddingRight: 'var(--ui-gap)',
					fontSize: 'var(--text-scale, 14px)',
				}}
			>
				{effectiveIsDev && <div className="absolute inset-x-0 top-0 h-[2px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />}
				{effectiveIsCanary && <div className="absolute inset-x-0 top-0 h-[2px] bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />}

				<div className="flex items-center shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
					{state !== 'hidden' && (
						<button
							onClick={() => {
								if (window.innerWidth < 768) {
									setMobileOpen(!isMobileOpen);
								} else {
									toggle();
								}
							}}
							className="relative z-10 p-2 text-(--text) transition-colors hover:text-(--accent)"
							style={{ marginRight: 'var(--ui-gap)' }}
						>
							{state == 'open' ? <SidebarOpen size={20} strokeWidth={2.5} /> : <SidebarClose size={20} strokeWidth={2.5} />}
						</button>
					)}

					<Link href={'/'} className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:left-auto flex items-center" draggable={false}>
						{renderBanner()}
					</Link>
				</div>

				<div style={{ flex: 1, WebkitAppRegion: 'drag' } as React.CSSProperties} className="h-full min-w-4" />

				<div className="flex items-center gap-4 shrink-0 relative z-10" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
					{!isApp && (
						<motion.div
							animate={{ width: isExpanded ? 'auto' : '20px' }}
							onHoverStart={() => setIsExpanded(true)}
							onHoverEnd={() => setIsExpanded(false)}
							className="hidden sm:flex [.is-electron_&]:!hidden items-center overflow-hidden"
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
					)}

					<button
						type="button"
						onClick={() => setSearchOpen(true)}
						title={t('components.header.commandPalette')}
						className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-(--foreground)/40 hover:bg-(--foreground) border border-(--border)/10 hover:border-(--accent)/40 text-(--text-muted) hover:text-(--text) transition-all cursor-pointer"
					>
						<Search size={16} className="text-(--accent)" />
						<kbd className="hidden md:inline-flex items-center text-[10px] font-mono font-bold text-(--text-muted)">Ctrl K</kbd>
					</button>

					<Link
						suppressHydrationWarning
						href={getEnvUrl('https://store.xernerx.com')}
						title={t('components.header.store')}
						className="flex items-center text-(--text) cursor-pointer hover:text-(--accent) transition-colors"
					>
						<Store size={20} />
					</Link>

					{state === 'hidden' && (
						<button className="text-(--text) cursor-pointer hover:text-(--accent)" onClick={() => setNavOpen(true)} title={t('components.header.title1')}>
							<LayoutGrid size={20} />
						</button>
					)}

					{isMounted && state === 'hidden' && activeUser && (
						<div ref={notificationsRef} className="relative flex items-center">
							<button
								type="button"
								onClick={() => {
									setNotificationsOpen((prev) => {
										const next = !prev;
										if (next) setUserMenuOpen(false);
										return next;
									});
								}}
								title={t('components.header.notifications')}
								className={`relative text-(--text) cursor-pointer hover:text-(--accent) transition-colors ${notificationsOpen ? 'text-(--accent)' : ''}`}
							>
								<Bell size={20} />
								{hasUnread && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-(--accent) border-2 border-(--background)" />}
							</button>

							<AnimatePresence>{notificationsOpen && <SidebarNotifications isCollapsed={false} placement="top" onClose={() => setNotificationsOpen(false)} />}</AnimatePresence>
						</div>
					)}

					{isMounted && state === 'hidden' && activeUser && (
						<div ref={userMenuRef} className="relative flex items-center">
							<button
								onClick={() => {
									setUserMenuOpen((prev) => {
										const next = !prev;
										if (next) setNotificationsOpen(false);
										return next;
									});
								}}
								className="relative flex items-center justify-center rounded-full transition-transform hover:scale-105 cursor-pointer focus:outline-hidden"
								title={activeUser?.global_name || activeUser?.name || 'User Profile'}
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
											className="absolute -top-1 -left-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-black shadow-md border border-(--background) animate-pulse"
										>
											<Gift size={10} />
										</span>
									)}
								</div>
							</button>

							<AnimatePresence>{userMenuOpen && <SidebarUserCard activeUser={activeUser} placement="top" onClose={() => setUserMenuOpen(false)} />}</AnimatePresence>
						</div>
					)}

					<div className={`${isApp ? 'flex' : 'hidden [.is-electron_&]:flex'} items-center gap-4`}>
						<button className="text-(--text) cursor-pointer hover:text-(--accent)" onClick={() => (window as any).electron?.minimize?.()}>
							<Minus size={20} />
						</button>

						<button className="text-(--text) cursor-pointer hover:text-(--accent)" onClick={toggleMaximize}>
							{maximized ? <Copy size={20} /> : <Square size={14} />}
						</button>

						<button className="text-(--text) cursor-pointer hover:text-(--accent-red)" onClick={() => (window as any).electron?.close?.()}>
							<X size={20} />
						</button>
					</div>
				</div>
			</header>
			<HeaderOmnibar isOpen={isUrlPlacerOpen} onClose={() => setUrlPlacerOpen(false)} urlState={urlState} resolveOmnibarUrl={resolveOmnibarUrl} />
		</div>
	);
}
