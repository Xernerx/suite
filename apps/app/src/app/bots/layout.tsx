/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Explore & Vote for Top Discord Bots',
	description: 'Browse, search, and vote for top Discord bots on Xernerx Studios, including productivity, translation, moderation, and utility bots.',
	alternates: {
		canonical: '/bots',
	},
	openGraph: {
		title: 'Xernerx Studios | Explore & Vote for Top Discord Bots',
		description: 'Browse, search, and vote for top Discord bots on Xernerx Studios, including productivity, translation, moderation, and utility bots.',
		url: 'https://app.xernerx.com/bots',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Explore Discord Bots' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Explore & Vote for Top Discord Bots',
		description: 'Browse, search, and vote for top Discord bots on Xernerx Studios, including productivity, translation, moderation, and utility bots.',
		images: ['/banner.png'],
	},
};

export default function BotsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
