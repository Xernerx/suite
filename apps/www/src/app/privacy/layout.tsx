/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Privacy Policy & Data Protection',
	description: 'Read the Xernerx Studios Privacy Policy to learn how we collect, protect, and process account, Discord bot, and platform usage data.',
	openGraph: {
		title: 'Xernerx Studios | Privacy Policy & Data Protection',
		description: 'Read the Xernerx Studios Privacy Policy to learn how we collect, protect, and process account, Discord bot, and platform usage data.',
	},
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
	return children;
}
