/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Compass, Copy, Globe, HelpCircle, Layers, LayoutGrid, Moon, Search, Settings, SidebarIcon, Sun, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDictionary } from './DictionaryProvider';
import { useEnvironment } from './EnvironmentProvider';
import { useSidebar } from './SidebarProvider';
import { useTheme } from './ThemeProvider';
import { useToast } from './ToastProvider';
import { useUser } from './UserProvider';

type PaletteActionItem = {
	id: string;
	section: 'views' | 'actions' | 'apps';
	label: string;
	subtitle?: string;
	shortcut?: string;
	icon: React.ElementType;
	onSelect: () => void;
};

export function CommandPaletteModal({
	isOpen,
	onClose,
	navigation = [],
	onOpenAppDrawer,
	onOpenHelp,
	onOpenOmnibar,
}: {
	isOpen: boolean;
	onClose: () => void;
	navigation?: any[];
	onOpenAppDrawer: () => void;
	onOpenHelp: () => void;
	onOpenOmnibar: () => void;
}) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const router = useRouter();
	const sidebar = useSidebar();
	const { resolvedTheme, setTheme } = useTheme();
	const { data: session } = useSession();
	const { user: discordUser } = useUser();

	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [roles, setRoles] = useState<any[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isOpen) {
			setQuery('');
			setSelectedIndex(0);
			return;
		}
		setTimeout(() => inputRef.current?.focus(), 20);
		fetch(getEnvUrl('https://api.xernerx.com/secure/core'), {
			credentials: 'include',
		})
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => setRoles(Array.isArray(data) ? data : []))
			.catch(() => {});
	}, [isOpen, getEnvUrl]);

	const activeUser = discordUser || session?.user;
	const userRoleIds = Array.isArray((activeUser as any)?.roles) ? (activeUser as any).roles : [];
	const activeRoles = roles.filter((r) => userRoleIds.includes(r.id));
	const hasAdminAccess = activeRoles.some((r) => r.permissions?.access === true);
	const visibleNavigation = useMemo(() => navigation.filter((item) => !item.adminOnly || hasAdminAccess), [navigation, hasAdminAccess]);

	const allItems: PaletteActionItem[] = useMemo(() => {
		const list: PaletteActionItem[] = [];

		// 1. Active Page Sidebar Views
		if (sidebar.state !== 'hidden' && sidebar.navItems.length > 0) {
			sidebar.navItems.forEach((item, idx) => {
				const resolvedLabel = t(item.label);
				const resolvedCategory = item.category ? t(item.category) : undefined;
				list.push({
					id: `view-${item.view || item.label}-${idx}`,
					section: 'views',
					label: resolvedLabel,
					subtitle: resolvedCategory,
					shortcut: idx < 9 ? `Alt + ${idx + 1}` : undefined,
					icon: item.icon || Layers,
					onSelect: () => {
						if (item.view) sidebar.setView(item.view);
						if (item.onClick) item.onClick();
						if (item.href && item.href !== '#') router.push(item.href);
						onClose();
					},
				});
			});
		}

		// 2. Quick Actions
		list.push({
			id: 'action-theme',
			section: 'actions',
			label: resolvedTheme === 'dark' ? t('common.shortcuts.modal.palette.actions.switchThemeLight') : t('common.shortcuts.modal.palette.actions.switchThemeDark'),
			icon: resolvedTheme === 'dark' ? Sun : Moon,
			onSelect: () => {
				setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
				onClose();
			},
		});

		if (sidebar.state !== 'hidden') {
			list.push({
				id: 'action-sidebar',
				section: 'actions',
				label: t('common.shortcuts.modal.palette.actions.toggleSidebar'),
				shortcut: 'Ctrl + B',
				icon: SidebarIcon,
				onSelect: () => {
					sidebar.toggle();
					onClose();
				},
			});
		}

		list.push(
			{
				id: 'action-app-drawer',
				section: 'actions',
				label: t('common.shortcuts.modal.palette.actions.openAppDrawer'),
				shortcut: 'Ctrl + Space',
				icon: LayoutGrid,
				onSelect: () => {
					onOpenAppDrawer();
				},
			},
			{
				id: 'action-omnibar',
				section: 'actions',
				label: t('common.shortcuts.modal.palette.actions.toggleOmnibar'),
				shortcut: 'Ctrl + .',
				icon: Globe,
				onSelect: () => {
					onOpenOmnibar();
				},
			},
			{
				id: 'action-copy-url',
				section: 'actions',
				label: t('common.shortcuts.modal.palette.actions.copyUrl'),
				shortcut: 'Ctrl + Shift + C',
				icon: Copy,
				onSelect: () => {
					const currentUrl = window.location.href;
					navigator.clipboard.writeText(currentUrl).then(() => {
						toast({ type: 'success', title: t('components.header.urlCopied'), description: currentUrl });
					});
					onClose();
				},
			},
			{
				id: 'action-shortcuts',
				section: 'actions',
				label: t('common.shortcuts.modal.palette.actions.openShortcuts'),
				shortcut: 'Ctrl + /',
				icon: HelpCircle,
				onSelect: () => {
					onOpenHelp();
				},
			},
			{
				id: 'action-account',
				section: 'actions',
				label: t('common.shortcuts.modal.palette.actions.openAccount'),
				shortcut: 'Ctrl + ,',
				icon: Settings,
				onSelect: () => {
					window.location.href = getEnvUrl('https://account.xernerx.com');
					onClose();
				},
			}
		);

		// 3. Suite Applications
		visibleNavigation.forEach((app, idx) => {
			const resolvedLabel = t(app.label);
			const resolvedCategory = app.category ? t(app.category) : undefined;
			list.push({
				id: `app-${app.href}-${idx}`,
				section: 'apps',
				label: resolvedLabel,
				subtitle: resolvedCategory,
				icon: app.icon || Compass,
				onSelect: () => {
					window.location.href = getEnvUrl(app.href);
					onClose();
				},
			});
		});

		return list;
	}, [sidebar, resolvedTheme, setTheme, t, visibleNavigation, getEnvUrl, router, onClose, onOpenAppDrawer, onOpenHelp, onOpenOmnibar, toast]);

	const filteredItems = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return allItems;
		return allItems.filter(
			(item) => item.label.toLowerCase().includes(trimmed) || (item.subtitle && item.subtitle.toLowerCase().includes(trimmed)) || (item.shortcut && item.shortcut.toLowerCase().includes(trimmed))
		);
	}, [allItems, query]);

	useEffect(() => {
		setSelectedIndex(0);
	}, [query]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (filteredItems.length === 0) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const target = filteredItems[selectedIndex];
			if (target) target.onSelect();
		}
	};

	const sections: Array<{ key: 'views' | 'actions' | 'apps'; title: string }> = [
		{ key: 'views', title: t('common.shortcuts.modal.palette.sections.views') },
		{ key: 'actions', title: t('common.shortcuts.modal.palette.sections.actions') },
		{ key: 'apps', title: t('common.shortcuts.modal.palette.sections.apps') },
	];

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4">
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: -10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: -10 }}
						transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
						className="relative w-full max-w-xl rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl z-10 max-h-[75vh] flex flex-col overflow-hidden"
					>
						<div className="flex items-center gap-3 px-5 py-4 border-b border-(--border)/10 bg-(--background)/40 shrink-0">
							<Search size={18} className="text-(--accent) shrink-0" />
							<input
								ref={inputRef}
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder={t('common.shortcuts.modal.palette.placeholder')}
								className="w-full bg-transparent text-sm text-(--text) placeholder:text-(--text-muted) outline-none"
							/>
							<button onClick={onClose} className="rounded-lg p-1.5 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition shrink-0">
								<X size={16} />
							</button>
						</div>

						<div className="overflow-y-auto p-3 flex flex-col gap-4 flex-1">
							{filteredItems.length > 0 ? (
								sections.map((section) => {
									const sectionItems = filteredItems.filter((i) => i.section === section.key);
									if (sectionItems.length === 0) return null;

									return (
										<div key={section.key} className="flex flex-col gap-1">
											<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted) px-3 py-1">{section.title}</span>
											{sectionItems.map((item) => {
												const globalIdx = filteredItems.indexOf(item);
												const isSelected = globalIdx === selectedIndex;
												const IconComponent = item.icon;

												return (
													<button
														key={item.id}
														type="button"
														onMouseEnter={() => setSelectedIndex(globalIdx)}
														onClick={item.onSelect}
														className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
															isSelected ? 'bg-(--accent)/15 text-(--accent)' : 'text-(--text) hover:bg-(--background)/60'
														}`}
													>
														<div className="flex items-center gap-3 min-w-0">
															<div
																className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${
																	isSelected ? 'bg-(--accent) text-white border-(--accent)' : 'bg-(--background) text-(--text-muted) border-(--border)/10'
																}`}
															>
																<IconComponent size={15} />
															</div>
															<div className="flex flex-col min-w-0">
																<span className="text-sm font-medium truncate">{item.label}</span>
																{item.subtitle && <span className="text-[11px] text-(--text-muted) truncate">{item.subtitle}</span>}
															</div>
														</div>

														<div className="flex items-center gap-2 shrink-0">
															{item.shortcut && (
																<kbd className="rounded-md px-2 py-0.5 text-[11px] font-mono bg-(--background) text-(--text-muted) border border-(--border)/10">
																	{item.shortcut}
																</kbd>
															)}
															<ArrowRight size={14} className={isSelected ? 'opacity-100 text-(--accent)' : 'opacity-0'} />
														</div>
													</button>
												);
											})}
										</div>
									);
								})
							) : (
								<p className="text-sm text-(--text-muted) text-center py-8">{t('common.shortcuts.modal.palette.empty')}</p>
							)}
						</div>

						<div className="px-5 py-2.5 border-t border-(--border)/10 bg-(--background)/30 flex items-center justify-between text-[11px] text-(--text-muted) shrink-0">
							<div className="flex items-center gap-3">
								<span>
									<kbd className="font-mono text-(--text)">↑↓</kbd> {t('common.shortcuts.modal.palette.footer.navigate')}
								</span>
								<span>
									<kbd className="font-mono text-(--text)">Enter</kbd> {t('common.shortcuts.modal.palette.footer.select')}
								</span>
							</div>
							<span>
								<kbd className="font-mono text-(--text)">Esc</kbd> {t('common.shortcuts.modal.palette.footer.close')}
							</span>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
