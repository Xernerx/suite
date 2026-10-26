/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Developer Portal & Organizations',
	description: 'Manage your Xernerx Studios developer organizations, publish Discord bots, configure webhooks, and monitor application telemetry.',
	robots: {
		index: false,
		follow: false,
	},
	alternates: {
		canonical: 'https://portal.xernerx.com',
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
