/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Explore & Vote for Top Discord Bots',
	description: 'Browse, search, and vote for top Discord bots on Xernerx Studios, including productivity, translation, moderation, and utility bots.',
	openGraph: {
		title: 'Xernerx Studios | Explore & Vote for Top Discord Bots',
		description: 'Browse, search, and vote for top Discord bots on Xernerx Studios, including productivity, translation, moderation, and utility bots.',
	},
};

export default function BotsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
