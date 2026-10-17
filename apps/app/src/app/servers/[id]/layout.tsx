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
		const res = await fetch(`${apiBase}/core/guilds/${id}`, {
			next: { revalidate: 300 },
		});

		if (!res.ok) {
			return {
				title: 'Server Not Found',
				description: 'This Discord server does not exist or is private.',
			};
		}

		const guild = await res.json();

		const parts: string[] = [];
		if (guild.memberCount) parts.push(`Members: ${Number(guild.memberCount).toLocaleString()}`);
		if (guild.messageCount) parts.push(`Messages: ${Number(guild.messageCount).toLocaleString()}`);
		if (guild.voteCount) parts.push(`Votes: ${Number(guild.voteCount).toLocaleString()}`);
		const statsDescription = parts.join(' • ');

		const baseDescription = guild.description || guild.info || `Join ${guild.name} on Xernerx Studios!`;
		const ogDescription = statsDescription ? `${baseDescription}\n\n📊 ${statsDescription}` : baseDescription;
		const currentUrl = `${appBase}/servers/${id}`;

		return {
			title: guild.name,
			description: ogDescription,
			openGraph: {
				title: guild.name,
				description: ogDescription,
				url: currentUrl,
				images: guild.iconUrl ? [{ url: guild.iconUrl }] : [],
			},
			twitter: {
				card: 'summary',
				title: guild.name,
				description: ogDescription,
				images: guild.iconUrl ? [guild.iconUrl] : [],
			},
		};
	} catch {
		return {
			title: 'Discord Server Profile',
			description: 'View Discord server statistics, community details, and invite links on Xernerx Studios.',
		};
	}
}

export default function ServerLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
