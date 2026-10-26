/** @format */

import { BookOpen, Cloud, Globe, LayoutDashboard, Server, ShieldAlert, Terminal, UserCircle, Compass, Building2, LifeBuoy, Store } from 'lucide-react';

export type NavigationItem = {
	label: string;
	href: string;
	icon?: React.ElementType;
	category: string;
	adminOnly?: boolean;
	requiredPermission?: string;
};

export const navigation: NavigationItem[] = [
	// User
	{ label: 'lib.navigation.items.explore', href: 'https://app.xernerx.com', icon: Compass, category: 'lib.navigation.categories.user' },
	{ label: 'lib.navigation.items.dashboard', href: 'https://app.xernerx.com/dashboard', icon: LayoutDashboard, category: 'lib.navigation.categories.user' },
	{ label: 'lib.navigation.items.account', href: 'https://account.xernerx.com', icon: UserCircle, category: 'lib.navigation.categories.user' },
	{ label: 'lib.navigation.items.store', href: 'https://store.xernerx.com', icon: Store, category: 'lib.navigation.categories.user' },

	// Developer
	{ label: 'lib.navigation.items.portal', href: 'https://portal.xernerx.com', icon: Building2, category: 'lib.navigation.categories.developer' },
	{ label: 'lib.navigation.items.api', href: 'https://api.xernerx.com', icon: Terminal, category: 'lib.navigation.categories.developer' },
	{ label: 'lib.navigation.items.docs', href: 'https://docs.xernerx.com', icon: BookOpen, category: 'lib.navigation.categories.developer' },
	{ label: 'lib.navigation.items.cdn', href: 'https://cdn.xernerx.com', icon: Cloud, category: 'lib.navigation.categories.developer' },

	// External
	{ label: 'lib.navigation.items.website', href: 'https://www.xernerx.com', icon: Globe, category: 'lib.navigation.categories.public' },
	{ label: 'lib.navigation.items.help', href: 'https://info.xernerx.com', icon: LifeBuoy, category: 'lib.navigation.categories.public' },

	// Management
	{ label: 'lib.navigation.items.admin', href: 'https://admin.xernerx.com', icon: ShieldAlert, category: 'lib.navigation.categories.management', adminOnly: true, requiredPermission: 'access' },
	{ label: 'lib.navigation.items.hosting', href: 'https://hosting.xernerx.com', icon: Server, category: 'lib.navigation.categories.management', adminOnly: true, requiredPermission: 'hosting' },
];

export type HeaderSubdomainItem = {
	id: 'app' | 'portal' | 'store' | 'account' | 'info' | 'docs' | 'cdn' | 'api' | 'www' | 'admin' | 'hosting';
	label: string;
	host: string;
	href: string;
	icon: React.ElementType;
	adminOnly?: boolean;
	requiredPermission?: string;
};

export const headerSubdomainsCatalog: HeaderSubdomainItem[] = [
	{ id: 'app', label: 'lib.navigation.items.explore', host: 'app.xernerx.com', href: 'https://app.xernerx.com', icon: Compass },
	{ id: 'portal', label: 'lib.navigation.items.portal', host: 'portal.xernerx.com', href: 'https://portal.xernerx.com', icon: Building2 },
	{ id: 'store', label: 'lib.navigation.items.store', host: 'store.xernerx.com', href: 'https://store.xernerx.com', icon: Store },
	{ id: 'account', label: 'lib.navigation.items.account', host: 'account.xernerx.com', href: 'https://account.xernerx.com', icon: UserCircle },
	{ id: 'info', label: 'lib.navigation.items.help', host: 'info.xernerx.com', href: 'https://info.xernerx.com', icon: LifeBuoy },
	{ id: 'docs', label: 'lib.navigation.items.docs', host: 'docs.xernerx.com', href: 'https://docs.xernerx.com', icon: BookOpen },
	{ id: 'cdn', label: 'lib.navigation.items.cdn', host: 'cdn.xernerx.com', href: 'https://cdn.xernerx.com', icon: Cloud },
	{ id: 'api', label: 'lib.navigation.items.api', host: 'api.xernerx.com', href: 'https://api.xernerx.com', icon: Terminal },
	{ id: 'www', label: 'lib.navigation.items.website', host: 'www.xernerx.com', href: 'https://www.xernerx.com', icon: Globe },
	{ id: 'admin', label: 'lib.navigation.items.admin', host: 'admin.xernerx.com', href: 'https://admin.xernerx.com', icon: ShieldAlert, adminOnly: true, requiredPermission: 'access' },
	{ id: 'hosting', label: 'lib.navigation.items.hosting', host: 'hosting.xernerx.com', href: 'https://hosting.xernerx.com', icon: Server, adminOnly: true, requiredPermission: 'hosting' },
];
