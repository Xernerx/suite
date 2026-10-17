/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Download Xernerx App',
	description: 'Download the official Xernerx Studios desktop companion application for Windows, macOS, and Linux.',
	openGraph: {
		title: 'Xernerx Studios | Download Xernerx App',
		description: 'Download the official Xernerx Studios desktop companion application for Windows, macOS, and Linux.',
	},
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
	return children;
}
