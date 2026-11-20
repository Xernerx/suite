/** @format */

import React from 'react';
import { BookOpen, Cloud, FileCode2, Gauge, Globe, Newspaper, Server, ShieldAlert, Terminal, UserCircle, Compass, Building2, LifeBuoy, Store } from 'lucide-react';

export function BungieTricornIcon({ size = 24, strokeWidth = 2, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }) {
	return React.createElement(
		'svg',
		{
			xmlns: 'http://www.w3.org/2000/svg',
			width: size,
			height: size,
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			strokeWidth,
			strokeLinecap: 'round',
			strokeLinejoin: 'round',
			className,
			...props,
		},
		React.createElement('rect', { width: '4.096', height: '7.51', x: '9.952', y: '4.382', rx: '2.048' }),
		React.createElement('path', {
			d: 'M10.449 5.105a12.85 12.85 0 0 1-3.273-1.247c-.097-.068-.437-.248-.437-.248a2.811 2.811 0 0 0-2.775 4.865c2.714 2.048 5.22 5.692 5.22 9.362a2.816 2.816 0 0 0 5.632 0c0-3.67 2.506-7.314 5.22-9.361a2.81 2.81 0 0 0-2.775-4.866s-.34.18-.437.247a12.85 12.85 0 0 1-3.273 1.247',
		})
	);
}

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
	{ label: 'lib.navigation.items.dashboard', href: 'https://app.xernerx.com/dashboard', icon: Gauge, category: 'lib.navigation.categories.user' },
	{ label: 'lib.navigation.items.account', href: 'https://account.xernerx.com', icon: UserCircle, category: 'lib.navigation.categories.user' },
	{ label: 'lib.navigation.items.store', href: 'https://store.xernerx.com', icon: Store, category: 'lib.navigation.categories.user' },

	// Developer
	{ label: 'lib.navigation.items.portal', href: 'https://portal.xernerx.com', icon: Building2, category: 'lib.navigation.categories.developer' },
	{ label: 'lib.navigation.items.api', href: 'https://api.xernerx.com', icon: Terminal, category: 'lib.navigation.categories.developer' },
	{ label: 'lib.navigation.items.docs', href: 'https://docs.xernerx.com', icon: BookOpen, category: 'lib.navigation.categories.developer' },
	{ label: 'lib.navigation.items.cdn', href: 'https://cdn.xernerx.com', icon: Cloud, category: 'lib.navigation.categories.developer' },
	{ label: 'lib.navigation.items.haste', href: 'https://haste.xernerx.com', icon: FileCode2, category: 'lib.navigation.categories.developer' },

	// External
	{ label: 'lib.navigation.items.website', href: 'https://www.xernerx.com', icon: Globe, category: 'lib.navigation.categories.public' },
	{ label: 'lib.navigation.items.blog', href: 'https://blog.xernerx.com', icon: Newspaper, category: 'lib.navigation.categories.public' },
	{ label: 'lib.navigation.items.help', href: 'https://info.xernerx.com', icon: LifeBuoy, category: 'lib.navigation.categories.public' },

	// Management
	{ label: 'lib.navigation.items.admin', href: 'https://admin.xernerx.com', icon: ShieldAlert, category: 'lib.navigation.categories.management', adminOnly: true, requiredPermission: 'access' },
	{ label: 'lib.navigation.items.hosting', href: 'https://hosting.xernerx.com', icon: Server, category: 'lib.navigation.categories.management', adminOnly: true, requiredPermission: 'hosting' },
];

export type HeaderSubdomainItem = {
	id: 'app' | 'dashboard' | 'portal' | 'store' | 'account' | 'info' | 'docs' | 'cdn' | 'haste' | 'blog' | 'api' | 'www' | 'admin' | 'hosting';
	label: string;
	host: string;
	href: string;
	icon: React.ElementType;
	adminOnly?: boolean;
	requiredPermission?: string;
};

export const headerSubdomainsCatalog: HeaderSubdomainItem[] = [
	{ id: 'app', label: 'lib.navigation.items.explore', host: 'app.xernerx.com', href: 'https://app.xernerx.com', icon: Compass },
	{ id: 'dashboard', label: 'lib.navigation.items.dashboard', host: 'app.xernerx.com/dashboard', href: 'https://app.xernerx.com/dashboard', icon: Gauge },
	{ id: 'portal', label: 'lib.navigation.items.portal', host: 'portal.xernerx.com', href: 'https://portal.xernerx.com', icon: Building2 },
	{ id: 'store', label: 'lib.navigation.items.store', host: 'store.xernerx.com', href: 'https://store.xernerx.com', icon: Store },
	{ id: 'account', label: 'lib.navigation.items.account', host: 'account.xernerx.com', href: 'https://account.xernerx.com', icon: UserCircle },
	{ id: 'info', label: 'lib.navigation.items.help', host: 'info.xernerx.com', href: 'https://info.xernerx.com', icon: LifeBuoy },
	{ id: 'blog', label: 'lib.navigation.items.blog', host: 'blog.xernerx.com', href: 'https://blog.xernerx.com', icon: Newspaper },
	{ id: 'docs', label: 'lib.navigation.items.docs', host: 'docs.xernerx.com', href: 'https://docs.xernerx.com', icon: BookOpen },
	{ id: 'cdn', label: 'lib.navigation.items.cdn', host: 'cdn.xernerx.com', href: 'https://cdn.xernerx.com', icon: Cloud },
	{ id: 'haste', label: 'lib.navigation.items.haste', host: 'haste.xernerx.com', href: 'https://haste.xernerx.com', icon: FileCode2 },
	{ id: 'api', label: 'lib.navigation.items.api', host: 'api.xernerx.com', href: 'https://api.xernerx.com', icon: Terminal },
	{ id: 'www', label: 'lib.navigation.items.website', host: 'www.xernerx.com', href: 'https://www.xernerx.com', icon: Globe },
	{ id: 'admin', label: 'lib.navigation.items.admin', host: 'admin.xernerx.com', href: 'https://admin.xernerx.com', icon: ShieldAlert, adminOnly: true, requiredPermission: 'access' },
	{ id: 'hosting', label: 'lib.navigation.items.hosting', host: 'hosting.xernerx.com', href: 'https://hosting.xernerx.com', icon: Server, adminOnly: true, requiredPermission: 'hosting' },
];
