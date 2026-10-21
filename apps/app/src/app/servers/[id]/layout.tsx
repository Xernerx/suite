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
		const res = await fetch(`${apiBase}/core/guilds/${id}?format=json`, {
			next: { revalidate: 300 },
		});

		if (!res.ok) {
			return {
				title: 'Discord Server Not Found',
				description: 'This Discord server profile is private or does not exist on the Xernerx Studios community directory. Explore public Discord servers.',
				alternates: { canonical: `/servers/${id}` },
				robots: { index: false, follow: false },
			};
		}

		const guild = await res.json();

		const parts: string[] = [];
		if (guild.memberCount !== undefined) parts.push(`👥 Members: ${Number(guild.memberCount).toLocaleString()}`);
		if (guild.messageCount !== undefined) parts.push(`💬 Messages: ${Number(guild.messageCount).toLocaleString()}`);
		if (guild.voteCount !== undefined) parts.push(`🔼 Votes: ${Number(guild.voteCount).toLocaleString()}`);
		const statsDescription = parts.join(' • ');

		const title = `${guild.name}${guild.verified ? ' ✓' : ''}`;
		const baseDescription = guild.description || guild.info || `Join ${guild.name} on Xernerx Studios!`;
		const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
		const currentUrl = `${appBase}/servers/${id}`;
		const cardImageUrl = `${apiBase}/core/guilds/${id}?type=png`;

		return {
			title,
			description: ogDescription,
			alternates: { canonical: `/servers/${id}` },
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
						alt: guild.name,
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
			title: 'Discord Server Profile & Community',
			description: 'View Discord server member statistics, activity metrics, community information, and invite links on the Xernerx Studios directory.',
			alternates: { canonical: `/servers/${id}` },
		};
	}
}

export default function ServerLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
