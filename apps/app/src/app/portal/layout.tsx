/** @format */

import { Book, LogIn } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Portal',
	description: 'Manage your Xernerx developer organizations and applications.',
};

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Layout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession(auth);

	if (!session) {
		const host = (await headers()).get('host') || '';
		const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]+)?$/.test(host);

		let url = 'https://account.xernerx.com/login';
		if (host.includes('localhost')) url = 'http://localhost:4003/login';
		else if (isIp) url = `http://${host.split(':')[0]}:4003/login`;
		else if (host.includes('.dev.')) url = `https://account.dev.${process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com'}/login`;
		else if (host.includes('.canary.')) url = `https://account.canary.${process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com'}/login`;
		redirect(url);
	}

	return <>{children}</>;
}
