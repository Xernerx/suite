/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Cookie Policy & Storage Preferences',
	description: 'Learn how Xernerx Studios uses essential, functional, and analytics cookies to secure sessions and personalize your platform experience.',
	alternates: {
		canonical: '/cookies',
	},
	openGraph: {
		title: 'Xernerx Studios | Cookie Policy & Storage Preferences',
		description: 'Learn how Xernerx Studios uses essential, functional, and analytics cookies to secure sessions and personalize your platform experience.',
		url: 'https://www.xernerx.com/cookies',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Xernerx Cookie Policy' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Cookie Policy & Storage Preferences',
		description: 'Learn how Xernerx Studios uses essential, functional, and analytics cookies to secure sessions and personalize your platform experience.',
		images: ['/banner.png'],
	},
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
