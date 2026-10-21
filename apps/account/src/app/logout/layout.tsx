/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Sign Out of Your Xernerx Account',
	description: 'Safely sign out of your active Xernerx Studios session across web applications and connected services.',
	alternates: { canonical: '/logout' },
	robots: { index: false, follow: false },
};

export default function LogoutLayout({ children }: { children: React.ReactNode }) {
	return children;
}
