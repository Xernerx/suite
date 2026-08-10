/** @format */
'use client';

import { Copy, Download, LayoutGrid, Minus, SidebarClose, SidebarOpen, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEnvironment, usePlatform, useShortcuts, useSidebar } from '@xernerx/providers';

import BannerCanary from '../../public/banner-canary.svg';
import BannerDev from '../../public/banner-dev.svg';
import BannerPublic from '../../public/banner.svg';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function Header() {
	const { state, toggle, setMobileOpen, isMobileOpen } = useSidebar();
	const { type } = usePlatform();
	const { getEnvUrl } = useEnvironment();
	const [maximized, setMaximized] = useState(false);

	const [isExpanded, setIsExpanded] = useState(true);

	async function toggleMaximize() {
		const electron = (window as any).electron;
		await electron?.maximize?.();
		setMaximized((await electron?.isMaximized?.())!);
	}

	const { isDev, isCanary } = useEnvironment();
	const { setNavOpen } = useShortcuts();

	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
		const timer = setTimeout(() => setIsExpanded(false), 2000);
		return () => clearTimeout(timer);
	}, []);

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

	return (
		<header
			className="relative z-[60] flex h-[50px] shrink-0 items-center justify-between w-full bg-(--background)"
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
								Download the app!
							</motion.span>
						</Link>
					</motion.div>
				)}

				{state === 'hidden' && (
					<button className="text-(--text) cursor-pointer hover:text-(--accent)" onClick={() => setNavOpen(true)} title="Open App Drawer (Ctrl + K)">
						<LayoutGrid size={20} />
					</button>
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
	);
}
