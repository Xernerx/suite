/** @format */
import {
	Activity,
	BarChart3,
	Bell,
	BookOpen,
	Bug,
	DollarSign,
	FileCheck,
	FileCog,
	Globe,
	History,
	Image as ImageIcon,
	KeyRound,
	Languages,
	Lightbulb,
	Map,
	Megaphone,
	Paintbrush,
	ScrollText,
	Settings,
	Shield,
	ShieldCheck,
	Store,
	Ticket,
	Users,
} from 'lucide-react';
import type React from 'react';

export type PaletteActionItem = {
	id: string;
	section: 'views' | 'actions' | 'apps' | 'settings' | 'support' | 'admin';
	label: string;
	subtitle?: string;
	shortcut?: string;
	icon: React.ElementType;
	onSelect: () => void;
};

export const ACCOUNT_TABS = [
	{ view: 'profile', labelKey: 'common.nav.items.profile', catKey: 'common.nav.categories.account', icon: ShieldCheck },
	{ view: 'activity', labelKey: 'account.activity.navLabel', catKey: 'common.nav.categories.account', icon: Activity },
	{ view: 'connections', labelKey: 'common.nav.items.connections', catKey: 'common.nav.categories.account', icon: Globe },
	{ view: 'devices', labelKey: 'common.nav.items.devices', catKey: 'common.nav.categories.account', icon: Shield },
	{ view: 'appearance', labelKey: 'common.nav.items.appearance', catKey: 'common.nav.categories.preferences', icon: Paintbrush },
	{ view: 'language', labelKey: 'common.nav.items.language', catKey: 'common.nav.categories.preferences', icon: Globe },
	{ view: 'notifications', labelKey: 'common.nav.items.notifications', catKey: 'common.nav.categories.preferences', icon: Bell },
	{ view: 'billing', labelKey: 'common.nav.items.billing', catKey: 'common.nav.categories.billing', icon: DollarSign },
	{ view: 'tokens', labelKey: 'common.nav.items.tokens', catKey: 'common.nav.categories.developer', icon: KeyRound },
	{ view: 'media', labelKey: 'account.media.title', catKey: 'common.nav.categories.developer', icon: ImageIcon },
];

export const SUPPORT_PORTALS = [
	{ path: '/status', labelKey: 'info.home.portals.status.title', icon: Activity },
	{ path: '/roadmap', labelKey: 'info.home.portals.roadmap.title', icon: Map },
	{ path: '/suggestions', labelKey: 'info.home.portals.suggestions.title', icon: Lightbulb },
	{ path: '/issues', labelKey: 'info.home.portals.issues.title', icon: Bug },
	{ path: '/faq', labelKey: 'info.home.portals.faq.title', icon: BookOpen },
	{ path: '/changelog', labelKey: 'info.home.portals.changelog.title', icon: History },
];

export const ADMIN_TABS = [
	{ view: 'overview', labelKey: 'admin.dashboard.nav.overview', catKey: 'common.nav.categories.system', icon: Activity },
	{ view: 'seo', labelKey: 'admin.dashboard.nav.seo', catKey: 'common.nav.categories.system', icon: BarChart3 },
	{ view: 'audit', labelKey: 'admin.dashboard.nav.auditLogs', catKey: 'common.nav.categories.system', icon: ScrollText },
	{ view: 'users', labelKey: 'common.nav.items.users', catKey: 'common.nav.categories.moderator', icon: Users },
	{ view: 'roles', labelKey: 'common.nav.items.roles', catKey: 'common.nav.categories.system', icon: Shield },
	{ view: 'store', labelKey: 'admin.dashboard.nav.store', catKey: 'common.nav.categories.product', icon: Store },
	{ view: 'media', labelKey: 'admin.dashboard.nav.mediaLibrary', catKey: 'admin.dashboard.nav.media', icon: ImageIcon },
	{ view: 'invites', labelKey: 'admin.dashboard.nav.invites', catKey: 'common.nav.categories.administrator', icon: Ticket },
	{ view: 'announcements', labelKey: 'admin.dashboard.nav.announcements', catKey: 'common.nav.categories.administrator', icon: Megaphone },
	{ view: 'roadmap', labelKey: 'common.nav.items.roadmap', catKey: 'common.nav.categories.product', icon: Map },
	{ view: 'suggestions', labelKey: 'common.nav.items.suggestions', catKey: 'common.nav.categories.product', icon: Lightbulb },
	{ view: 'issues', labelKey: 'common.nav.items.issues', catKey: 'common.nav.categories.product', icon: Bug },
	{ view: 'translations', labelKey: 'common.nav.items.translations', catKey: 'common.nav.categories.translator', icon: Languages },
	{ view: 'applications_review', labelKey: 'common.nav.items.applications_review', catKey: 'common.nav.categories.moderator', icon: FileCheck },
	{ view: 'applications_manage', labelKey: 'common.nav.items.applications_manage', catKey: 'common.nav.categories.administrator', icon: FileCog },
	{ view: 'tokens', labelKey: 'common.nav.items.tokens', catKey: 'common.nav.categories.administrator', icon: KeyRound },
	{ view: 'settings', labelKey: 'common.nav.items.settings', catKey: 'common.nav.categories.system', icon: Settings },
];
