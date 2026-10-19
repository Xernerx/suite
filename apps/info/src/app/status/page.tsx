/** @format */

import { Metadata } from 'next';
import StatusClient from '@/components/StatusClient';

export const metadata: Metadata = {
	title: 'System Status & Uptime',
	description: 'Live operational status, response latency, and active incident tracking across all Xernerx Studios web applications and APIs.',
	openGraph: {
		title: 'Xernerx Studios — System Status & Uptime',
		description: 'Live operational status, response latency, and active incident tracking across the Xernerx Suite ecosystem.',
	},
};

export default function StatusPage() {
	return <StatusClient />;
}
