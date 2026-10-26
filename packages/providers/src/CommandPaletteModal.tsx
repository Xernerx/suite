/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Camera, Compass, Copy, Globe, HelpCircle, Layers, LayoutGrid, Loader2, Moon, Search, Settings, SidebarIcon, Sun, Trophy, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDictionary } from './DictionaryProvider';
import { useEnvironment } from './EnvironmentProvider';
import { useSidebar } from './SidebarProvider';
import { useTheme } from './ThemeProvider';
import { useToast } from './ToastProvider';
import { useUser } from './UserProvider';
import { buildDeepLinkPaletteItems, buildDynamicPaletteItems, matchesPaletteQuery, type PaletteActionItem, type PaletteSectionKey } from './commandPaletteData';

let cachedFaqCatalog: any[] | null = null;
let cachedDocsCatalog: any[] | null = null;

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
	const [liveBots, setLiveBots] = useState<any[]>([]);
	const [liveServers, setLiveServers] = useState<any[]>([]);
	const [communityData, setCommunityData] = useState<{ issues: any[]; suggestions: any[]; roadmap: any[] }>({ issues: [], suggestions: [], roadmap: [] });
	const [faqCatalog, setFaqCatalog] = useState<any[]>(cachedFaqCatalog || []);
	const [docsCatalog, setDocsCatalog] = useState<any[]>(cachedDocsCatalog || []);
	const [searchingLive, setSearchingLive] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isOpen) {
			setQuery('');
			setSelectedIndex(0);
			setLiveBots([]);
			setLiveServers([]);
			return;
		}
		setTimeout(() => inputRef.current?.focus(), 20);
		fetch(getEnvUrl('https://api.xernerx.com/secure/core'), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => setRoles(Array.isArray(data) ? data : []))
			.catch(() => {});

		Promise.all([
			fetch(getEnvUrl('https://api.xernerx.com/info/issues'))
				.then((r) => (r.ok ? r.json() : { data: [] }))
				.catch(() => ({ data: [] })),
			fetch(getEnvUrl('https://api.xernerx.com/info/suggestions'))
				.then((r) => (r.ok ? r.json() : { data: [] }))
				.catch(() => ({ data: [] })),
			fetch(getEnvUrl('https://api.xernerx.com/info/roadmap'))
				.then((r) => (r.ok ? r.json() : { data: [] }))
				.catch(() => ({ data: [] })),
			cachedFaqCatalog
				? Promise.resolve({ items: cachedFaqCatalog })
				: fetch(getEnvUrl('https://api.xernerx.com/core/faq?flat=true'))
						.then((r) => (r.ok ? r.json() : { items: [] }))
						.catch(() => ({ items: [] })),
			cachedDocsCatalog
				? Promise.resolve({ items: cachedDocsCatalog })
				: fetch(getEnvUrl('https://api.xernerx.com/core/docs?flat=true'))
						.then((r) => (r.ok ? r.json() : { items: [] }))
						.catch(() => ({ items: [] })),
		]).then(([iRes, sRes, rRes, faqRes, docsRes]) => {
			setCommunityData({
				issues: Array.isArray(iRes?.data) ? iRes.data : [],
				suggestions: Array.isArray(sRes?.data) ? sRes.data : [],
				roadmap: Array.isArray(rRes?.data) ? rRes.data : [],
			});
			if (Array.isArray(faqRes?.items) && faqRes.items.length > 0) {
				cachedFaqCatalog = faqRes.items;
				setFaqCatalog(faqRes.items);
			}
			if (Array.isArray(docsRes?.items) && docsRes.items.length > 0) {
				cachedDocsCatalog = docsRes.items;
				setDocsCatalog(docsRes.items);
			}
		});
	}, [isOpen, getEnvUrl]);

	useEffect(() => {
		const trimmed = query.trim();
		if (!isOpen || trimmed.length < 2) {
			setLiveBots([]);
			setLiveServers([]);
			setSearchingLive(false);
			return;
		}
		setSearchingLive(true);
		const timer = setTimeout(() => {
			Promise.all([
				fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?search=${encodeURIComponent(trimmed)}&limit=4`))
					.then((r) => (r.ok ? r.json() : []))
					.catch(() => []),
				fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds?search=${encodeURIComponent(trimmed)}&limit=4`))
					.then((r) => (r.ok ? r.json() : []))
					.catch(() => []),
			])
				.then(([botsRes, guildsRes]) => {
					setLiveBots(Array.isArray(botsRes) ? botsRes : []);
					setLiveServers(Array.isArray(guildsRes) ? guildsRes : []);
				})
				.finally(() => setSearchingLive(false));
		}, 180);
		return () => clearTimeout(timer);
	}, [query, isOpen, getEnvUrl]);

	const activeUser = discordUser || session?.user;
	const userRoleIds = Array.isArray((activeUser as any)?.roles) ? (activeUser as any).roles : [];
	const activeRoles = roles.filter((r) => userRoleIds.includes(r.id));
	const hasAdminAccess = activeRoles.some((r) => r.permissions?.access === true);
	const visibleNavigation = useMemo(
		() => navigation.filter((item) => !item.adminOnly || activeRoles.some((r) => r.permissions?.[item.requiredPermission || 'access'] === true)),
		[navigation, activeRoles]
	);

	const allItems: PaletteActionItem[] = useMemo(() => {
		const list: PaletteActionItem[] = [];

		if (sidebar.state !== 'hidden' && sidebar.navItems.length > 0) {
			sidebar.navItems.forEach((item, idx) => {
				list.push({
					id: `view-${item.view || item.label}-${idx}`,
					section: 'views',
					label: t(item.label),
					subtitle: item.category ? t(item.category) : undefined,
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

		const electronBridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (electronBridge) {
			list.push(
				{
					id: 'action-desktop-companion',
					section: 'actions',
					label: t('account.preferences.desktop.newCompanionWindow'),
					shortcut: 'Ctrl + Shift + N',
					icon: Layers,
					onSelect: () => {
						electronBridge.openCompanionWindow?.();
						onClose();
					},
				},
				{
					id: 'action-desktop-capture',
					section: 'actions',
					label: t('account.preferences.desktop.quickCapture'),
					shortcut: 'Ctrl + Shift + S',
					icon: Camera,
					onSelect: () => {
						electronBridge.quickCapture?.('screen');
						onClose();
					},
				},
				{
					id: 'action-desktop-overlay',
					section: 'actions',
					label: t('account.preferences.desktop.launchOverlay'),
					icon: Layers,
					onSelect: () => {
						electronBridge.toggleOverlay?.();
						onClose();
					},
				}
			);
		} else {
			list.push({
				id: 'action-open-in-desktop',
				section: 'actions',
				label: t('components.header.openInDesktop'),
				icon: Compass,
				onSelect: () => {
					if (typeof window !== 'undefined') window.location.href = `xernerx://open?url=${encodeURIComponent(window.location.href)}`;
					onClose();
				},
			});
		}

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
			{ id: 'action-app-drawer', section: 'actions', label: t('common.shortcuts.modal.palette.actions.openAppDrawer'), shortcut: 'Ctrl + Space', icon: LayoutGrid, onSelect: onOpenAppDrawer },
			{ id: 'action-omnibar', section: 'actions', label: t('common.shortcuts.modal.palette.actions.toggleOmnibar'), shortcut: 'Ctrl + .', icon: Globe, onSelect: onOpenOmnibar },
			{
				id: 'action-copy-url',
				section: 'actions',
				label: t('common.shortcuts.modal.palette.actions.copyUrl'),
				shortcut: 'Ctrl + Shift + C',
				icon: Copy,
				onSelect: () => {
					const urlObj = new URL(window.location.href);
					if (sidebar.state !== 'hidden' && sidebar.view && !urlObj.searchParams.has('view')) urlObj.searchParams.set('view', sidebar.view);
					const currentUrl = urlObj.toString();
					navigator.clipboard.writeText(currentUrl).then(() => toast({ type: 'success', title: t('components.header.urlCopied'), description: currentUrl }));
					onClose();
				},
			},
			{ id: 'action-shortcuts', section: 'actions', label: t('common.shortcuts.modal.palette.actions.openShortcuts'), shortcut: 'Ctrl + /', icon: HelpCircle, onSelect: onOpenHelp },
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

		visibleNavigation.forEach((app, idx) => {
			list.push({
				id: `app-${app.href}-${idx}`,
				section: 'apps',
				label: t(app.label),
				subtitle: app.category ? t(app.category) : undefined,
				icon: app.icon || Compass,
				onSelect: () => {
					window.location.href = getEnvUrl(app.href);
					onClose();
				},
			});
		});

		list.push({
			id: 'app-leaderboard',
			section: 'apps',
			label: t('app.leaderboard.title'),
			subtitle: t('lib.navigation.items.explore'),
			icon: Trophy,
			onSelect: () => {
				window.location.href = `${getEnvUrl('https://app.xernerx.com')}/leaderboard`;
				onClose();
			},
		});

		list.push(...buildDeepLinkPaletteItems({ t, getEnvUrl, sidebar, hasAdminAccess, onClose }));
		return list;
	}, [sidebar, resolvedTheme, setTheme, t, visibleNavigation, hasAdminAccess, getEnvUrl, router, onClose, onOpenAppDrawer, onOpenHelp, onOpenOmnibar, toast]);

	const filteredItems = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return allItems;
		const staticMatches = allItems.filter((item) => matchesPaletteQuery(`${item.label} ${item.subtitle || ''} ${item.shortcut || ''} ${item.keywords || ''}`, trimmed));
		const dynamicItems = buildDynamicPaletteItems({
			trimmedQuery: trimmed,
			liveBots,
			liveServers,
			communityData,
			faqCatalog,
			docsCatalog,
			getEnvUrl,
			onClose,
		});
		return [...staticMatches, ...dynamicItems];
	}, [allItems, query, liveBots, liveServers, communityData, faqCatalog, docsCatalog, getEnvUrl, onClose]);

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

	const sections: Array<{ key: PaletteSectionKey; title: string }> = [
		{ key: 'views', title: t('common.shortcuts.modal.palette.sections.views') },
		{ key: 'actions', title: t('common.shortcuts.modal.palette.sections.actions') },
		{ key: 'bots', title: t('common.shortcuts.modal.palette.sections.bots') },
		{ key: 'servers', title: t('common.shortcuts.modal.palette.sections.servers') },
		{ key: 'docs', title: t('common.shortcuts.modal.palette.sections.docs') },
		{ key: 'faq', title: t('common.shortcuts.modal.palette.sections.faq') },
		{ key: 'community', title: t('common.shortcuts.modal.palette.sections.community') },
		{ key: 'store', title: t('common.shortcuts.modal.palette.sections.store') },
		{ key: 'apps', title: t('common.shortcuts.modal.palette.sections.apps') },
		{ key: 'settings', title: t('common.shortcuts.modal.palette.sections.settings') },
		{ key: 'support', title: t('common.shortcuts.modal.palette.sections.support') },
		{ key: 'admin', title: t('common.shortcuts.modal.palette.sections.admin') },
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
							{searchingLive ? <Loader2 size={18} className="text-(--accent) animate-spin shrink-0" /> : <Search size={18} className="text-(--accent) shrink-0" />}
							<input
								ref={inputRef}
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder={t('common.shortcuts.modal.palette.placeholder')}
								className="w-full bg-transparent text-sm text-(--text) placeholder:text-(--text-muted) outline-none"
							/>
							<button
								type="button"
								onClick={onClose}
								aria-label={t('common.close')}
								className="rounded-lg p-1.5 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition shrink-0"
							>
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
																className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 overflow-hidden ${
																	isSelected ? 'bg-(--accent) text-white border-(--accent)' : 'bg-(--background) text-(--text-muted) border-(--border)/10'
																}`}
															>
																{item.avatarUrl ? (
																	<Image src={item.avatarUrl} alt={item.label} width={32} height={32} unoptimized className="w-full h-full object-cover" />
																) : (
																	<IconComponent size={15} />
																)}
															</div>
															<div className="flex flex-col min-w-0">
																<span className="text-sm font-medium truncate">{item.label}</span>
																{item.subtitle && <span className="text-[11px] text-(--text-muted) truncate">{item.subtitle}</span>}
															</div>
														</div>

														<div className="flex items-center gap-2 shrink-0">
															{item.shortcut && (
																<kbd className="rounded-xl px-2 py-0.5 text-[11px] font-mono bg-(--background) text-(--text-muted) border border-(--border)/10">
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
