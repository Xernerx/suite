/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Internal Developer Policy',
	description: 'Confidentiality, credential security, production data ethics, intellectual property, and operational governance for internal Xernerx Studios developers and staff.',
	alternates: {
		canonical: '/developer-policy',
	},
	openGraph: {
		title: 'Xernerx Studios | Internal Developer Policy',
		description: 'Confidentiality, credential security, production data ethics, intellectual property, and operational governance for internal Xernerx Studios developers and staff.',
		url: 'https://www.xernerx.com/developer-policy',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Xernerx Studios Internal Developer Policy' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Internal Developer Policy',
		description: 'Confidentiality, credential security, production data ethics, intellectual property, and operational governance for internal Xernerx Studios developers and staff.',
		images: ['/banner.png'],
	},
};

export default function DeveloperPolicyLayout({ children }: { children: React.ReactNode }) {
	return children;
}
