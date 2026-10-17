/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Frequently Asked Questions & Help Guides',
	description: 'Find answers to common questions about Xernerx Studios Discord bots, environments, translations, and platform features.',
	openGraph: {
		title: 'Xernerx Support | Frequently Asked Questions & Help Guides',
		description: 'Find answers to common questions about Xernerx Studios Discord bots, environments, translations, and platform features.',
	},
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
	return children;
}
