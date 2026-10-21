/** @format */

export interface RawCardBlueprint {
	id: string;
	slug: string;
	titleKey: string;
	paragraphKeys: string[];
	bulletKeys?: string[];
	tableType?: 'subdomains' | 'environments';
	links: { labelKey: string; href: string; vanity?: string; external?: boolean }[];
}

export interface RawCategoryBlueprint {
	id: string;
	titleKey: string;
	navTitleKey: string;
	sectionId: 'platform' | 'community' | 'accountAndDevs';
	sectionTitleKey: string;
	cards: RawCardBlueprint[];
}

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
	extra?: { bulletKeys?: string[]; tableType?: 'subdomains' | 'environments' }
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
				'card1',
				'subdomains',
				'faq.overview.card1.title',
				['faq.overview.card1.description'],
				[
					ql('exploreBots', 'https://app.xernerx.com', 'app.xernerx.com'),
					ql('accountSettings', 'https://account.xernerx.com', 'account.xernerx.com'),
					ql('storeHub', 'https://store.xernerx.com', 'store.xernerx.com'),
					ql('v1ApiDocs', 'https://docs.xernerx.com', 'docs.xernerx.com'),
				],
				{ tableType: 'subdomains' }
			),
			c(
				'card2',
				'navigation',
				'faq.overview.card2.title',
				['faq.overview.card2.description'],
				[
					ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'),
					ql('appearanceTab', 'https://account.xernerx.com/?tab=appearance', 'account.xernerx.com/appearance'),
				]
			),
			c(
				'card3',
				'shortcuts',
				'faq.overview.card3.title',
				['faq.overview.card3.description'],
				[ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'), ql('accountSettings', 'https://account.xernerx.com', 'account.xernerx.com')]
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
					ql('devPortal', 'https://app.xernerx.com/portal', 'app.xernerx.com/orgs'),
				]
			),
			c(
				'card5',
				'support',
				'faq.overview.card5.title',
				['faq.overview.card5.description'],
				[
					ql('discordSupport', '/support', '/support', true),
					ql('contactPage', 'https://www.xernerx.com/contact', 'xernerx.com/contact'),
					ql('issueTracker', 'https://info.xernerx.com/issues', 'info.xernerx.com/bugs'),
				]
			),
		],
	},
	{
		id: 'environments',
		titleKey: 'faq.environments.title',
		navTitleKey: 'common.nav.items.environments',
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
			c(
				'card4',
				'issues',
				'faq.environments.card4.title',
				['faq.environments.card4.description'],
				[ql('issueTracker', 'https://info.xernerx.com/issues', 'info.xernerx.com/bugs'), ql('activityLog', 'https://account.xernerx.com/?tab=activity', 'account.xernerx.com/activity')]
			),
			c(
				'card6',
				'suggestions-roadmap',
				'faq.environments.card6.title',
				['faq.environments.card6.description'],
				[
					ql('suggestions', 'https://info.xernerx.com/suggestions', 'info.xernerx.com/suggestions'),
					ql('roadmap', 'https://info.xernerx.com/roadmap', 'info.xernerx.com/roadmap'),
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
				'rpc-hotkeys',
				'faq.desktop.card4.title',
				['faq.desktop.card4.description'],
				[
					ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'),
					ql('appearanceTab', 'https://account.xernerx.com/?tab=appearance', 'account.xernerx.com/appearance'),
				]
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
				'card8',
				'discovery',
				'faq.bots.card8.title',
				['faq.bots.card8.description'],
				[
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'),
					ql('exploreServers', 'https://app.xernerx.com/servers', 'app.xernerx.com/servers'),
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
					ql('devPortal', 'https://app.xernerx.com/portal', 'app.xernerx.com/portal'),
					ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1'),
				]
			),
			c(
				'card9',
				'commands',
				'faq.bots.card9.title',
				['faq.bots.card9.description'],
				[ql('devPortal', 'https://app.xernerx.com/portal', 'app.xernerx.com/portal'), ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1')]
			),
			c(
				'card10',
				'reviews',
				'faq.bots.card10.title',
				['faq.bots.card10.description'],
				[ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'), ql('devPortal', 'https://app.xernerx.com/portal', 'app.xernerx.com/portal')]
			),
			c(
				'card1',
				'estimated-value',
				'faq.bots.card.title',
				['faq.bots.card.description1', 'faq.bots.card.disclaimer', 'faq.bots.card.description2'],
				[ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'), ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard')],
				{ bulletKeys: ['faq.bots.card.baseline', 'faq.bots.card.multiplier'] }
			),
			c(
				'card4',
				'webhooks',
				'faq.bots.card4.title',
				['faq.bots.card4.description'],
				[ql('devPortal', 'https://app.xernerx.com/portal', 'app.xernerx.com/portal'), ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1')]
			),
			c(
				'card5',
				'voting',
				'faq.bots.card5.title',
				['faq.bots.card5.description'],
				[
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'),
					ql('exploreServers', 'https://app.xernerx.com/servers', 'app.xernerx.com/servers'),
					ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard'),
				]
			),
			c(
				'card3',
				'official-invites',
				'faq.bots.card3.title',
				['faq.bots.card3.description'],
				[ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invite'), ql('coreApiDocs', 'https://docs.xernerx.com/api/core', 'docs.xernerx.com/api/core')]
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
				'card1',
				'dashboard',
				'faq.servers.card1.title',
				['faq.servers.card1.description'],
				[
					ql('serverDashboard', 'https://app.xernerx.com/dashboard', 'app.xernerx.com/dashboard'),
					ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invite'),
					ql('exploreServers', 'https://app.xernerx.com/servers', 'app.xernerx.com/servers'),
				]
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
				'card3',
				'virtue',
				'faq.servers.card3.title',
				['faq.servers.card3.description'],
				[
					ql('virtueSettings', 'https://app.xernerx.com/dashboard?tab=virtue', 'app.xernerx.com/dashboard?tab=virtue'),
					ql('botInvites', 'https://www.xernerx.com/invites', 'xernerx.com/invite'),
					ql('storeConsumers', 'https://store.xernerx.com/?category=consumers', 'store.xernerx.com/?category=consumers'),
				]
			),
			c(
				'card4',
				'organizations',
				'faq.servers.card4.title',
				['faq.servers.card4.description'],
				[ql('devPortal', 'https://app.xernerx.com/portal', 'app.xernerx.com/orgs'), ql('serverDashboard', 'https://app.xernerx.com/dashboard', 'app.xernerx.com/dashboard')]
			),
			c(
				'card5',
				'transfers',
				'faq.servers.card5.title',
				['faq.servers.card5.description'],
				[
					ql('devPortal', 'https://app.xernerx.com/portal', 'app.xernerx.com/portal'),
					ql('serverSettings', 'https://app.xernerx.com/dashboard?tab=settings', 'app.xernerx.com/dashboard?tab=settings'),
				]
			),
			c(
				'card6',
				'profiles',
				'faq.servers.card6.title',
				['faq.servers.card6.description'],
				[
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'),
					ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'),
					ql('supporters', 'https://app.xernerx.com/supporters', 'app.xernerx.com/supporters'),
				]
			),
		],
	},
];
