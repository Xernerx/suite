/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Community Feature Suggestions & Voting',
	description: 'Submit new feature ideas, discuss improvements, and vote on community suggestions for Xernerx Studios Discord bots and web applications.',
	alternates: { canonical: '/suggestions' },
	openGraph: {
		title: 'Xernerx Support | Community Feature Suggestions & Voting',
		description: 'Submit new feature ideas, discuss improvements, and vote on community suggestions for Xernerx Studios Discord bots and web applications.',
		url: 'https://info.xernerx.com/suggestions',
		siteName: 'Xernerx Support & Info',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Support — Feature Suggestions' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Support | Community Feature Suggestions & Voting',
		description: 'Submit new feature ideas, discuss improvements, and vote on community suggestions for Xernerx Studios Discord bots and web applications.',
		images: ['/opengraph-image'],
	},
};

export default function SuggestionsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
