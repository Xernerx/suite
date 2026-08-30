/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Studios | Terms of Service',
		template: 'Xernerx Studios | Terms of Service | %s',
	},
	description: 'Review the Terms of Service for Xernerx Studios, including the conditions, responsibilities and policies that apply when using our websites, software, APIs and services.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
