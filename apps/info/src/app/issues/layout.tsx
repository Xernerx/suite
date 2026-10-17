/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Bug Reports & Issue Tracker',
	description: 'Report bugs, track open technical issues, and view resolution progress across Xernerx Studios applications and Discord bots.',
	openGraph: {
		title: 'Xernerx Support | Bug Reports & Issue Tracker',
		description: 'Report bugs, track open technical issues, and view resolution progress across Xernerx Studios applications and Discord bots.',
	},
};

export default function IssuesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
