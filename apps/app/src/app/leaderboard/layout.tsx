/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Ecosystem Leaderboards — Top Discord Bots, Servers & Daily Streaks',
	description: 'Explore live rankings of the highest-voted Discord bots, largest public Discord servers, and longest daily user streaks across the Xernerx Studios ecosystem.',
	keywords: ['Xernerx', 'Discord leaderboard', 'top Discord bots', 'top Discord servers', 'daily streaks', 'Virtue XP', 'bot rankings'],
	alternates: {
		canonical: '/leaderboard',
	},
	openGraph: {
		title: 'Xernerx Studios | Ecosystem Leaderboards — Bots, Servers & Streaks',
		description: 'Explore live rankings of the highest-voted Discord bots, largest public Discord servers, and longest daily user streaks across the Xernerx Studios ecosystem.',
		url: 'https://app.xernerx.com/leaderboard',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Xernerx Ecosystem Leaderboards' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Ecosystem Leaderboards — Bots, Servers & Streaks',
		description: 'Explore live rankings of the highest-voted Discord bots, largest public Discord servers, and longest daily user streaks across the Xernerx Studios ecosystem.',
		images: ['/banner.png'],
	},
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
	return children;
}
