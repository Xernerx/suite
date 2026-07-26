/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp, Globe, LayoutDashboard, LogIn, LogOut, Server, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@xernerx/providers';

// Define your cross-domain ecosystem services here
const SERVICES = [
	{ label: 'Website', href: 'https://www.xernerx.com', icon: Globe },
	{ label: 'Dashboard', href: 'https://app.xernerx.com', icon: LayoutDashboard },
	{ label: 'CDN', href: 'https://cdn.xernerx.com', icon: Server },
	{ label: 'Account', href: 'https://auth.xernerx.com', icon: User },
];

export function Sidebar() {
	const { data: session } = useSession();
	const { state, isMobileOpen, setMobileOpen, navItems, view, setView } = useSidebar();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const isCollapsed = state === 'closed';

	// Close menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
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
                    fixed bottom-0 left-0 z-50 flex flex-col bg-(--background) transition-all duration-300 ease-in-out
                    md:sticky md:top-[72px] md:h-[calc(100vh-72px)]
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0 
                    ${isCollapsed ? 'md:w-[80px]' : 'md:w-64'}
                `}>
				{/* Navigation Items */}
				<div className='flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden pt-6 px-3'>
					{navItems.map((item, idx) => {
						const Icon = item.icon;
						const active = item.view && view === item.view;

						return (
							<Link
								key={idx}
								href={item.href || '#'}
								onClick={() => {
									if (item.view) setView(item.view);
									if (item.onClick) item.onClick();
									setMobileOpen(false);
								}}
								className={`group relative flex items-center rounded-xl py-3 transition-all duration-200 
                                    ${active ? 'bg-(--active-accent)/50 text-(--text) font-semibold shadow-xs' : 'text-(--text-muted) hover:bg-(--foreground) hover:text-(--text)'}
                                    ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-4'}
                                `}>
								{active && !isCollapsed && <div className='absolute left-0 h-5 w-1 rounded-r-full bg-accent' />}

								{Icon && <Icon size={22} strokeWidth={2} className={`shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-accent' : ''}`} />}
								<span
									className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium 
                                    ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
									{item.label}
								</span>
							</Link>
						);
					})}
				</div>

				{/* User Section / Ecosystem Menu Dropdown (Bottom) */}
				<div
					ref={menuRef}
					className={`relative p-3 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-accent before:to-transparent ${isCollapsed ? 'flex justify-center' : ''}`}>
					{!session?.user ? (
						<Link
							href='/login'
							className={`flex items-center justify-center gap-2 rounded-xl bg-accent text-white transition-colors hover:bg-accent-hover 
                                ${isCollapsed ? 'h-11 w-11 p-0' : 'w-full py-2.5 px-4 font-medium text-sm'}
                            `}>
							<LogIn size={18} />
							{!isCollapsed && <span>Login</span>}
						</Link>
					) : (
						<div className='relative'>
							{/* Ecosystem Popup Menu - Popping out to the side to avoid overflow clipping */}
							<AnimatePresence>
								{isMenuOpen && (
									<motion.div
										initial={{ opacity: 0, scale: 0.95, x: -8 }}
										animate={{ opacity: 1, scale: 1, x: 0 }}
										exit={{ opacity: 0, scale: 0.95, x: -8 }}
										transition={{ duration: 0.15, ease: 'easeOut' }}
										className='absolute bottom-0 left-full ml-3 z-50 flex w-64 flex-col gap-1 rounded-2xl border border-(--border)/10 bg-(--foreground) p-2 shadow-2xl backdrop-blur-md'>
										<span className='text-[11px] text-(--text-muted) uppercase px-3 py-2'>Suite</span>
										<div className='relative px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-2 before:absolute before:inset-x-0 before:bottom-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-accent before:to-transparent' />

										{SERVICES.map((service, sIdx) => {
											const ServiceIcon = service.icon;
											return (
												<Link
													key={sIdx}
													href={service.href}
													className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-(--text-muted) transition-colors hover:bg-(--background) hover:text-(--text)'>
													<ServiceIcon size={18} className='text-(--accent)' />
													<span>{service.label}</span>
												</Link>
											);
										})}

										<div className='my-1 h-[1px] bg-(--border)/10' />

										<Link
											href='/logout'
											className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10'
											onClick={() => setIsMenuOpen(false)}>
											<LogOut size={18} />
											<span>Log out</span>
										</Link>
									</motion.div>
								)}
							</AnimatePresence>

							{/* Clickable Profile Trigger Card */}
							<button
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								className={`group flex w-full items-center rounded-xl p-2 transition-colors hover:bg-(--foreground) text-left 
                                    ${isCollapsed ? 'justify-center' : 'justify-between gap-3'}
                                `}>
								<div className='flex items-center gap-3 overflow-hidden'>
									{/* Avatar */}
									{session.user.image ? (
										<Image
											src={session.user.image}
											alt='User Avatar'
											height={100}
											width={100}
											className='h-10 w-10 shrink-0 rounded-full border border-(--border) object-cover'
											unoptimized
											draggable={false}
											loading='eager'
										/>
									) : (
										<div className='h-10 w-10 shrink-0 rounded-full bg-(--border)' />
									)}

									{/* User Info (Hidden when collapsed) */}
									<div
										className={`flex flex-col overflow-hidden transition-all duration-300 
                                        ${isCollapsed ? 'w-0 opacity-0' : 'flex-1 opacity-100'}`}>
										<span className='truncate text-sm font-semibold text-(--text)'>{session.user.name}</span>
										<span className='truncate text-xs text-(--text-muted)'>@{session.user.name?.toLowerCase().replace(/\s/g, '')}</span>
									</div>
								</div>

								{/* Menu Toggle Chevron Icon (Hidden when collapsed) */}
								{!isCollapsed && <ChevronUp size={18} className={`shrink-0 text-(--text-muted) transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />}
							</button>
						</div>
					)}
				</div>
			</aside>
		</>
	);
}
