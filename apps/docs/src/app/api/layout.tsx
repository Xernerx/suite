/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'REST API | Xernerx Docs',
	description: 'Comprehensive documentation for the Xernerx HTTP API. Learn how to authenticate, interact with databases, and utilize core microservices securely.',
};

export default function APILayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
