/** @format */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type SidebarNavItem = {
	label: string;
	icon?: React.ReactNode;
	href?: string;
	onClick?: () => void;
	view?: string;
};

type SidebarContextType = {
	state: 'open' | 'closed' | 'hidden';
	toggle: () => void;
	hide: () => void;
	show: () => void;

	navItems: SidebarNavItem[];
	setNavItems: (items: SidebarNavItem[]) => void;
	clearNavItems: () => void;

	view: string | null;
	setView: (href: string | null) => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<'open' | 'closed' | 'hidden'>('open');
	const [prevState, setPrevState] = useState<'open' | 'closed'>('open');
	const [navItems, setNavItems] = useState<SidebarNavItem[]>([]);
	const [view, setView] = useState<string | null>(null);

	useEffect(() => {
		if (state !== 'hidden') setPrevState(state);
	}, [state]);

	return (
		<SidebarContext.Provider
			value={{
				state,
				toggle: () => setState((s) => (s === 'open' ? 'closed' : 'open')),
				hide: () => setState('hidden'),
				show: () => setState(state === 'hidden' ? prevState : state),

				navItems,
				setNavItems,
				clearNavItems: () => setNavItems([]),

				view,
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
