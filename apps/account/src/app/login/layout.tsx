/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Sign In to Your Xernerx Account',
	description: 'Sign in with Discord or scan a QR code to access your Xernerx Studios account, bot dashboards, server configurations, and billing settings.',
	alternates: { canonical: '/login' },
	openGraph: {
		title: 'Xernerx Account | Sign In to Your Xernerx Account',
		description: 'Sign in with Discord or scan a QR code to access your Xernerx Studios account, bot dashboards, server configurations, and billing settings.',
		url: 'https://account.xernerx.com/login',
		siteName: 'Xernerx Account',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Account Sign In' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Account | Sign In to Your Xernerx Account',
		description: 'Sign in with Discord or scan a QR code to access your Xernerx Studios account, bot dashboards, server configurations, and billing settings.',
		images: ['/opengraph-image'],
	},
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
	return children;
}
