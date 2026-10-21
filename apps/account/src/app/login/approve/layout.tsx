/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Approve Device Sign-In Request',
	description: 'Review and approve a pending QR code sign-in request for your Xernerx Studios account.',
	alternates: { canonical: '/login/approve' },
	robots: { index: false, follow: false },
};

export default function ApproveLoginLayout({ children }: { children: React.ReactNode }) {
	return children;
}
