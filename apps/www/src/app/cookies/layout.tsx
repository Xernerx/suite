/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Studios | Cookie Policy',
		template: 'Xernerx Studios | Cookie Policy | %s',
	},
	description: 'Learn how Xernerx Studios uses cookies, local storage, and similar technologies across our websites, applications, APIs and services.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
