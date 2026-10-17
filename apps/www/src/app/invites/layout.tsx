/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Official Discord Bot & Server Invites',
	description: 'Invite official Xernerx Studios Discord bots including To-Do List, Metamorphosis, and Zodiac, or join our official support community.',
	openGraph: {
		title: 'Xernerx Studios | Official Discord Bot & Server Invites',
		description: 'Invite official Xernerx Studios Discord bots including To-Do List, Metamorphosis, and Zodiac, or join our official support community.',
	},
};

export default function InvitesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
