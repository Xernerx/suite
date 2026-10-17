/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Product Roadmap & Upcoming Features',
	description: 'Track planned features, active development milestones, and known issues across Xernerx Studios bots and services.',
	openGraph: {
		title: 'Xernerx Support | Product Roadmap & Upcoming Features',
		description: 'Track planned features, active development milestones, and known issues across Xernerx Studios bots and services.',
	},
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
	return children;
}
