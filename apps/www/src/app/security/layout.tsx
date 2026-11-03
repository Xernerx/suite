/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Platform & Discord Bot Security Architecture',
	description: 'Learn how Xernerx Studios secures the Xernerx Suite monorepo, API gateway, and official Discord bots including Virtue, To-Do List Bot, Metamorphosis, and Zodiac.',
	alternates: {
		canonical: '/security',
	},
	openGraph: {
		title: 'Xernerx Studios | Platform & Discord Bot Security Architecture',
		description: 'Learn how Xernerx Studios secures the Xernerx Suite monorepo, API gateway, and official Discord bots including Virtue, To-Do List Bot, Metamorphosis, and Zodiac.',
		url: 'https://www.xernerx.com/security',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Xernerx Security Architecture' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Platform & Discord Bot Security Architecture',
		description: 'Learn how Xernerx Studios secures the Xernerx Suite monorepo, API gateway, and official Discord bots including Virtue, To-Do List Bot, Metamorphosis, and Zodiac.',
		images: ['/banner.png'],
	},
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
	return children;
}
