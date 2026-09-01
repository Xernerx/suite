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
	{ label: 'lib.navigation.items.explore', href: 'https://app.xernerx.com', icon: Compass, category: 'lib.navigation.categories.user' },
	{ label: 'lib.navigation.items.dashboard', href: 'https://app.xernerx.com/dashboard', icon: LayoutDashboard, category: 'lib.navigation.categories.user' },
	{ label: 'lib.navigation.items.account', href: 'https://account.xernerx.com', icon: UserCircle, category: 'lib.navigation.categories.user' },

	// Developer
	{ label: 'lib.navigation.items.portal', href: 'https://app.xernerx.com/portal', icon: Building2, category: 'lib.navigation.categories.developer' },
	{ label: 'lib.navigation.items.api', href: 'https://api.xernerx.com', icon: Terminal, category: 'lib.navigation.categories.developer' },
	{ label: 'lib.navigation.items.docs', href: 'https://docs.xernerx.com', icon: BookOpen, category: 'lib.navigation.categories.developer' },
	{ label: 'lib.navigation.items.cdn', href: 'https://cdn.xernerx.com', icon: Cloud, category: 'lib.navigation.categories.developer' },

	// External
	{ label: 'lib.navigation.items.website', href: 'https://www.xernerx.com', icon: Globe, category: 'lib.navigation.categories.public' },

	// Management
	{ label: 'lib.navigation.items.admin', href: 'https://admin.xernerx.com', icon: ShieldAlert, category: 'lib.navigation.categories.management', adminOnly: true },
];
