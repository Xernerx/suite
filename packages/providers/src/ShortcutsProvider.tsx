/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Command, Compass, FileText, HelpCircle, Search, SidebarIcon, X } from 'lucide-react';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { navigation } from '@xernerx/lib';
import { useEnvironment } from '@xernerx/providers';

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
			<NavigationModal isOpen={isNavOpen} onClose={() => setNavOpen(false)} />
			<FloatingNavigationShortcut />
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

function NavigationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const { getEnvUrl } = useEnvironment();

	return (
		<AnimatePresence>
			{isOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className='absolute inset-0 bg-black/60 backdrop-blur-sm' />

					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
						className='relative w-full max-w-lg rounded-2xl bg-(--foreground) border border-(--border)/10 p-6 shadow-2xl z-10 max-h-[85vh] flex flex-col'>
						<div className='flex items-center justify-between mb-6 pb-4 border-b border-(--border)/10 shrink-0'>
							<div className='flex items-center gap-3'>
								<div
									className='flex h-10 w-10 items-center justify-center rounded-xl'
									style={{
										background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
										color: 'var(--accent)',
									}}>
									<Compass size={20} />
								</div>
								<div>
									<h2 className='text-lg font-semibold text-(--text)'>Navigation</h2>
								</div>
							</div>

							<button onClick={onClose} className='rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition'>
								<X size={18} />
							</button>
						</div>

						<div className='space-y-2 overflow-y-auto pr-1'>
							{navigation && navigation.length > 0 ? (
								navigation.map((item: any, idx: number) => {
									const resolvedHref = getEnvUrl(item.href);
									return (
										<a
											key={idx}
											href={resolvedHref}
											onClick={onClose}
											className='flex items-center justify-between rounded-xl px-4 py-3 bg-(--background) border border-(--border)/10 transition hover:border-(--accent)'>
											<span className='text-sm font-medium text-(--text)'>{item.label}</span>
											<span className='text-xs text-(--text-muted) font-mono'>{resolvedHref}</span>
										</a>
									);
								})
							) : (
								<p className='text-sm text-(--text-muted) text-center py-4'>No navigation links available.</p>
							)}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

function FloatingNavigationShortcut() {
	const { setNavOpen } = useShortcuts();

	return (
		<div className='fixed top-6 left-6 z-40'>
			<button
				onClick={() => setNavOpen(true)}
				className='flex h-11 items-center gap-2 px-3.5 rounded-xl bg-(--foreground) border border-(--border)/10 shadow-lg text-(--text) transition hover:border-(--accent)'
				title='Open Navigation (Ctrl + K)'>
				<Compass size={18} className='text-(--accent)' />
				<span className='text-xs font-medium'>Navigation</span>
			</button>
		</div>
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
				<div className='fixed inset-0 z-[60] flex items-center justify-center p-4'>
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className='absolute inset-0 bg-black/60 backdrop-blur-sm' />

					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
						className='relative w-full max-w-2xl rounded-2xl bg-(--foreground) border border-(--border)/10 p-6 shadow-2xl z-10 max-h-[85vh] flex flex-col'>
						<div className='flex items-center justify-between mb-6 pb-4 border-b border-(--border)/10 shrink-0'>
							<div className='flex items-center gap-3'>
								<div
									className='flex h-10 w-10 items-center justify-center rounded-xl'
									style={{
										background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
										color: 'var(--accent)',
									}}>
									<FileText size={20} />
								</div>
								<div>
									<h2 className='text-lg font-semibold text-(--text)'>Changelog</h2>
									<p className='text-xs text-(--text-muted)'>Recent application updates and releases</p>
								</div>
							</div>

							<div className='flex items-center gap-3'>
								{changelogData?.versions && changelogData.versions.length > 0 && (
									<div className='relative'>
										<button
											onClick={() => setDropdownOpen((prev) => !prev)}
											className='flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--background) border border-(--border)/10 text-xs font-mono text-(--text) hover:border-(--accent) transition'>
											<span>{changelogData.selectedVersion || 'Select Version'}</span>
											<ChevronDown size={14} className='text-(--text-muted)' />
										</button>

										<AnimatePresence>
											{isDropdownOpen && (
												<motion.div
													initial={{ opacity: 0, y: 4 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: 4 }}
													className='absolute right-0 mt-2 w-40 rounded-xl bg-(--background) border border-(--border)/10 shadow-xl p-1 z-20 max-h-48 overflow-y-auto'>
													{changelogData.versions.map((ver) => (
														<button
															key={ver}
															onClick={() => {
																setDropdownOpen(false);
																fetchChangelog(ver);
															}}
															className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition ${
																changelogData.selectedVersion === ver ? 'bg-(--accent)/10 text-(--accent) font-semibold' : 'text-(--text) hover:bg-(--foreground)'
															}`}>
															{ver}
														</button>
													))}
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								)}

								<button onClick={onClose} className='rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition'>
									<X size={18} />
								</button>
							</div>
						</div>

						<div className='space-y-4 overflow-y-auto pr-2 flex-1 text-sm text-(--text-muted) font-mono whitespace-pre-wrap bg-(--background) p-4 rounded-xl border border-(--border)/10'>
							{changelogData ? changelogData.content : 'Loading changelog...'}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

function HelpModal({ isOpen, onClose, shortcuts }: { isOpen: boolean; onClose: () => void; shortcuts: ShortcutItem[] }) {
	const [electronVersion, setElectronVersion] = useState<string | null>(null);
	const [appVersion, setAppVersion] = useState<string>('1.0.0');
	const [isChangelogOpen, setChangelogOpen] = useState(false);

	useEffect(() => {
		const win = window as any;
		if (win.electron) {
			if (win.electron.version) {
				setAppVersion(win.electron.version);
			}
			if (win.electron.metadata?.electronVersion) {
				setElectronVersion(win.electron.metadata.electronVersion);
			} else {
				setElectronVersion('Loaded');
			}
		} else {
			fetch('/api/version')
				.then((res) => res.json())
				.then((data) => {
					if (data.version) setAppVersion(data.version);
				})
				.catch(() => {});
		}
	}, []);

	return (
		<>
			<AnimatePresence>
				{isOpen && (
					<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className='absolute inset-0 bg-black/60 backdrop-blur-sm' />

						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
							className='relative w-full max-w-lg rounded-2xl bg-(--foreground) border border-(--border)/10 p-6 shadow-2xl z-10 max-h-[85vh] flex flex-col'>
							<div className='flex items-center justify-between mb-6 pb-4 border-b border-(--border)/10 shrink-0'>
								<div className='flex items-center gap-3'>
									<div
										className='flex h-10 w-10 items-center justify-center rounded-xl'
										style={{
											background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
											color: 'var(--accent)',
										}}>
										<Command size={20} />
									</div>
									<div>
										<h2 className='text-lg font-semibold text-(--text)'>Keyboard Shortcuts</h2>
										<p className='text-xs text-(--text-muted)'>Quick commands to navigate efficiently</p>
									</div>
								</div>

								<button onClick={onClose} className='rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition'>
									<X size={18} />
								</button>
							</div>

							<div className='space-y-3 overflow-y-auto pr-1'>
								{shortcuts.map((item, idx) => {
									const IconComponent = item.icon || Command;
									return (
										<div key={idx} className='flex items-center justify-between rounded-xl px-4 py-3 bg-(--background) border border-(--border)/10'>
											<div className='flex items-center gap-3 text-sm text-(--text)'>
												<IconComponent size={16} className='text-(--accent)' />
												<span>{item.description}</span>
											</div>

											<kbd className='rounded-md px-2.5 py-1 text-xs font-mono font-medium bg-(--foreground) text-(--text) border border-(--border)/10 shadow-sm'>{item.key}</kbd>
										</div>
									);
								})}
							</div>

							<div className='mt-6 pt-4 border-t border-(--border)/10 flex items-center justify-between text-xs text-(--text-muted) shrink-0 px-1'>
								<div className='flex items-center gap-2'>
									<span>
										Version:{' '}
										<button onClick={() => setChangelogOpen(true)} className='text-(--text) font-mono underline hover:text-(--accent) transition cursor-pointer' title='View Changelog'>
											{appVersion}
										</button>
									</span>
									{electronVersion && (
										<>
											<span>•</span>
											<span>
												Electron: <strong className='text-(--text) font-mono'>{electronVersion}</strong>
											</span>
										</>
									)}
								</div>
								<span>
									Press <kbd className='font-mono text-(--text)'>Esc</kbd> to close
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
