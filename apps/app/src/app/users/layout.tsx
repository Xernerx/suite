/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Explore Public User Profiles & Bot Creators',
	description: 'Discover public user profiles, Discord bot developers, community leaders, and top contributors across the Xernerx Studios ecosystem.',
	keywords: ['Xernerx', 'Discord users', 'bot developers', 'creator profiles', 'community directory'],
	alternates: {
		canonical: '/users',
	},
	openGraph: {
		title: 'Xernerx Studios | Explore Public User Profiles & Bot Creators',
		description: 'Discover public user profiles, Discord bot developers, community leaders, and top contributors across the Xernerx Studios ecosystem.',
		url: 'https://app.xernerx.com/users',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Explore Xernerx Users' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Explore Public User Profiles & Bot Creators',
		description: 'Discover public user profiles, Discord bot developers, community leaders, and top contributors across the Xernerx Studios ecosystem.',
		images: ['/banner.png'],
	},
};

export default function UsersDirectoryLayout({ children }: { children: React.ReactNode }) {
	return children;
}
