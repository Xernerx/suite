/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Copy, Download, Home, LayoutGrid, Minus, Monitor, RotateCw, Search, SidebarClose, SidebarOpen, Smartphone, Square, Tablet, User as UserIcon, X } from 'lucide-react';
import { useDictionary, useEnvironment, usePlatform, useShortcuts, useSidebar, useUser } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import BannerCanary from '../../public/banner-canary.svg';
import BannerDev from '../../public/banner-dev.svg';
import BannerPublic from '../../public/banner.svg';
import Image from 'next/image';
import Link from 'next/link';
import SidebarUserCard from './cards/SidebarUser';

export function SubSelector({ name, options, defaultValue }: { name: string; options: string[]; defaultValue: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const [value, setValue] = useState(defaultValue);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			window.addEventListener('click', handleClickOutside);
		}
		return () => window.removeEventListener('click', handleClickOutside);
	}, [isOpen]);

	return (
		<div ref={ref} className="relative flex items-center">
			<input type="hidden" name={name} value={value} />
			<div className="text-sm font-medium text-(--text) cursor-pointer hover:text-(--accent) transition-colors flex items-center select-none" onClick={() => setIsOpen(!isOpen)}>
				{value}
			</div>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -5, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -5, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-(--background) border border-white/10 rounded-md shadow-xl overflow-hidden min-w-[120px] z-[9999] flex flex-col p-1"
					>
						{options.map((option) => (
							<div
								key={option}
								className={`px-3 py-1.5 text-sm font-medium rounded-sm cursor-pointer transition-colors ${value === option ? 'bg-(--accent)/10 text-(--accent)' : 'text-(--text) hover:bg-(--foreground)'}`}
								onClick={() => {
									setValue(option);
									setIsOpen(false);
								}}
							>
								{option}
							</div>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

const deviceIcons = {
	desktop: Monitor,
	mobile: Smartphone,
	tablet: Tablet,
} as const;

export function Header() {
	const { state, toggle, setMobileOpen, isMobileOpen } = useSidebar();
	const { t } = useDictionary();
	const { type, device } = usePlatform();
	const { getEnvUrl } = useEnvironment();
	const [maximized, setMaximized] = useState(false);

	const { data: session } = useSession();
	const { user: discordUser } = useUser();
	const activeUser = discordUser || session?.user;

	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);

	const [isExpanded, setIsExpanded] = useState(true);

	async function toggleMaximize() {
		const electron = (window as any).electron;
		await electron?.maximize?.();
		setMaximized((await electron?.isMaximized?.())!);
	}

	const { isDev, isCanary } = useEnvironment();
	const { setNavOpen, isUrlPlacerOpen, setUrlPlacerOpen } = useShortcuts();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
		const timer = setTimeout(() => setIsExpanded(false), 2000);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setUserMenuOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		setUserMenuOpen(false);
	}, [pathname]);

	const avatarUrl = activeUser?.avatar
		? `https://cdn.discordapp.com/avatars/${activeUser.id}/${activeUser.avatar}.${activeUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
		: activeUser?.image;
	const decorationUrl = activeUser?.avatar_decoration_data?.asset ? `https://cdn.discordapp.com/avatar-decoration-presets/${activeUser.avatar_decoration_data.asset}.png` : null;

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
		const env = host.includes('.dev.') || host === 'localhost' ? 'dev' : host.includes('.canary.') ? 'canary' : 'public';

		let pre = 'app';
		['www', 'api', 'docs', 'admin', 'account'].forEach((p) => {
			if (host.startsWith(`${p}.`)) pre = p;
		});

		const searchStr = searchParams.toString();
		return { pre, env, path: pathname + (searchStr ? `?${searchStr}` : '') };
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

				<div className="flex items-center">
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

				<div style={{ flex: 1, WebkitAppRegion: 'drag' } as React.CSSProperties} className="w-full h-full" />

				<div className="flex items-center gap-4">
					{type !== 'application' && (
						<motion.div
							animate={{ width: isExpanded ? 'auto' : '20px' }}
							onHoverStart={() => setIsExpanded(true)}
							onHoverEnd={() => setIsExpanded(false)}
							className="hidden sm:flex items-center overflow-hidden"
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

					{state === 'hidden' && (
						<button className="text-(--text) cursor-pointer hover:text-(--accent)" onClick={() => setNavOpen(true)} title={t('components.header.title1')}>
							<LayoutGrid size={20} />
						</button>
					)}

					{isMounted && state === 'hidden' && activeUser && (
						<div ref={userMenuRef} className="relative flex items-center">
							<button
								onClick={() => setUserMenuOpen((prev) => !prev)}
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
								</div>
							</button>

							<AnimatePresence>{userMenuOpen && <SidebarUserCard activeUser={activeUser} placement="top" onClose={() => setUserMenuOpen(false)} />}</AnimatePresence>
						</div>
					)}

					{type === 'application' && (
						<>
							<button className="text-(--text) cursor-pointer hover:text-(--accent)" onClick={() => (window as any).electron?.minimize?.()}>
								<Minus size={20} />
							</button>

							<button className="text-(--text) cursor-pointer hover:text-(--accent)" onClick={toggleMaximize}>
								{maximized ? <Copy size={20} /> : <Square size={14} />}
							</button>

							<button className="text-(--text) cursor-pointer hover:text-(--accent-red)" onClick={() => (window as any).electron?.close?.()}>
								<X size={20} />
							</button>
						</>
					)}
				</div>
			</header>
			<AnimatePresence>
				{isUrlPlacerOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
						animate={{ height: 44, opacity: 1, transitionEnd: { overflow: 'visible' } }}
						exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
						transition={{ type: 'spring', stiffness: 400, damping: 30 }}
						className="flex items-center w-full shrink-0 bg-(--background) px-4 gap-3 relative z-[999]"
					>
						<div className="flex items-center gap-1">
							<button onClick={() => window.history.back()} className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-md transition-all">
								<ArrowLeft size={16} strokeWidth={2.5} />
							</button>
							<button onClick={() => window.history.forward()} className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-md transition-all">
								<ArrowRight size={16} strokeWidth={2.5} />
							</button>
							<button onClick={() => window.location.reload()} className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-md transition-all">
								<RotateCw size={16} strokeWidth={2.5} />
							</button>
							<button onClick={() => (window.location.href = '/')} className="text-(--text-muted) hover:text-(--text) hover:bg-(--foreground) p-1.5 rounded-md transition-all ml-1">
								<Home size={16} strokeWidth={2.5} />
							</button>
						</div>

						<form
							className="flex flex-1 items-center bg-(--foreground) rounded-full h-[30px] px-3 border border-white/10 ml-1 focus-within:ring-2 focus-within:ring-(--accent)/20 focus-within:border-(--accent) transition-all shadow-sm"
							onSubmit={(e) => {
								e.preventDefault();
								const pre = (e.currentTarget.elements.namedItem('pre') as HTMLSelectElement).value;
								const env = (e.currentTarget.elements.namedItem('env') as HTMLSelectElement).value;
								const path = (e.currentTarget.elements.namedItem('path') as HTMLInputElement).value;

								const domain = 'xernerx.com';
								let fullPath = path.trim();
								if (fullPath && !fullPath.startsWith('/')) {
									fullPath = '/' + fullPath;
								}

								const url = `https://${pre}.${env === 'public' ? '' : env + '.'}${domain}${fullPath}`;
								window.location.href = url;
							}}
						>
							<span className="text-(--text-muted) select-none text-sm font-medium pr-1">https://</span>
							<SubSelector name="pre" options={['app', 'www', 'api', 'docs', 'admin', 'account']} defaultValue={urlState.pre} />
							<span className="text-(--text-muted) select-none text-sm font-medium px-0.5">.</span>
							<SubSelector name="env" options={['public', 'canary', 'dev']} defaultValue={urlState.env} />
							<span className="text-(--text-muted) select-none text-sm font-medium pl-0.5 pr-2">.xernerx.com</span>
							<input
								key={urlState.path}
								name="path"
								type="text"
								placeholder="/path"
								className="bg-transparent border-none outline-none text-sm font-medium w-full text-(--text) placeholder:text-(--text-muted)/70"
								autoFocus
								defaultValue={urlState.path}
							/>
						</form>

						<button onClick={() => setUrlPlacerOpen(false)} className="text-(--text-muted) hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-all">
							<X size={16} strokeWidth={2.5} />
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
