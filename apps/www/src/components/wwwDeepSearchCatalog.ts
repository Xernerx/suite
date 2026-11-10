/** @format */

import type { ShowcasePackage } from './HomeClient';

export type WwwSearchCategory = 'pages' | 'bots' | 'docs' | 'faq' | 'careers';

export interface WwwSearchResult {
	id: string;
	category: WwwSearchCategory;
	title: string;
	description: string;
	subLabel?: string;
	keywords?: string;
	href: string;
	external?: boolean;
}

export function matchesTokens(haystack: string, rawQuery: string): boolean {
	const tokens = rawQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return false;
	const lower = haystack.toLowerCase();
	return tokens.every((tok) => lower.includes(tok));
}

export function buildWwwStaticSearchEntries(params: {
	t: (path: string, variables?: Record<string, string | number>) => string;
	getEnvUrl: (baseUrl: string) => string;
	packages: ShowcasePackage[];
}): WwwSearchResult[] {
	const { t, getEnvUrl, packages } = params;

	const pageEntries: WwwSearchResult[] = [
		{
			id: 'page-download',
			category: 'pages',
			title: t('www.cta.download'),
			description: t('www.services.dashboard.desc'),
			subLabel: 'xernerx.com/download',
			keywords: 'download desktop app electron windows macos linux companion overlay',
			href: '/download',
		},
		{
			id: 'page-invites',
			category: 'pages',
			title: t('www.hero.links.invites'),
			description: 'Official Discord invite links (Essential, Optional, and Advanced 0-Permission presets) for Virtue, Zodiac, Metamorphosis, and To-Do List Bot.',
			subLabel: 'xernerx.com/invites',
			keywords: 'invites discord bots servers join add virtue zodiac metamorphosis todo essential optional advanced 0 permissions oauth2',
			href: '/invites',
		},
		{
			id: 'page-careers',
			category: 'careers',
			title: t('www.hero.links.careers'),
			description: 'Apply for open developer, moderator, and translator positions at Xernerx Studios.',
			subLabel: 'xernerx.com/applications',
			keywords: 'careers jobs applications roles staff developer moderator translator',
			href: '/applications',
		},
		{
			id: 'page-contact',
			category: 'pages',
			title: t('www.hero.links.contact'),
			description: 'Get in touch with our engineering and community support teams.',
			subLabel: 'xernerx.com/contact',
			keywords: 'contact support email discord help',
			href: '/contact',
		},
		{
			id: 'page-terms',
			category: 'pages',
			title: 'Terms of Service',
			description: 'Platform rules, acceptable use, and legal terms of service.',
			subLabel: 'xernerx.com/terms',
			keywords: 'terms of service tos legal policy rules',
			href: '/terms',
		},
		{
			id: 'page-blog',
			category: 'pages',
			title: 'Xernerx Blog & Announcements',
			description: 'Official product announcements, platform security advisories, engineering deep-dives, and RSS feed.',
			subLabel: 'blog.xernerx.com',
			keywords: 'blog news announcements articles security advisories engineering devlog updates rss feed',
			href: getEnvUrl('https://blog.xernerx.com'),
			external: true,
		},
		{
			id: 'social-x',
			category: 'pages',
			title: 'Xernerx Studios on X (Twitter)',
			description: 'Follow @XernerxStudios on X for release announcements, status updates, and developer highlights.',
			subLabel: 'x.com/XernerxStudios',
			keywords: 'x twitter social media follow @xernerxstudios updates announcements',
			href: 'https://x.com/XernerxStudios',
			external: true,
		},
		{
			id: 'social-bluesky',
			category: 'pages',
			title: 'Xernerx Studios on Bluesky',
			description: 'Follow @xernerx.com on Bluesky for open-source TypeScript SDK updates and ecosystem news.',
			subLabel: 'bsky.app/profile/xernerx.com',
			keywords: 'bluesky bsky social media follow @xernerx.com updates announcements',
			href: 'https://bsky.app/profile/xernerx.com',
			external: true,
		},
		{
			id: 'social-instagram',
			category: 'pages',
			title: 'Xernerx Studios on Instagram',
			description: 'Follow @xernerxstudios on Instagram for visual feature showcases, Discord bot previews, and studio updates.',
			subLabel: 'instagram.com/xernerxstudios',
			keywords: 'instagram ig social media follow @xernerxstudios reels showcases',
			href: 'https://www.instagram.com/xernerxstudios/',
			external: true,
		},
		{
			id: 'page-security',
			category: 'pages',
			title: t('www.security.header.title'),
			description: t('www.security.header.subtitle'),
			subLabel: 'xernerx.com/security',
			keywords: 'security architecture encryption tokens webhooks virtue todo metamorphosis zodiac data minimization 3-tier privacy',
			href: '/security',
		},
		{
			id: 'page-license',
			category: 'pages',
			title: t('www.license.header.title'),
			description: t('www.license.header.subtitle'),
			subLabel: 'xernerx.com/license',
			keywords: 'license proprietary saas apache-2.0 open source sdk copyright trademarks legal',
			href: '/license',
		},
		{
			id: 'page-privacy',
			category: 'pages',
			title: t('www.privacy.header.title'),
			description: 'Data protection, 3-tier privacy truth, GDPR data export, and data retention.',
			subLabel: 'xernerx.com/privacy',
			keywords: 'privacy policy gdpr ccpa data protection public limited private',
			href: '/privacy',
		},
		{
			id: 'page-cookies',
			category: 'pages',
			title: t('www.cookies.header.title'),
			description: 'First-party session cookies, localStorage preference keys, Desktop session partitions, and consent controls.',
			subLabel: 'xernerx.com/cookies',
			keywords: 'cookies policy localstorage session partition consent preferences tracking',
			href: '/cookies',
		},
		{
			id: 'page-app-dashboard',
			category: 'pages',
			title: t('www.services.dashboard.title'),
			description: t('www.services.dashboard.desc'),
			subLabel: 'app.xernerx.com',
			keywords: 'dashboard explore bots servers leaderboard virtue overlay',
			href: getEnvUrl('https://app.xernerx.com'),
			external: true,
		},
		{
			id: 'page-compare',
			category: 'pages',
			title: 'Compare Bots & Servers Studio',
			description: 'Compare up to 4 Discord bots or community servers side-by-side across stats, features, and verification.',
			subLabel: 'app.xernerx.com/compare',
			keywords: 'compare vs comparison side by side bots servers stats metrics',
			href: getEnvUrl('https://app.xernerx.com/compare'),
			external: true,
		},
		{
			id: 'page-portal',
			category: 'pages',
			title: 'Developer Portal & Organizations',
			description: 'Manage your Discord bots, organizations, releases, slash commands, and webhooks.',
			subLabel: 'portal.xernerx.com',
			keywords: 'portal developer bots organizations webhooks releases commands shard capacity 2500',
			href: getEnvUrl('https://portal.xernerx.com'),
			external: true,
		},
		{
			id: 'page-account',
			category: 'pages',
			title: t('www.highlights.personalization.title'),
			description: t('www.highlights.personalization.description'),
			subLabel: 'account.xernerx.com',
			keywords:
				'account profile appearance theme accent dot matrix studio cosmetics avatar frame nameplate card theme stage render constellation hexgrid aurora glyphs ambient scene cursor fx shockwave icon pack window controls showcases badges credits tokens media',
			href: getEnvUrl('https://account.xernerx.com'),
			external: true,
		},
		{
			id: 'page-store',
			category: 'pages',
			title: 'Xernerx Store & Credit Cosmetics Vault',
			description: 'Ultra Ecosystem bundle, individual bot passes, Developer Pro API, and Credit Store cosmetics & slots.',
			subLabel: 'store.xernerx.com',
			keywords:
				'store billing subscriptions ultra credits perks cdn slots showcases vanity url badges stage render constellation hexgrid aurora glyphs ambient scene glass surface cursor fx shockwave icon pack avatar frame nameplate card theme overlay skin bundle',
			href: getEnvUrl('https://store.xernerx.com'),
			external: true,
		},
		{
			id: 'page-info',
			category: 'faq',
			title: 'Support, Roadmap, Issues & Status Hub',
			description: t('www.highlights.roadmap.description'),
			subLabel: 'info.xernerx.com',
			keywords: 'info support status roadmap suggestions issues bugs faq changelog',
			href: getEnvUrl('https://info.xernerx.com'),
			external: true,
		},
	];

	const officialBots: WwwSearchResult[] = (
		[
			['virtue', 'virtue leveling xp voice progression roles leaderboard discord bot'],
			['todo', 'todo list bot tasks boards productivity discord'],
			['zodiac', 'zodiac astrology horoscopes discord bot'],
			['metamorphosis', 'metamorphosis logging moderation discord bot'],
		] as const
	).map(([slug, keywords]) => ({
		id: `bot-${slug}`,
		category: 'bots',
		title: t(`www.applications.${slug}.title`),
		description: t(`www.applications.${slug}.desc`),
		subLabel: t('www.tags.discordBot'),
		keywords,
		href: getEnvUrl(`https://app.xernerx.com/bots/${slug}`),
		external: true,
	}));

	const packageEntries: WwwSearchResult[] = packages.map((pkg) => ({
		id: `pkg-${pkg.name}`,
		category: 'docs',
		title: pkg.name,
		description: pkg.desc || t('www.software.packageDesc', { name: pkg.name }),
		subLabel: t('www.software.npmPackageTag'),
		keywords: `npm package sdk library ${pkg.name}`,
		href: getEnvUrl(pkg.link),
		external: true,
	}));

	return [...pageEntries, ...officialBots, ...packageEntries];
}
