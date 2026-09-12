/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: {
		default: 'Store',
		template: 'Xernerx Studios | %s',
	},
	description: 'Explore the Xernerx Studios store. Subscribe to individual bot passes, server infrastructure, developer API plans, or unlock everything with the Ultra bundle.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
