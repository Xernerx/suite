/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Open-Source NPM Packages & Frameworks',
	description: 'Browse official Xernerx Studios TypeScript packages, Discord bot frameworks, and open-source developer libraries with versioned API documentation.',
	alternates: { canonical: '/packages' },
	openGraph: {
		title: 'Xernerx Docs | Open-Source NPM Packages & Frameworks',
		description: 'Browse official Xernerx Studios TypeScript packages, Discord bot frameworks, and open-source developer libraries with versioned API documentation.',
		url: 'https://docs.xernerx.com/packages',
		siteName: 'Xernerx Docs',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Docs — NPM Packages & Frameworks' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Docs | Open-Source NPM Packages & Frameworks',
		description: 'Browse official Xernerx Studios TypeScript packages, Discord bot frameworks, and open-source developer libraries with versioned API documentation.',
		images: ['/opengraph-image'],
	},
};

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
