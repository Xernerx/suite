/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'NPM Packages | Xernerx Docs',
	description: 'Guides and references for the open-source Xernerx Developer Software suite, including frameworks, libraries, and utilities.',
};

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
