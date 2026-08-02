/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Globe, IdCard, LogIn, Monitor, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import Profile from './sidebar/Profile';
import { usePlatform } from '@/providers/PlatformProvider';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@/providers/SidebarProvider';
import { useUser } from '@/providers/UserProvider';

export default function Sidebar() {
	const profileButtonRef = useRef<HTMLButtonElement | null>(null);
	const profileContainerRef = useRef<HTMLDivElement | null>(null);
	const profileMenuRef = useRef<HTMLDivElement | null>(null);
	const profileCardRef = useRef<HTMLDivElement | null>(null);

	const { state, navItems, view, setView } = useSidebar();
	const { type } = usePlatform();
	const { user } = useUser();
	const { data: session, status } = useSession();
	const router = useRouter();

	const [openProfile, setOpenProfile] = useState(false);
	const [profileMenu, setProfileMenu] = useState(false);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Node;

			const insideButton = profileButtonRef.current?.contains(target);
			const insideContainer = profileContainerRef.current?.contains(target);
			const insideMenu = profileMenuRef.current?.contains(target);
			const insideCard = profileCardRef.current?.contains(target);

			// CLOSE MENU
			if (!insideButton && !insideContainer && !insideMenu) {
				setProfileMenu(false);
			}

			// CLOSE PROFILE CARD
			if (!insideCard) {
				setOpenProfile(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	if (state === 'hidden') return null;

	const avatarDecoration = user?.avatar_decoration_data?.asset && `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.webp`;

	const nameplate = user?.collectibles?.nameplate && `https://cdn.discordapp.com/assets/collectibles/${user.collectibles.nameplate.asset}asset.webm`;

	const navTop = navItems.filter((item) => item.href);
	const navBottom = navItems.filter((item) => item.onClick && !item.href);

	return (
		<motion.aside
			animate={{ width: state === 'open' ? 300 : 70 }}
			transition={{ duration: 0.25, ease: 'easeOut' }}
			className="h-full flex flex-col px-[calc(var(--ui-gap)*0.75)] py-[calc(var(--ui-gap)*0.75)]"
			style={{
				gap: 'calc(var(--ui-gap) * 0.5)',
				background: 'var(--bg-main)',
				color: 'var(--text-main)',
			}}
		>
			<div className="overflow-y-auto overflow-x-hidden">
				<div className="flex flex-col gap-1">
					{/* Bottom: Navigation */}
					{navTop.map((item, i) => {
						return (
							<button
								key={`bottom-${i}`}
								onClick={() => router.push(item.href!)}
								className={`flex items-center rounded-md transition px-3 py-2 ${state === 'open' ? 'gap-2 justify-start' : 'justify-center'}  w-full`}
								style={{ color: 'var(--text-main)' }}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = 'var(--accent-hover)';
									e.currentTarget.style.cursor = 'pointer';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'transparent';
								}}
							>
								{item.icon || <span className="uppercase">{item.label[0]}</span>}

								<AnimatePresence>
									{state === 'open' && (
										<motion.span
											initial={{ opacity: 0, x: -6 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -6 }}
											transition={{ duration: 0.15 }}
											className="whitespace-nowrap"
										>
											{item.label}
										</motion.span>
									)}
								</AnimatePresence>
							</button>
						);
					})}

					{/* Divider */}

					{navBottom.length > 0 && (
						<div className="py-2 px-2 ">
							<div
								className="h-[1px] w-full"
								style={{
									background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
								}}
							/>
						</div>
					)}
				</div>

				{/* BOTTOM: Actions */}
				{navBottom.map((item, i) => {
					const active = view === item.view;

					return (
						<button
							key={i}
							onClick={() => {
								if (item.view) setView(item.view);
								item.onClick?.();
							}}
							className={`flex items-center rounded-md transition px-3 py-2 ${state === 'open' ? 'gap-2 justify-start' : 'justify-center'} w-full`}
							style={{
								background: active ? 'var(--accent)' : 'transparent',
								color: active ? '#fff' : 'var(--text-main)',
							}}
							onMouseEnter={(e) => {
								if (!active) {
									e.currentTarget.style.background = 'var(--accent-hover)';
									e.currentTarget.style.cursor = 'pointer';
								}
							}}
							onMouseLeave={(e) => {
								if (!active) e.currentTarget.style.background = 'transparent';
							}}
						>
							{item.icon || <span className="uppercase">{item.label[0]}</span>}

							<AnimatePresence>
								{state === 'open' && (
									<motion.span
										initial={{ opacity: 0, x: -6 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -6 }}
										transition={{ duration: 0.15 }}
										className="whitespace-nowrap"
									>
										{item.label}
									</motion.span>
								)}
							</AnimatePresence>
						</button>
					);
				})}
			</div>

			<div ref={profileContainerRef} className="mt-auto relative">
				{session && user ? (
					<>
						{state === 'open' && (
							<div className="relative rounded-xl overflow-hidden backdrop-blur p-2" style={{ background: 'var(--container)' }}>
								{type != 'application' && typeof nameplate === 'string' && nameplate.startsWith('http') && (
									<video
										autoPlay
										loop
										muted
										playsInline
										className="absolute inset-0 w-full h-full object-cover opacity-70 pointer-events-none"
										onCanPlay={(e) => {
											e.currentTarget.muted = true;
										}}
									>
										<source src={nameplate} type="video/webm" />
									</video>
								)}

								<div className="relative flex items-center justify-between gap-2">
									<button ref={profileButtonRef} onClick={() => setOpenProfile(!openProfile)} className="flex items-center gap-3 group w-full text-left cursor-pointer">
										<div className="relative">
											<img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} className="w-10 h-10 rounded-full" />
											{avatarDecoration && <img src={avatarDecoration} className="absolute inset-0 scale-[1.15] pointer-events-none" />}
											<div className="absolute -bottom-1 -right-1 bg-(--bg-main) p-1 rounded-full">{type === 'browser' ? <Globe size={12} /> : <Monitor size={12} />}</div>
										</div>

										<div className="flex flex-col overflow-hidden">
											<span className="text-sm font-medium truncate">{user.global_name ?? user.username}</span>
											<span className="text-xs opacity-60 truncate">@{user.username}</span>
										</div>
									</button>

									<button onClick={() => router.push('/account')} className="p-2 rounded-lg cursor-pointer hover:bg-(--accent-hover) transition">
										<Settings size={16} />
									</button>
								</div>
							</div>
						)}

						<AnimatePresence>
							{profileMenu && state !== 'open' && (
								<motion.div
									ref={profileMenuRef}
									initial={{ y: 10, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									exit={{ y: 10, opacity: 0 }}
									className="absolute bottom-full left-0 w-full mb-3 bg-(--bg-main) border border-white/10 rounded-lg shadow-xl p-2 flex flex-col gap-2"
								>
									<button
										onClick={() => {
											setProfileMenu(false);
											setOpenProfile(true);
										}}
										className="p-2 rounded-md cursor-pointer hover:bg-(--accent-hover)"
									>
										<IdCard size={18} />
									</button>

									<button
										onClick={() => {
											setProfileMenu(false);
											router.push('/account');
										}}
										className="p-2 rounded-md cursor-pointer hover:bg-(--accent-hover)"
									>
										<Settings size={18} />
									</button>
								</motion.div>
							)}
						</AnimatePresence>

						{state !== 'open' && (
							<div className="flex justify-center">
								<button ref={profileButtonRef} onClick={() => setProfileMenu(!profileMenu)} className="relative cursor-pointer">
									<img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} className="w-10 h-10 rounded-full" />
									{avatarDecoration && <img src={avatarDecoration} className="absolute inset-0 scale-[1.15] pointer-events-none" />}
								</button>
							</div>
						)}
					</>
				) : status === 'loading' ? null : (
					<Nav icon={<LogIn size={18} />} label="Sign In" onClick={() => router.push('/auth/login')} />
				)}
			</div>

			<AnimatePresence>{openProfile && user && <Profile ref={profileCardRef} user={user} />}</AnimatePresence>
		</motion.aside>
	);
}

function Nav({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
	return (
		<motion.button
			whileHover={{ x: 4 }}
			whileTap={{ scale: 0.97 }}
			onClick={onClick}
			className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition bg-transparent cursor-pointer hover:bg-(--accent-hover)"
		>
			<div className="flex items-center justify-center w-8 h-8 rounded-md transition">
				<span className="text-slate-300">{icon}</span>
			</div>

			<span className="truncate text-slate-200 ">{label}</span>
		</motion.button>
	);
}

function TabButton({ active, onClick, icon, position }: { active: boolean; onClick: () => void; icon: React.ReactNode; position: 'left' | 'right' }) {
	const inactiveShape = position === 'left' ? 'rounded-tr-lg' : 'rounded-tl-lg';

	return (
		<button
			onClick={onClick}
			className={`flex-1 flex justify-center items-center py-2 transition relative ${active ? 'bg-transparent' : `border border-white/10 border-b-0 ${inactiveShape} bg-[rgba(0,0,0,0.2)] cursor-pointer hover:bg-(--accent-hover)`}`}
		>
			<span style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>{icon}</span>
		</button>
	);
}
