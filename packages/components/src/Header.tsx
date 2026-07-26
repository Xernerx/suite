/** @format */
'use client';

import { SidebarClose, SidebarOpen } from 'lucide-react';

import Banner from '../../public/banner.svg';
import Link from 'next/link';
import { useSidebar } from '@xernerx/providers';

export function Header() {
	const { state, toggle, setMobileOpen, isMobileOpen } = useSidebar();

	return (
		<header className='flex h-[72px] shrink-0 items-center px-4 md:px-6 w-full'>
			{state !== 'hidden' && (
				<button
					onClick={() => {
						if (window.innerWidth < 768) {
							setMobileOpen(!isMobileOpen);
						} else {
							toggle();
						}
					}}
					className='mr-4 p-2 text-(--text-muted) transition-colors hover:text-(--text)'>
					{state == 'open' ? <SidebarOpen size={24} strokeWidth={2.5} /> : <SidebarClose size={24} strokeWidth={2.5} />}
				</button>
			)}

			<Link href={'/'}>
				<Banner className='text-(--accent) hover:test-(--hover-accent) h-10' />
			</Link>
		</header>
	);
}
