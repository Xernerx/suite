/** @format */
'use client';

import { Compass, LogIn, User as UserIcon } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { usePlatform, useSidebar, useUser } from '@xernerx/providers';

import { AnimatePresence } from 'framer-motion';
import { Divider } from '@xernerx/ui';
import Image from 'next/image';
import Link from 'next/link';
import SidebarSuite from './cards/SidebarSuite';
import SidebarUserCard from './cards/SidebarUser';
import { useSession } from 'next-auth/react';

const deviceIcons = {
	desktop: Monitor,
	mobile: Smartphone,
	tablet: Tablet,
} as const;

export function Sidebar() {
	const { data: session } = useSession();
	const { state, isMobileOpen, setMobileOpen, navItems, view, setView } = useSidebar();
	const { user: discordUser } = useUser();
	const { device } = usePlatform();

	// Manage which dropdown is active instead of a single boolean
	const [activeMenu, setActiveMenu] = useState<'none' | 'suite' | 'user'>('none');
	const menuRef = useRef<HTMLDivElement>(null);

	const isCollapsed = state === 'closed' && !isMobileOpen;
	const activeUser = discordUser || session?.user;

	const DeviceIcon = deviceIcons[device?.toLowerCase() as keyof typeof deviceIcons];
	const iconStyles = 'text-(--accent-green) absolute -bottom-0.5 -right-0.5 h-[14px] w-[14px] border-2 border-(--background) rounded-full bg-(--foreground)';

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setActiveMenu('none');
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	if (state === 'hidden') return null;

	return (
		<>
			{/* Mobile Backdrop */}
			{isMobileOpen && <div className='fixed inset-0 top-[72px] z-40 bg-black/50 backdrop-blur-sm md:hidden' onClick={() => setMobileOpen(false)} />}

			<aside
				className={`
                    fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-(--background) transition-all duration-300 ease-in-out
                    w-full pt-[72px] pb-4
                    md:w-64 md:top-0 md:bottom-auto md:sticky md:h-[calc(100vh-72px)] md:pt-0 md:pb-0
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0 
                    ${isCollapsed ? 'md:w-[80px]' : ''}
                `}>
				{/* Navigation Items */}
				<div className='flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pt-4 px-3'>
					{navItems.map((item, idx) => {
						const Icon = item.icon;
						const active = item.view && view === item.view;

						const prevItem = idx > 0 ? navItems[idx - 1] : null;
						const showCategory = item.category && item.category !== prevItem?.category;

						return (
							<Fragment key={idx}>
								{showCategory && (
									<div className={`mt-4 mb-1 transition-all duration-300 ${isCollapsed ? 'flex justify-center' : 'px-4'}`}>
										{isCollapsed ? (
											<div className='h-[1px] w-8 bg-gradient-to-r from-transparent via-(--border) to-transparent' />
										) : (
											<span className='text-[11px] font-bold uppercase tracking-wider text-(--text-muted)'>{item.category}</span>
										)}
									</div>
								)}

								<Link
									href={item.href || '#'}
									onClick={() => {
										if (item.view) setView(item.view);
										if (item.onClick) item.onClick();
										setMobileOpen(false);
									}}
									className={`group relative flex items-center rounded-xl py-3 transition-all duration-200 items-center 
                                        ${active ? 'bg-(--active-accent)/50 text-(--text) font-semibold shadow-xs' : 'text-(--text-muted) hover:bg-(--foreground) hover:text-(--text)'}
                                        ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-4'}
                                    `}>
									{active && !isCollapsed && <div className='absolute left-0 h-5 w-1 rounded-r-full bg-(--accent)' />}

									{Icon && <Icon size={14} strokeWidth={2} className={`shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-(--accent)' : ''}`} />}

									<span
										className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium text-[14px] 
                                        ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
										{item.label}
									</span>
								</Link>
							</Fragment>
						);
					})}
				</div>

				<Divider />
				{/* Bottom Ecosystem & User Section */}

				<div ref={menuRef} className={`relative flex flex-col gap-1 p-3 ${isCollapsed ? 'items-center' : ''}`}>
					{!activeUser ? (
						<Link
							href='/login'
							className={`flex items-center justify-center gap-2 rounded-xl bg-(--accent) text-white transition-colors hover:bg-(--accent-hover) mt-1
                                ${isCollapsed ? 'h-10 w-10 p-0' : 'w-full py-2.5 px-4 font-medium text-sm'}
                            `}>
							<LogIn size={18} />
							{!isCollapsed && <span>Login</span>}
						</Link>
					) : (
						<div className='relative w-full mt-1'>
							{/* Suite Menu Dropdown */}
							<AnimatePresence>{activeMenu === 'suite' && <SidebarSuite isCollapsed={isCollapsed} onClose={() => setActiveMenu('none')} />}</AnimatePresence>

							{/* User Menu Dropdown (Rich Discord Profile) */}
							<AnimatePresence>{activeMenu === 'user' && <SidebarUserCard activeUser={activeUser} isCollapsed={isCollapsed} />}</AnimatePresence>

							{/* Combined Trigger Card Wrapper */}
							<div
								className={`group flex w-full items-center rounded-xl p-2 transition-colors hover:bg-(--foreground)
                                ${activeMenu === 'user' || activeMenu === 'suite' ? 'bg-(--foreground)' : ''}
                                ${isCollapsed ? 'flex-col justify-center gap-3' : 'justify-between gap-3'}
                            `}>
								{/* User Info Trigger (Left Side) */}
								<button onClick={() => setActiveMenu(activeMenu === 'user' ? 'none' : 'user')} className='flex flex-1 items-center gap-3 overflow-hidden text-left'>
									<div className='relative shrink-0'>
										{activeUser.image || activeUser.avatar ? (
											<Image
												src={activeUser.image || `https://cdn.discordapp.com/avatars/${activeUser.id}/${activeUser.avatar}.png`}
												alt='User Avatar'
												height={100}
												width={100}
												className='h-9 w-9 rounded-full border border-(--border) object-cover'
												unoptimized
												draggable={false}
												loading='eager'
											/>
										) : (
											<div className='flex h-9 w-9 items-center justify-center rounded-full bg-(--border)'>
												<UserIcon size={16} className='text-(--text-muted)' />
											</div>
										)}
										{/* Status Indicator */}
										{DeviceIcon ? <DeviceIcon className={iconStyles} /> : <div className={`${iconStyles} rounded-full`} />}
									</div>

									<div
										className={`flex flex-col overflow-hidden transition-all duration-300 
                                        ${isCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}>
										<span className='truncate text-sm font-semibold text-(--text)'>{activeUser.global_name || activeUser.name}</span>
										<span className='truncate text-xs text-(--text-muted)'>@{activeUser.username || activeUser.name?.toLowerCase().replace(/\s/g, '')}</span>
									</div>
								</button>

								{/* Compass Ecosystem Trigger (Right Side) */}
								<button
									onClick={() => setActiveMenu(activeMenu === 'suite' ? 'none' : 'suite')}
									className={`shrink-0 flex items-center justify-center rounded-lg p-1.5 transition-colors hover:bg-(--background) 
                                        ${activeMenu === 'suite' ? 'bg-(--background)' : ''}
                                    `}>
									<Compass
										size={isCollapsed ? 20 : 18}
										className={`transition-transform duration-200 ${activeMenu === 'suite' ? 'text-(--accent)' : 'text-(--text-muted) group-hover:text-(--text)'}`}
									/>
								</button>
							</div>
						</div>
					)}
				</div>
			</aside>
		</>
	);
}
