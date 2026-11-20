/** @format */

'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
	ArrowLeft,
	ArrowRight,
	Bell,
	Check,
	Compass,
	Copy,
	Gift,
	Home,
	LayoutDashboard,
	LayoutGrid,
	Monitor,
	Moon,
	RotateCw,
	Search,
	SidebarClose,
	SidebarOpen,
	Sun,
	Trophy,
	User as UserIcon,
	X,
} from 'lucide-react';
import type { HeaderSubdomainItem } from '@xernerx/lib';
import { useDictionary, useTheme } from '@xernerx/providers';
import BannerCanary from '../../../../packages/public/banner-canary.svg';
import BannerDev from '../../../../packages/public/banner-dev.svg';
import BannerPublic from '../../../../packages/public/banner.svg';
import { DesktopPreviewUserPopover, type PreviewSidebarUserData } from './DesktopPreviewUserPopover';
import type { PreviewMainView } from './DesktopPreviewSidebar';
import { DesktopPreviewWindowControls, type PreviewControlStyle } from './DesktopPreviewWindowControls';

export type { PreviewControlStyle };

interface DesktopPreviewHeaderProps {
	controlStyle: PreviewControlStyle;
	isRightAligned: boolean;
	cycleControls: () => void;
	maximized: boolean;
	onToggleMaximize: () => void;
	dockedSide: 'left' | 'right' | null;
	onCycleDock: () => void;
	sidebarHidden: boolean;
	sidebarCollapsed: boolean;
	setSidebarCollapsed: (fn: (prev: boolean) => boolean) => void;
	omnibarOpen: boolean;
	setOmnibarOpen: (fn: boolean | ((prev: boolean) => boolean)) => void;
	pinnedSubdomains: HeaderSubdomainItem[];
	modKey: string;
	environment: string;
	activeRoutePath: string;
	onSelectView: (view: PreviewMainView) => void;
	userMenuOpen: boolean;
	setUserMenuOpen: (fn: boolean | ((prev: boolean) => boolean)) => void;
	osToastOpen: boolean;
	setOsToastOpen: (open: boolean) => void;
	setOverlayOpen: (fn: boolean | ((prev: boolean) => boolean)) => void;
	activeAccount: 'main' | 'alt';
	onSwitchAccount: () => void;
	rpcEnabled: boolean;
	setRpcEnabled: (val: boolean) => void;
	claimed: boolean;
	setClaimed: (fn: boolean | ((prev: boolean) => boolean)) => void;
	userData: PreviewSidebarUserData;
}

const BTN_CLASS_MAP: Record<string, string> = {
	xernerx:
		'h-8 w-8 rounded-full bg-(--foreground)/50 border border-(--border)/15 flex items-center justify-center text-(--text-muted) hover:bg-(--accent)/20 hover:border-(--accent)/40 hover:text-(--accent) transition-all cursor-pointer',
	squircle:
		'h-8 w-8 rounded-xl bg-(--foreground)/50 border border-(--border)/15 flex items-center justify-center text-(--text-muted) hover:bg-(--accent)/20 hover:border-(--accent)/40 hover:text-(--accent) transition-all cursor-pointer',
	capsule: 'h-7 w-7 rounded-full flex items-center justify-center text-(--text-muted) hover:bg-(--accent)/20 hover:text-(--accent) transition-all cursor-pointer',
	minimal:
		'h-8 w-8 rounded-full bg-(--accent)/8 hover:bg-(--accent)/20 border border-(--accent)/20 flex items-center justify-center text-(--text-muted) hover:text-(--accent) transition-all cursor-pointer',
	macos: 'h-8 w-8 rounded-xl bg-(--foreground)/25 hover:bg-(--foreground)/60 border border-(--border)/10 flex items-center justify-center text-(--text-muted) hover:text-(--accent) transition-all cursor-pointer',
};

