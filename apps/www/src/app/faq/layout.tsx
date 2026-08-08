/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Xernerx Studios | FaQ',
	description: 'Get answers on frequently asked questions',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
