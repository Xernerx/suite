/** @format */

import { Metadata } from 'next';
import StatusClient from '@/components/StatusClient';

export const metadata: Metadata = {
	title: 'System Status & Real-Time Uptime Monitor',
	description: 'Live operational status, response latency metrics, and active incident tracking across all Xernerx Studios web applications, bots, and APIs.',
	alternates: { canonical: '/status' },
	openGraph: {
		title: 'Xernerx Support | System Status & Real-Time Uptime Monitor',
		description: 'Live operational status, response latency metrics, and active incident tracking across all Xernerx Studios web applications, bots, and APIs.',
		url: 'https://info.xernerx.com/status',
		siteName: 'Xernerx Support & Info',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Support — System Status & Uptime' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Support | System Status & Real-Time Uptime Monitor',
		description: 'Live operational status, response latency metrics, and active incident tracking across all Xernerx Studios web applications, bots, and APIs.',
		images: ['/opengraph-image'],
	},
};

export default function StatusPage() {
	return <StatusClient />;
}
