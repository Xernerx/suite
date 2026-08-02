/** @format */
'use client';

import { Compass, SidebarClose, SidebarOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEnvironment, useShortcuts, useSidebar } from '@xernerx/providers';

import BannerCanary from '../../public/banner-canary.svg';
import BannerDev from '../../public/banner-dev.svg';
import BannerPublic from '../../public/banner.svg';
import Link from 'next/link';

export function Header() {
	const { state, toggle, setMobileOpen, isMobileOpen } = useSidebar();
	const { isDev, isCanary } = useEnvironment();
	const { setNavOpen } = useShortcuts();

	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// During SSR and initial hydration, default to false to match server HTML
	const effectiveIsDev = isMounted ? isDev : false;
	const effectiveIsCanary = isMounted ? isCanary : false;

	// Helper to dynamically render the correct SVG with its respective environment color
	const renderBanner = () => {
		if (effectiveIsDev) {
			return <BannerDev className='h-10 text-(--accent) hover:text-orange-400 transition-colors' />;
		}
		if (effectiveIsCanary) {
			return <BannerCanary className='h-10 text-(--accent) hover:text-blue-400 transition-colors' />;
		}
		return <BannerPublic className='h-10 text-(--accent) hover:text-(--hover-accent) transition-colors' />;
	};

	return (
		<header
			className='relative z-[60] flex h-[72px] shrink-0 items-center justify-between w-full bg-(--background)'
			style={{
				paddingLeft: 'var(--ui-gap)',
				paddingRight: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}>
			{/* Ambient Environment Glow (Top Border) */}
			{effectiveIsDev && <div className='absolute inset-x-0 top-0 h-[2px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]' />}
			{effectiveIsCanary && <div className='absolute inset-x-0 top-0 h-[2px] bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]' />}

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
						className='relative z-10 p-2 text-(--text-muted) transition-colors hover:text-(--text)'
						style={{ marginRight: 'var(--ui-gap)' }}>
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
