/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ChevronDown, Command, Compass, Copy, FileText, Globe, HelpCircle, Layers, LayoutGrid, RefreshCw, Save, Search, Settings, SidebarIcon, X } from 'lucide-react';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useDictionary, useEnvironment, useSidebar, useToast, useUser } from '@xernerx/providers';
import { navigation } from '@xernerx/lib';
import { useSession } from 'next-auth/react';
import { CommandPaletteModal } from './CommandPaletteModal';

type ShortcutItem = {
	key: string;
	description: string;
	icon?: React.ElementType;
};
type ShortcutsContextType = {
	isHelpOpen: boolean;
	setHelpOpen: (open: boolean) => void;
	isSearchOpen: boolean;
	setSearchOpen: (open: boolean) => void;
	isNavOpen: boolean;
	setNavOpen: (open: boolean) => void;
	isSidebarVisible: boolean;
	toggleSidebar: () => void;
	isUrlPlacerOpen: boolean;
	setUrlPlacerOpen: (open: boolean) => void;
	shortcuts: ShortcutItem[];
	registerShortcut: (shortcut: ShortcutItem) => void;
};
const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);
const defaultShortcuts: ShortcutItem[] = [
	{
		key: 'Ctrl + /',
		description: 'common.shortcuts.items.toggleHelp',
		icon: HelpCircle,
	},
	{
		key: 'Ctrl + K',
		description: 'common.shortcuts.items.searchOrPalette',
		icon: Search,
	},
	{
		key: 'Ctrl + Space',
		description: 'common.shortcuts.items.openAppDrawer',
		icon: Compass,
	},
	{
		key: 'Ctrl + B',
		description: 'common.shortcuts.items.toggleSidebar',
		icon: SidebarIcon,
	},
	{
		key: 'Ctrl + .',
		description: 'common.shortcuts.items.toggleOmnibar',
		icon: Globe,
	},
	{
		key: 'Ctrl + I',
		description: 'common.shortcuts.items.toggleNotifications',
		icon: Bell,
	},
	{
		key: 'Ctrl + ,',
		description: 'common.shortcuts.items.openAccountSettings',
		icon: Settings,
	},
	{
		key: 'Ctrl + S / Enter',
		description: 'common.shortcuts.items.saveChanges',
		icon: Save,
	},
	{
		key: 'Alt + 1..9',
		description: 'common.shortcuts.items.switchSidebarViews',
		icon: Layers,
	},
	{
		key: 'Ctrl + Shift + C',
		description: 'common.shortcuts.items.copyUrl',
		icon: Copy,
	},
	{
		key: 'Ctrl + R',
		description: 'common.shortcuts.items.reloadApp',
		icon: RefreshCw,
	},
	{
		key: 'Esc',
		description: 'common.shortcuts.items.closeModals',
		icon: X,
	},
];
export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const sidebar = useSidebar();
	const [isHelpOpen, setHelpOpen] = useState(false);
	const [isSearchOpen, setSearchOpen] = useState(false);
	const [isNavOpen, setNavOpen] = useState(false);
	const [isUrlPlacerOpen, setUrlPlacerOpen] = useState(false);
	const [isSidebarVisible, setSidebarVisible] = useState(true);
	const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(defaultShortcuts);
	const toggleSidebar = () => setSidebarVisible((prev) => !prev);
	const registerShortcut = (newShortcut: ShortcutItem) => {
		setShortcuts((prev) => {
			if (prev.some((s) => s.key === newShortcut.key)) return prev;
			return [...prev, newShortcut];
		});
	};
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
			if ((e.ctrlKey || e.metaKey) && e.key === '.') {
				e.preventDefault();
				setUrlPlacerOpen((prev) => !prev);
			} else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
				e.preventDefault();
				setHelpOpen((prev) => !prev);
			} else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
				const pageSearchInput = document.querySelector('[data-search-shortcut="k"]');
				if (!pageSearchInput || e.shiftKey || isSearchOpen) {
					e.preventDefault();
					setSearchOpen((prev) => !prev);
				}
			} else if (((e.ctrlKey || e.metaKey) && (e.key === ' ' || e.code === 'Space')) || (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'a' || e.key === 'A') && !isInput)) {
				e.preventDefault();
				setNavOpen((prev) => !prev);
			} else if ((e.ctrlKey || e.metaKey) && e.key === ',' && !isInput) {
				e.preventDefault();
				window.location.href = getEnvUrl('https://account.xernerx.com');
			} else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C') && !isInput) {
				e.preventDefault();
				const urlObj = new URL(window.location.href);
				if (sidebar.state !== 'hidden' && sidebar.view && !urlObj.searchParams.has('view')) {
					urlObj.searchParams.set('view', sidebar.view);
				}
				const currentUrl = urlObj.toString();
				navigator.clipboard.writeText(currentUrl).then(() => {
					toast({ type: 'success', title: t('components.header.urlCopied'), description: currentUrl });
				});
			} else if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B') && !isInput) {
				e.preventDefault();
				toggleSidebar();
			} else if (e.key === 'Escape') {
				setHelpOpen(false);
				setSearchOpen(false);
				setNavOpen(false);
				setUrlPlacerOpen(false);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [getEnvUrl, toast, t, isSearchOpen, sidebar.state, sidebar.view]);
	const value = {
		isHelpOpen,
		setHelpOpen,
		isSearchOpen,
		setSearchOpen,
		isNavOpen,
		setNavOpen,
		isUrlPlacerOpen,
		setUrlPlacerOpen,
		isSidebarVisible,
		toggleSidebar,
		shortcuts,
		registerShortcut,
	};
	return (
		<ShortcutsContext.Provider value={value}>
			{children}
			<HelpModal isOpen={isHelpOpen} onClose={() => setHelpOpen(false)} shortcuts={shortcuts} />
			<NavigationModal isOpen={isNavOpen} onClose={() => setNavOpen(false)} navigation={navigation} />
			<CommandPaletteModal
				isOpen={isSearchOpen}
				onClose={() => setSearchOpen(false)}
				navigation={navigation}
				onOpenAppDrawer={() => {
					setSearchOpen(false);
					setNavOpen(true);
				}}
				onOpenHelp={() => {
					setSearchOpen(false);
					setHelpOpen(true);
				}}
				onOpenOmnibar={() => {
					setSearchOpen(false);
					setUrlPlacerOpen(true);
				}}
			/>
		</ShortcutsContext.Provider>
	);
}
export function useShortcuts() {
	const context = useContext(ShortcutsContext);
	if (context === undefined) {
		throw new Error('useShortcuts must be used within a ShortcutsProvider');
	}
	return context;
}
export function NavigationModal({ isOpen, onClose, navigation = [] }: { isOpen: boolean; onClose: () => void; navigation?: any[] }) {
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const { data: session } = useSession();
	const { user: discordUser } = useUser();
	const [roles, setRoles] = useState<any[]>([]);
	const [filterQuery, setFilterQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const filterInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isOpen) {
			setFilterQuery('');
			setSelectedIndex(0);
			return;
		}
		setTimeout(() => filterInputRef.current?.focus(), 20);
		fetch(getEnvUrl('https://api.xernerx.com/secure/core'), {
			credentials: 'include',
		})
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => setRoles(Array.isArray(data) ? data : []))
			.catch(() => {});
	}, [getEnvUrl, isOpen]);

	const activeUser = discordUser || session?.user;
	const userRoleIds = Array.isArray((activeUser as any)?.roles) ? (activeUser as any).roles : [];
	const activeRoles = roles.filter((r) => userRoleIds.includes(r.id));
	const hasAdminAccess = activeRoles.some((r) => r.permissions?.access === true);
	const visibleNavigation = navigation
		.filter((item) => !item.adminOnly || hasAdminAccess)
		.filter((item) => {
			if (!filterQuery.trim()) return true;
			const q = filterQuery.toLowerCase();
			return t(item.label).toLowerCase().includes(q) || (item.category && t(item.category).toLowerCase().includes(q));
		});

	useEffect(() => {
		setSelectedIndex(0);
	}, [filterQuery]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (visibleNavigation.length === 0) return;
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev + 1) % visibleNavigation.length);
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev - 1 + visibleNavigation.length) % visibleNavigation.length);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const selected = visibleNavigation[selectedIndex];
			if (selected) {
				window.location.href = getEnvUrl(selected.href);
				onClose();
			}
		}
	};

	const hasCategories = visibleNavigation.some((item) => item.category);
	const groupedNavigation = visibleNavigation.reduce((acc: Record<string, any[]>, item: any) => {
		const category = item.category || 'Other';
		if (!acc[category]) acc[category] = [];
		acc[category].push(item);
		return acc;
	}, {});

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
					<motion.div
						initial={{
							opacity: 0,
						}}
						animate={{
							opacity: 1,
						}}
						exit={{
							opacity: 0,
						}}
						onClick={onClose}
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
					/>

					<motion.div
						initial={{
							opacity: 0,
							scale: 0.95,
							y: 20,
						}}
						animate={{
							opacity: 1,
							scale: 1,
							y: 0,
						}}
						exit={{
							opacity: 0,
							scale: 0.95,
							y: 20,
						}}
						transition={{
							duration: 0.2,
							ease: [0.16, 1, 0.3, 1],
						}}
						className="relative w-full max-w-3xl rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl z-10 max-h-[85vh] flex flex-col"
						style={{
							padding: 'var(--ui-gap)',
							gap: 'var(--ui-gap)',
						}}
					>
						<div className="flex items-center justify-between pb-3 border-b border-(--border)/10 shrink-0 gap-4">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
									style={{
										background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
										color: 'var(--accent)',
									}}
								>
									<LayoutGrid size={20} />
								</div>
								<div>
									<h2 className="text-lg font-semibold text-(--text)">{t('common.shortcuts.modal.navigation.title')}</h2>
									<p className="text-xs text-(--text-muted)">{t('common.shortcuts.modal.navigation.description')}</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<div className="relative hidden sm:flex items-center">
									<Search size={14} className="absolute left-3 text-(--text-muted)" />
									<input
										ref={filterInputRef}
										type="text"
										value={filterQuery}
										onChange={(e) => setFilterQuery(e.target.value)}
										placeholder={t('common.shortcuts.modal.navigation.searchPlaceholder')}
										className="pl-8 pr-3 py-1.5 rounded-xl bg-(--background) border border-(--border)/10 text-xs text-(--text) placeholder:text-(--text-muted) outline-none focus:border-(--accent) w-48 transition"
									/>
								</div>
								<button onClick={onClose} className="rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition">
									<X size={18} />
								</button>
							</div>
						</div>

						<div
							className="overflow-y-auto pr-1 flex flex-col"
							style={{
								gap: 'var(--ui-gap)',
							}}
						>
							{visibleNavigation.length > 0 ? (
								hasCategories ? (
									Object.entries(groupedNavigation).map(([category, items]) => (
										<div
											key={category}
											className="flex flex-col"
											style={{
												gap: 'calc(var(--ui-gap) * 0.5)',
											}}
										>
											<h3 className="text-xs font-bold uppercase tracking-wider text-(--text-muted) px-1">{t(category)}</h3>
											<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6">
												{items.map((item: any, idx: number) => {
													const globalIdx = visibleNavigation.indexOf(item);
													const isSelected = globalIdx === selectedIndex;
													const resolvedHref = getEnvUrl(item.href);
													const AppIcon = item.icon || Compass;
													return (
														<a
															key={idx}
															href={resolvedHref}
															onClick={onClose}
															onMouseEnter={() => setSelectedIndex(globalIdx)}
															className="group flex flex-col items-center gap-3 cursor-pointer"
														>
															<div
																className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-[22px] bg-(--background) border shadow-sm transition-all duration-200 ease-out group-hover:scale-105 group-hover:shadow-md ${
																	isSelected
																		? 'scale-105 border-(--accent) ring-2 ring-(--accent)/30 shadow-md'
																		: 'border-(--border)/10 group-hover:border-(--accent)/50'
																}`}
															>
																<AppIcon
																	size={18}
																	className={`${isSelected ? 'text-(--accent)' : 'text-(--text-muted) group-hover:text-(--accent)'} transition-colors`}
																/>
															</div>
															<span className={`text-xs sm:text-sm font-medium text-center line-clamp-1 w-full px-1 ${isSelected ? 'text-(--accent)' : 'text-(--text)'}`}>
																{t(item.label)}
															</span>
														</a>
													);
												})}
											</div>
										</div>
									))
								) : (
									<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6 py-2">
										{visibleNavigation.map((item: any, idx: number) => {
											const isSelected = idx === selectedIndex;
											const resolvedHref = getEnvUrl(item.href);
											const AppIcon = item.icon || Compass;
											return (
												<a
													key={idx}
													href={resolvedHref}
													onClick={onClose}
													onMouseEnter={() => setSelectedIndex(idx)}
													className="group flex flex-col items-center gap-3 cursor-pointer"
												>
													<div
														className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-[22px] bg-(--background) border shadow-sm transition-all duration-200 ease-out group-hover:scale-105 group-hover:shadow-md ${
															isSelected ? 'scale-105 border-(--accent) ring-2 ring-(--accent)/30 shadow-md' : 'border-(--border)/10 group-hover:border-(--accent)/50'
														}`}
													>
														<AppIcon size={28} className={`${isSelected ? 'text-(--accent)' : 'text-(--text-muted) group-hover:text-(--accent)'} transition-colors`} />
													</div>
													<span className={`text-xs sm:text-sm font-medium text-center line-clamp-1 w-full px-1 ${isSelected ? 'text-(--accent)' : 'text-(--text)'}`}>
														{t(item.label)}
													</span>
												</a>
											);
										})}
									</div>
								)
							) : (
								<p className="text-sm text-(--text-muted) text-center py-10">{t('common.shortcuts.modal.navigation.empty')}</p>
							)}
						</div>

						<div className="pt-2 border-t border-(--border)/10 flex items-center justify-between text-[11px] text-(--text-muted) shrink-0 px-1">
							<span>{t('common.shortcuts.modal.navigation.navigateHint')}</span>
							<span>
								{t('common.shortcutsprovider.description4')} <kbd className="font-mono text-(--text)">{t('common.shortcutsprovider.text')}</kbd>{' '}
								{t('common.shortcutsprovider.description5')}
							</span>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
function ChangelogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [changelogData, setChangelogData] = useState<{
		versions: string[];
		selectedVersion: string;
		content: string;
	} | null>(null);
	const [isDropdownOpen, setDropdownOpen] = useState(false);
	const fetchChangelog = (version?: string) => {
		const url = version ? `/api/changelog?version=${encodeURIComponent(version)}` : '/api/changelog';
		fetch(url)
			.then((res) => res.json())
			.then((data) => setChangelogData(data))
			.catch(() => setChangelogData(null));
	};
	useEffect(() => {
		if (isOpen) {
			fetchChangelog();
		}
	}, [isOpen]);

	const renderFormattedChangelog = (raw: string) => {
		const lines = raw.split('\n');
		return (
			<div className="flex flex-col gap-2.5 text-sm">
				{lines.map((line, i) => {
					const trimmed = line.trim();
					if (!trimmed) return null;
					if (trimmed.startsWith('## ')) {
						return (
							<h3 key={i} className="text-base font-bold text-(--text) border-b border-(--border)/10 pb-1.5 mt-1">
								v{trimmed.replace(/^##\s*/, '')}
							</h3>
						);
					}
					if (trimmed.startsWith('### ')) {
						const sectionName = trimmed.replace(/^###\s*/, '');
						return (
							<span
								key={i}
								className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-2"
							>
								{sectionName}
							</span>
						);
					}
					if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
						const itemText = trimmed.replace(/^[-*]\s*/, '');
						return (
							<div key={i} className="flex items-start gap-2.5 pl-2 text-(--text-muted) leading-relaxed">
								<span className="h-1.5 w-1.5 rounded-full bg-(--accent) mt-2 shrink-0" />
								<span>{itemText}</span>
							</div>
						);
					}
					return (
						<p key={i} className="text-(--text-muted) leading-relaxed">
							{trimmed}
						</p>
					);
				})}
			</div>
		);
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
					<motion.div
						initial={{
							opacity: 0,
						}}
						animate={{
							opacity: 1,
						}}
						exit={{
							opacity: 0,
						}}
						onClick={onClose}
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
					/>

					<motion.div
						initial={{
							opacity: 0,
							scale: 0.95,
							y: 20,
						}}
						animate={{
							opacity: 1,
							scale: 1,
							y: 0,
						}}
						exit={{
							opacity: 0,
							scale: 0.95,
							y: 20,
						}}
						transition={{
							duration: 0.2,
							ease: [0.16, 1, 0.3, 1],
						}}
						className="relative w-full max-w-2xl rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl z-10 max-h-[85vh] flex flex-col"
						style={{
							padding: 'var(--ui-gap)',
							gap: 'var(--ui-gap)',
						}}
					>
						<div className="flex items-center justify-between pb-3 border-b border-(--border)/10 shrink-0">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl"
									style={{
										background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
										color: 'var(--accent)',
									}}
								>
									<FileText size={20} />
								</div>
								<div>
									<h2 className="text-lg font-semibold text-(--text)">{t('common.shortcutsprovider.title')}</h2>
									<p className="text-xs text-(--text-muted)">{t('common.shortcutsprovider.description')}</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								{changelogData?.versions && changelogData.versions.length > 0 && (
									<div className="relative">
										<button
											onClick={() => setDropdownOpen((prev) => !prev)}
											className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--background) border border-(--border)/10 text-xs font-mono text-(--text) hover:border-(--accent) transition cursor-pointer"
										>
											<span>{changelogData.selectedVersion ? `v${changelogData.selectedVersion}` : t('common.shortcutsprovider.selectVersion')}</span>
											<ChevronDown size={14} className="text-(--text-muted)" />
										</button>

										<AnimatePresence>
											{isDropdownOpen && (
												<motion.div
													initial={{
														opacity: 0,
														y: 4,
													}}
													animate={{
														opacity: 1,
														y: 0,
													}}
													exit={{
														opacity: 0,
														y: 4,
													}}
													className="absolute right-0 mt-2 w-40 rounded-xl bg-(--background) border border-(--border)/10 shadow-xl p-1 z-20 max-h-48 overflow-y-auto"
												>
													{changelogData.versions.map((ver) => (
														<button
															key={ver}
															onClick={() => {
																setDropdownOpen(false);
																fetchChangelog(ver);
															}}
															className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition cursor-pointer ${changelogData.selectedVersion === ver ? 'bg-(--accent)/10 text-(--accent) font-semibold' : 'text-(--text) hover:bg-(--foreground)'}`}
														>
															v{ver}
														</button>
													))}
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								)}

								<button onClick={onClose} className="rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition cursor-pointer">
									<X size={18} />
								</button>
							</div>
						</div>

						<div
							className="overflow-y-auto pr-2 flex-1 bg-(--background) rounded-2xl border border-(--border)/10"
							style={{
								padding: 'var(--ui-gap)',
							}}
						>
							{changelogData ? renderFormattedChangelog(changelogData.content) : <span className="text-sm text-(--text-muted)">{t('common.shortcutsprovider.loadingChangelog')}</span>}
						</div>

						<div className="pt-2 border-t border-(--border)/10 flex items-center justify-between text-xs text-(--text-muted) shrink-0 px-1">
							<a href={getEnvUrl('https://info.xernerx.com/changelog')} className="text-(--accent) hover:underline font-semibold">
								{t('common.shortcutsprovider.viewFullChangelog')} →
							</a>
							<span>
								{t('common.shortcutsprovider.description4')} <kbd className="font-mono text-(--text)">{t('common.shortcutsprovider.text')}</kbd>{' '}
								{t('common.shortcutsprovider.description5')}
							</span>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
function HelpModal({ isOpen, onClose, shortcuts }: { isOpen: boolean; onClose: () => void; shortcuts: ShortcutItem[] }) {
	const { t } = useDictionary();
	const { environment } = useEnvironment();
	const [electronVersion, setElectronVersion] = useState<string | null>(null);
	const [appVersion, setAppVersion] = useState<string>('1.0.0');
	const [isChangelogOpen, setChangelogOpen] = useState(false);
	useEffect(() => {
		const win = window as any;
		if (win.electron) {
			if (win.electron.version) {
				setElectronVersion(win.electron.version);
			}
		}
		fetch('/api/version')
			.then((res) => res.json())
			.then((data) => {
				if (data.version) setAppVersion(data.version);
			})
			.catch(() => {});
	}, []);
	return (
		<>
			<AnimatePresence>
				{isOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<motion.div
							initial={{
								opacity: 0,
							}}
							animate={{
								opacity: 1,
							}}
							exit={{
								opacity: 0,
							}}
							onClick={onClose}
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						/>

						<motion.div
							initial={{
								opacity: 0,
								scale: 0.95,
								y: 20,
							}}
							animate={{
								opacity: 1,
								scale: 1,
								y: 0,
							}}
							exit={{
								opacity: 0,
								scale: 0.95,
								y: 20,
							}}
							transition={{
								duration: 0.2,
								ease: [0.16, 1, 0.3, 1],
							}}
							className="relative w-full max-w-lg rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl z-10 max-h-[85vh] flex flex-col"
							style={{
								padding: 'var(--ui-gap)',
								gap: 'var(--ui-gap)',
							}}
						>
							<div className="flex items-center justify-between pb-3 border-b border-(--border)/10 shrink-0">
								<div className="flex items-center gap-3">
									<div
										className="flex h-10 w-10 items-center justify-center rounded-xl"
										style={{
											background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
											color: 'var(--accent)',
										}}
									>
										<Command size={20} />
									</div>
									<div>
										<h2 className="text-lg font-semibold text-(--text)">{t('common.shortcutsprovider.title2')}</h2>
										<p className="text-xs text-(--text-muted)">{t('common.shortcutsprovider.description2')}</p>
									</div>
								</div>

								<button onClick={onClose} className="rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition">
									<X size={18} />
								</button>
							</div>

							<div
								className="flex flex-col overflow-y-auto pr-1"
								style={{
									gap: 'calc(var(--ui-gap) * 0.5)',
								}}
							>
								{shortcuts.map((item, idx) => {
									const IconComponent = item.icon || Command;
									return (
										<div key={idx} className="flex items-center justify-between rounded-xl px-4 py-3 bg-(--background) border border-(--border)/10">
											<div className="flex items-center gap-3 text-sm text-(--text)">
												<IconComponent size={16} className="text-(--accent)" />
												<span>{t(item.description)}</span>
											</div>

											<kbd className="rounded-md px-2.5 py-1 text-xs font-mono font-medium bg-(--foreground) text-(--text) border border-(--border)/10 shadow-sm">{item.key}</kbd>
										</div>
									);
								})}
							</div>

							<div className="pt-3 border-t border-(--border)/10 flex items-center justify-between text-xs text-(--text-muted) shrink-0 px-1">
								<div className="flex items-center gap-2">
									<span>
										{environment}:{' '}
										<button
											onClick={() => setChangelogOpen(true)}
											className="text-(--text) font-mono underline hover:text-(--accent) transition cursor-pointer"
											title={t('common.shortcutsprovider.tooltip')}
										>
											<strong>{appVersion}</strong>
										</button>
									</span>
									{electronVersion && (
										<>
											<span>•</span>
											<span>
												{t('common.shortcutsprovider.description3')}
												<strong className="text-(--text) font-mono">{electronVersion}</strong>
											</span>
										</>
									)}
								</div>
								<span>
									{t('common.shortcutsprovider.description4')}
									<kbd className="font-mono text-(--text)">{t('common.shortcutsprovider.text')}</kbd>
									{t('common.shortcutsprovider.description5')}
								</span>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			<ChangelogModal isOpen={isChangelogOpen} onClose={() => setChangelogOpen(false)} />
		</>
	);
}
