/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Explore & Join Public Discord Servers',
	description: 'Discover, vote for, and join vibrant Discord communities and verified public servers across the Xernerx Studios global directory.',
	alternates: {
		canonical: '/servers',
	},
	openGraph: {
		title: 'Xernerx Studios | Explore & Join Public Discord Servers',
		description: 'Discover, vote for, and join vibrant Discord communities and verified public servers across the Xernerx Studios global directory.',
		url: 'https://app.xernerx.com/servers',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Explore Discord Servers' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Explore & Join Public Discord Servers',
		description: 'Discover, vote for, and join vibrant Discord communities and verified public servers across the Xernerx Studios global directory.',
		images: ['/banner.png'],
	},
};

export default function ServersLayout({ children }: { children: React.ReactNode }) {
	return children;
}
