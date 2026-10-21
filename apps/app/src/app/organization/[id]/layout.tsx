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
		const res = await fetch(`${apiBase}/core/organizations/${id}?format=json`, {
			next: { revalidate: 300 },
		});

		if (!res.ok) {
			return {
				title: 'Organization Profile Not Found',
				description: 'This organization profile is private or does not exist on the Xernerx Studios platform. Explore public organizations and teams.',
				alternates: { canonical: `/organization/${id}` },
				robots: { index: false, follow: false },
			};
		}

		const org = await res.json();

		const parts: string[] = [];
		if (org.memberCount !== undefined) parts.push(`👥 Members: ${Number(org.memberCount).toLocaleString()}`);
		if (org.botCount !== undefined) parts.push(`🤖 Bots: ${Number(org.botCount).toLocaleString()}`);
		if (org.serverCount !== undefined) parts.push(`🌐 Servers: ${Number(org.serverCount).toLocaleString()}`);
		const statsDescription = parts.join(' • ');

		const title = `${org.name}${org.verified ? ' ✓' : ''}`;
		const baseDescription = org.description || org.info || `Check out ${org.name} on Xernerx Studios!`;
		const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
		const currentUrl = `${appBase}/organization/${id}`;
		const cardImageUrl = `${apiBase}/core/organizations/${id}?type=png`;

		return {
			title,
			description: ogDescription,
			alternates: { canonical: `/organization/${id}` },
			openGraph: {
				siteName: 'Xernerx Studios',
				type: 'website',
				title,
				description: ogDescription,
				url: currentUrl,
				images: [
					{
						url: cardImageUrl,
						width: 840,
						height: 360,
						alt: org.name,
					},
				],
			},
			twitter: {
				card: 'summary_large_image',
				title,
				description: ogDescription,
				images: [cardImageUrl],
			},
		};
	} catch {
		return {
			title: 'Organization Profile & Team Directory',
			description: 'View organization team members, published Discord bots, and official community servers on the Xernerx Studios ecosystem directory.',
			alternates: { canonical: `/organization/${id}` },
		};
	}
}

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
