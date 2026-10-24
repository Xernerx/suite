/** @format */
import { Bot, Boxes, Bug, Code, HardDrive, HelpCircle, Lightbulb, Map, Server } from 'lucide-react';
import type React from 'react';
import { ACCOUNT_DEEP_FEATURES, ACCOUNT_TABS, ADMIN_TABS, STORE_DEEP_LINKS, SUITE_DEEP_PORTALS, SUPPORT_PORTALS } from './commandPaletteCatalog';

export { ACCOUNT_DEEP_FEATURES, ACCOUNT_TABS, ADMIN_TABS, STORE_DEEP_LINKS, SUITE_DEEP_PORTALS, SUPPORT_PORTALS };

export type PaletteSectionKey = 'views' | 'actions' | 'bots' | 'servers' | 'docs' | 'faq' | 'community' | 'store' | 'apps' | 'settings' | 'support' | 'admin';

export type PaletteActionItem = {
	id: string;
	section: PaletteSectionKey;
	label: string;
	subtitle?: string;
	keywords?: string;
	shortcut?: string;
	avatarUrl?: string | null;
	icon: React.ElementType;
	onSelect: () => void;
};

export function matchesPaletteQuery(haystack: string, rawQuery: string): boolean {
	const tokens = rawQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return true;
	const lower = haystack.toLowerCase();
	return tokens.every((tok) => lower.includes(tok));
}

