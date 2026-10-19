/** @format */

import type { Metadata } from 'next';
import LeaderboardClient from '@/components/LeaderboardClient';

export const metadata: Metadata = {
	title: 'Ecosystem Leaderboards',
	description: 'Explore the highest-voted Discord bots, top community servers, and longest daily streaks across the Xernerx ecosystem.',
	openGraph: {
		siteName: 'Xernerx Studios',
		title: 'Ecosystem Leaderboards | Xernerx Studios',
		description: 'Explore the highest-voted Discord bots, top community servers, and longest daily streaks across the Xernerx ecosystem.',
	},
};

export default function LeaderboardPage() {
	return <LeaderboardClient />;
}
