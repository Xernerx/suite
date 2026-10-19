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
		const res = await fetch(`${apiBase}/core/users/${id}?format=json`, {
			next: { revalidate: 300 },
		});

		if (!res.ok) {
			return {
				title: 'User Profile',
				description: 'This user profile is private or does not exist on Xernerx Studios.',
			};
		}

		const user = await res.json();

		const parts: string[] = [];
		if (user.streak) parts.push(`🔥 Streak: ${Number(user.streak).toLocaleString()}d`);
		if (user.botCount) parts.push(`🤖 Bots: ${Number(user.botCount).toLocaleString()}`);
		if (user.orgCount) parts.push(`🏢 Orgs: ${Number(user.orgCount).toLocaleString()}`);
		const statsDescription = parts.join(' • ');

		const title = `${user.name}${user.verified ? ' ✓' : ''}${user.handle ? ` (${user.handle})` : ''}`;
		const baseDescription = user.description || `Explore ${user.name}'s profile, published bots, and communities on Xernerx Studios.`;
		const ogDescription = statsDescription ? `${baseDescription}\n\n${statsDescription}` : baseDescription;
		const currentUrl = `${appBase}/users/${id}`;
		const cardImageUrl = `${apiBase}/core/users/${id}?type=png`;

		return {
			title,
			description: ogDescription,
			openGraph: {
				siteName: 'Xernerx Studios',
				type: 'profile',
				title,
				description: ogDescription,
				url: currentUrl,
				images: [
					{
						url: cardImageUrl,
						width: 840,
						height: 360,
						alt: user.name,
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
			title: 'User Profile',
			description: 'View user profiles, published bots, and organizations on Xernerx Studios.',
		};
	}
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
