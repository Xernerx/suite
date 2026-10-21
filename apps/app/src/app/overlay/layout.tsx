/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Desktop Game Overlay & HUD Companion',
	description: 'Real-time in-game overlay and quick-action HUD for the Xernerx Studios Desktop Companion client.',
	alternates: { canonical: '/overlay' },
	robots: { index: false, follow: false },
};

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
	return children;
}
