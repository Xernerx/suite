/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Command, Compass, FileText, HelpCircle, LayoutGrid, Search, SidebarIcon, X } from 'lucide-react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useUser } from '@xernerx/providers';

import { navigation } from '@xernerx/lib';
import { useSession } from 'next-auth/react';

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
	shortcuts: ShortcutItem[];
	registerShortcut: (shortcut: ShortcutItem) => void;
};

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);

const defaultShortcuts: ShortcutItem[] = [
	{ key: 'Ctrl + .', description: 'Toggle help menu', icon: HelpCircle },
	{ key: 'Ctrl + /', description: 'Open global search across app', icon: Search },
	{ key: 'Ctrl + K', description: 'Open navigation modal', icon: Compass },
	{ key: 'Ctrl + ~', description: 'Toggle application sidebar visibility', icon: SidebarIcon },
	{ key: 'Esc', description: 'Close active overlays or modals', icon: X },
];

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
	const [isHelpOpen, setHelpOpen] = useState(false);
	const [isSearchOpen, setSearchOpen] = useState(false);
	const [isNavOpen, setNavOpen] = useState(false);
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

			if (e.ctrlKey && e.key === '.') {
				e.preventDefault();
				setHelpOpen((prev) => !prev);
			} else if (e.ctrlKey && e.key === '/') {
				e.preventDefault();
				setSearchOpen((prev) => !prev);
			} else if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) {
				e.preventDefault();
				setNavOpen((prev) => !prev);
			} else if (e.ctrlKey && e.key === '`' && !isInput) {
				e.preventDefault();
				toggleSidebar();
			} else if (e.key === 'Escape') {
				setHelpOpen(false);
				setSearchOpen(false);
				setNavOpen(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	const value = {
		isHelpOpen,
		setHelpOpen,
		isSearchOpen,
		setSearchOpen,
		isNavOpen,
		setNavOpen,
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

	useEffect(() => {
		if (!isOpen) return;
		fetch(getEnvUrl('https://api.xernerx.com/secure/roles'), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => setRoles(data))
			.catch(() => {});
	}, [getEnvUrl, isOpen]);

	const activeUser = discordUser || session?.user;
	const userRoleIds = Array.isArray(activeUser?.roles) ? activeUser.roles : [];
	const activeRoles = roles.filter((r) => userRoleIds.includes(r.id));
	const hasAdminAccess = activeRoles.some((r) => r.permissions?.access === true);

	const visibleNavigation = navigation.filter((item) => !item.adminOnly || hasAdminAccess);
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
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
						className="relative w-full max-w-3xl rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl z-10 max-h-[85vh] flex flex-col"
						style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
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
									<LayoutGrid size={20} />
								</div>
								<div>
									<h2 className="text-lg font-semibold text-(--text)">{t('common.shortcuts.modal.navigation.title')}</h2>
									<p className="text-xs text-(--text-muted)">{t('common.shortcuts.modal.navigation.description')}</p>
								</div>
							</div>

							<button onClick={onClose} className="rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition">
								<X size={18} />
							</button>
						</div>

						<div className="overflow-y-auto pr-1 flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
							{visibleNavigation.length > 0 ? (
								hasCategories ? (
									Object.entries(groupedNavigation).map(([category, items]) => (
										<div key={category} className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
											<h3 className="text-xs font-bold uppercase tracking-wider text-(--text-muted) px-1">{category}</h3>
											<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6">
												{items.map((item: any, idx: number) => {
													const resolvedHref = getEnvUrl(item.href);
													const AppIcon = item.icon || Compass;

													return (
														<a key={idx} href={resolvedHref} onClick={onClose} className="group flex flex-col items-center gap-3 cursor-pointer">
															<div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-[22px] bg-(--background) border border-(--border)/10 shadow-sm transition-all duration-200 ease-out group-hover:scale-105 group-hover:shadow-md group-hover:border-(--accent)/50">
																<AppIcon size={18} className="text-(--text-muted) group-hover:text-(--accent) transition-colors" />
															</div>
															<span className="text-xs sm:text-sm font-medium text-(--text) text-center line-clamp-1 w-full px-1">{item.label}</span>
														</a>
													);
												})}
											</div>
										</div>
									))
								) : (
									<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6 py-2">
										{visibleNavigation.map((item: any, idx: number) => {
											const resolvedHref = getEnvUrl(item.href);
											const AppIcon = item.icon || Compass;

											return (
												<a key={idx} href={resolvedHref} onClick={onClose} className="group flex flex-col items-center gap-3 cursor-pointer">
													<div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-[22px] bg-(--background) border border-(--border)/10 shadow-sm transition-all duration-200 ease-out group-hover:scale-105 group-hover:shadow-md group-hover:border-(--accent)/50">
														<AppIcon size={28} className="text-(--text-muted) group-hover:text-(--accent) transition-colors" />
													</div>
													<span className="text-xs sm:text-sm font-medium text-(--text) text-center line-clamp-1 w-full px-1">{item.label}</span>
												</a>
											);
										})}
									</div>
								)
							) : (
								<p className="text-sm text-(--text-muted) text-center py-10">{t('common.shortcuts.modal.navigation.empty')}</p>
							)}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

function ChangelogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const [changelogData, setChangelogData] = useState<{ versions: string[]; selectedVersion: string; content: string } | null>(null);
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

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
						className="relative w-full max-w-2xl rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl z-10 max-h-[85vh] flex flex-col"
						style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
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
									<h2 className="text-lg font-semibold text-(--text)">Changelog</h2>
									<p className="text-xs text-(--text-muted)">Recent application updates and releases</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								{changelogData?.versions && changelogData.versions.length > 0 && (
									<div className="relative">
										<button
											onClick={() => setDropdownOpen((prev) => !prev)}
											className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--background) border border-(--border)/10 text-xs font-mono text-(--text) hover:border-(--accent) transition"
										>
											<span>{changelogData.selectedVersion || 'Select Version'}</span>
											<ChevronDown size={14} className="text-(--text-muted)" />
										</button>

										<AnimatePresence>
											{isDropdownOpen && (
												<motion.div
													initial={{ opacity: 0, y: 4 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: 4 }}
													className="absolute right-0 mt-2 w-40 rounded-xl bg-(--background) border border-(--border)/10 shadow-xl p-1 z-20 max-h-48 overflow-y-auto"
												>
													{changelogData.versions.map((ver) => (
														<button
															key={ver}
															onClick={() => {
																setDropdownOpen(false);
																fetchChangelog(ver);
															}}
															className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition ${
																changelogData.selectedVersion === ver ? 'bg-(--accent)/10 text-(--accent) font-semibold' : 'text-(--text) hover:bg-(--foreground)'
															}`}
														>
															{ver}
														</button>
													))}
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								)}

								<button onClick={onClose} className="rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition">
									<X size={18} />
								</button>
							</div>
						</div>

						<div
							className="overflow-y-auto pr-2 flex-1 text-sm text-(--text-muted) font-mono whitespace-pre-wrap bg-(--background) rounded-2xl border border-(--border)/10"
							style={{ padding: 'var(--ui-gap)' }}
						>
							{changelogData ? changelogData.content : 'Loading changelog...'}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

function HelpModal({ isOpen, onClose, shortcuts }: { isOpen: boolean; onClose: () => void; shortcuts: ShortcutItem[] }) {
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
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
							className="relative w-full max-w-lg rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl z-10 max-h-[85vh] flex flex-col"
							style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
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
										<h2 className="text-lg font-semibold text-(--text)">Keyboard Shortcuts</h2>
										<p className="text-xs text-(--text-muted)">Quick commands to navigate efficiently</p>
									</div>
								</div>

								<button onClick={onClose} className="rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition">
									<X size={18} />
								</button>
							</div>

							<div className="flex flex-col overflow-y-auto pr-1" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
								{shortcuts.map((item, idx) => {
									const IconComponent = item.icon || Command;
									return (
										<div key={idx} className="flex items-center justify-between rounded-xl px-4 py-3 bg-(--background) border border-(--border)/10">
											<div className="flex items-center gap-3 text-sm text-(--text)">
												<IconComponent size={16} className="text-(--accent)" />
												<span>{item.description}</span>
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
											title="View Changelog"
										>
											<strong>{appVersion}</strong>
										</button>
									</span>
									{electronVersion && (
										<>
											<span>•</span>
											<span>
												App: <strong className="text-(--text) font-mono">{electronVersion}</strong>
											</span>
										</>
									)}
								</div>
								<span>
									Press <kbd className="font-mono text-(--text)">Esc</kbd> to close
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
