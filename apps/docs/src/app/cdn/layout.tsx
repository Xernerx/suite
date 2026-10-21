/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'CDN Media Pipeline & Asset Streaming Guide',
	description: 'Developer documentation for the Xernerx Studios Content Delivery Network, authenticated media uploads, private storage, and raw asset streaming.',
	alternates: { canonical: '/cdn' },
	openGraph: {
		title: 'Xernerx Docs | CDN Media Pipeline & Asset Streaming Guide',
		description: 'Developer documentation for the Xernerx Studios Content Delivery Network, authenticated media uploads, private storage, and raw asset streaming.',
		url: 'https://docs.xernerx.com/cdn',
		siteName: 'Xernerx Docs',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Docs — CDN Media Pipeline' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Docs | CDN Media Pipeline & Asset Streaming Guide',
		description: 'Developer documentation for the Xernerx Studios Content Delivery Network, authenticated media uploads, private storage, and raw asset streaming.',
		images: ['/opengraph-image'],
	},
};

export default function CdnDocsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
