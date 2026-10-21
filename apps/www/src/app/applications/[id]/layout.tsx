/** @format */

import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	const canonicalPath = `/applications/${id}`;
	return {
		title: 'Position Application & Team Roles',
		description: 'Complete and submit your application to join the Xernerx Studios engineering, moderation, translation, or community support team.',
		alternates: { canonical: canonicalPath },
		openGraph: {
			title: 'Xernerx Studios | Position Application & Team Roles',
			description: 'Complete and submit your application to join the Xernerx Studios engineering, moderation, translation, or community support team.',
			url: `https://www.xernerx.com${canonicalPath}`,
			siteName: 'Xernerx Studios',
			images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Studios Careers & Applications' }],
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: 'Xernerx Studios | Position Application & Team Roles',
			description: 'Complete and submit your application to join the Xernerx Studios engineering, moderation, translation, or community support team.',
			images: ['/opengraph-image'],
		},
	};
}

export default function ApplicationDetailLayout({ children }: { children: React.ReactNode }) {
	return children;
}
