/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Unified Platform Changelog & Release Notes',
	description: 'Browse versioned release notes, new features, security updates, and SDK improvements across all Xernerx Suite applications and open-source NPM packages.',
	alternates: { canonical: '/changelog' },
	openGraph: {
		title: 'Xernerx Support | Unified Platform Changelog & Release Notes',
		description: 'Browse versioned release notes, new features, security updates, and SDK improvements across all Xernerx Suite applications and open-source NPM packages.',
		url: 'https://info.xernerx.com/changelog',
		siteName: 'Xernerx Support & Info',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Unified Changelog' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Support | Unified Platform Changelog & Release Notes',
		description: 'Browse versioned release notes, new features, security updates, and SDK improvements across all Xernerx Suite applications and open-source NPM packages.',
		images: ['/opengraph-image'],
	},
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
	return children;
}
