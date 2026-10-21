/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Bug Reports & Technical Issue Tracker',
	description: 'Report bugs, track open technical issues, and view engineering resolution progress across Xernerx Studios web applications and Discord bots.',
	alternates: { canonical: '/issues' },
	openGraph: {
		title: 'Xernerx Support | Bug Reports & Technical Issue Tracker',
		description: 'Report bugs, track open technical issues, and view engineering resolution progress across Xernerx Studios web applications and Discord bots.',
		url: 'https://info.xernerx.com/issues',
		siteName: 'Xernerx Support & Info',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Support — Bug Reports & Issue Tracker' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Support | Bug Reports & Technical Issue Tracker',
		description: 'Report bugs, track open technical issues, and view engineering resolution progress across Xernerx Studios web applications and Discord bots.',
		images: ['/opengraph-image'],
	},
};

export default function IssuesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
