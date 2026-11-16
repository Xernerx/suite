/** @format */

import { type RawCategoryBlueprint, FAQ_PLATFORM_AND_COMMUNITY_BLUEPRINTS, c, ql } from './faqBlueprintsPlatform';

export { FAQ_SUBDOMAINS_CATALOG, type FaqInteractiveAction, type RawCardBlueprint, type RawCategoryBlueprint } from './faqBlueprintsPlatform';

const FAQ_ACCOUNT_AND_DEVS_BLUEPRINTS: RawCategoryBlueprint[] = [
	{
		id: 'account',
		titleKey: 'faq.account.title',
		navTitleKey: 'faq.account.navTitle',
		sectionId: 'account',
		sectionTitleKey: 'faq.category.account',
		cards: [
			c(
				'card0',
				'what-is-xernerx-account',
				'faq.account.card0.title',
				['faq.account.card0.description'],
				[ql('accountSettings', 'https://account.xernerx.com/?tab=account', 'account.xernerx.com'), ql('signInPage', 'https://account.xernerx.com/login', 'account.xernerx.com/login')]
			),
			c(
				'card1',
				'oauth-qr',
				'faq.account.card1.title',
				['faq.account.card1.description'],
				[ql('signInPage', 'https://account.xernerx.com/login', 'account.xernerx.com/login'), ql('securityPolicy', 'https://www.xernerx.com/security', 'xernerx.com/security')]
			),
			c(
				'card13',
				'qr-device-pairing',
				'faq.account.card13.title',
				['faq.account.card13.description'],
				[
					ql('signInPage', 'https://account.xernerx.com/login', 'account.xernerx.com/login'),
					ql('devicesTab', 'https://account.xernerx.com/?tab=devices', 'account.xernerx.com/devices'),
					ql('desktopDownload', 'https://www.xernerx.com/download', 'xernerx.com/desktop'),
				]
			),
			c(
				'card5',
				'sessions',
				'faq.account.card5.title',
				['faq.account.card5.description'],
				[ql('devicesTab', 'https://account.xernerx.com/?tab=devices', 'account.xernerx.com/devices'), ql('accountSettings', 'https://account.xernerx.com/?tab=account', 'account.xernerx.com')]
			),
			c(
				'card6',
				'connections',
				'faq.account.card6.title',
				['faq.account.card6.description'],
				[
					ql('connectionsTab', 'https://account.xernerx.com/?tab=connections', 'account.xernerx.com/connections'),
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'),
				]
			),
			c(
				'card10',
				'activity-log',
				'faq.account.card10.title',
				['faq.account.card10.description'],
				[
					ql('activityLog', 'https://account.xernerx.com/?tab=activity', 'account.xernerx.com/activity'),
					ql('accountSettings', 'https://account.xernerx.com/?tab=account', 'account.xernerx.com'),
				]
			),
			c(
				'card14',
				'reset-delete-account',
				'faq.account.card14.title',
				['faq.account.card14.description'],
				[ql('accountSettings', 'https://account.xernerx.com/?tab=account', 'account.xernerx.com'), ql('privacyPolicy', 'https://www.xernerx.com/privacy', 'xernerx.com/privacy')]
			),
		],
	},
	{
		id: 'profiles',
		titleKey: 'faq.profiles.title',
		navTitleKey: 'faq.profiles.navTitle',
		sectionId: 'account',
		sectionTitleKey: 'faq.category.account',
		cards: [
			c(
				'card6',
				'profiles',
				'faq.profiles.card6.title',
				['faq.profiles.card6.description'],
				[ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'), ql('supporters', 'https://app.xernerx.com/supporters', 'app.xernerx.com/supporters')]
			),
			c(
				'card12',
				'collectibles-badges',
				'faq.profiles.card12.title',
				['faq.profiles.card12.description'],
				[
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'),
					ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'),
				]
			),
			c(
				'card11',
				'showcases-badges',
				'faq.profiles.card11.title',
				['faq.profiles.card11.description'],
				[
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'),
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
				]
			),
			c(
				'card13',
				'profile-cosmetics',
				'faq.profiles.card13.title',
				['faq.profiles.card13.description'],
				[
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'),
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
					ql('storeConsumers', 'https://store.xernerx.com/?category=consumers', 'store.xernerx.com/?category=consumers'),
				]
			),
		],
	},
	{
		id: 'preferences',
		titleKey: 'faq.preferences.title',
		navTitleKey: 'faq.preferences.navTitle',
		sectionId: 'account',
		sectionTitleKey: 'faq.category.account',
		cards: [
			c(
				'card7',
				'appearance',
				'faq.preferences.card7.title',
				['faq.preferences.card7.description'],
				[
					ql('appearanceTab', 'https://account.xernerx.com/?tab=appearance', 'account.xernerx.com/appearance'),
					ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'),
				]
			),
			c(
				'card10',
				'stage-forms-canvas',
				'faq.preferences.card10.title',
				['faq.preferences.card10.description'],
				[
					ql('appearanceTab', 'https://account.xernerx.com/?tab=appearance', 'account.xernerx.com/appearance'),
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
				]
			),
			c(
				'card11',
				'ui-text-scaling',
				'faq.preferences.card11.title',
				['faq.preferences.card11.description'],
				[ql('appearanceTab', 'https://account.xernerx.com/?tab=appearance', 'account.xernerx.com/appearance')]
			),
			c(
				'card9',
				'preferences',
				'faq.preferences.card9.title',
				['faq.preferences.card9.description'],
				[
					ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'),
					ql('appearanceTab', 'https://account.xernerx.com/?tab=appearance', 'account.xernerx.com/appearance'),
				]
			),
			c(
				'card8',
				'notifications',
				'faq.preferences.card8.title',
				['faq.preferences.card8.description'],
				[ql('notificationPrefs', 'https://account.xernerx.com/?tab=notifications', 'account.xernerx.com/notifications'), ql('storeHub', 'https://store.xernerx.com', 'store.xernerx.com')]
			),
		],
	},
	{
		id: 'privacy',
		titleKey: 'faq.privacy.title',
		navTitleKey: 'faq.privacy.navTitle',
		sectionId: 'account',
		sectionTitleKey: 'faq.category.account',
		cards: [
			c(
				'card3',
				'privacy',
				'faq.privacy.card3.title',
				['faq.privacy.card3.description'],
				[
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'),
					ql('cdnPortal', 'https://cdn.xernerx.com', 'cdn.xernerx.com'),
					ql('hasteStudio', 'https://haste.xernerx.com', 'haste.xernerx.com'),
					ql('privacyPolicy', 'https://www.xernerx.com/privacy', 'xernerx.com/privacy'),
				]
			),
			c(
				'card4',
				'legal-policies-cookies',
				'faq.privacy.card4.title',
				['faq.privacy.card4.description'],
				[
					ql('termsPolicy', 'https://www.xernerx.com/terms', 'xernerx.com/terms'),
					ql('privacyPolicy', 'https://www.xernerx.com/privacy', 'xernerx.com/privacy'),
					ql('cookiePolicy', 'https://www.xernerx.com/cookies', 'xernerx.com/cookies'),
					ql('securityPolicy', 'https://www.xernerx.com/security', 'xernerx.com/security'),
				]
			),
			c(
				'card12',
				'personal-data-export',
				'faq.privacy.card12.title',
				['faq.privacy.card12.description'],
				[
					ql('accountSettings', 'https://account.xernerx.com/?tab=account', 'account.xernerx.com'),
					ql('activityLog', 'https://account.xernerx.com/?tab=activity', 'account.xernerx.com/activity'),
					ql('privacyPolicy', 'https://www.xernerx.com/privacy', 'xernerx.com/privacy'),
				]
			),
		],
	},
	{
		id: 'billing',
		titleKey: 'faq.billing.title',
		navTitleKey: 'faq.billing.navTitle',
		sectionId: 'billing',
		sectionTitleKey: 'faq.category.billing',
		cards: [
			c(
				'card0',
				'what-is-store',
				'faq.billing.card0.title',
				['faq.billing.card0.description'],
				[
					ql('storeHub', 'https://store.xernerx.com', 'store.xernerx.com'),
					ql('storeConsumers', 'https://store.xernerx.com/?category=consumers', 'store.xernerx.com/?category=consumers'),
					ql('storeDevelopers', 'https://store.xernerx.com/?category=developers', 'store.xernerx.com/?category=developers'),
				]
			),
			c(
				'card1',
				'store',
				'faq.billing.card1.title',
				['faq.billing.card1.description'],
				[
					ql('storeHub', 'https://store.xernerx.com', 'store.xernerx.com'),
					ql('storeConsumers', 'https://store.xernerx.com/?category=consumers', 'store.xernerx.com/?category=consumers'),
					ql('storeDevelopers', 'https://store.xernerx.com/?category=developers', 'store.xernerx.com/?category=developers'),
				]
			),
			c(
				'card9',
				'promo-codes-annual',
				'faq.billing.card9.title',
				['faq.billing.card9.description'],
				[ql('storeHub', 'https://store.xernerx.com', 'store.xernerx.com'), ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing')]
			),
			c(
				'card2',
				'subscriptions',
				'faq.billing.card2.title',
				['faq.billing.card2.description'],
				[ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'), ql('storeHub', 'https://store.xernerx.com', 'store.xernerx.com')]
			),
			c(
				'card10',
				'community-supporters',
				'faq.billing.card10.title',
				['faq.billing.card10.description'],
				[ql('supporters', 'https://app.xernerx.com/supporters', 'app.xernerx.com/supporters'), ql('storeHub', 'https://store.xernerx.com', 'store.xernerx.com')]
			),
		],
	},
	{
		id: 'credits',
		titleKey: 'faq.credits.title',
		navTitleKey: 'faq.credits.navTitle',
		sectionId: 'billing',
		sectionTitleKey: 'faq.category.billing',
		cards: [
			c(
				'card0',
				'what-are-credits',
				'faq.credits.card0.title',
				['faq.credits.card0.description'],
				[
					ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'),
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
					ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard'),
				]
			),
			c(
				'card1',
				'how-to-earn-credits',
				'faq.credits.card1.title',
				['faq.credits.card1.description'],
				[
					ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'),
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'),
					ql('issueTracker', 'https://info.xernerx.com/issues', 'info.xernerx.com/bugs'),
					ql('suggestions', 'https://info.xernerx.com/suggestions', 'info.xernerx.com/suggestions'),
				]
			),
			c(
				'card3',
				'daily-gift',
				'faq.credits.card3.title',
				['faq.credits.card3.description'],
				[ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'), ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard')]
			),
			c(
				'card9',
				'streak-shields',
				'faq.credits.card9.title',
				['faq.credits.card9.description'],
				[
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
					ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'),
				]
			),
			c(
				'card8',
				'credit-handout-algorithm',
				'faq.credits.card8.title',
				['faq.credits.card8.description1', 'faq.credits.card8.description2'],
				[
					ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'),
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
					ql('virtueSettings', 'https://app.xernerx.com/dashboard?tab=virtue', 'app.xernerx.com/dashboard?tab=virtue'),
					ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard'),
				],
				{
					bulletKeys: ['faq.credits.card8.bullet1', 'faq.credits.card8.bullet2', 'faq.credits.card8.bullet3', 'faq.credits.card8.bullet4', 'faq.credits.card8.bullet5'],
				}
			),
			c(
				'card6',
				'credit-store-perks',
				'faq.credits.card6.title',
				['faq.credits.card6.description'],
				[
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'),
					ql('appearanceTab', 'https://account.xernerx.com/?tab=appearance', 'account.xernerx.com/appearance'),
				]
			),
			c(
				'card10',
				'credit-topup-packs',
				'faq.credits.card10.title',
				['faq.credits.card10.description'],
				[
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
					ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'),
				]
			),
			c(
				'card7',
				'credit-tipping',
				'faq.credits.card7.title',
				['faq.credits.card7.description'],
				[
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'),
					ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'),
					ql('supporters', 'https://app.xernerx.com/supporters', 'app.xernerx.com/supporters'),
				]
			),
		],
	},
	{
		id: 'cdn',
		titleKey: 'faq.cdn.title',
		navTitleKey: 'faq.cdn.navTitle',
		sectionId: 'billing',
		sectionTitleKey: 'faq.category.billing',
		cards: [
			c(
				'card0',
				'what-is-media-cdn',
				'faq.cdn.card0.title',
				['faq.cdn.card0.description'],
				[
					ql('cdnPortal', 'https://cdn.xernerx.com', 'cdn.xernerx.com'),
					ql('mediaLibrary', 'https://account.xernerx.com/?tab=media', 'account.xernerx.com/media'),
					ql('cdnDocs', 'https://docs.xernerx.com/cdn', 'docs.xernerx.com/cdn'),
				]
			),
			c(
				'card4',
				'cdn',
				'faq.cdn.card4.title',
				['faq.cdn.card4.description'],
				[
					ql('cdnPortal', 'https://cdn.xernerx.com', 'cdn.xernerx.com'),
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
					ql('storeConsumers', 'https://store.xernerx.com/?category=consumers', 'store.xernerx.com/?category=consumers'),
				]
			),
			c(
				'card5',
				'cdn-cropping-folders-privacy',
				'faq.cdn.card5.title',
				['faq.cdn.card5.description'],
				[
					ql('cdnPortal', 'https://cdn.xernerx.com', 'cdn.xernerx.com'),
					ql('mediaLibrary', 'https://account.xernerx.com/?tab=media', 'account.xernerx.com/media'),
					ql('cdnDocs', 'https://docs.xernerx.com/cdn', 'docs.xernerx.com/cdn'),
				]
			),
		],
	},
	{
		id: 'developers',
		titleKey: 'faq.developers.title',
		navTitleKey: 'faq.developers.navTitle',
		sectionId: 'developers',
		sectionTitleKey: 'faq.category.developers',
		cards: [
			c(
				'card0',
				'what-is-rest-api',
				'faq.developers.card0.title',
				['faq.developers.card0.description'],
				[
					ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1'),
					ql('apiGateway', 'https://api.xernerx.com', 'api.xernerx.com'),
					ql('apiTokens', 'https://account.xernerx.com/?tab=tokens', 'account.xernerx.com/tokens'),
				]
			),
			c(
				'card1',
				'namespaces',
				'faq.developers.card1.title',
				['faq.developers.card1.description'],
				[
					ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1'),
					ql('coreApiDocs', 'https://docs.xernerx.com/api/core', 'docs.xernerx.com/api/core'),
					ql('apiTokens', 'https://account.xernerx.com/?tab=tokens', 'account.xernerx.com/tokens'),
				]
			),
			c(
				'card11',
				'bearer-tokens',
				'faq.developers.card11.title',
				['faq.developers.card11.description'],
				[
					ql('apiTokens', 'https://account.xernerx.com/?tab=tokens', 'account.xernerx.com/tokens'),
					ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1'),
					ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'),
				]
			),
			c(
				'card7',
				'tokens',
				'faq.developers.card7.title',
				['faq.developers.card7.description'],
				[ql('apiTokens', 'https://account.xernerx.com/?tab=tokens', 'account.xernerx.com/tokens'), ql('securityPolicy', 'https://www.xernerx.com/security', 'xernerx.com/security')]
			),
			c(
				'card2',
				'rate-limits',
				'faq.developers.card2.title',
				['faq.developers.card2.description'],
				[
					ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1'),
					ql('apiGateway', 'https://api.xernerx.com', 'api.xernerx.com'),
					ql('storeDevelopers', 'https://store.xernerx.com/?category=developers', 'store.xernerx.com/?category=developers'),
				]
			),
			c(
				'card12',
				'api-playground',
				'faq.developers.card12.title',
				['faq.developers.card12.description'],
				[ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1'), ql('coreApiDocs', 'https://docs.xernerx.com/api/core', 'docs.xernerx.com/api/core')]
			),
			c(
				'card10',
				'shard-capacity-limit',
				'faq.developers.card10.title',
				['faq.developers.card10.description'],
				[ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1#post-bot-stats', 'docs.xernerx.com/api/v1#post-bot-stats'), ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com')]
			),
		],
	},
	{
		id: 'webhooks',
		titleKey: 'faq.webhooks.title',
		navTitleKey: 'faq.webhooks.navTitle',
		sectionId: 'developers',
		sectionTitleKey: 'faq.category.developers',
		cards: [
			c(
				'card1',
				'webhooks',
				'faq.webhooks.card1.title',
				['faq.webhooks.card1.description'],
				[
					ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'),
					ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1'),
					ql('storeDevelopers', 'https://store.xernerx.com/?category=developers', 'store.xernerx.com/?category=developers'),
				]
			),
			c(
				'card2',
				'webhook-signatures',
				'faq.webhooks.card2.title',
				['faq.webhooks.card2.description'],
				[
					ql('npmPackagesDocs', 'https://docs.xernerx.com/packages', 'docs.xernerx.com/packages'),
					ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'),
					ql('securityPolicy', 'https://www.xernerx.com/security', 'xernerx.com/security'),
				]
			),
			c('card3', 'webhook-delivery-logs', 'faq.webhooks.card3.title', ['faq.webhooks.card3.description'], [ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com')]),
			c(
				'card4',
				'websocket',
				'faq.webhooks.card4.title',
				['faq.webhooks.card4.description'],
				[ql('websocketDocs', 'https://docs.xernerx.com/websocket', 'docs.xernerx.com/websocket'), ql('npmPackagesDocs', 'https://docs.xernerx.com/packages', 'docs.xernerx.com/packages')]
			),
		],
	},
	{
		id: 'packages',
		titleKey: 'faq.packages.title',
		navTitleKey: 'faq.packages.navTitle',
		sectionId: 'developers',
		sectionTitleKey: 'faq.category.developers',
		cards: [
			c(
				'card0',
				'official-npm-packages',
				'faq.packages.card0.title',
				['faq.packages.card0.description'],
				[ql('npmPackagesDocs', 'https://docs.xernerx.com/packages', 'docs.xernerx.com/packages'), ql('npmPackage', '/npm', '/npm', true), ql('githubOrg', '/github', '/github', true)]
			),
			c(
				'card8',
				'packages',
				'faq.packages.card8.title',
				['faq.packages.card8.description'],
				[ql('npmPackagesDocs', 'https://docs.xernerx.com/packages', 'docs.xernerx.com/packages'), ql('githubOrg', '/github', '/github', true)]
			),
			c(
				'card3',
				'widgets',
				'faq.packages.card3.title',
				['faq.packages.card3.description'],
				[
					ql('coreApiDocs', 'https://docs.xernerx.com/api/core', 'docs.xernerx.com/api/core'),
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'),
					ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'),
				]
			),
			c(
				'card4',
				'svg-status-badges',
				'faq.packages.card4.title',
				['faq.packages.card4.description'],
				[
					ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1'),
					ql('statusBadge', 'https://api.xernerx.com/v1/status/badge.svg', 'api.xernerx.com/v1/status/badge.svg', true),
				]
			),
			c('card9', 'haste-pastebin', 'faq.packages.card9.title', ['faq.packages.card9.description'], [ql('hasteStudio', 'https://haste.xernerx.com', 'haste.xernerx.com')]),
			c(
				'card10',
				'haste-api',
				'faq.packages.card10.title',
				['faq.packages.card10.description'],
				[ql('hasteStudio', 'https://haste.xernerx.com', 'haste.xernerx.com'), ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1#haste-documents', 'docs.xernerx.com/api/v1#haste-documents')]
			),
		],
	},
	{
		id: 'translations',
		titleKey: 'faq.translations.title',
		navTitleKey: 'faq.translations.navTitle',
		sectionId: 'developers',
		sectionTitleKey: 'faq.category.developers',
		cards: [
			c(
				'card0',
				'how-localization-works',
				'faq.translations.card0.title',
				['faq.translations.card0.description'],
				[
					ql('languagePrefs', 'https://account.xernerx.com/?tab=language', 'account.xernerx.com/language'),
					ql('translationStudio', 'https://admin.xernerx.com/?tab=translations', 'admin.xernerx.com/?tab=translations'),
				]
			),
			c(
				'card1',
				'translator-role',
				'faq.translations.card1.title',
				['faq.translations.card1.p1', 'faq.translations.card1.p2'],
				[
					ql('languagePrefs', 'https://account.xernerx.com/?tab=language', 'account.xernerx.com/language'),
					ql('openApplications', 'https://www.xernerx.com/applications', 'xernerx.com/careers'),
				]
			),
			c(
				'card2',
				'studio',
				'faq.translations.card2.title',
				['faq.translations.card2.description'],
				[
					ql('translationStudio', 'https://admin.xernerx.com/?tab=translations', 'admin.xernerx.com/?tab=translations'),
					ql('notificationPrefs', 'https://account.xernerx.com/?tab=notifications', 'account.xernerx.com/notifications'),
				]
			),
			c(
				'card3',
				'pipeline',
				'faq.translations.card3.title',
				['faq.translations.card3.description'],
				[ql('canaryEnv', 'https://canary.xernerx.com', 'canary.xernerx.com', true), ql('changelog', 'https://info.xernerx.com/changelog', 'info.xernerx.com/changelog')]
			),
			c(
				'card4',
				'new-languages',
				'faq.translations.card4.title',
				['faq.translations.card4.description'],
				[ql('discordSupport', '/support', '/support', true), ql('suggestions', 'https://info.xernerx.com/suggestions', 'info.xernerx.com/suggestions')]
			),
			c(
				'card5',
				'locale-sync',
				'faq.translations.card5.title',
				['faq.translations.card5.description'],
				[ql('languagePrefs', 'https://account.xernerx.com/?tab=language', 'account.xernerx.com/language'), ql('cookiePolicy', 'https://www.xernerx.com/cookies', 'xernerx.com/cookies')]
			),
		],
	},
];

export const FAQ_BLUEPRINTS: RawCategoryBlueprint[] = [...FAQ_PLATFORM_AND_COMMUNITY_BLUEPRINTS, ...FAQ_ACCOUNT_AND_DEVS_BLUEPRINTS];
