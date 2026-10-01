import type { Metadata } from 'next';
import { database } from '@xernerx/lib/server';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	const { models } = await database('xernerx');

	const bot = await models.bots.Bot.findOne({ id }).lean();

	if (!bot) {
		return {
			title: 'Bot Not Found',
			description: 'This bot does not exist or has been removed.',
		};
	}

	const stats = await models.bots.Stat.findOne({ id }).lean();

	let statsDescription = '';
	if (stats) {
		const parts = [];
		if (stats.guildCount) parts.push(`Servers: ${stats.guildCount.toLocaleString()}`);
		if (stats.userCount) parts.push(`Users: ${stats.userCount.toLocaleString()}`);
		if (stats.voteCount) parts.push(`Votes: ${stats.voteCount.toLocaleString()}`);
		if (parts.length > 0) statsDescription = parts.join(' • ');
	}

	const baseDescription = bot.description || bot.info || `Check out ${bot.name} on Xernerx!`;
	const ogDescription = statsDescription ? `${baseDescription}\n\n📊 ${statsDescription}` : baseDescription;

	const domain = process.env.DOMAIN || 'xernerx.com';
	const isDev = process.env.ENVIRONMENT === 'DEVELOPMENT';
	const baseUrl = isDev ? `https://app.dev.${domain}` : `https://app.${domain}`;
	const currentUrl = `${baseUrl}/bots/${id}`;

	return {
		title: bot.name,
		description: ogDescription,
		openGraph: {
			title: bot.name,
			description: ogDescription,
			url: currentUrl,
			images: bot.avatar ? [{ url: bot.avatar }] : [],
		},
		twitter: {
			card: 'summary',
			title: bot.name,
			description: ogDescription,
			images: bot.avatar ? [bot.avatar] : [],
		},
	};
}

export default function BotLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
