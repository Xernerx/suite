/** @format */

import { type RawCategoryBlueprint, FAQ_PLATFORM_AND_COMMUNITY_BLUEPRINTS, c, ql } from './faqBlueprintsPlatform';

export type { RawCardBlueprint, RawCategoryBlueprint } from './faqBlueprintsPlatform';

const FAQ_ACCOUNT_AND_DEVS_BLUEPRINTS: RawCategoryBlueprint[] = [
	{
		id: 'account',
		titleKey: 'faq.account.title',
		navTitleKey: 'faq.account.navTitle',
		sectionId: 'accountAndDevs',
		sectionTitleKey: 'faq.category.accountAndDevs',
		cards: [
			c(
				'card1',
				'oauth-qr',
				'faq.account.card1.title',
				['faq.account.card1.description'],
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
				'card11',
				'showcases-badges',
				'faq.account.card11.title',
				['faq.account.card11.description'],
				[
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'),
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
				]
			),
			c(
				'card7',
				'appearance',
				'faq.account.card7.title',
				['faq.account.card7.description'],
				[
					ql('appearanceTab', 'https://account.xernerx.com/?tab=appearance', 'account.xernerx.com/appearance'),
					ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'),
				]
			),
			c(
				'card9',
				'preferences',
				'faq.account.card9.title',
				['faq.account.card9.description'],
				[
					ql('preferencesTab', 'https://account.xernerx.com/?tab=preferences', 'account.xernerx.com/preferences'),
					ql('appearanceTab', 'https://account.xernerx.com/?tab=appearance', 'account.xernerx.com/appearance'),
				]
			),
			c(
				'card8',
				'notifications',
				'faq.account.card8.title',
				['faq.account.card8.description'],
				[ql('notificationPrefs', 'https://account.xernerx.com/?tab=notifications', 'account.xernerx.com/notifications'), ql('storeHub', 'https://store.xernerx.com', 'store.xernerx.com')]
			),
			c(
				'card10',
				'activity-gdpr',
				'faq.account.card10.title',
				['faq.account.card10.description'],
				[
					ql('activityLog', 'https://account.xernerx.com/?tab=activity', 'account.xernerx.com/activity'),
					ql('accountSettings', 'https://account.xernerx.com/?tab=account', 'account.xernerx.com'),
					ql('privacyPolicy', 'https://www.xernerx.com/privacy', 'xernerx.com/privacy'),
				]
			),
			c(
				'card3',
				'privacy',
				'faq.account.card3.title',
				['faq.account.card3.description'],
				[
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'),
					ql('accountSettings', 'https://account.xernerx.com/?tab=account', 'account.xernerx.com'),
					ql('termsPolicy', 'https://www.xernerx.com/terms', 'xernerx.com/terms'),
				]
			),
			c(
				'card12',
				'personal-data-export',
				'faq.account.card12.title',
				['faq.account.card12.description'],
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
		sectionId: 'accountAndDevs',
		sectionTitleKey: 'faq.category.accountAndDevs',
		cards: [
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
				'card3',
				'daily-gift',
				'faq.billing.card3.title',
				['faq.billing.card3.description'],
				[
					ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'),
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
					ql('leaderboards', 'https://app.xernerx.com/leaderboard', 'app.xernerx.com/leaderboard'),
					ql('supporters', 'https://app.xernerx.com/supporters', 'app.xernerx.com/supporters'),
				]
			),
			c(
				'card6',
				'credit-store-perks',
				'faq.billing.card6.title',
				['faq.billing.card6.description'],
				[
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
					ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'),
					ql('profileSettings', 'https://account.xernerx.com/?tab=profile', 'account.xernerx.com/profile'),
				]
			),
			c(
				'card7',
				'credit-tipping',
				'faq.billing.card7.title',
				['faq.billing.card7.description'],
				[
					ql('creditStore', 'https://store.xernerx.com/?category=credits', 'store.xernerx.com/?category=credits'),
					ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'),
					ql('exploreBots', 'https://app.xernerx.com/bots', 'app.xernerx.com/bots'),
					ql('supporters', 'https://app.xernerx.com/supporters', 'app.xernerx.com/supporters'),
				]
			),
			c(
				'card2',
				'subscriptions',
				'faq.billing.card2.title',
				['faq.billing.card2.description'],
				[ql('billingTab', 'https://account.xernerx.com/?tab=billing', 'account.xernerx.com/billing'), ql('storeHub', 'https://store.xernerx.com', 'store.xernerx.com')]
			),
			c(
				'card4',
				'cdn',
				'faq.billing.card4.title',
				['faq.billing.card4.description'],
				[
					ql('cdnPortal', 'https://cdn.xernerx.com', 'cdn.xernerx.com'),
					ql('mediaLibrary', 'https://account.xernerx.com/?tab=media', 'account.xernerx.com/media'),
					ql('cdnDocs', 'https://docs.xernerx.com/cdn', 'docs.xernerx.com/cdn'),
				]
			),
			c(
				'card5',
				'careers',
				'faq.billing.card5.title',
				['faq.billing.card5.description'],
				[
					ql('openApplications', 'https://www.xernerx.com/applications', 'xernerx.com/careers • /jobs'),
					ql('notificationPrefs', 'https://account.xernerx.com/?tab=notifications', 'account.xernerx.com/notifications'),
				]
			),
		],
	},
	{
		id: 'developers',
		titleKey: 'faq.developers.title',
		navTitleKey: 'faq.developers.navTitle',
		sectionId: 'accountAndDevs',
		sectionTitleKey: 'faq.category.accountAndDevs',
		cards: [
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
				'card7',
				'tokens',
				'faq.developers.card7.title',
				['faq.developers.card7.description'],
				[ql('apiTokens', 'https://account.xernerx.com/?tab=tokens', 'account.xernerx.com/tokens'), ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1')]
			),
			c(
				'card3',
				'widgets',
				'faq.developers.card3.title',
				['faq.developers.card3.description'],
				[
					ql('coreApiDocs', 'https://docs.xernerx.com/api/core', 'docs.xernerx.com/api/core'),
					ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1'),
					ql('statusBadge', 'https://api.xernerx.com/v1/status/badge.svg', 'api.xernerx.com/v1/status/badge.svg', true),
				]
			),
			c(
				'card8',
				'packages',
				'faq.developers.card8.title',
				['faq.developers.card8.description'],
				[ql('npmPackagesDocs', 'https://docs.xernerx.com/packages', 'docs.xernerx.com/packages'), ql('npmPackage', '/npm', '/npm', true), ql('githubOrg', '/github', '/github', true)]
			),
			c(
				'card4',
				'webhooks',
				'faq.developers.card4.title',
				['faq.developers.card4.description'],
				[ql('devPortal', 'https://portal.xernerx.com', 'portal.xernerx.com'), ql('v1ApiDocs', 'https://docs.xernerx.com/api/v1', 'docs.xernerx.com/api/v1')]
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
		],
	},
	{
		id: 'translations',
		titleKey: 'faq.translations.title',
		navTitleKey: 'common.nav.items.translations',
		sectionId: 'accountAndDevs',
		sectionTitleKey: 'faq.category.accountAndDevs',
		cards: [
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