export function buildDynamicPaletteItems({
	trimmedQuery,
	liveBots,
	liveServers,
	communityData,
	faqCatalog = [],
	docsCatalog = [],
	getEnvUrl,
	onClose,
}: {
	trimmedQuery: string;
	liveBots: any[];
	liveServers: any[];
	communityData: { issues: any[]; suggestions: any[]; roadmap: any[] };
	faqCatalog?: any[];
	docsCatalog?: any[];
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
		const matchedDocs = docsCatalog
			.filter((d) =>
				matchesPaletteQuery(
					`${d.title || ''} ${d.description || ''} ${d.method || ''} ${d.path || ''} ${d.categoryTitle || ''} ${d.sectionTitle || ''} ${Array.isArray(d.keywords) ? d.keywords.join(' ') : ''}`,
					trimmedQuery
				)
			)
			.slice(0, 6);

		matchedDocs.forEach((doc, idx) => {
			const endpointPrefix = doc.method && doc.path ? `${doc.method} ${doc.path} — ` : '';
			dynamicItems.push({
				id: `dyn-doc-${doc.id || idx}`,
				section: 'docs',
				label: `${endpointPrefix}${doc.title || doc.id}`,
				subtitle: `${doc.categoryTitle || 'Docs'} • ${doc.description || ''}`,
				icon: doc.category === 'packages' ? Boxes : doc.category === 'cdn' ? HardDrive : Code,
				onSelect: () => {
					window.location.href = getEnvUrl(doc.url || 'https://docs.xernerx.com');
					onClose();
				},
			});
		});

		const matchedFaqs = faqCatalog
			.filter((f) =>
				matchesPaletteQuery(
					`${f.question || ''} ${f.answer || ''} ${f.categoryTitle || ''} ${f.sectionTitle || ''} ${f.slug || ''} ${Array.isArray(f.bullets) ? f.bullets.join(' ') : ''}`,
					trimmedQuery
				)
			)
			.slice(0, 6);

		matchedFaqs.forEach((faq, idx) => {
			dynamicItems.push({
				id: `dyn-faq-${faq.fullId || faq.id || idx}`,
				section: 'faq',
				label: faq.question || faq.id,
				subtitle: `${faq.categoryTitle || 'FAQ'} • ${faq.answer || ''}`,
				icon: HelpCircle,
				onSelect: () => {
					window.location.href = `${getEnvUrl('https://info.xernerx.com')}/faq?category=${encodeURIComponent(faq.categoryId || 'overview')}&q=${encodeURIComponent(trimmedQuery)}`;
					onClose();
				},
			});
		});

		const matchedRoadmap = communityData.roadmap.filter((r) => matchesPaletteQuery(`${r.title || ''} ${r.description || ''} ${r.product || ''} ${r.status || ''}`, trimmedQuery)).slice(0, 4);
		const matchedSuggestions = communityData.suggestions.filter((s) => matchesPaletteQuery(`${s.title || ''} ${s.description || ''} ${s.product || ''}`, trimmedQuery)).slice(0, 4);
		const matchedIssues = communityData.issues.filter((i) => matchesPaletteQuery(`${i.title || ''} ${i.description || ''} ${i.product || ''}`, trimmedQuery)).slice(0, 4);

		matchedRoadmap.forEach((item, idx) => {
			dynamicItems.push({
				id: `comm-road-${item._id || idx}`,
				section: 'community',
				label: item.title,
				subtitle: item.description,
				icon: Map,
				onSelect: () => {
					window.location.href = `${getEnvUrl('https://info.xernerx.com')}/roadmap?q=${encodeURIComponent(item.title || '')}`;
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
	}

	return dynamicItems;
}

export function buildDeepLinkPaletteItems({
	t,
	getEnvUrl,
	sidebar,
	hasAdminAccess,
	onClose,
}: {
	t: (key: string) => string;
	getEnvUrl: (url: string) => string;
	sidebar: { setView: (v: string) => void };
	hasAdminAccess: boolean;
	onClose: () => void;
}): PaletteActionItem[] {
	const list: PaletteActionItem[] = [];

	const navigateAccountTab = (view: string) => {
		const accountBase = getEnvUrl('https://account.xernerx.com');
		try {
			if (window.location.origin === new URL(accountBase).origin && window.location.pathname === '/') {
				sidebar.setView(view);
				onClose();
				return;
			}
		} catch {}
		window.location.href = `${accountBase}/?tab=${view}`;
		onClose();
	};

	ACCOUNT_TABS.forEach((tab) => {
		list.push({
			id: `settings-account-${tab.view}`,
			section: 'settings',
			label: t(tab.labelKey),
			subtitle: t(tab.catKey),
			keywords: tab.keywords,
			icon: tab.icon,
			onSelect: () => navigateAccountTab(tab.view),
		});
	});

	ACCOUNT_DEEP_FEATURES.forEach((feat) => {
		list.push({
			id: `settings-feat-${feat.id}`,
			section: 'settings',
			label: feat.label,
			subtitle: feat.subtitle,
			keywords: feat.keywords,
			icon: feat.icon,
			onSelect: () => navigateAccountTab(feat.view),
		});
	});

	STORE_DEEP_LINKS.forEach((storeItem) => {
		list.push({
			id: `store-${storeItem.id}`,
			section: 'store',
			label: storeItem.label,
			subtitle: storeItem.subtitle,
			keywords: storeItem.keywords,
			icon: storeItem.icon,
			onSelect: () => {
				window.location.href = `${getEnvUrl('https://store.xernerx.com')}${storeItem.path}`;
				onClose();
			},
		});
	});

	SUITE_DEEP_PORTALS.forEach((portal) => {
		list.push({
			id: `suite-portal-${portal.id}`,
			section: portal.section,
			label: portal.label,
			subtitle: portal.subtitle,
			keywords: portal.keywords,
			icon: portal.icon,
			onSelect: () => {
				window.location.href = `${getEnvUrl(portal.baseUrl)}${portal.path}`;
				onClose();
			},
		});
	});

	SUPPORT_PORTALS.forEach((portal) => {
		list.push({
			id: `support-${portal.path}`,
			section: 'support',
			label: t(portal.labelKey),
			subtitle: t('common.footer.sections.support'),
			keywords: portal.keywords,
			icon: portal.icon,
			onSelect: () => {
				window.location.href = `${getEnvUrl('https://info.xernerx.com')}${portal.path}`;
				onClose();
			},
		});
	});

	if (hasAdminAccess) {
		ADMIN_TABS.forEach((tab) => {
			list.push({
				id: `admin-${tab.view}`,
				section: 'admin',
				label: t(tab.labelKey),
				subtitle: t(tab.catKey),
				keywords: tab.keywords,
				icon: tab.icon,
				onSelect: () => {
					const adminBase = getEnvUrl('https://admin.xernerx.com');
					try {
						if (window.location.origin === new URL(adminBase).origin && window.location.pathname === '/') {
							sidebar.setView(tab.view);
							onClose();
							return;
						}
					} catch {}
					window.location.href = `${adminBase}/?tab=${tab.view}`;
					onClose();
				},
			});
		});
	}

	return list;
}
