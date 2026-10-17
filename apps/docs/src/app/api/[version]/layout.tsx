/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'REST API Endpoints & Authentication Reference',
	description: 'Interactive documentation for Xernerx Studios REST API endpoints, Bearer token authentication, and webhook integrations.',
	openGraph: {
		title: 'Xernerx Docs | REST API Endpoints & Authentication Reference',
		description: 'Interactive documentation for Xernerx Studios REST API endpoints, Bearer token authentication, and webhook integrations.',
	},
};

export default function ApiVersionDocsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
