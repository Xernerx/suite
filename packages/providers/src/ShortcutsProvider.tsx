/** @format */
'use client';

import { Bell, Compass, Copy, EyeOff, Globe, HelpCircle, Layers, RefreshCw, Save, Search, Settings, SidebarIcon, X } from 'lucide-react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useSidebar, useToast } from '@xernerx/providers';
import { navigation } from '@xernerx/lib';
import { CommandPaletteModal } from './CommandPaletteModal';
import { NavigationModal, type TourNavigationStage } from './NavigationModal';
import { HelpModal, type ShortcutItem } from './ShortcutHelpModal';

export { NavigationModal } from './NavigationModal';

type ShortcutsContextType = {
	isHelpOpen: boolean;
	setHelpOpen: (open: boolean) => void;
	isSearchOpen: boolean;
	setSearchOpen: (open: boolean) => void;
	isNavOpen: boolean;
	setNavOpen: (open: boolean) => void;
	isSidebarVisible: boolean;
	toggleSidebar: () => void;
	isContentHidden: boolean;
	setContentHidden: (hidden: boolean) => void;
	toggleContentHidden: () => void;
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
		key: 'Alt + H',
		description: 'common.shortcuts.items.toggleContentUi',
		icon: EyeOff,
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
	const [isContentHidden, setContentHidden] = useState(false);
	const [onboardingStage, setOnboardingStage] = useState<TourNavigationStage>(() =>
		typeof window !== 'undefined' && (window as any).__xernerxOnboardingStage ? (window as any).__xernerxOnboardingStage : { active: false }
	);
	const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(defaultShortcuts);

	const toggleSidebar = () => setSidebarVisible((prev) => !prev);
	const toggleContentHidden = () => setContentHidden((prev) => !prev);
	const registerShortcut = (newShortcut: ShortcutItem) => {
		setShortcuts((prev) => {
			if (prev.some((s) => s.key === newShortcut.key)) return prev;
			return [...prev, newShortcut];
		});
	};

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if ((window as any).__xernerxOnboardingStage) {
			setOnboardingStage((window as any).__xernerxOnboardingStage);
		}
		const onOnboardingStage = (e: Event) => {
			const detail = (e as CustomEvent<TourNavigationStage>).detail;
			if (detail && typeof detail.active === 'boolean') {
				setOnboardingStage(detail);
			}
		};
		window.addEventListener('xernerx:onboarding-stage', onOnboardingStage);
		return () => window.removeEventListener('xernerx:onboarding-stage', onOnboardingStage);
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

			if (onboardingStage.active) {
				if (onboardingStage.navPromptTarget) {
					if (
						((e.ctrlKey || e.metaKey) && e.key === '.') ||
						((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === ' ' || e.code === 'Space')) ||
						(e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'a' || e.key === 'A') && !isInput)
					) {
						e.preventDefault();
						setNavOpen((prev) => !prev);
					} else if (e.key === 'Escape') {
						setNavOpen(false);
					}
				}
				return;
			}

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
			} else if (
				((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === ' ' || e.code === 'Space')) ||
				(e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'a' || e.key === 'A') && !isInput)
			) {
				e.preventDefault();
				setNavOpen((prev) => !prev);
			} else if (
				(e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'h' || e.key === 'H') && !isInput) ||
				((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'h' || e.key === 'H') && !isInput)
			) {
				e.preventDefault();
				setContentHidden((prev) => !prev);
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
			} else if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'r' || e.key === 'R')) {
				if (typeof window !== 'undefined' && (window as any).electron) {
					e.preventDefault();
					window.location.reload();
				}
			} else if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B') && !isInput) {
				e.preventDefault();
				toggleSidebar();
			} else if (e.key === 'Escape') {
				setHelpOpen(false);
				setSearchOpen(false);
				setNavOpen(false);
				setUrlPlacerOpen(false);
				setContentHidden(false);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		const unsubQuickLaunch = bridge?.onQuickLaunch?.(() => {
			setHelpOpen(false);
			setNavOpen(false);
			setUrlPlacerOpen(false);
			setSearchOpen(true);
		});
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			unsubQuickLaunch?.();
		};
	}, [getEnvUrl, toast, t, isSearchOpen, sidebar.state, sidebar.view, onboardingStage.active, onboardingStage.navPromptTarget]);

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
		isContentHidden,
		setContentHidden,
		toggleContentHidden,
		shortcuts,
		registerShortcut,
	};

	return (
		<ShortcutsContext.Provider value={value}>
			{children}
			<HelpModal isOpen={isHelpOpen} onClose={() => setHelpOpen(false)} shortcuts={shortcuts} />
			<NavigationModal isOpen={isNavOpen} onClose={() => setNavOpen(false)} navigation={navigation} onboardingStage={onboardingStage} />
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