export function DesktopPreviewHeader({
	controlStyle,
	isRightAligned,
	cycleControls,
	maximized,
	onToggleMaximize,
	dockedSide,
	onCycleDock,
	sidebarHidden,
	sidebarCollapsed,
	setSidebarCollapsed,
	omnibarOpen,
	setOmnibarOpen,
	pinnedSubdomains,
	modKey,
	environment,
	activeRoutePath,
	onSelectView,
	userMenuOpen,
	setUserMenuOpen,
	osToastOpen,
	setOsToastOpen,
	setOverlayOpen,
	activeAccount,
	onSwitchAccount,
	rpcEnabled,
	setRpcEnabled,
	claimed,
	setClaimed,
	userData,
}: DesktopPreviewHeaderProps) {
	const { t } = useDictionary();
	const { resolvedTheme, setTheme } = useTheme();
	const [copiedUrl, setCopiedUrl] = useState(false);
	const [avatarFailed, setAvatarFailed] = useState(false);

	const headerIconBtnClass = BTN_CLASS_MAP[controlStyle] || 'flex items-center text-(--text) cursor-pointer hover:text-(--accent) transition-colors';
	const iconSize = controlStyle === 'windows' ? 20 : 16;
	const envSegment = environment === 'dev' || environment === 'canary' ? environment : 'public';
	const isMainSlot = activeAccount === 'main';
	const showRealAvatar = Boolean(isMainSlot && userData.avatarUrl && !avatarFailed);

	const renderBanner = () => {
		if (environment === 'dev') return <BannerDev className="h-10 text-(--accent) hover:text-(--accent-orange) transition-colors" />;
		if (environment === 'canary') return <BannerCanary className="h-10 text-(--accent) hover:text-(--hover-accent) transition-colors" />;
		return <BannerPublic className="h-10 text-(--accent) hover:text-(--hover-accent) transition-colors" />;
	};

	const handleCopyOmnibar = () => {
		const fullUrl = `https://app.${envSegment === 'public' ? '' : `${envSegment}.`}xernerx.com${activeRoutePath}`;
		navigator.clipboard?.writeText?.(fullUrl).catch(() => {});
		setCopiedUrl(true);
		setTimeout(() => setCopiedUrl(false), 1600);
	};

	return (
		<div className="relative flex flex-col w-full z-40 shrink-0 bg-(--background) select-none">
			<header className={`relative flex ${isRightAligned ? 'flex-row-reverse' : ''} h-[50px] shrink-0 items-center justify-between w-full bg-(--background) px-4`}>
				{environment === 'dev' && <div className="absolute inset-x-0 top-0 h-[2px] bg-(--accent-orange) shadow-[0_0_12px_color-mix(in_srgb,var(--accent-orange)_80%,transparent)]" />}
				{environment === 'canary' && <div className="absolute inset-x-0 top-0 h-[2px] bg-(--accent) shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_80%,transparent)]" />}

				{/* Left Cluster */}
				<div className={`flex ${isRightAligned ? 'flex-row-reverse' : ''} items-center shrink-0`}>
					{!isRightAligned && controlStyle === 'macos' && (
						<div className="mr-4">
							<DesktopPreviewWindowControls
								controlStyle={controlStyle}
								cycleControls={cycleControls}
								maximized={maximized}
								onToggleMaximize={onToggleMaximize}
								dockedSide={dockedSide}
								onCycleDock={onCycleDock}
							/>
						</div>
					)}

					{!sidebarHidden && (
						<div className={isRightAligned ? 'ml-4' : 'mr-4'}>
							<button
								type="button"
								title={`${t('components.sidebar.title')} (${modKey} + B)`}
								aria-label={t('components.sidebar.title')}
								onClick={() => setSidebarCollapsed((v) => !v)}
								className={`${controlStyle === 'windows' ? 'p-2' : ''} ${headerIconBtnClass} active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2`}
							>
								{!sidebarCollapsed ? (
									<SidebarOpen size={iconSize} strokeWidth={2.5} className={isRightAligned ? 'scale-x-[-1]' : ''} />
								) : (
									<SidebarClose size={iconSize} strokeWidth={2.5} className={isRightAligned ? 'scale-x-[-1]' : ''} />
								)}
							</button>
						</div>
					)}

					<button
						type="button"
						onClick={() => onSelectView('explore')}
						aria-label="Xernerx Studios"
						className="flex items-center cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 rounded-lg"
					>
						{renderBanner()}
					</button>
				</div>

				<div className="flex-1 h-full min-w-4" />

				{/* Right Cluster */}
				<div className={`flex ${isRightAligned ? 'flex-row-reverse' : ''} items-center ${controlStyle === 'windows' ? 'gap-4' : 'gap-2'} shrink-0`}>
					<div
						className={`flex ${isRightAligned ? 'flex-row-reverse' : ''} items-center ${
							controlStyle === 'windows' ? 'gap-4' : controlStyle === 'capsule' ? 'gap-1.5 rounded-full bg-(--foreground)/50 border border-(--border)/15 px-2 py-0.5' : 'gap-2'
						} shrink-0`}
					>
						{pinnedSubdomains.map((sub) => {
							const SubIcon = sub.icon;
							const isCurrent = sub.id === 'dashboard' ? activeRoutePath.startsWith('/dashboard') : sub.id === 'app' && !activeRoutePath.startsWith('/dashboard');
							return (
								<button
									key={sub.id}
									type="button"
									title={t(sub.label)}
									aria-label={t(sub.label)}
									onClick={() => {
										if (sub.id === 'dashboard') onSelectView('server');
										else if (sub.id === 'app') onSelectView('explore');
										else setOmnibarOpen(true);
									}}
									className={`${headerIconBtnClass} ${isCurrent ? 'text-(--accent)' : ''} active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2`}
								>
									<SubIcon size={iconSize} />
								</button>
							);
						})}

						{sidebarHidden && (
							<button
								type="button"
								title={t('components.header.title1')}
								aria-label={t('components.header.title1')}
								onClick={() => setOmnibarOpen((v) => !v)}
								className={headerIconBtnClass}
							>
								<LayoutGrid size={iconSize} />
							</button>
						)}

						{pinnedSubdomains.length > 0 && <span aria-hidden="true" className="h-4 w-px bg-(--border)/15 shrink-0 mx-0.5" />}

						<button
							type="button"
							title={`${t('components.header.commandPalette')} (${modKey} + K)`}
							aria-label={t('components.header.commandPalette')}
							onClick={() => setOmnibarOpen((v) => !v)}
							className={`${headerIconBtnClass} active:scale-95 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2`}
						>
							<Search size={iconSize} className="text-(--accent)" />
						</button>

						{sidebarHidden && (
							<>
								<button
									type="button"
									title={t('components.header.notifications')}
									aria-label={t('components.header.notifications')}
									onClick={() => setOsToastOpen(!osToastOpen)}
									className={`relative ${headerIconBtnClass}`}
								>
									<Bell size={iconSize} />
									{userData.unreadCount > 0 && (
										<span className="absolute -top-1.5 -right-1.5 flex min-w-[16px] h-[16px] px-1 items-center justify-center rounded-full bg-(--accent-red) text-[9px] font-extrabold leading-none text-white border-2 border-(--background)">
											{userData.unreadCount > 9 ? '9+' : userData.unreadCount}
										</span>
									)}
								</button>

								<div className="relative flex items-center">
									<button
										type="button"
										onClick={() => setUserMenuOpen((v) => !v)}
										aria-label={userData.displayName}
										className="relative flex items-center justify-center rounded-full cursor-pointer hover:scale-105 transition-transform"
									>
										{showRealAvatar ? (
											<img
												src={userData.avatarUrl!}
												alt={`${userData.displayName} profile avatar`}
												onError={() => setAvatarFailed(true)}
												className="h-8 w-8 rounded-full border border-(--border)/20 object-cover"
												draggable={false}
											/>
										) : (
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--foreground)/40 border border-(--border)/20">
												<UserIcon size={15} className="text-(--text-muted)" />
											</div>
										)}
										<Monitor className="text-(--accent-green) absolute -bottom-0.5 -right-0.5 h-[12px] w-[12px] border-2 border-(--background) rounded-full bg-(--foreground)" />
										{!claimed && (
											<span className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-(--accent-orange) text-white border border-(--background)">
												<Gift size={9} />
											</span>
										)}
									</button>

									<AnimatePresence>
										{userMenuOpen && (
											<DesktopPreviewUserPopover
												sidebarCollapsed={false}
												isRightAligned={isRightAligned}
												placement="top"
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
								</div>
							</>
						)}
					</div>

					{(isRightAligned || controlStyle !== 'macos') && (
						<>
							<span aria-hidden="true" className="h-4 w-px bg-(--border)/15 shrink-0" />
							<DesktopPreviewWindowControls
								controlStyle={controlStyle}
								cycleControls={cycleControls}
								maximized={maximized}
								onToggleMaximize={onToggleMaximize}
								dockedSide={dockedSide}
								onCycleDock={onCycleDock}
							/>
						</>
					)}
				</div>
			</header>

			{/* Authentic HeaderOmnibar Strip + Route Suggestions Popover */}
			<AnimatePresence>
				{omnibarOpen && (
					<motion.div
						initial={{ opacity: 0, scaleY: 0.92 }}
						animate={{ opacity: 1, scaleY: 1 }}
						exit={{ opacity: 0, scaleY: 0.92 }}
						transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
						className="origin-top relative border-b border-(--border)/10 bg-(--background) px-4 py-2 flex items-center gap-2"
					>
						<div className="flex items-center gap-1.5 text-(--text-muted) shrink-0">
							{[ArrowLeft, ArrowRight, RotateCw, Home].map((NavIcon, idx) => (
								<button
									key={idx}
									type="button"
									onClick={idx === 3 ? () => onSelectView('explore') : undefined}
									className="h-8 w-8 rounded-full bg-(--foreground)/35 hover:bg-(--foreground)/70 border border-(--border)/10 flex items-center justify-center hover:text-(--text) transition-colors cursor-pointer"
								>
									<NavIcon size={14} />
								</button>
							))}
						</div>

						<div className="relative flex-1 min-w-0">
							<div className="flex items-center justify-between gap-3 rounded-full bg-(--foreground)/35 backdrop-blur-md border border-(--border)/15 px-4 py-1.5 text-xs font-mono">
								<div className="flex items-center gap-1.5 min-w-0 truncate">
									<span className="text-(--text-muted)">https://</span>
									<span className="px-1.5 py-0.5 rounded-lg bg-(--accent)/12 text-(--accent) font-bold">app</span>
									<span className="text-(--text-muted)">.</span>
									{envSegment !== 'public' && (
										<>
											<span className="px-1.5 py-0.5 rounded-lg bg-(--accent)/12 text-(--accent) font-bold">{envSegment}</span>
											<span className="text-(--text-muted)">.</span>
										</>
									)}
									<span className="text-(--text-muted) pr-2 border-r border-(--border)/15">xernerx.com</span>
									<span className="pl-1 text-(--text) font-medium truncate">{activeRoutePath}</span>
								</div>

								<div className="flex items-center gap-2 shrink-0">
									<span className="px-2.5 py-0.5 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-(--accent) text-[11px] font-sans font-bold">
										{activeRoutePath.startsWith('/dashboard') ? t('components.header.omnibar.badgeServer') : t('components.header.omnibar.badgeRoute')}
									</span>
									<button
										type="button"
										onClick={handleCopyOmnibar}
										className="text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
										aria-label={t('components.header.omnibar.actionCopyDiscordId')}
									>
										{copiedUrl ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} />}
									</button>
								</div>
							</div>

							<div className="absolute top-[calc(100%+8px)] left-0 w-[520px] rounded-3xl bg-(--foreground)/90 backdrop-blur-xl border border-(--border)/15 shadow-2xl p-3.5 flex flex-col gap-2.5 z-50">
								<span className="text-[10px] font-extrabold uppercase tracking-wider text-(--text-muted) px-1">{t('components.header.omnibar.routesHeading', { app: 'APP' })}</span>
								<div className="grid grid-cols-2 gap-1.5">
									{[
										{ label: t('app.dashboard.nav.explore'), path: '/', view: 'explore' as const, Icon: Compass },
										{ label: t('app.home.text6'), path: '/dashboard', view: 'server' as const, Icon: LayoutDashboard },
										{ label: t('app.leaderboard.title'), path: '/leaderboard', view: 'leaderboard' as const, Icon: Trophy },
									].map((r) => (
										<button
											key={r.path}
											type="button"
											onClick={() => {
												onSelectView(r.view);
												setOmnibarOpen(false);
											}}
											className="flex items-center justify-between gap-2 rounded-2xl bg-(--background)/65 hover:bg-(--background) border border-(--border)/10 px-3 py-2 text-left transition-colors cursor-pointer"
										>
											<span className="inline-flex items-center gap-2 text-xs font-bold text-(--text) truncate">
												<r.Icon size={13} className="text-(--accent) shrink-0" />
												<span>{r.label}</span>
												<span className="font-mono text-[11px] text-(--text-muted)">{r.path}</span>
											</span>
											<span className="rounded-full bg-(--accent)/15 text-(--accent) px-2 py-0.5 text-[10px] font-bold shrink-0">
												{t('components.header.omnibar.badgeRoute')}
											</span>
										</button>
									))}
								</div>
							</div>
						</div>

						<button
							type="button"
							onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
							className="h-8 w-8 rounded-full bg-(--foreground)/35 hover:bg-(--foreground)/70 border border-(--border)/10 flex items-center justify-center text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer shrink-0"
							aria-label={t('components.header.omnibar.actionToggleTheme')}
						>
							{resolvedTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
						</button>

						<button
							type="button"
							onClick={() => setOmnibarOpen(false)}
							className="h-8 w-8 rounded-full bg-(--foreground)/35 hover:bg-(--foreground)/70 border border-(--border)/10 flex items-center justify-center text-(--text-muted) hover:text-(--text) transition-colors cursor-pointer shrink-0"
							aria-label={t('common.close')}
						>
							<X size={14} />
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
