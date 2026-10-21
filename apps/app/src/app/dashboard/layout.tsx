/** @format */

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: {
		default: 'Server & Bot Management Dashboard',
		template: 'Xernerx Studios | Dashboard | %s',
	},
	description: 'Manage your Discord servers, Virtue bot modules, custom branding, and community analytics from the unified Xernerx Studios dashboard.',
	robots: {
		index: false,
		follow: false,
	},
	alternates: {
		canonical: '/dashboard',
	},
	openGraph: {
		title: {
			default: 'Xernerx Studios | Server & Bot Management Dashboard',
			template: 'Xernerx Studios | Dashboard | %s',
		},
		description: 'Manage your Discord servers, Virtue bot modules, custom branding, and community analytics from the unified Xernerx Studios dashboard.',
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
		title: {
			default: 'Xernerx Studios | Server & Bot Management Dashboard',
			template: 'Xernerx Studios | Dashboard | %s',
		},
		description: 'Manage your Discord servers, Virtue bot modules, custom branding, and community analytics from the unified Xernerx Studios dashboard.',
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
		const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]+)?$/.test(host);
		const domain = process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com';

		let url = 'https://account.xernerx.com/login';
		let returnTo = `https://app.${domain}/dashboard`;
		if (host.includes('localhost')) {
			url = 'http://localhost:4003/login';
			returnTo = `http://${host}/dashboard`;
		} else if (isIp) {
			url = `http://${host.split(':')[0]}:4003/login`;
			returnTo = `http://${host}/dashboard`;
		} else if (host.includes('.dev.')) {
			url = `https://account.dev.${domain}/login`;
			returnTo = `https://app.dev.${domain}/dashboard`;
		} else if (host.includes('.canary.')) {
			url = `https://account.canary.${domain}/login`;
			returnTo = `https://app.canary.${domain}/dashboard`;
		}
		redirect(`${url}?redirect=${encodeURIComponent(returnTo)}`);
	}

	return <>{children}</>;
}
