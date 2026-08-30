/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Studios | Store',
		template: 'Xernerx Studios | Store | %s',
	},
	description: 'Explore the Xernerx Studios store. Subscribe to individual bot passes, server infrastructure, developer API plans, or unlock everything with the Ultra bundle.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
