/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Terms of Service & Platform Rules',
	description: 'Review the official Xernerx Studios Terms of Service governing the use of our web applications, Discord bots, APIs, and developer tools.',
	openGraph: {
		title: 'Xernerx Studios | Terms of Service & Platform Rules',
		description: 'Review the official Xernerx Studios Terms of Service governing the use of our web applications, Discord bots, APIs, and developer tools.',
	},
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
