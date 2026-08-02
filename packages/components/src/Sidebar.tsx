/** @format */
'use client';

import { Compass, LogIn, User as UserIcon } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { useDictionary, usePlatform, useSidebar, useUser } from '@xernerx/providers';

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
	const { t } = useDictionary();

	// Manage which dropdown is active instead of a single boolean
	const [activeMenu, setActiveMenu] = useState<'none' | 'suite' | 'user'>('none');
	const menuRef = useRef<HTMLDivElement>(null);

	const isCollapsed = state === 'closed' && !isMobileOpen;
	const activeUser = discordUser || session?.user;

	// Resolve Discord CDN URLs for Avatar, Decoration, and Nameplate
	const avatarUrl = activeUser?.avatar
		? `https://cdn.discordapp.com/avatars/${activeUser.id}/${activeUser.avatar}.${activeUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
		: activeUser?.image;
	const decorationUrl = activeUser?.avatar_decoration_data?.asset ? `https://cdn.discordapp.com/avatar-decoration-presets/${activeUser.avatar_decoration_data.asset}.png` : null;
	const nameplateUrl = activeUser?.collectibles?.nameplate?.asset ? `https://cdn.discordapp.com/assets/collectibles/${activeUser.collectibles.nameplate.asset}asset.webm` : null;

	const DeviceIcon = deviceIcons[device?.toLowerCase() as keyof typeof deviceIcons];
	const iconStyles = 'text-(--accent-green) absolute -bottom-0.5 -right-0.5 h-[14px] w-[14px] border-2 border-(--background) rounded-full bg-(--foreground) z-20';

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
			{isMobileOpen && <div className="fixed inset-0 top-[72px] z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />}

			<aside
				className={`
                    fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-(--background) transition-all duration-300 ease-in-out
                    w-full pt-[72px] pb-4
                    md:w-80 md:top-0 md:bottom-auto md:sticky md:h-[calc(100vh-72px)] md:pt-0 md:pb-0
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0 
                    ${isCollapsed ? 'md:w-[80px]' : ''}
                `}
				style={{
					paddingLeft: 'var(--ui-gap)',
					paddingRight: 'var(--ui-gap)',
					fontSize: 'var(--text-scale, 14px)',
				}}
			>
				{/* Navigation Items */}
				<div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden pt-4" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
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
											<div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-(--border) to-transparent" />
										) : (
											<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{item.category}</span>
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
									className={`group relative flex items-center rounded-xl transition-all duration-200 
                                        ${active ? 'bg-(--active-accent)/50 text-(--text) font-semibold shadow-xs' : 'text-(--text-muted) hover:bg-(--foreground) hover:text-(--text)'}
                                        ${isCollapsed ? 'justify-center px-0' : ''}
                                    `}
									style={{
										padding: isCollapsed ? 'calc(var(--ui-gap) * 0.75) 0' : 'calc(var(--ui-gap) * 0.75) var(--ui-gap)',
										gap: isCollapsed ? 0 : 'var(--ui-gap)',
									}}
								>
									{active && !isCollapsed && <div className="absolute left-0 h-5 w-1 rounded-r-full bg-(--accent)" />}

									{Icon && <Icon size={14} strokeWidth={2} className={`shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-(--accent)' : ''}`} />}

									<span
										className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium text-[14px] 
                                        ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}
									>
										{item.label}
									</span>
								</Link>
							</Fragment>
						);
					})}
				</div>

				<Divider />
				{/* Bottom Ecosystem & User Section */}

				<div ref={menuRef} className={`relative flex flex-col ${isCollapsed ? 'items-center' : ''}`} style={{ paddingBottom: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.5)' }}>
					{!activeUser ? (
						<Link
							href="/login"
							className={`flex items-center justify-center rounded-xl bg-(--accent) text-white transition-colors hover:bg-(--accent-hover) mt-1
                                ${isCollapsed ? 'h-10 w-10 p-0' : 'w-full font-medium text-sm'}
                            `}
							style={!isCollapsed ? { padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.5)' } : {}}
						>
							<LogIn size={18} />
							{!isCollapsed && <span>{t('common.sidebar.login', {}, 'Login')}</span>}
						</Link>
					) : (
						<div className="relative w-full mt-1">
							{/* Suite Menu Dropdown */}
							<AnimatePresence>{activeMenu === 'suite' && <SidebarSuite isCollapsed={isCollapsed} onClose={() => setActiveMenu('none')} />}</AnimatePresence>

							{/* User Menu Dropdown (Rich Discord Profile) */}
							<AnimatePresence>{activeMenu === 'user' && <SidebarUserCard activeUser={activeUser} isCollapsed={isCollapsed} />}</AnimatePresence>

							{/* Combined Trigger Card Wrapper - Now hosts the Nameplate */}
							<div
								className={`group relative overflow-hidden flex w-full items-center rounded-2xl transition-colors 
                                ${!nameplateUrl ? 'hover:bg-(--foreground)' : 'shadow-inner'}
                                ${!nameplateUrl && (activeMenu === 'user' || activeMenu === 'suite') ? 'bg-(--foreground)' : ''}
                                ${isCollapsed ? 'flex-col justify-center' : 'justify-between'}
                            `}
								style={{ padding: 'calc(var(--ui-gap) * 0.75)', gap: 'var(--ui-gap)' }}
							>
								{/* Root Nameplate Video Background */}
								{nameplateUrl && (
									<>
										<video src={nameplateUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-fill z-0 pointer-events-none opacity-90" />
										{/* Optional slight dark overlay for text readability across all themes */}
										<div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />
									</>
								)}

								{/* User Info Trigger (Left Side) */}
								<button
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
													alt="User Avatar"
													fill
													className="rounded-full border border-(--border) object-cover"
													unoptimized
													draggable={false}
													loading="eager"
												/>
												{decorationUrl && (
													<Image
														src={decorationUrl}
														alt="Avatar Decoration"
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

								{/* Compass Ecosystem Trigger (Right Side) */}
								<button
									onClick={() => setActiveMenu(activeMenu === 'suite' ? 'none' : 'suite')}
									className={`relative z-10 shrink-0 flex items-center justify-center rounded-xl transition-colors 
                                        ${nameplateUrl ? 'hover:bg-black/30 text-white drop-shadow-md' : 'hover:bg-(--background) text-(--text-muted) group-hover:text-(--text)'}
                                        ${activeMenu === 'suite' ? (nameplateUrl ? 'bg-black/40 text-white' : 'bg-(--background)') : ''}
                                    `}
									style={{ padding: 'calc(var(--ui-gap) * 0.5)' }}
								>
									<Compass size={isCollapsed ? 20 : 18} className={`transition-transform duration-200 ${activeMenu === 'suite' && !nameplateUrl ? 'text-(--accent)' : ''}`} />
								</button>
							</div>
						</div>
					)}
				</div>
			</aside>
		</>
	);
}
