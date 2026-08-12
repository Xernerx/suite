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
		let url = 'https://auth.xernerx.com/login';
		if (host.includes('localhost') || host.includes('.dev.')) url = 'https://auth.dev.xernerx.com/login';
		else if (host.includes('.canary.')) url = 'https://auth.canary.xernerx.com/login';
		redirect(url);
	}

	return <>{children}</>;
}
