/** @format */

import { BookOpen, Cloud, Globe, LayoutDashboard, ShieldAlert, Terminal, UserCircle } from 'lucide-react';

export type NavigationItem = {
	label: string;
	href: string;
	icon?: React.ElementType;
	category: string;
	adminOnly?: boolean;
};

export const navigation: NavigationItem[] = [
	// Core Suite
	{ label: 'Dashboard', href: 'https://app.xernerx.com', icon: LayoutDashboard, category: 'Suite' },
	{ label: 'Account', href: 'https://auth.xernerx.com', icon: UserCircle, category: 'Suite' },

	// Developer Tools
	{ label: 'API', href: 'https://api.xernerx.com', icon: Terminal, category: 'Developers' },
	{ label: 'Docs', href: 'https://docs.xernerx.com', icon: BookOpen, category: 'Developers' },
	{ label: 'CDN', href: 'https://cdn.xernerx.com', icon: Cloud, category: 'Developers' },

	// External
	{ label: 'Website', href: 'https://www.xernerx.com', icon: Globe, category: 'Public' },

	// Management
	{ label: 'Admin', href: 'https://admin.xernerx.com', icon: ShieldAlert, category: 'Management', adminOnly: true },
];
