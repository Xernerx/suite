/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: {
		default: 'Xernerx Studios | Contact',
		template: 'Xernerx Studios | Contact | %s',
	},
	description: 'Get in touch with Xernerx Studios for support, partnerships, security disclosures, legal enquiries and general questions.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
