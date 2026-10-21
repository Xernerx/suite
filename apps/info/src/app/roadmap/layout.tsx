/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Product Roadmap & Upcoming Features',
	description: 'Track planned features, active development milestones, and upcoming platform releases across Xernerx Studios Discord bots and web services.',
	alternates: { canonical: '/roadmap' },
	openGraph: {
		title: 'Xernerx Support | Product Roadmap & Upcoming Features',
		description: 'Track planned features, active development milestones, and upcoming platform releases across Xernerx Studios Discord bots and web services.',
		url: 'https://info.xernerx.com/roadmap',
		siteName: 'Xernerx Support & Info',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Support — Product Roadmap' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Support | Product Roadmap & Upcoming Features',
		description: 'Track planned features, active development milestones, and upcoming platform releases across Xernerx Studios Discord bots and web services.',
		images: ['/opengraph-image'],
	},
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
	return children;
}
