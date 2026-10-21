/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Contact Support, Security & Inquiries',
	description: 'Get in touch with Xernerx Studios for general inquiries, technical support, billing questions, security disclosures, or career opportunities.',
	alternates: {
		canonical: '/contact',
	},
	openGraph: {
		title: 'Xernerx Studios | Contact Support, Security & Inquiries',
		description: 'Get in touch with Xernerx Studios for general inquiries, technical support, billing questions, security disclosures, or career opportunities.',
		url: 'https://www.xernerx.com/contact',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Contact Xernerx Studios' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Contact Support, Security & Inquiries',
		description: 'Get in touch with Xernerx Studios for general inquiries, technical support, billing questions, security disclosures, or career opportunities.',
		images: ['/banner.png'],
	},
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
	return children;
}
