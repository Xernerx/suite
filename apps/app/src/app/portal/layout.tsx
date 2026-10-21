/** @format */

import { Book, LogIn } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Developer Portal & Organizations',
	description: 'Manage your Xernerx Studios developer organizations, publish Discord bots, configure webhooks, and monitor application telemetry.',
	robots: {
		index: false,
		follow: false,
	},
	alternates: {
		canonical: '/portal',
	},
};

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Layout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession(auth);

	if (!session) {
		const host = (await headers()).get('host') || '';
		const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]+)?$/.test(host);
		const domain = process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com';

		let url = 'https://account.xernerx.com/login';
		let returnTo = `https://app.${domain}/portal`;
		if (host.includes('localhost')) {
			url = 'http://localhost:4003/login';
			returnTo = `http://${host}/portal`;
		} else if (isIp) {
			url = `http://${host.split(':')[0]}:4003/login`;
			returnTo = `http://${host}/portal`;
		} else if (host.includes('.dev.')) {
			url = `https://account.dev.${domain}/login`;
			returnTo = `https://app.dev.${domain}/portal`;
		} else if (host.includes('.canary.')) {
			url = `https://account.canary.${domain}/login`;
			returnTo = `https://app.canary.${domain}/portal`;
		}
		redirect(`${url}?redirect=${encodeURIComponent(returnTo)}`);
	}

	return <>{children}</>;
}
