/** @format */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
	const [prevState, setPrevState] = useState<'open' | 'closed'>('open');
	const [isMobileOpen, setMobileOpen] = useState(false);

	const [navItems, setNavItems] = useState<SidebarNavItem[]>([]);

	const [view, setViewState] = useState<string | null>(null);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		if (state !== 'hidden') setPrevState(state);
	}, [state]);

	// 1. Handle URL or Path changes
	useEffect(() => {
		setIsMounted(true);
		const storageKey = `xernerx_sidebar_view_${pathname}`;
		const storedView = localStorage.getItem(storageKey);
		const params = new URLSearchParams(window.location.search);
		const urlView = params.get('view');

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

	const setView = (newView: string | null) => {
		setViewState(newView);
		const storageKey = `xernerx_sidebar_view_${pathname}`;

		if (newView) {
			localStorage.setItem(storageKey, newView);
		} else {
			localStorage.removeItem(storageKey);
		}

		// Clean the URL if they navigated via a shared link
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			if (params.has('view')) {
				params.delete('view');

				const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
				router.replace(newUrl, { scroll: false });
			}
		}
	};

	return (
		<SidebarContext.Provider
			value={{
				state,
				isMobileOpen,
				toggle: () => setState((s) => (s === 'open' ? 'closed' : 'open')),
				setMobileOpen,
				hide: () => setState('hidden'),
				show: () => setState(state === 'hidden' ? prevState : state),

				navItems,
				setNavItems,
				clearNavItems: () => setNavItems([]),

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
