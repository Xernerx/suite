/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Live System Status, Uptime & Bot Telemetry',
	description: 'Monitor real-time operational health, API response latency, active incidents, and 24-hour uptime across all Xernerx Suite web services and official Discord bots.',
	alternates: { canonical: '/status' },
	openGraph: {
		title: 'Xernerx Support | Live System Status, Uptime & Bot Telemetry',
		description: 'Monitor real-time operational health, API response latency, active incidents, and 24-hour uptime across all Xernerx Suite web services and official Discord bots.',
		url: 'https://info.xernerx.com/status',
		siteName: 'Xernerx Support & Info',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Live System Status' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Support | Live System Status, Uptime & Bot Telemetry',
		description: 'Monitor real-time operational health, API response latency, active incidents, and 24-hour uptime across all Xernerx Suite web services and official Discord bots.',
		images: ['/opengraph-image'],
	},
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
	return children;
}
