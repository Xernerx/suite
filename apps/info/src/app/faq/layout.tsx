/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Frequently Asked Questions & Help Guides',
	description: 'Find answers to common questions about Xernerx Studios Discord bots, server configurations, localization, billing, and platform features.',
	alternates: { canonical: '/faq' },
	openGraph: {
		title: 'Xernerx Support | Frequently Asked Questions & Help Guides',
		description: 'Find answers to common questions about Xernerx Studios Discord bots, server configurations, localization, billing, and platform features.',
		url: 'https://info.xernerx.com/faq',
		siteName: 'Xernerx Support & Info',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Support — FAQ & Help Guides' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Support | Frequently Asked Questions & Help Guides',
		description: 'Find answers to common questions about Xernerx Studios Discord bots, server configurations, localization, billing, and platform features.',
		images: ['/opengraph-image'],
	},
};

const faqStructuredData = {
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	mainEntity: [
		{
			'@type': 'Question',
			name: 'How is the Xernerx Suite organized across its subdomains?',
			acceptedAnswer: {
				'@type': 'Answer',
				text: 'The Xernerx Suite is a unified ecosystem where a single Discord sign-in carries across xernerx.com (Marketing & Security), app.xernerx.com (Bot & Server Directory, Virtue Dashboard, Leaderboards), account.xernerx.com (Identity, Preferences, API Tokens, Billing), store.xernerx.com (Ultra Ecosystem & Bot Passes), docs.xernerx.com (v1 REST API, WebSocket & NPM Package Docs), info.xernerx.com (Status, Roadmap, Suggestions, Issues, Changelog, FAQ), blog.xernerx.com (Official Newsroom), and cdn.xernerx.com (Media CDN).',
			},
		},
		{
			'@type': 'Question',
			name: 'How does the Virtue Progression System work on Discord servers?',
			acceptedAnswer: {
				'@type': 'Answer',
				text: 'Virtue tracks per-server text XP/levels/messages (without ever storing raw message text) and voice XP/levels/duration alongside each user’s Global Xernerx Level. Server administrators can configure XP curve difficulty (Easy, Casual, Balanced, Hard, Extreme), Daily/Weekly/Monthly reset cycles, Server Booster multipliers, and level-up role rewards across Unified Server, Text, or Voice tracks at app.xernerx.com/dashboard?tab=virtue.',
			},
		},
		{
			'@type': 'Question',
			name: 'How do Public, Limited, and Private privacy tiers work across Xernerx?',
			acceptedAnswer: {
				'@type': 'Answer',
				text: 'Every User, Bot, Server, Organization, CDN Media item, and Blog Article enforces our Universal 3-Tier Privacy Truth: Public (listed in public directories, leaderboards, and search; accessible by anyone), Limited (unlisted—never shown in public directories or search, but accessible via direct link or ID), and Private (strictly owner-only—never listed and blocked from viewing even with a direct link).',
			},
		},
		{
			'@type': 'Question',
			name: 'How do I export my GDPR JSON data, opt out of Automatic Service Profiles, or delete my Virtue data?',
			acceptedAnswer: {
				'@type': 'Answer',
				text: 'Sign in at account.xernerx.com to download a machine-readable JSON archive of your account, toggle off Automatic Service Profiles (services: false) so Discord messages do not automatically create a Xernerx or Virtue profile, click Delete Virtue Data to permanently erase your Virtue XP and levels across all servers, or delete your account.',
			},
		},
	],
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
			{children}
		</>
	);
}
