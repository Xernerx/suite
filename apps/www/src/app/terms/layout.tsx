/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Terms of Service & Platform Rules',
	description: 'Review the official Xernerx Studios Terms of Service governing the use of our web applications, Discord bots, APIs, and developer tools.',
	alternates: {
		canonical: '/terms',
	},
	openGraph: {
		title: 'Xernerx Studios | Terms of Service & Platform Rules',
		description: 'Review the official Xernerx Studios Terms of Service governing the use of our web applications, Discord bots, APIs, and developer tools.',
		url: 'https://www.xernerx.com/terms',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Xernerx Terms of Service' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Terms of Service & Platform Rules',
		description: 'Review the official Xernerx Studios Terms of Service governing the use of our web applications, Discord bots, APIs, and developer tools.',
		images: ['/banner.png'],
	},
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
