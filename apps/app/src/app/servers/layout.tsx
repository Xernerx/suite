/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Explore & Join Public Discord Servers',
	description: 'Discover and join vibrant Discord communities and public servers across the Xernerx Studios network.',
	openGraph: {
		title: 'Xernerx Studios | Explore & Join Public Discord Servers',
		description: 'Discover and join vibrant Discord communities and public servers across the Xernerx Studios network.',
	},
};

export default function ServersLayout({ children }: { children: React.ReactNode }) {
	return children;
}
