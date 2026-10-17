/** @format */

import type { Metadata } from 'next';
import { headers } from 'next/headers';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;

	const headersList = await headers();
	const host = headersList.get('host') || '';
	const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
	const isDev = isLocal || host.includes('.dev.') || process.env.ENVIRONMENT?.toLowerCase() === 'development';
	const isCanary = host.includes('.canary.') || process.env.ENVIRONMENT?.toLowerCase() === 'canary';
	const domain = process.env.DOMAIN || 'xernerx.com';

	const apiBase = isLocal ? 'http://localhost:4001' : isDev ? `https://api.dev.${domain}` : isCanary ? `https://api.canary.${domain}` : `https://api.${domain}`;

	const appBase = isLocal ? 'http://localhost:4004' : isDev ? `https://app.dev.${domain}` : isCanary ? `https://app.canary.${domain}` : `https://app.${domain}`;

	try {
		const res = await fetch(`${apiBase}/core/organizations/${id}`, {
			next: { revalidate: 300 },
		});

		if (!res.ok) {
			return {
				title: 'Organization Not Found',
				description: 'This organization does not exist or is private.',
			};
		}

		const org = await res.json();

		const parts: string[] = [];
		if (org.memberCount) parts.push(`Members: ${Number(org.memberCount).toLocaleString()}`);
		if (org.botCount) parts.push(`Bots: ${Number(org.botCount).toLocaleString()}`);
		if (org.serverCount) parts.push(`Servers: ${Number(org.serverCount).toLocaleString()}`);
		const statsDescription = parts.join(' • ');

		const baseDescription = org.description || org.info || `Check out ${org.name} on Xernerx Studios!`;
		const ogDescription = statsDescription ? `${baseDescription}\n\n📊 ${statsDescription}` : baseDescription;
		const currentUrl = `${appBase}/organization/${id}`;

		return {
			title: org.name,
			description: ogDescription,
			openGraph: {
				title: org.name,
				description: ogDescription,
				url: currentUrl,
				images: org.iconUrl ? [{ url: org.iconUrl }] : [],
			},
			twitter: {
				card: 'summary',
				title: org.name,
				description: ogDescription,
				images: org.iconUrl ? [org.iconUrl] : [],
			},
		};
	} catch {
		return {
			title: 'Organization Profile',
			description: 'View organization members, published bots, and official servers on Xernerx Studios.',
		};
	}
}

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
