/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Download Official Desktop Companion App',
	description: 'Download the official Xernerx Studios desktop companion application for Windows, macOS, and Linux with Discord Rich Presence and live overlays.',
	alternates: {
		canonical: '/download',
	},
	openGraph: {
		title: 'Xernerx Studios | Download Official Desktop Companion App',
		description: 'Download the official Xernerx Studios desktop companion application for Windows, macOS, and Linux with Discord Rich Presence and live overlays.',
		url: 'https://www.xernerx.com/download',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Xernerx Desktop App' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Download Official Desktop Companion App',
		description: 'Download the official Xernerx Studios desktop companion application for Windows, macOS, and Linux with Discord Rich Presence and live overlays.',
		images: ['/banner.png'],
	},
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
	return children;
}
