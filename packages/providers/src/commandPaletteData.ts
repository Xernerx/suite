/** @format */
import {
	Activity,
	BarChart3,
	Bell,
	BookOpen,
	Bot,
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
	Server,
	Settings,
	Shield,
	ShieldCheck,
	SlidersHorizontal,
	Store,
	Ticket,
	Users,
} from 'lucide-react';
import type React from 'react';

export type PaletteActionItem = {
	id: string;
	section: 'views' | 'actions' | 'bots' | 'servers' | 'community' | 'apps' | 'settings' | 'support' | 'admin';
	label: string;
	subtitle?: string;
	shortcut?: string;
	avatarUrl?: string | null;
	icon: React.ElementType;
	onSelect: () => void;
};

export function buildDynamicPaletteItems({
	trimmedQuery,
	liveBots,
	liveServers,
	communityData,
	getEnvUrl,
	onClose,
}: {
	trimmedQuery: string;
	liveBots: any[];
	liveServers: any[];
	communityData: { issues: any[]; suggestions: any[]; roadmap: any[] };
	getEnvUrl: (url: string) => string;
	onClose: () => void;
}): PaletteActionItem[] {
	const dynamicItems: PaletteActionItem[] = [];

	liveBots.forEach((bot) => {
		const avatarUrl = bot.avatarUrl || (bot.avatar ? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=64` : null);
		dynamicItems.push({
			id: `live-bot-${bot.id}`,
			section: 'bots',
			label: bot.name || bot.username || bot.id,
			subtitle: bot.description || `#${bot.id}`,
			avatarUrl,
			icon: Bot,
			onSelect: () => {
				window.location.href = `${getEnvUrl('https://app.xernerx.com')}/bots/${bot.id}`;
				onClose();
			},
		});
	});

	liveServers.forEach((srv) => {
		const avatarUrl = srv.iconUrl || (srv.icon ? `https://cdn.discordapp.com/icons/${srv.id}/${srv.icon}.png?size=64` : null);
		dynamicItems.push({
			id: `live-server-${srv.id}`,
			section: 'servers',
			label: srv.name || srv.id,
			subtitle: srv.description || `#${srv.id}`,
			avatarUrl,
			icon: Server,
			onSelect: () => {
				window.location.href = `${getEnvUrl('https://app.xernerx.com')}/servers/${srv.id}`;
				onClose();
			},
		});
	});

	if (trimmedQuery.length >= 2) {
		const matchedIssues = communityData.issues.filter((i) => (i.title || '').toLowerCase().includes(trimmedQuery) || (i.description || '').toLowerCase().includes(trimmedQuery)).slice(0, 2);
		const matchedSuggestions = communityData.suggestions
			.filter((s) => (s.title || '').toLowerCase().includes(trimmedQuery) || (s.description || '').toLowerCase().includes(trimmedQuery))
			.slice(0, 2);
		const matchedRoadmap = communityData.roadmap.filter((r) => (r.title || '').toLowerCase().includes(trimmedQuery) || (r.description || '').toLowerCase().includes(trimmedQuery)).slice(0, 2);

		matchedIssues.forEach((item, idx) => {
			dynamicItems.push({
				id: `comm-issue-${item._id || idx}`,
				section: 'community',
				label: item.title,
				subtitle: item.description,
				icon: Bug,
				onSelect: () => {
					window.location.href = `${getEnvUrl('https://info.xernerx.com')}/issues?q=${encodeURIComponent(item.title || '')}`;
					onClose();
				},
			});
		});
		matchedSuggestions.forEach((item, idx) => {
			dynamicItems.push({
				id: `comm-sug-${item._id || idx}`,
				section: 'community',
				label: item.title,
				subtitle: item.description,
				icon: Lightbulb,
				onSelect: () => {
					window.location.href = `${getEnvUrl('https://info.xernerx.com')}/suggestions?q=${encodeURIComponent(item.title || '')}`;
					onClose();
				},
			});
		});
		matchedRoadmap.forEach((item, idx) => {
			dynamicItems.push({
				id: `comm-road-${item._id || idx}`,
				section: 'community',
				label: item.title,
				subtitle: item.description,
				icon: Map,
				onSelect: () => {
					window.location.href = `${getEnvUrl('https://info.xernerx.com')}/roadmap`;
					onClose();
				},
			});
		});
	}

	return dynamicItems;
}

export const ACCOUNT_TABS = [
	{ view: 'profile', labelKey: 'common.nav.items.profile', catKey: 'common.nav.categories.account', icon: ShieldCheck },
	{ view: 'activity', labelKey: 'account.activity.navLabel', catKey: 'common.nav.categories.account', icon: Activity },
	{ view: 'connections', labelKey: 'common.nav.items.connections', catKey: 'common.nav.categories.account', icon: Globe },
	{ view: 'devices', labelKey: 'common.nav.items.devices', catKey: 'common.nav.categories.account', icon: Shield },
	{ view: 'appearance', labelKey: 'common.nav.items.appearance', catKey: 'common.nav.categories.preferences', icon: Paintbrush },
	{ view: 'preferences', labelKey: 'common.nav.items.preferences', catKey: 'common.nav.categories.preferences', icon: SlidersHorizontal },
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
