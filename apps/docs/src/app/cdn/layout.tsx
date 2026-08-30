/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'CDN Services | Xernerx Docs',
	description: 'Documentation for the Xernerx Content Delivery Network. Discover how to programmatically upload, retrieve, and manage distributed media assets.',
};

export default function CDNLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
