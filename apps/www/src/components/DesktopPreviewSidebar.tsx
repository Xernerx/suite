/** @format */

'use client';

import { Fragment, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bell, Compass, Gift, LayoutGrid, Monitor, Trophy, User as UserIcon } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Divider } from '@xernerx/ui';
import { DesktopPreviewUserPopover, type PreviewSidebarUserData } from './DesktopPreviewUserPopover';
import type { PreviewGuildItem } from './useDesktopPreviewData';

export type PreviewMainView = 'server' | 'explore' | 'leaderboard';

interface DesktopPreviewSidebarProps {
	sidebarCollapsed: boolean;
	isRightAligned: boolean;
	activeView: PreviewMainView;
	setActiveView: (view: PreviewMainView) => void;
	guilds: PreviewGuildItem[];
	selectedServerId: string;
	onSelectServer: (id: string) => void;
	showShortcutHints: boolean;
	userMenuOpen: boolean;
	setUserMenuOpen: (fn: boolean | ((prev: boolean) => boolean)) => void;
	osToastOpen: boolean;
	setOsToastOpen: (open: boolean) => void;
	setOmnibarOpen: (fn: boolean | ((prev: boolean) => boolean)) => void;
	setOverlayOpen: (fn: boolean | ((prev: boolean) => boolean)) => void;
	activeAccount: 'main' | 'alt';
	onSwitchAccount: () => void;
	rpcEnabled: boolean;
	setRpcEnabled: (val: boolean) => void;
	claimed: boolean;
	setClaimed: (fn: boolean | ((prev: boolean) => boolean)) => void;
	userData: PreviewSidebarUserData;
}

