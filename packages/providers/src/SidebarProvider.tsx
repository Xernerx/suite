/** @format */
'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export type SidebarNavItem = {
	label: string;
	category?: string;
	icon?: React.ElementType;
	href?: string;
	onClick?: () => void;
	view?: string;
};

type SidebarContextType = {
	state: 'open' | 'closed' | 'hidden';
	isMobileOpen: boolean;
	toggle: () => void;
	setMobileOpen: (open: boolean) => void;
	hide: () => void;
	show: () => void;

	navItems: SidebarNavItem[];
	setNavItems: (items: SidebarNavItem[]) => void;
	clearNavItems: () => void;

	view: string | null;
	setView: (view: string | null) => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();

	const [state, setState] = useState<'open' | 'closed' | 'hidden'>('hidden');
	const [prevState, setPrevState] = useState<'open' | 'closed'>(() => {
		if (typeof window !== 'undefined') {
			try {
				if (localStorage.getItem('pref_defaultSidebarCollapsed') === 'true') return 'closed';
			} catch {}
		}
		return 'open';
	});
	const [isMobileOpen, setMobileOpen] = useState(false);

	const [navItems, setNavItems] = useState<SidebarNavItem[]>([]);

	const [view, setViewState] = useState<string | null>(null);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		if (state !== 'hidden') setPrevState(state);
	}, [state]);

	const setView = useCallback(
		(newView: string | null) => {
			setViewState(newView);
			const storageKey = `xernerx_sidebar_view_${pathname}`;

			if (newView) {
				localStorage.setItem(storageKey, newView);
			} else {
				localStorage.removeItem(storageKey);
			}

			// Clean or sync the URL synchronously if they navigated via a shared link
			if (typeof window !== 'undefined') {
				const params = new URLSearchParams(window.location.search);
				let updated = false;
				if (params.has('view')) {
					params.delete('view');
					if (newView) {
						params.set('tab', newView);
					}
					updated = true;
				}
				if (params.has('tab')) {
					if (newView) {
						params.set('tab', newView);
					} else {
						params.delete('tab');
					}
					updated = true;
				}
				if (updated) {
					const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
					window.history.replaceState(null, '', newUrl);
				}
			}
		},
		[pathname]
	);

	const toggle = useCallback(() => {
		setState((s) => (s === 'open' ? 'closed' : 'open'));
	}, []);

	const hide = useCallback(() => {
		setState('hidden');
	}, []);

	const show = useCallback(() => {
		setState((s) => (s === 'hidden' ? prevState : s));
	}, [prevState]);

	const clearNavItems = useCallback(() => {
		setNavItems([]);
	}, []);

	// 0. Global keyboard shortcuts for sidebar toggle (Ctrl + B) and view switching (Alt + 1..9)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

			if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B') && !isInput) {
				if (state !== 'hidden') {
					e.preventDefault();
					setState((s) => (s === 'open' ? 'closed' : 'open'));
				}
			} else if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && /^[1-9]$/.test(e.key) && !isInput) {
				if (state !== 'hidden' && navItems.length > 0) {
					const idx = parseInt(e.key, 10) - 1;
					const targetItem = navItems[idx];
					if (targetItem) {
						e.preventDefault();
						if (targetItem.view) {
							setView(targetItem.view);
						}
						if (targetItem.onClick) {
							targetItem.onClick();
						}
						if (targetItem.href && targetItem.href !== '#') {
							router.push(targetItem.href);
						}
					}
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [state, navItems, setView, router]);

	// 1. Handle URL or Path changes
	useEffect(() => {
		setIsMounted(true);
		const storageKey = `xernerx_sidebar_view_${pathname}`;
		const storedView = localStorage.getItem(storageKey);
		const params = new URLSearchParams(window.location.search);
		const urlView = params.get('view') || params.get('tab');

		if (urlView) {
			localStorage.setItem(storageKey, urlView);
			setViewState(urlView);
		} else if (storedView) {
			setViewState(storedView);
		} else {
			setViewState(null);
		}
	}, [pathname]);

	// 2. Handle NavItems loading & fallback once items are registered by the page
	useEffect(() => {
		if (navItems.length === 0) return;

		// Check if current view belongs to the current page's navItems
		const isValidView = view && navItems.some((item) => item.view === view);

		if (!isValidView) {
			const storageKey = `xernerx_sidebar_view_${pathname}`;
			const storedView = localStorage.getItem(storageKey);
			const defaultView = navItems.find((item) => item.view)?.view || null;

			if (storedView && navItems.some((item) => item.view === storedView)) {
				setViewState(storedView);
			} else if (defaultView) {
				setViewState(defaultView);
			}
		}
	}, [navItems, pathname, view]);

	return (
		<SidebarContext.Provider
			value={{
				state,
				isMobileOpen,
				toggle,
				setMobileOpen,
				hide,
				show,

				navItems,
				setNavItems,
				clearNavItems,

				view: isMounted ? view : navItems.find((i) => i.view)?.view || null,
				setView,
			}}
		>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const ctx = useContext(SidebarContext);
	if (!ctx) throw new Error('SidebarProvider missing');
	return ctx;
}
