/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Xernerx Studios | Dashboard',
	description: 'Manage your Xernerx applications, tokens, and settings. Access platform tools and infrastructure from a unified dashboard.',
	openGraph: {
		title: 'Xernerx Studios | Dashboard',
		description: 'Access the Xernerx dashboard to manage applications, API tokens, and platform configuration.',
		url: 'https://app.xernerx.com/dashboard',
		siteName: 'Xernerx',
		images: [
			{
				url: '/banner.png',
				width: 1200,
				height: 630,
				alt: 'Xernerx Dashboard',
			},
		],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Studios | Dashboard',
		description: 'Manage your Xernerx tools, tokens, and applications in one place.',
		images: ['/banner.png'],
	},
};

import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Layout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession(auth);

	if (!session) {
		const host = (await headers()).get('host') || '';
		let url = 'https://auth.xernerx.com/login';
		if (host.includes('localhost') || host.includes('.dev.')) url = 'https://auth.dev.xernerx.com/login';
		else if (host.includes('.canary.')) url = 'https://auth.canary.xernerx.com/login';
		redirect(url);
	}

	return <>{children}</>;
}
