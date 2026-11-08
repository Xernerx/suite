/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Software & Ecosystem License',
	description: 'Read the official Xernerx Studios Proprietary & SaaS License and learn how our Apache-2.0 open-source TypeScript SDKs are licensed.',
	alternates: {
		canonical: '/license',
	},
	openGraph: {
		title: 'Xernerx Studios | Software & Ecosystem License',
		description: 'Read the official Xernerx Studios Proprietary & SaaS License and learn how our Apache-2.0 open-source TypeScript SDKs are licensed.',
		url: 'https://www.xernerx.com/license',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Xernerx Studios License' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Software & Ecosystem License',
		description: 'Read the official Xernerx Studios Proprietary & SaaS License and learn how our Apache-2.0 open-source TypeScript SDKs are licensed.',
		images: ['/banner.png'],
	},
};

export default function LicenseLayout({ children }: { children: React.ReactNode }) {
	return children;
}
