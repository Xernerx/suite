/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'QR Code Sign-In & Mobile Authentication',
	description: 'Scan a secure QR code with your mobile device to sign in to your Xernerx Studios account instantly without typing credentials.',
	alternates: { canonical: '/login/qr' },
	robots: { index: false, follow: false },
};

export default function QrLoginLayout({ children }: { children: React.ReactNode }) {
	return children;
}
