/** @format */

export type FaqInteractiveAction = 'commandPalette' | 'appDrawer' | 'omnibar' | 'shortcutsModal';

export interface RawCardBlueprint {
	id: string;
	slug: string;
	titleKey: string;
	paragraphKeys: string[];
	disclaimerKey?: string;
	bulletKeys?: string[];
	tableType?: 'subdomains' | 'environments';
	interactiveAction?: FaqInteractiveAction;
	links: { labelKey: string; href: string; vanity?: string; external?: boolean }[];
}

export interface RawCategoryBlueprint {
	id: string;
	titleKey: string;
	navTitleKey: string;
	sectionId: 'platform' | 'community' | 'account' | 'billing' | 'developers';
	sectionTitleKey: string;
	cards: RawCardBlueprint[];
}

export const FAQ_SUBDOMAINS_CATALOG = [
	{ key: 'www', href: 'https://www.xernerx.com', domain: 'xernerx.com' },
	{ key: 'app', href: 'https://app.xernerx.com', domain: 'app.xernerx.com' },
	{ key: 'account', href: 'https://account.xernerx.com', domain: 'account.xernerx.com' },
	{ key: 'store', href: 'https://store.xernerx.com', domain: 'store.xernerx.com' },
	{ key: 'portal', href: 'https://portal.xernerx.com', domain: 'portal.xernerx.com' },
	{ key: 'cdn', href: 'https://cdn.xernerx.com', domain: 'cdn.xernerx.com' },
	{ key: 'docs', href: 'https://docs.xernerx.com', domain: 'docs.xernerx.com' },
	{ key: 'info', href: 'https://info.xernerx.com', domain: 'info.xernerx.com' },
	{ key: 'haste', href: 'https://haste.xernerx.com', domain: 'haste.xernerx.com' },
	{ key: 'blog', href: 'https://blog.xernerx.com', domain: 'blog.xernerx.com' },
	{ key: 'api', href: 'https://api.xernerx.com', domain: 'api.xernerx.com' },
	{ key: 'admin', href: 'https://admin.xernerx.com', domain: 'admin.xernerx.com' },
	{ key: 'hosting', href: 'https://hosting.xernerx.com', domain: 'hosting.xernerx.com' },
] as const;

export const ql = (labelKey: string, href: string, vanity?: string, external?: boolean) => ({
	labelKey: `faq.quickLinks.${labelKey}`,
	href,
	...(vanity ? { vanity } : {}),
	...(external ? { external } : {}),
});

export const c = (
	id: string,
	slug: string,
	titleKey: string,
	paragraphKeys: string[],
	links: { labelKey: string; href: string; vanity?: string; external?: boolean }[],
	extra?: { disclaimerKey?: string; bulletKeys?: string[]; tableType?: 'subdomains' | 'environments'; interactiveAction?: FaqInteractiveAction }
): RawCardBlueprint => ({
	id,
	slug,
	titleKey,
	paragraphKeys,
	links,
	...extra,
});

