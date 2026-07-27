/** @format */
'use client';

import { Compass, SidebarClose, SidebarOpen } from 'lucide-react';
import { useEnvironment, useShortcuts, useSidebar } from '@xernerx/providers';

import BannerCanary from '../../public/banner-canary.svg';
import BannerDev from '../../public/banner-dev.svg';
import BannerPublic from '../../public/banner.svg';
import Link from 'next/link';

export function Header() {
	const { state, toggle, setMobileOpen, isMobileOpen } = useSidebar();
	const { isDev, isCanary } = useEnvironment();
	const { setNavOpen } = useShortcuts();

	// Helper to dynamically render the correct SVG with its respective environment color
	const renderBanner = () => {
		if (isDev) {
			return <BannerDev className='h-10 text-(--accent) hover:text-orange-400 transition-colors' />;
		}
		if (isCanary) {
			return <BannerCanary className='h-10 text-(--accent) hover:text-blue-400 transition-colors' />;
		}
		return <BannerPublic className='h-10 text-(--accent) hover:text-(--hover-accent) transition-colors' />;
	};

	return (
		<header className='relative z-[60] flex h-[72px] shrink-0 items-center justify-between px-4 md:px-6 w-full bg-(--background)'>
			{/* Ambient Environment Glow (Top Border) */}
			{isDev && <div className='absolute inset-x-0 top-0 h-[2px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]' />}
			{isCanary && <div className='absolute inset-x-0 top-0 h-[2px] bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]' />}

			<div className='flex items-center'>
				{state !== 'hidden' && (
					<button
						onClick={() => {
							if (window.innerWidth < 768) {
								setMobileOpen(!isMobileOpen);
							} else {
								toggle();
							}
						}}
						className='relative z-10 mr-4 p-2 text-(--text-muted) transition-colors hover:text-(--text)'>
						{state == 'open' ? <SidebarOpen size={24} strokeWidth={2.5} /> : <SidebarClose size={24} strokeWidth={2.5} />}
					</button>
				)}

				<Link href={'/'} className='absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:left-auto flex items-center'>
					{renderBanner()}
				</Link>
			</div>

			{state === 'hidden' && (
				<button onClick={() => setNavOpen(true)} title='Open Navigation (Ctrl + K)'>
					<Compass size={18} className='text-(--text-muted) cursor-pointer hover:text-(--text)' />
				</button>
			)}
		</header>
	);
}
