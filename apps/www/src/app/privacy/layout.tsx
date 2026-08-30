/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Studios | Privacy Policy',
		template: 'Xernerx Studios | Privacy Policy | %s',
	},
	description: 'Learn how Xernerx Studios collects, uses, stores and protects your personal information when you use our websites, applications, APIs and services.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
