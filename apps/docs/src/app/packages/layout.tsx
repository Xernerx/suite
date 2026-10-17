/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Open-Source NPM Packages & Frameworks',
	description: 'Browse official Xernerx Studios TypeScript packages, Discord bot frameworks, and open-source developer libraries.',
	openGraph: {
		title: 'Xernerx Docs | Open-Source NPM Packages & Frameworks',
		description: 'Browse official Xernerx Studios TypeScript packages, Discord bot frameworks, and open-source developer libraries.',
	},
};

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
