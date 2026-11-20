/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Connect Xernerx Mobile',
	description: 'Securely hand off your authenticated Discord session to the Xernerx Mobile app.',
	alternates: { canonical: '/login/mobile' },
	robots: { index: false, follow: false },
};

export default function MobileLoginLayout({ children }: { children: React.ReactNode }) {
	return children;
}
