/** @format */

import { MetadataRoute } from 'next';
import { database } from '@xernerx/lib/server';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = 'https://app.xernerx.com';
	const now = new Date();

	const entries: MetadataRoute.Sitemap = [
		{ url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
		{ url: `${baseUrl}/bots`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: `${baseUrl}/bots/virtue`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
		{ url: `${baseUrl}/bots/todo`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
		{ url: `${baseUrl}/bots/metamorphosis`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
		{ url: `${baseUrl}/bots/zodiac`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
		{ url: `${baseUrl}/servers`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: `${baseUrl}/users`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: `${baseUrl}/leaderboard`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
		{ url: `${baseUrl}/dashboard`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: `${baseUrl}/overlay`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
	];

	const officialIdToSlug: Record<string, string> = {
		'1484880634844287138': 'virtue',
		'782105629572464652': 'todo',
		'881678826906730547': 'metamorphosis',
		'950251264095162418': 'zodiac',
	};
	const seenBotSlugs = new Set<string>(['virtue', 'todo', 'metamorphosis', 'zodiac']);

	try {
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any)?.Bot;
		const GuildModel = (db.models.guilds as any)?.Guild;
		const UserModel = (db.models.users as any)?.User;
		const OrganizationModel = (db.models.organizations as any)?.Organization;

		const [publicBots, publicServers, publicUsers, publicOrgs] = await Promise.all([
			BotModel
				? BotModel.find({ privacy: 'public' })
						.select('id vanitySlug updatedAt')
						.limit(2000)
						.lean()
						.catch(() => [])
				: [],
			GuildModel
				? GuildModel.find({ privacy: 'public' })
						.select('id vanitySlug updatedAt')
						.limit(2000)
						.lean()
						.catch(() => [])
				: [],
			UserModel
				? UserModel.find({ privacy: 'public' })
						.select('id vanitySlug updatedAt')
						.limit(2000)
						.lean()
						.catch(() => [])
				: [],
			OrganizationModel
				? OrganizationModel.find({ $or: [{ privacy: 'public' }, { 'config.privacy': 'public' }] })
						.select('_id vanitySlug updatedAt')
						.limit(1000)
						.lean()
						.catch(() => [])
				: [],
		]);

		for (const bot of publicBots) {
			const slugOrId = bot.vanitySlug || officialIdToSlug[String(bot.id)] || bot.id;
			if (!slugOrId || seenBotSlugs.has(String(slugOrId).toLowerCase())) continue;
			seenBotSlugs.add(String(slugOrId).toLowerCase());
			entries.push({
				url: `${baseUrl}/bots/${encodeURIComponent(String(slugOrId))}`,
				lastModified: bot.updatedAt ? new Date(bot.updatedAt) : now,
				changeFrequency: 'weekly',
				priority: 0.8,
			});
		}

		for (const guild of publicServers) {
			const slugOrId = guild.vanitySlug || guild.id;
			if (!slugOrId) continue;
			entries.push({
				url: `${baseUrl}/servers/${encodeURIComponent(String(slugOrId))}`,
				lastModified: guild.updatedAt ? new Date(guild.updatedAt) : now,
				changeFrequency: 'weekly',
				priority: 0.8,
			});
		}

		for (const user of publicUsers) {
			const slugOrId = user.vanitySlug || user.id;
			if (!slugOrId) continue;
			entries.push({
				url: `${baseUrl}/users/${encodeURIComponent(String(slugOrId))}`,
				lastModified: user.updatedAt ? new Date(user.updatedAt) : now,
				changeFrequency: 'weekly',
				priority: 0.7,
			});
		}

		for (const org of publicOrgs) {
			const slugOrId = org.vanitySlug || (org._id ? String(org._id) : '');
			if (!slugOrId) continue;
			entries.push({
				url: `${baseUrl}/organization/${encodeURIComponent(String(slugOrId))}`,
				lastModified: org.updatedAt ? new Date(org.updatedAt) : now,
				changeFrequency: 'weekly',
				priority: 0.75,
			});
		}
	} catch {
		// Gracefully fall back to static entries if database is unreachable during build
	}

	return entries;
}