export function DesktopPreviewSidebar({
	sidebarCollapsed,
	isRightAligned,
	activeView,
	setActiveView,
	guilds,
	selectedServerId,
	onSelectServer,
	showShortcutHints,
	userMenuOpen,
	setUserMenuOpen,
	osToastOpen,
	setOsToastOpen,
	setOmnibarOpen,
	setOverlayOpen,
	activeAccount,
	onSwitchAccount,
	rpcEnabled,
	setRpcEnabled,
	claimed,
	setClaimed,
	userData,
}: DesktopPreviewSidebarProps) {
	const { t } = useDictionary();
	const [avatarFailed, setAvatarFailed] = useState(false);
	const [decorationFailed, setDecorationFailed] = useState(false);
	const [nameplateFailed, setNameplateFailed] = useState(false);
	const [failedGuildIcons, setFailedGuildIcons] = useState<Record<string, boolean>>({});

	useEffect(() => {
		setAvatarFailed(false);
		setDecorationFailed(false);
		setNameplateFailed(false);
	}, [userData.avatarUrl, userData.decorationUrl, userData.nameplateUrl]);

	const isMainSlot = activeAccount === 'main';
	const currentName = isMainSlot ? userData.displayName : 'CozyAlt';
	const currentHandle = isMainSlot ? userData.handle : '@cozyalt';

	const showRealAvatar = Boolean(isMainSlot && userData.avatarUrl && !avatarFailed);
	const showDecoration = Boolean(isMainSlot && userData.decorationUrl && !decorationFailed);
	const activeCustomNameplate = isMainSlot ? userData.customNameplate : 'none';
	const activeCustomFrame = isMainSlot ? userData.customAvatarFrame : 'none';
	const hasActiveNameplate = Boolean(isMainSlot && userData.nameplateUrl && !nameplateFailed && activeCustomNameplate === 'none');

	const navEntries = [
		{
			id: 'explore',
			label: t('app.dashboard.nav.explore'),
			category: t('app.dashboard.categories.navigation'),
			active: activeView === 'explore',
			onClick: () => setActiveView('explore'),
			renderIcon: (active: boolean) => <Compass size={14} strokeWidth={2} className={`shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-(--accent)' : ''}`} />,
		},
		{
			id: 'leaderboard',
			label: t('app.leaderboard.title'),
			category: t('app.dashboard.categories.navigation'),
			active: activeView === 'leaderboard',
			onClick: () => setActiveView('leaderboard'),
			renderIcon: (active: boolean) => <Trophy size={14} strokeWidth={2} className={`shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-(--accent)' : ''}`} />,
		},
		...guilds.map((srv) => ({
			id: `server-${srv.id}`,
			label: srv.name,
			category: t('app.dashboard.categories.servers'),
			active: activeView === 'server' && selectedServerId === srv.id,
			onClick: () => onSelectServer(srv.id),
			renderIcon: () =>
				srv.iconUrl && !failedGuildIcons[srv.id] ? (
					<img
						src={srv.iconUrl}
						alt={`${srv.name} Discord server icon`}
						onError={() => setFailedGuildIcons((prev) => ({ ...prev, [srv.id]: true }))}
						className="w-5 h-5 rounded-full object-cover shrink-0"
						draggable={false}
					/>
				) : (
					<span className="w-5 h-5 rounded-full bg-(--foreground) border border-(--border)/15 flex items-center justify-center text-[10px] font-bold text-(--text) shrink-0">
						{srv.badge}
					</span>
				),
		})),
	];

	return (
		<aside className={`relative flex flex-col bg-(--background) transition-[width] duration-300 ease-in-out shrink-0 h-full px-4 select-none ${sidebarCollapsed ? 'w-[80px]' : 'w-[288px]'}`}>
			{/* Navigation Items (Exact Sidebar.tsx Layout & Active Indicator) */}
			<nav aria-label={t('components.sidebar.title')} className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden pt-4 rounded-2xl gap-1">
				{navEntries.map((item, idx) => {
					const prevItem = idx > 0 ? navEntries[idx - 1] : null;
					const showCategory = item.category !== prevItem?.category;
					const shortcutLabel = showShortcutHints && idx < 9 ? `Alt + ${idx + 1}` : undefined;

					return (
						<Fragment key={item.id}>
							{showCategory && (
								<div className={`mt-3 first:mt-0 mb-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'flex justify-center' : 'px-4'}`}>
									{sidebarCollapsed ? (
										<div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-(--border) to-transparent" />
									) : (
										<span className="block truncate text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{item.category}</span>
									)}
								</div>
							)}

							<button
								type="button"
								title={shortcutLabel ? `${item.label} (${shortcutLabel})` : item.label}
								onClick={item.onClick}
								className={`w-full min-w-0 group relative flex items-center text-left rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
									item.active
										? 'bg-(--active-accent)/50 text-(--text) font-semibold shadow-xs'
										: 'text-(--text-muted) hover:bg-(--foreground)/30 backdrop-blur-md hover:text-(--text)'
								} ${sidebarCollapsed ? 'justify-center py-3 px-0' : 'justify-start py-2.5 px-4 gap-3.5'}`}
							>
								{item.active && !sidebarCollapsed && (
									<div className={`absolute ${isRightAligned ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} h-5 w-1 bg-(--accent-readable,var(--accent))`} />
								)}
								{item.renderIcon(item.active)}
								<span className={`truncate transition-all duration-300 font-medium text-[14px] ${sidebarCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 min-w-0 opacity-100'}`}>
									{item.label}
								</span>
								{!sidebarCollapsed && shortcutLabel && (
									<kbd className="inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-(--text-muted) bg-(--background)/95 backdrop-blur-md px-1.5 py-0.5 rounded-xl border border-(--border)/15 shadow-xs z-10">
										{shortcutLabel}
									</kbd>
								)}
							</button>
						</Fragment>
					);
				})}
			</nav>

			<Divider />

			{/* Docked Bottom User Stack + Authentic SidebarUserCard Popover */}
			<div className={`relative z-30 flex flex-col pb-4 gap-2 ${sidebarCollapsed ? 'items-center' : ''}`}>
				<AnimatePresence>
					{userMenuOpen && (
						<DesktopPreviewUserPopover
							sidebarCollapsed={sidebarCollapsed}
							isRightAligned={isRightAligned}
							activeAccount={activeAccount}
							onSwitchAccount={onSwitchAccount}
							rpcEnabled={rpcEnabled}
							setRpcEnabled={setRpcEnabled}
							claimed={claimed}
							setClaimed={setClaimed}
							setOverlayOpen={setOverlayOpen}
							onClose={() => setUserMenuOpen(false)}
							userData={userData}
						/>
					)}
				</AnimatePresence>

				{/* Combined Trigger Card Wrapper (Exact Sidebar.tsx lines 470-619) */}
				<div
					className={`group relative overflow-hidden flex w-full items-center rounded-2xl border transition-all ${
						activeCustomNameplate !== 'none'
							? `xrx-nameplate-${activeCustomNameplate} border-(--accent)/35 shadow-sm`
							: !hasActiveNameplate
								? 'border-(--border)/10 bg-(--foreground)/30 hover:bg-(--foreground)/45 backdrop-blur-md'
								: 'border-(--border)/15 shadow-sm'
					} ${activeCustomNameplate === 'none' && !hasActiveNameplate && userMenuOpen ? 'bg-(--foreground)/45 backdrop-blur-md' : ''} ${
						sidebarCollapsed ? 'flex-col justify-center p-2 gap-2' : 'justify-between p-3 gap-3'
					}`}
					style={hasActiveNameplate ? { backgroundImage: userData.nameplateGradient } : undefined}
				>
					{hasActiveNameplate && userData.nameplateUrl && (
						<>
							<video
								src={userData.nameplateUrl}
								autoPlay
								loop
								muted
								playsInline
								onError={() => setNameplateFailed(true)}
								className="absolute inset-0 w-full h-full object-cover object-right z-0 pointer-events-none opacity-95"
								style={{
									WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 22%, rgba(0,0,0,0.85) 45%, #000 65%)',
									maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 22%, rgba(0,0,0,0.85) 45%, #000 65%)',
								}}
							/>
							<div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent z-0 pointer-events-none" />
						</>
					)}

					<button
						type="button"
						onClick={() => setUserMenuOpen((v) => !v)}
						title={currentName}
						className="relative z-10 flex flex-1 min-w-0 items-center overflow-hidden text-left rounded-lg cursor-pointer gap-3 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
					>
						<div className="relative shrink-0">
							{showRealAvatar ? (
								<div className="relative h-9 w-9">
									<img
										src={userData.avatarUrl!}
										alt={`${currentName} profile avatar`}
										onError={() => setAvatarFailed(true)}
										className={`h-full w-full rounded-full border border-(--border)/20 object-cover ${activeCustomFrame !== 'none' ? `xrx-avatar-frame-${activeCustomFrame}` : ''}`}
										draggable={false}
									/>
									{showDecoration && (
										<img
											src={userData.decorationUrl!}
											alt={`${currentName} avatar decoration`}
											onError={() => setDecorationFailed(true)}
											className="absolute -inset-[15%] w-[130%] h-[130%] max-w-none scale-[1.15] z-10 pointer-events-none"
											draggable={false}
										/>
									)}
								</div>
							) : (
								<div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--border)/25">
									{isMainSlot ? <UserIcon size={16} className="text-(--text-muted)" /> : <span className="text-xs font-black text-(--text)">C</span>}
								</div>
							)}
							{!claimed && (
								<span className="absolute -top-1 -left-1 z-30 flex h-4 w-4 items-center justify-center rounded-full bg-(--accent-orange) text-white shadow-sm">
									<Gift size={10} />
								</span>
							)}
							<Monitor className="text-(--accent-green) absolute -bottom-0.5 -right-0.5 h-[14px] w-[14px] border-2 border-(--background) rounded-full bg-(--foreground)/30 backdrop-blur-md z-20" />
						</div>

						{!sidebarCollapsed && (
							<div className="flex flex-col overflow-hidden flex-1 min-w-0 gap-0.5">
								<span className={`truncate text-sm font-bold tracking-wide ${hasActiveNameplate ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-(--text)'}`}>
									{currentName}
								</span>
								<span className={`truncate text-xs ${hasActiveNameplate ? 'text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' : 'text-(--text-muted)'}`}>{currentHandle}</span>
							</div>
						)}
					</button>

					<div className={`relative z-10 flex ${sidebarCollapsed ? 'flex-col' : 'items-center'} gap-1 shrink-0`}>
						<button
							type="button"
							title={t('components.header.notifications')}
							aria-label={t('components.header.notifications')}
							onClick={() => setOsToastOpen(!osToastOpen)}
							className={`shrink-0 flex items-center justify-center rounded-xl p-2 transition-colors cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
								hasActiveNameplate ? 'hover:bg-(--background)/30 text-white drop-shadow-md' : 'hover:bg-(--background) text-(--text-muted) hover:text-(--text)'
							} ${osToastOpen ? 'bg-(--background)/60 text-(--accent)' : ''}`}
						>
							<div className="relative">
								<Bell size={sidebarCollapsed ? 20 : 18} />
								{userData.unreadCount > 0 && (
									<span className="absolute -top-1.5 -right-1.5 flex min-w-[16px] h-[16px] px-1 items-center justify-center rounded-full bg-(--accent-red) text-[9px] font-extrabold leading-none text-white border-2 border-(--background) shadow-xs">
										{userData.unreadCount > 9 ? '9+' : userData.unreadCount}
									</span>
								)}
							</div>
						</button>

						<button
							type="button"
							title={t('components.header.title1')}
							aria-label={t('components.header.title1')}
							onClick={() => setOmnibarOpen((v) => !v)}
							className={`shrink-0 flex items-center justify-center rounded-xl p-2 transition-colors cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${
								hasActiveNameplate ? 'hover:bg-(--background)/30 text-white drop-shadow-md' : 'hover:bg-(--background) text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<LayoutGrid size={sidebarCollapsed ? 20 : 18} />
						</button>
					</div>
				</div>
			</div>
		</aside>
	);
}
