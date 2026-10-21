/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Cancel Subscription & Manage Plan',
	description: 'Review your active Xernerx Studios subscription details and manage or cancel your recurring billing plan.',
	robots: { index: false, follow: false },
};

export default function CancelSubscriptionLayout({ children }: { children: React.ReactNode }) {
	return children;
}
