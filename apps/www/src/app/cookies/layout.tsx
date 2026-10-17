/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Cookie Policy & Storage Preferences',
	description: 'Learn how Xernerx Studios uses essential, functional, and analytics cookies to secure sessions and personalize your platform experience.',
	openGraph: {
		title: 'Xernerx Studios | Cookie Policy & Storage Preferences',
		description: 'Learn how Xernerx Studios uses essential, functional, and analytics cookies to secure sessions and personalize your platform experience.',
	},
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
