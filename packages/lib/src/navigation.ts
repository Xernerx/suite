/** @format */

import { BookOpen, Cloud, Globe, LayoutDashboard, ShieldAlert, Terminal, UserCircle, Compass, Building2 } from 'lucide-react';

export type NavigationItem = {
	label: string;
	href: string;
	icon?: React.ElementType;
	category: string;
	adminOnly?: boolean;
};

export const navigation: NavigationItem[] = [
	// User
	{ label: 'Explore', href: 'https://app.xernerx.com', icon: Compass, category: 'User' },
	{ label: 'Dashboard', href: 'https://app.xernerx.com/dashboard', icon: LayoutDashboard, category: 'User' },
	{ label: 'Account', href: 'https://account.xernerx.com', icon: UserCircle, category: 'User' },

	// Developer
	{ label: 'Portal', href: 'https://app.xernerx.com/portal', icon: Building2, category: 'Developer' },
	{ label: 'API', href: 'https://api.xernerx.com', icon: Terminal, category: 'Developer' },
	{ label: 'Docs', href: 'https://docs.xernerx.com', icon: BookOpen, category: 'Developer' },
	{ label: 'CDN', href: 'https://cdn.xernerx.com', icon: Cloud, category: 'Developer' },

	// External
	{ label: 'Website', href: 'https://www.xernerx.com', icon: Globe, category: 'Public' },

	// Management
	{ label: 'Admin', href: 'https://admin.xernerx.com', icon: ShieldAlert, category: 'Management', adminOnly: true },
];
