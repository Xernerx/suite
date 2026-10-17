/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'CDN Media Pipeline & Asset Streaming Guide',
	description: 'Developer documentation for the Xernerx Studios Content Delivery Network, media uploads, and raw asset streaming.',
	openGraph: {
		title: 'Xernerx Docs | CDN Media Pipeline & Asset Streaming Guide',
		description: 'Developer documentation for the Xernerx Studios Content Delivery Network, media uploads, and raw asset streaming.',
	},
};

export default function CdnDocsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
