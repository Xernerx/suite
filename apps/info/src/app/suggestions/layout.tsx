/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Community Feature Suggestions & Voting',
	description: 'Submit new feature ideas and vote on community suggestions for Xernerx Studios Discord bots and web applications.',
	openGraph: {
		title: 'Xernerx Support | Community Feature Suggestions & Voting',
		description: 'Submit new feature ideas and vote on community suggestions for Xernerx Studios Discord bots and web applications.',
	},
};

export default function SuggestionsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
