/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Xernerx Studios | Dashboard',
	description: 'Manage your Xernerx applications, tokens, and settings. Access platform tools and infrastructure from a unified dashboard.',
	openGraph: {
		title: 'Xernerx Studios | Dashboard',
		description: 'Access the Xernerx dashboard to manage applications, API tokens, and platform configuration.',
		url: 'https://app.xernerx.com/dashboard',
		siteName: 'Xernerx',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Xernerx Dashboard',
			},
		],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Dashboard',
		description: 'Manage your Xernerx tools, tokens, and applications in one place.',
		images: ['/banner.png'],
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
