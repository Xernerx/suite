/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Privacy Policy & Data Protection',
	description: 'Read the Xernerx Studios Privacy Policy to learn how we collect, protect, and process account, Discord bot, and platform usage data.',
	alternates: {
		canonical: '/privacy',
	},
	openGraph: {
		title: 'Xernerx Studios | Privacy Policy & Data Protection',
		description: 'Read the Xernerx Studios Privacy Policy to learn how we collect, protect, and process account, Discord bot, and platform usage data.',
		url: 'https://www.xernerx.com/privacy',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Xernerx Privacy Policy' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Privacy Policy & Data Protection',
		description: 'Read the Xernerx Studios Privacy Policy to learn how we collect, protect, and process account, Discord bot, and platform usage data.',
		images: ['/banner.png'],
	},
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
	return children;
}