export const FAQ_PLATFORM_AND_COMMUNITY_BLUEPRINTS: RawCategoryBlueprint[] = [
	{
		id: 'overview',
		titleKey: 'faq.overview.title',
		navTitleKey: 'faq.overview.navTitle',
		sectionId: 'platform',
		sectionTitleKey: 'faq.category.platform',
		cards: [
			c(
				'card0',
				'what-is-xernerx-suite',
				'faq.overview.card0.title',
				['faq.overview.card0.description'],
				[
					ql('productionEnv', 'https://www.xernerx.com', 'xernerx.com', true),
					ql('exploreBots', 'https://app.xernerx.com', 'app.xernerx.com'),
					ql('accountSettings', 'https://account.xernerx.com', 'account.xernerx.com'),
					ql('desktopDownload', 'https://www.xernerx.com/download', 'xernerx.com/desktop'),
				]
			),
			c(
				'card1',
				'subdomains',
				'faq.overview.card1.title',
				['faq.overview.card1.description'],
				[
					ql('exploreBots', 'https://app.xernerx.com', 'app.xernerx.com'),
					ql('accountSettings', 'https://account.xernerx.com', 'account.xernerx.com'),
					ql('storeHub', 'https://store.xernerx.com', 'store.xernerx.com'),
					ql('portalSubdomain', 'https://portal.xernerx.com', 'portal.xernerx.com'),
					ql('v1ApiDocs', 'https://docs.xernerx.com', 'docs.xernerx.com'),
				],
				{ tableType: 'subdomains' }
			),
			c(
				'card2',
				'command-palette',
				'faq.overview.card2.title',
				['faq.overview.card2.description'],
				[
					ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'),
					ql('appearanceTab', 'https://account.xernerx.com/?tab=appearance', 'account.xernerx.com/appearance'),
				],
				{ interactiveAction: 'commandPalette' }
			),
			c(
				'card7',
				'app-drawer',
				'faq.overview.card7.title',
				['faq.overview.card7.description'],
				[
					ql('exploreBots', 'https://app.xernerx.com', 'app.xernerx.com'),
					ql('portalSubdomain', 'https://portal.xernerx.com', 'portal.xernerx.com'),
					ql('blogNewsroom', 'https://blog.xernerx.com', 'blog.xernerx.com'),
				],
				{ interactiveAction: 'appDrawer' }
			),
			c(
				'card8',
				'url-omnibar',
				'faq.overview.card8.title',
				['faq.overview.card8.description'],
				[ql('productionEnv', 'https://www.xernerx.com', 'xernerx.com', true), ql('canaryEnv', 'https://canary.xernerx.com', 'canary.xernerx.com', true)],
				{ interactiveAction: 'omnibar' }
			),
			c(
				'card3',
				'shortcuts',
				'faq.overview.card3.title',
				['faq.overview.card3.description'],
				[ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'), ql('accountSettings', 'https://account.xernerx.com', 'account.xernerx.com')],
				{ interactiveAction: 'shortcutsModal' }
			),
			c(
				'card4',
				'vanity-links',
				'faq.overview.card4.title',
				['faq.overview.card4.description'],
				[
					ql('discordSupport', '/support', '/support • /discord', true),
					ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invite'),
					ql('desktopDownload', 'https://www.xernerx.com/download', 'xernerx.com/desktop'),
					ql('openApplications', 'https://www.xernerx.com/applications', 'xernerx.com/careers • /jobs'),
					ql('issueTracker', 'https://info.xernerx.com/issues', 'info.xernerx.com/bugs'),
					ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'),
				]
			),
			c(
				'card6',
				'custom-vanity-slugs',
				'faq.overview.card6.title',
				['faq.overview.card6.description'],
				[
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots/[slug]'),
					ql('exploreServers', 'https://app.xernerx.com/servers', 'app.xernerx.com/servers/[slug]'),
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'app.xernerx.com/users/[slug]'),
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
				]
			),
		],
	},
	{
		id: 'environments',
		titleKey: 'faq.environments.title',
		navTitleKey: 'faq.environments.navTitle',
		sectionId: 'platform',
		sectionTitleKey: 'faq.category.platform',
		cards: [
			c(
				'card1',
				'release-channels',
				'faq.environments.card.title',
				['faq.environments.card.description'],
				[
					ql('productionEnv', 'https://www.xernerx.com', 'xernerx.com', true),
					ql('canaryEnv', 'https://canary.xernerx.com', 'canary.xernerx.com', true),
					ql('desktopDownload', 'https://www.xernerx.com/download', 'xernerx.com/desktop'),
				],
				{ tableType: 'environments' }
			),
			c(
				'card7',
				'release-vs-canary',
				'faq.environments.card7.title',
				['faq.environments.card7.description'],
				[
					ql('productionEnv', 'https://www.xernerx.com', 'xernerx.com', true),
					ql('canaryEnv', 'https://canary.xernerx.com', 'canary.xernerx.com', true),
					ql('issueTracker', 'https://info.xernerx.com/issues', 'info.xernerx.com/bugs'),
				]
			),
			c(
				'card2',
				'status',
				'faq.environments.card2.title',
				['faq.environments.card2.description'],
				[
					ql('systemStatus', 'https://info.xernerx.com/status', 'info.xernerx.com/status'),
					ql('statusBadge', 'https://api.xernerx.com/v1/status/badge.svg', 'api.xernerx.com/v1/status/badge.svg', true),
					ql('issueTracker', 'https://info.xernerx.com/issues', 'info.xernerx.com/bugs'),
				]
			),
			c(
				'card3',
				'changelog',
				'faq.environments.card3.title',
				['faq.environments.card3.description'],
				[
					ql('changelog', 'https://info.xernerx.com/changelog', 'info.xernerx.com/changelog'),
					ql('changelogRss', 'https://api.xernerx.com/v1/changelog/rss', 'api.xernerx.com/v1/changelog/rss', true),
					ql('roadmap', 'https://info.xernerx.com/roadmap', 'info.xernerx.com/roadmap'),
				]
			),
		],
	},
	{
		id: 'feedback',
		titleKey: 'faq.feedback.title',
		navTitleKey: 'faq.feedback.navTitle',
		sectionId: 'platform',
		sectionTitleKey: 'faq.category.platform',
		cards: [
			c(
				'card0',
				'what-is-support-hub',
				'faq.feedback.card0.title',
				['faq.feedback.card0.description'],
				[
					ql('issueTracker', 'https://info.xernerx.com/issues', 'info.xernerx.com/bugs'),
					ql('suggestions', 'https://info.xernerx.com/suggestions', 'info.xernerx.com/suggestions'),
					ql('roadmap', 'https://info.xernerx.com/roadmap', 'info.xernerx.com/roadmap'),
					ql('systemStatus', 'https://info.xernerx.com/status', 'info.xernerx.com/status'),
					ql('changelog', 'https://info.xernerx.com/changelog', 'info.xernerx.com/changelog'),
				]
			),
			c(
				'card1',
				'support-button',
				'faq.feedback.card1.title',
				['faq.feedback.card1.description'],
				[
					ql('discordSupport', '/support', '/support', true),
					ql('issueTracker', 'https://info.xernerx.com/issues', 'info.xernerx.com/bugs'),
					ql('suggestions', 'https://info.xernerx.com/suggestions', 'info.xernerx.com/suggestions'),
				]
			),
			c(
				'card5',
				'contact-departments',
				'faq.feedback.card5.title',
				['faq.feedback.card5.description'],
				[
					ql('contactPage', 'https://www.xernerx.com/contact', 'xernerx.com/contact'),
					ql('securityPolicy', 'https://www.xernerx.com/security', 'xernerx.com/security'),
					ql('privacyPolicy', 'https://www.xernerx.com/privacy', 'xernerx.com/privacy'),
				]
			),
			c(
				'card2',
				'issues',
				'faq.feedback.card2.title',
				['faq.feedback.card2.description'],
				[ql('issueTracker', 'https://info.xernerx.com/issues', 'info.xernerx.com/bugs'), ql('activityLog', 'https://account.xernerx.com/?tab=activity', 'account.xernerx.com/activity')]
			),
			c(
				'card6',
				'issue-release-badges',
				'faq.feedback.card6.title',
				['faq.feedback.card6.description'],
				[
					ql('issueTracker', 'https://info.xernerx.com/issues', 'info.xernerx.com/bugs'),
					ql('canaryEnv', 'https://canary.xernerx.com', 'canary.xernerx.com', true),
					ql('changelog', 'https://info.xernerx.com/changelog', 'info.xernerx.com/changelog'),
				]
			),
			c(
				'card3',
				'suggestions',
				'faq.feedback.card3.title',
				['faq.feedback.card3.description'],
				[
					ql('suggestions', 'https://info.xernerx.com/suggestions', 'info.xernerx.com/suggestions'),
					ql('activityLog', 'https://account.xernerx.com/?tab=activity', 'account.xernerx.com/activity'),
				]
			),
			c(
				'card7',
				'roadmap',
				'faq.feedback.card7.title',
				['faq.feedback.card7.description'],
				[
					ql('roadmap', 'https://info.xernerx.com/roadmap', 'info.xernerx.com/roadmap'),
					ql('suggestions', 'https://info.xernerx.com/suggestions', 'info.xernerx.com/suggestions'),
					ql('notificationPrefs', 'https://account.xernerx.com/?tab=notifications', 'account.xernerx.com/notifications'),
				]
			),
			c(
				'card4',
				'careers',
				'faq.feedback.card4.title',
				['faq.feedback.card4.description'],
				[
					ql('openApplications', 'https://www.xernerx.com/applications', 'xernerx.com/careers • /jobs'),
					ql('activityLog', 'https://account.xernerx.com/?tab=activity', 'account.xernerx.com/activity'),
					ql('notificationPrefs', 'https://account.xernerx.com/?tab=notifications', 'account.xernerx.com/notifications'),
				]
			),
		],
	},
	{
		id: 'desktop',
		titleKey: 'faq.desktop.title',
		navTitleKey: 'faq.desktop.navTitle',
		sectionId: 'platform',
		sectionTitleKey: 'faq.category.platform',
		cards: [
			c(
				'card1',
				'desktop-app',
				'faq.desktop.card1.title',
				['faq.desktop.card1.description'],
				[ql('desktopDownload', 'https://www.xernerx.com/download', 'xernerx.com/desktop'), ql('liveOverlay', 'https://app.xernerx.com/overlay', 'app.xernerx.com/overlay')]
			),
			c(
				'card6',
				'desktop-canary-builds',
				'faq.desktop.card6.title',
				['faq.desktop.card6.description'],
				[ql('desktopDownload', 'https://www.xernerx.com/download', 'xernerx.com/desktop'), ql('canaryEnv', 'https://canary.xernerx.com/download', 'canary.xernerx.com/desktop', true)]
			),
			c(
				'card2',
				'multi-account',
				'faq.desktop.card2.title',
				['faq.desktop.card2.description'],
				[
					ql('desktopDownload', 'https://www.xernerx.com/download', 'xernerx.com/desktop'),
					ql('devicesTab', 'https://account.xernerx.com/?tab=devices', 'account.xernerx.com/devices'),
					ql('cookiePolicy', 'https://www.xernerx.com/cookies', 'xernerx.com/cookies'),
				]
			),
			c(
				'card3',
				'overlay',
				'faq.desktop.card3.title',
				['faq.desktop.card3.description'],
				[ql('liveOverlay', 'https://app.xernerx.com/overlay', 'app.xernerx.com/overlay'), ql('desktopDownload', 'https://www.xernerx.com/download', 'xernerx.com/desktop')]
			),
			c(
				'card4',
				'desktop-customization-rpc',
				'faq.desktop.card4.title',
				['faq.desktop.card4.description'],
				[
					ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'),
					ql('appearanceTab', 'https://account.xernerx.com/?tab=appearance', 'account.xernerx.com/appearance'),
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
				]
			),
			c(
				'card7',
				'streamer-protection-hotkeys',
				'faq.desktop.card7.title',
				['faq.desktop.card7.description'],
				[ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'), ql('cdnPortal', 'https://cdn.xernerx.com', 'cdn.xernerx.com')]
			),
			c(
				'card5',
				'troubleshooting',
				'faq.desktop.card5.title',
				['faq.desktop.card5.description'],
				[
					ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'),
					ql('issueTracker', 'https://info.xernerx.com/issues', 'info.xernerx.com/bugs'),
				]
			),
		],
	},
	{
		id: 'bots',
		titleKey: 'faq.bots.title',
		navTitleKey: 'faq.bots.navTitle',
		sectionId: 'community',
		sectionTitleKey: 'faq.category.community',
		cards: [
			c(
				'card0',
				'what-is-bot-directory',
				'faq.bots.card0.title',
				['faq.bots.card0.description'],
				[
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'),
					ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invite'),
					ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard'),
				]
			),
			c(
				'card2',
				'registration',
				'faq.bots.card2.title',
				['faq.bots.card2.description'],
				[
					ql('apiTokens', 'https://account.xernerx.com/?tab=tokens', 'account.xernerx.com/tokens'),
					ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'),
					ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1'),
				]
			),
			c(
				'card9',
				'commands',
				'faq.bots.card9.title',
				['faq.bots.card9.description'],
				[
					ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'),
					ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1'),
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'),
				]
			),
			c(
				'card11',
				'vitals-milestones',
				'faq.bots.card11.title',
				['faq.bots.card11.description'],
				[ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'), ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile')]
			),
			c(
				'card13',
				'telemetry-presence',
				'faq.bots.card13.title',
				['faq.bots.card13.description'],
				[
					ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1#post-bot-stats', 'docs.xernerx.com/api/v1#post-bot-stats'),
					ql('npmPackagesDocs', 'https://docs.xernerx.com/packages', 'docs.xernerx.com/packages'),
					ql('systemStatus', 'https://info.xernerx.com/status', 'info.xernerx.com/status'),
					ql('storeDevelopers', 'https://store.xernerx.com/?category=developers', 'store.xernerx.com/?category=developers'),
				]
			),
			c(
				'card10',
				'reviews',
				'faq.bots.card10.title',
				['faq.bots.card10.description'],
				[ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'), ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com')]
			),
			c(
				'card3',
				'official-invites',
				'faq.bots.card3.title',
				['faq.bots.card3.description'],
				[ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invite'), ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots')]
			),
			c(
				'card12',
				'invite-permission-options',
				'faq.bots.card12.title',
				['faq.bots.card12.description'],
				[ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invites'), ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots')]
			),
		],
	},
	{
		id: 'servers',
		titleKey: 'faq.servers.title',
		navTitleKey: 'faq.servers.navTitle',
		sectionId: 'community',
		sectionTitleKey: 'faq.category.community',
		cards: [
			c(
				'card0',
				'what-is-server-directory',
				'faq.servers.card0.title',
				['faq.servers.card0.description'],
				[ql('exploreServers', 'https://app.xernerx.com/servers', 'app.xernerx.com/servers'), ql('serverDashboard', 'https://app.xernerx.com/dashboard', 'app.xernerx.com/dashboard')]
			),
			c(
				'card1',
				'dashboard',
				'faq.servers.card1.title',
				['faq.servers.card1.description'],
				[ql('serverDashboard', 'https://app.xernerx.com/dashboard', 'app.xernerx.com/dashboard'), ql('exploreServers', 'https://app.xernerx.com/servers', 'app.xernerx.com/servers')]
			),
			c(
				'card10',
				'server-sync-status',
				'faq.servers.card10.title',
				['faq.servers.card10.description'],
				[ql('serverDashboard', 'https://app.xernerx.com/dashboard', 'app.xernerx.com/dashboard'), ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invite')]
			),
			c(
				'card2',
				'analytics',
				'faq.servers.card2.title',
				['faq.servers.card2.description'],
				[
					ql('serverStats', 'https://app.xernerx.com/dashboard?tab=stats', 'app.xernerx.com/dashboard?tab=stats'),
					ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard'),
				]
			),
			c(
				'card11',
				'server-applications-yourapps',
				'faq.servers.card11.title',
				['faq.servers.card11.description'],
				[
					ql('applicationsSettings', 'https://app.xernerx.com/dashboard?tab=applications', 'app.xernerx.com/dashboard?tab=applications'),
					ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invite'),
				]
			),
		],
	},
	{
		id: 'virtue',
		titleKey: 'faq.virtue.title',
		navTitleKey: 'faq.virtue.navTitle',
		sectionId: 'community',
		sectionTitleKey: 'faq.category.community',
		cards: [
			c(
				'card3',
				'virtue',
				'faq.virtue.card3.title',
				['faq.virtue.card3.description'],
				[
					ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invite'),
					ql('virtueSettings', 'https://app.xernerx.com/dashboard?tab=virtue', 'app.xernerx.com/dashboard?tab=virtue'),
					ql('storeConsumers', 'https://store.xernerx.com/?category=consumers', 'store.xernerx.com/?category=consumers'),
				]
			),
			c(
				'card10',
				'virtue-dashboard-settings',
				'faq.virtue.card10.title',
				['faq.virtue.card10.description'],
				[
					ql('virtueSettings', 'https://app.xernerx.com/dashboard?tab=virtue', 'app.xernerx.com/dashboard?tab=virtue'),
					ql('storeConsumers', 'https://store.xernerx.com/?category=consumers', 'store.xernerx.com/?category=consumers'),
				]
			),
			c(
				'card9',
				'virtue-level-algorithm',
				'faq.virtue.card9.title',
				['faq.virtue.card9.description1', 'faq.virtue.card9.description2'],
				[
					ql('virtueSettings', 'https://app.xernerx.com/dashboard?tab=virtue', 'app.xernerx.com/dashboard?tab=virtue'),
					ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard'),
					ql('storeConsumers', 'https://store.xernerx.com/?category=consumers', 'store.xernerx.com/?category=consumers'),
				],
				{
					bulletKeys: ['faq.virtue.card9.bullet1', 'faq.virtue.card9.bullet2', 'faq.virtue.card9.bullet3', 'faq.virtue.card9.bullet4'],
				}
			),
			c(
				'card7',
				'xp-voice-leaderboards',
				'faq.virtue.card7.title',
				['faq.virtue.card7.description'],
				[
					ql('virtueSettings', 'https://app.xernerx.com/dashboard?tab=virtue', 'app.xernerx.com/dashboard?tab=virtue'),
					ql('exploreServers', 'https://app.xernerx.com/servers', 'app.xernerx.com/servers'),
					ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard'),
				]
			),
			c(
				'card8',
				'virtue-level-role-tracks',
				'faq.virtue.card8.title',
				['faq.virtue.card8.description'],
				[
					ql('virtueSettings', 'https://app.xernerx.com/dashboard?tab=virtue', 'app.xernerx.com/dashboard?tab=virtue'),
					ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invite'),
				]
			),
			c(
				'card11',
				'dynamic-hoist-roles',
				'faq.virtue.card11.title',
				['faq.virtue.card11.description'],
				[
					ql('virtueSettings', 'https://app.xernerx.com/dashboard?tab=virtue', 'app.xernerx.com/dashboard?tab=virtue'),
					ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invite'),
				]
			),
		],
	},
	{
		id: 'leaderboards',
		titleKey: 'faq.leaderboards.title',
		navTitleKey: 'faq.leaderboards.navTitle',
		sectionId: 'community',
		sectionTitleKey: 'faq.category.community',
		cards: [
			c(
				'card0',
				'what-are-leaderboards',
				'faq.leaderboards.card0.title',
				['faq.leaderboards.card0.description'],
				[
					ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard'),
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'),
					ql('exploreServers', 'https://app.xernerx.com/servers', 'app.xernerx.com/servers'),
				]
			),
			c(
				'card8',
				'discovery',
				'faq.leaderboards.card8.title',
				['faq.leaderboards.card8.description'],
				[
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'),
					ql('exploreServers', 'https://app.xernerx.com/servers', 'app.xernerx.com/servers'),
					ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard'),
				]
			),
			c(
				'card5',
				'voting',
				'faq.leaderboards.card5.title',
				['faq.leaderboards.card5.description'],
				[
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'),
					ql('exploreServers', 'https://app.xernerx.com/servers', 'app.xernerx.com/servers'),
					ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard'),
				]
			),
			c(
				'card9',
				'spotlight-boosts',
				'faq.leaderboards.card9.title',
				['faq.leaderboards.card9.description'],
				[
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'),
					ql('exploreServers', 'https://app.xernerx.com/servers', 'app.xernerx.com/servers'),
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
				]
			),
			c(
				'card1',
				'estimated-value',
				'faq.leaderboards.card1.title',
				['faq.leaderboards.card1.description1', 'faq.leaderboards.card1.description2'],
				[ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'), ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard')],
				{
					disclaimerKey: 'faq.leaderboards.card1.disclaimer',
					bulletKeys: ['faq.leaderboards.card1.baseline', 'faq.leaderboards.card1.multiplier'],
				}
			),
		],
	},
	{
		id: 'organizations',
		titleKey: 'faq.organizations.title',
		navTitleKey: 'faq.organizations.navTitle',
		sectionId: 'community',
		sectionTitleKey: 'faq.category.community',
		cards: [
			c(
				'card4',
				'organizations',
				'faq.organizations.card4.title',
				['faq.organizations.card4.description'],
				[ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'), ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots')]
			),
			c(
				'card6',
				'org-invites-roles',
				'faq.organizations.card6.title',
				['faq.organizations.card6.description'],
				[ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'), ql('notificationPrefs', 'https://account.xernerx.com/?tab=notifications', 'account.xernerx.com/notifications')]
			),
			c(
				'card5',
				'transfers',
				'faq.organizations.card5.title',
				['faq.organizations.card5.description'],
				[ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'), ql('serverSettings', 'https://app.xernerx.com/dashboard?tab=settings', 'app.xernerx.com/dashboard?tab=settings')]
			),
			c(
				'card7',
				'reset-delete-listing',
				'faq.organizations.card7.title',
				['faq.organizations.card7.description'],
				[ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'), ql('serverSettings', 'https://app.xernerx.com/dashboard?tab=settings', 'app.xernerx.com/dashboard?tab=settings')]
			),
		],
	},
];
