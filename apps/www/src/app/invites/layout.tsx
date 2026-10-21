/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Official Discord Bot & Server Invites',
	description: 'Invite official Xernerx Studios Discord bots including To-Do List, Metamorphosis, and Zodiac, or join our official support community.',
	alternates: {
		canonical: '/invites',
	},
	openGraph: {
		title: 'Xernerx Studios | Official Discord Bot & Server Invites',
		description: 'Invite official Xernerx Studios Discord bots including To-Do List, Metamorphosis, and Zodiac, or join our official support community.',
		url: 'https://www.xernerx.com/invites',
		siteName: 'Xernerx',
		images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Xernerx Official Invites' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Official Discord Bot & Server Invites',
		description: 'Invite official Xernerx Studios Discord bots including To-Do List, Metamorphosis, and Zodiac, or join our official support community.',
		images: ['/banner.png'],
	},
};

export default function InvitesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
