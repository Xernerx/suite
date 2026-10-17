/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'WebSocket Gateway & Real-Time Event Protocol',
	description: 'Technical reference for the Xernerx Studios bidirectional WebSocket gateway, handshakes, and real-time event routing.',
	openGraph: {
		title: 'Xernerx Docs | WebSocket Gateway & Real-Time Event Protocol',
		description: 'Technical reference for the Xernerx Studios bidirectional WebSocket gateway, handshakes, and real-time event routing.',
	},
};

export default function WebsocketDocsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
