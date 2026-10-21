/** @format */

import type { Metadata } from 'next';
import LeaderboardClient from '@/components/LeaderboardClient';

export const metadata: Metadata = {
	title: 'Ecosystem Leaderboards & Top Rankings',
	description: 'Explore the highest-voted Discord bots, top community servers, and longest daily user streaks across the Xernerx Studios ecosystem.',
	alternates: {
		canonical: '/leaderboard',
	},
	openGraph: {
		siteName: 'Xernerx',
		title: 'Xernerx Studios | Ecosystem Leaderboards & Top Rankings',
		description: 'Explore the highest-voted Discord bots, top community servers, and longest daily user streaks across the Xernerx Studios ecosystem.',
		url: 'https://app.xernerx.com/leaderboard',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Xernerx Leaderboards' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Ecosystem Leaderboards & Top Rankings',
		description: 'Explore the highest-voted Discord bots, top community servers, and longest daily user streaks across the Xernerx Studios ecosystem.',
		images: ['/banner.png'],
	},
};

export default function LeaderboardPage() {
	return <LeaderboardClient />;
}
