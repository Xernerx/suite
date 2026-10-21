/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'REST API Endpoints & Authentication Reference',
	description: 'Interactive documentation for Xernerx Studios REST API endpoints, Bearer token authentication, request schemas, and Discord/Stripe webhook integrations.',
	alternates: { canonical: '/api/v1' },
	openGraph: {
		title: 'Xernerx Docs | REST API Endpoints & Authentication Reference',
		description: 'Interactive documentation for Xernerx Studios REST API endpoints, Bearer token authentication, request schemas, and Discord/Stripe webhook integrations.',
		url: 'https://docs.xernerx.com/api/v1',
		siteName: 'Xernerx Docs',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Docs — REST API Reference' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Docs | REST API Endpoints & Authentication Reference',
		description: 'Interactive documentation for Xernerx Studios REST API endpoints, Bearer token authentication, request schemas, and Discord/Stripe webhook integrations.',
		images: ['/opengraph-image'],
	},
};

export default function ApiVersionDocsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
