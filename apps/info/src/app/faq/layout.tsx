/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Frequently Asked Questions & Help Guides',
	description: 'Find answers to common questions about Xernerx Studios Discord bots, server configurations, localization, billing, and platform features.',
	alternates: { canonical: '/faq' },
	openGraph: {
		title: 'Xernerx Support | Frequently Asked Questions & Help Guides',
		description: 'Find answers to common questions about Xernerx Studios Discord bots, server configurations, localization, billing, and platform features.',
		url: 'https://info.xernerx.com/faq',
		siteName: 'Xernerx Support & Info',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Support — FAQ & Help Guides' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Support | Frequently Asked Questions & Help Guides',
		description: 'Find answers to common questions about Xernerx Studios Discord bots, server configurations, localization, billing, and platform features.',
		images: ['/opengraph-image'],
	},
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
	return children;
}
