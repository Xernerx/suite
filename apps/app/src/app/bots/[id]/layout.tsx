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
		const res = await fetch(`${apiBase}/core/bots/${id}?format=json`, {
			next: { revalidate: 300 },
		});

		if (!res.ok) {
			return {
				title: 'Bot Not Found',
				description: 'This bot is private or does not exist on Xernerx Studios.',
			};
		}

		const bot = await res.json();

		const parts: string[] = [];
		if (bot.guildCount !== undefined) parts.push(`🌐 Servers: ${Number(bot.guildCount).toLocaleString()}`);
		if (bot.userCount !== undefined) parts.push(`👥 Users: ${Number(bot.userCount).toLocaleString()}`);
		if (bot.voteCount !== undefined) parts.push(`🔼 Votes: ${Number(bot.voteCount).toLocaleString()}`);
		const statsDescription = parts.join(' • ');

		const title = `${bot.name}${bot.verified ? ' ✓' : ''}`;
		const baseDescription = bot.description || bot.info || `Check out ${bot.name} on Xernerx Studios!`;
		const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
		const currentUrl = `${appBase}/bots/${id}`;
		const cardImageUrl = `${apiBase}/core/bots/${id}?type=png`;

		return {
			title,
			description: ogDescription,
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
						alt: bot.name,
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
			title: 'Discord Bot Profile',
			description: 'View Discord bot statistics, commands, and reviews on Xernerx Studios.',
		};
	}
}

export default function BotLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
