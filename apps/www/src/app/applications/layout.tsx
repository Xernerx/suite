/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Careers & Applications',
	description: 'Apply to join the Xernerx Studios team and help build modern Discord bots, developer tools, and cloud infrastructure.',
	openGraph: {
		title: 'Xernerx Studios | Careers & Applications',
		description: 'Apply to join the Xernerx Studios team and help build modern Discord bots, developer tools, and cloud infrastructure.',
	},
};

export default function ApplicationsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
