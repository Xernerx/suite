/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Careers & Open Team Applications',
	description: 'Apply to join the Xernerx Studios engineering, moderation, and translation teams to help build modern Discord bots, developer tools, and cloud services.',
	alternates: {
		canonical: '/applications',
	},
	openGraph: {
		title: 'Xernerx Studios | Careers & Open Team Applications',
		description: 'Apply to join the Xernerx Studios engineering, moderation, and translation teams to help build modern Discord bots, developer tools, and cloud services.',
		url: 'https://www.xernerx.com/applications',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Xernerx Careers' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Careers & Open Team Applications',
		description: 'Apply to join the Xernerx Studios engineering, moderation, and translation teams to help build modern Discord bots, developer tools, and cloud services.',
		images: ['/banner.png'],
	},
};

export default function ApplicationsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
