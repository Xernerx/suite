/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'WebSocket Gateway & Real-Time Event Protocol',
	description: 'Technical reference for the Xernerx Studios bidirectional WebSocket gateway, authentication handshakes, heartbeat intervals, and real-time event routing.',
	alternates: { canonical: '/websocket' },
	openGraph: {
		title: 'Xernerx Docs | WebSocket Gateway & Real-Time Event Protocol',
		description: 'Technical reference for the Xernerx Studios bidirectional WebSocket gateway, authentication handshakes, heartbeat intervals, and real-time event routing.',
		url: 'https://docs.xernerx.com/websocket',
		siteName: 'Xernerx Docs',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Docs — WebSocket Gateway Protocol' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Docs | WebSocket Gateway & Real-Time Event Protocol',
		description: 'Technical reference for the Xernerx Studios bidirectional WebSocket gateway, authentication handshakes, heartbeat intervals, and real-time event routing.',
		images: ['/opengraph-image'],
	},
};

export default function WebsocketDocsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
