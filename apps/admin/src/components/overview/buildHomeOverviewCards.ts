/** @format */
import { Bot, Bug, Image as ImageIcon, Inbox, Key, Languages, Link as LinkIcon, Map, Megaphone, Server, Shield, ShoppingBag, Ticket, Users as UsersIcon } from 'lucide-react';
import type { AdminPermissionsMap } from '../HomeOverview';
import type { ModuleCard, UrgentItem } from './HomeOverviewSections';

interface BuildCardsInput {
	permissions: AdminPermissionsMap;
	t: (path: string, variables?: Record<string, string | number>) => string;
	localesData: any;
	issues: any[];
	applications: any[];
	appConfigs: Record<string, string>;
	suggestions: any[];
	roadmap: any[];
	users: any[];
	bots: any[];
	servers: any[];
	roles: any[];
	tokens: any[];
	storeItems: any[];
	storeCategories: any[];
	mediaList: any[];
	invites: any[];
	announcements: any[];
}

export function buildHomeOverviewCards({
	permissions,
	t,
	localesData,
	issues,
	applications,
	appConfigs,
	suggestions,
	roadmap,
	users,
	bots,
	servers,
	roles,
	tokens,
	storeItems,
	storeCategories,
	mediaList,
	invites,
	announcements,
}: BuildCardsInput): { urgentItems: UrgentItem[]; moduleCards: ModuleCard[] } {
	const urgentItems: UrgentItem[] = [];
	const moduleCards: ModuleCard[] = [];

	if (permissions.canManageIssues) {
		const openIssues = issues.filter((i) => i.status === 'open');
		const unverifiedIssues = openIssues.filter((i) => !i.acknowledged);
		const resolvedIssues = issues.filter((i) => i.status === 'resolved');

		if (unverifiedIssues.length > 0) {
			urgentItems.push({
				id: 'urgent-issues',
				view: 'issues',
				title: t('admin.dashboard.home.cards.issuesTitle'),
				subtitle: t('admin.dashboard.home.cards.issuesUrgent', { count: unverifiedIssues.length }),
				count: unverifiedIssues.length,
				severity: 'critical',
				icon: Bug,
				highlights: unverifiedIssues.slice(0, 3).map((i) => ({ label: i.title || i.id, query: i.title || i.id })),
			});
		}

		moduleCards.push({
			id: 'mod-issues',
			view: 'issues',
			title: t('admin.dashboard.home.cards.issuesTitle'),
			meta: t('admin.dashboard.home.cards.issuesMeta', { open: openIssues.length, resolved: resolvedIssues.length }),
			icon: Bug,
			badge:
				unverifiedIssues.length > 0
					? { text: `${unverifiedIssues.length} ${t('admin.dashboard.home.urgentBadge')}`, tone: 'urgent' }
					: { text: `${openIssues.length}`, tone: openIssues.length > 0 ? 'normal' : 'ok' },
		});
	}

	if (permissions.canApplicationsReview && permissions.isServerSet) {
		const pendingApps = applications.filter((a) => a.status === 'pending');
		const reviewedApps = applications.filter((a) => a.status !== 'pending');

		if (pendingApps.length > 0) {
			urgentItems.push({
				id: 'urgent-applications',
				view: 'applications_review',
				title: t('admin.dashboard.home.cards.applicationsTitle'),
				subtitle: t('admin.dashboard.home.cards.applicationsUrgent', { count: pendingApps.length }),
				count: pendingApps.length,
				severity: 'critical',
				icon: Ticket,
				highlights: pendingApps.slice(0, 3).map((a) => ({
					label: `${appConfigs[a.targetId] || t('admin.dashboard.applicationReviews.application')} • ${a.ownerId}`,
					query: a.ownerId !== 'anonymous' ? a.ownerId : appConfigs[a.targetId] || '',
				})),
			});
		}

		moduleCards.push({
			id: 'mod-applications',
			view: 'applications_review',
			title: t('admin.dashboard.home.cards.applicationsTitle'),
			meta: t('admin.dashboard.home.cards.applicationsMeta', { pending: pendingApps.length, reviewed: reviewedApps.length }),
			icon: Ticket,
			badge: pendingApps.length > 0 ? { text: `${pendingApps.length} ${t('admin.dashboard.home.urgentBadge')}`, tone: 'urgent' } : { text: '0', tone: 'ok' },
		});
	}

	if (permissions.canManageSuggestions) {
		const openSuggestions = suggestions.filter((s) => !s.status || s.status === 'open' || s.status === 'pending');
		const approvedSuggestions = suggestions.filter((s) => s.status === 'approved' || s.status === 'implemented');

		if (openSuggestions.length > 0) {
			urgentItems.push({
				id: 'urgent-suggestions',
				view: 'suggestions',
				title: t('admin.dashboard.home.cards.suggestionsTitle'),
				subtitle: t('admin.dashboard.home.cards.suggestionsUrgent', { count: openSuggestions.length }),
				count: openSuggestions.length,
				severity: 'warning',
				icon: Inbox,
				highlights: openSuggestions.slice(0, 3).map((s) => ({ label: s.title || s.id, query: s.title || s.id })),
			});
		}

		moduleCards.push({
			id: 'mod-suggestions',
			view: 'suggestions',
			title: t('admin.dashboard.home.cards.suggestionsTitle'),
			meta: t('admin.dashboard.home.cards.suggestionsMeta', { open: openSuggestions.length, approved: approvedSuggestions.length }),
			icon: Inbox,
			badge: openSuggestions.length > 0 ? { text: `${openSuggestions.length}`, tone: 'normal' } : { text: '0', tone: 'ok' },
		});
	}

	if (permissions.canTranslations && permissions.isServerSet) {
		const localesList: Array<{ code: string; label: string; coverage: number }> = Array.isArray(localesData)
			? localesData
			: localesData && typeof localesData === 'object'
				? Object.values(localesData)
				: [];
		const targetLocales = localesList.filter((l) => l && typeof l === 'object' && l.code && l.code !== 'en-GB');
		const incompleteLocales = targetLocales.filter((l) => (l.coverage ?? 0) < 100).sort((a, b) => (a.coverage ?? 0) - (b.coverage ?? 0));
		const avgCoverage = targetLocales.length > 0 ? Math.round(targetLocales.reduce((acc, l) => acc + (l.coverage ?? 0), 0) / targetLocales.length) : 100;

		if (incompleteLocales.length > 0) {
			urgentItems.push({
				id: 'urgent-translations',
				view: 'translations',
				title: t('admin.dashboard.home.cards.translationsTitle'),
				subtitle: t('admin.dashboard.home.cards.translationsUrgent', { count: incompleteLocales.length }),
				count: incompleteLocales.length,
				severity: 'info',
				icon: Languages,
				highlights: incompleteLocales.slice(0, 3).map((l) => ({ label: `${l.label} (${l.coverage ?? 0}%)`, query: l.code })),
			});
		}

		moduleCards.push({
			id: 'mod-translations',
			view: 'translations',
			title: t('admin.dashboard.home.cards.translationsTitle'),
			meta: t('admin.dashboard.home.cards.translationsMeta', { avg: avgCoverage, total: targetLocales.length }),
			icon: Languages,
			badge: { text: `${avgCoverage}%`, tone: avgCoverage === 100 ? 'ok' : 'normal' },
		});
	}

	if (permissions.canManageRoadmap) {
		const activeCount = roadmap.filter((r) => r.status === 'active' || r.status === 'in-progress').length;
		const plannedCount = roadmap.filter((r) => r.status === 'planned').length;
		const ideaCount = roadmap.filter((r) => !r.status || r.status === 'idea').length;

		moduleCards.push({
			id: 'mod-roadmap',
			view: 'roadmap',
			title: t('admin.dashboard.home.cards.roadmapTitle'),
			meta: t('admin.dashboard.home.cards.roadmapMeta', { active: activeCount, planned: plannedCount, ideas: ideaCount }),
			icon: Map,
			badge: { text: `${roadmap.length}`, tone: 'normal' },
		});
	}

	if (permissions.canUsers && permissions.isServerSet) {
		const verifiedUsers = users.filter((u) => u.verified).length;
		moduleCards.push({
			id: 'mod-users',
			view: 'users',
			title: t('admin.dashboard.home.cards.usersTitle'),
			meta: t('admin.dashboard.home.cards.usersMeta', { total: users.length, verified: verifiedUsers }),
			icon: UsersIcon,
			badge: { text: `${users.length}`, tone: 'normal' },
		});
	}

	if (permissions.canBots && permissions.isServerSet) {
		const verifiedBots = bots.filter((b) => b.verified).length;
		moduleCards.push({
			id: 'mod-bots',
			view: 'bots',
			title: t('admin.dashboard.home.cards.botsTitle'),
			meta: t('admin.dashboard.home.cards.botsMeta', { total: bots.length, verified: verifiedBots }),
			icon: Bot,
			badge: { text: `${bots.length}`, tone: 'normal' },
		});
	}

	if (permissions.canServers && permissions.isServerSet) {
		const verifiedServers = servers.filter((s) => s.verified).length;
		moduleCards.push({
			id: 'mod-servers',
			view: 'servers',
			title: t('admin.dashboard.home.cards.serversTitle'),
			meta: t('admin.dashboard.home.cards.serversMeta', { total: servers.length, verified: verifiedServers }),
			icon: Server,
			badge: { text: `${servers.length}`, tone: 'normal' },
		});
	}

	if (permissions.canRoles && permissions.isServerSet) {
		const syncedRoles = roles.filter((r) => r.role || r.discordRoleId).length;
		moduleCards.push({
			id: 'mod-roles',
			view: 'roles',
			title: t('admin.dashboard.home.cards.rolesTitle'),
			meta: t('admin.dashboard.home.cards.rolesMeta', { total: roles.length, synced: syncedRoles }),
			icon: Shield,
			badge: { text: `${roles.length}`, tone: 'normal' },
		});
	}

	if (permissions.canTokens && permissions.isServerSet) {
		const activeTokens = tokens.filter((tk) => tk.status === 'active').length;
		moduleCards.push({
			id: 'mod-tokens',
			view: 'tokens',
			title: t('admin.dashboard.home.cards.tokensTitle'),
			meta: t('admin.dashboard.home.cards.tokensMeta', { active: activeTokens, total: tokens.length }),
			icon: Key,
			badge: { text: `${activeTokens} / ${tokens.length}`, tone: 'normal' },
		});
	}

	if (permissions.canManageStore) {
		const activeStore = storeItems.filter((item) => item.enabled !== false).length;
		const discountedStore = storeItems.filter((item) => (item.discountPercent ?? item.discount ?? 0) > 0).length;
		moduleCards.push({
			id: 'mod-store',
			view: 'store',
			title: t('admin.dashboard.home.cards.storeTitle'),
			meta: t('admin.dashboard.home.cards.storeMeta', { active: activeStore, categories: storeCategories.length, discounted: discountedStore }),
			icon: ShoppingBag,
			badge: { text: `${activeStore}`, tone: 'ok' },
		});
	}

	if (permissions.canMedia) {
		moduleCards.push({
			id: 'mod-media',
			view: 'media',
			title: t('admin.dashboard.home.cards.mediaTitle'),
			meta: t('admin.dashboard.home.cards.mediaMeta', { total: mediaList.length }),
			icon: ImageIcon,
			badge: { text: `${mediaList.length}`, tone: 'normal' },
		});
	}

	if (permissions.canInvites) {
		moduleCards.push({
			id: 'mod-invites',
			view: 'invites',
			title: t('admin.dashboard.home.cards.invitesTitle'),
			meta: t('admin.dashboard.home.cards.invitesMeta', { total: invites.length }),
			icon: LinkIcon,
			badge: { text: `${invites.length}`, tone: 'normal' },
		});
	}

	if (permissions.canAnnouncements) {
		const scheduledCount = announcements.filter((a) => a.scheduledFor && !a.sentAt).length;
		moduleCards.push({
			id: 'mod-announcements',
			view: 'announcements',
			title: t('admin.dashboard.home.cards.announcementsTitle'),
			meta: t('admin.dashboard.home.cards.announcementsMeta', { total: announcements.length, scheduled: scheduledCount }),
			icon: Megaphone,
			badge: { text: `${announcements.length}`, tone: 'normal' },
		});
	}

	if (permissions.canSettings) {
		moduleCards.push({
			id: 'mod-settings',
			view: 'settings',
			title: t('admin.dashboard.home.cards.settingsTitle'),
			meta: t('admin.dashboard.home.cards.settingsMeta', { serverId: permissions.adminServerId || 'Unset' }),
			icon: Server,
			badge: { text: permissions.isServerSet ? 'OK' : '!', tone: permissions.isServerSet ? 'ok' : 'urgent' },
		});
	}

	return { urgentItems, moduleCards };
}
