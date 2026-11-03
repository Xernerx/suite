/** @format */

import { MetadataRoute } from 'next';
import { database } from '@xernerx/lib/server';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const now = new Date();

	const entries: MetadataRoute.Sitemap = [
		// WWW (www.xernerx.com)
		{ url: 'https://www.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
		{ url: 'https://www.xernerx.com/download', lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
		{ url: 'https://www.xernerx.com/invites', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://www.xernerx.com/applications', lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
		{ url: 'https://www.xernerx.com/contact', lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
		{ url: 'https://www.xernerx.com/security', lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
		{ url: 'https://www.xernerx.com/terms', lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
		{ url: 'https://www.xernerx.com/privacy', lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
		{ url: 'https://www.xernerx.com/cookies', lastModified: now, changeFrequency: 'monthly', priority: 0.5 },

		// APP (app.xernerx.com)
		{ url: 'https://app.xernerx.com/', lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: 'https://app.xernerx.com/bots', lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: 'https://app.xernerx.com/bots/virtue', lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
		{ url: 'https://app.xernerx.com/bots/todo', lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
		{ url: 'https://app.xernerx.com/bots/metamorphosis', lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
		{ url: 'https://app.xernerx.com/bots/zodiac', lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
		{ url: 'https://app.xernerx.com/servers', lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: 'https://app.xernerx.com/users', lastModified: now, changeFrequency: 'daily', priority: 0.85 },
		{ url: 'https://app.xernerx.com/leaderboard', lastModified: now, changeFrequency: 'daily', priority: 0.8 },

		// DOCS (docs.xernerx.com)
		{ url: 'https://docs.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
		{ url: 'https://docs.xernerx.com/api', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://docs.xernerx.com/api/v1', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://docs.xernerx.com/packages', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://docs.xernerx.com/cdn', lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
		{ url: 'https://docs.xernerx.com/websocket', lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

		// INFO (info.xernerx.com)
		{ url: 'https://info.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://info.xernerx.com/status', lastModified: now, changeFrequency: 'hourly', priority: 0.85 },
		{ url: 'https://info.xernerx.com/roadmap', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://info.xernerx.com/suggestions', lastModified: now, changeFrequency: 'daily', priority: 0.8 },
		{ url: 'https://info.xernerx.com/issues', lastModified: now, changeFrequency: 'daily', priority: 0.7 },
		{ url: 'https://info.xernerx.com/changelog', lastModified: now, changeFrequency: 'daily', priority: 0.8 },
		{ url: 'https://info.xernerx.com/faq', lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

		// STORE & PORTAL & HASTE
		{ url: 'https://store.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
		{ url: 'https://portal.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
		{ url: 'https://haste.xernerx.com/', lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
	];

	try {
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any)?.Bot;
		const GuildModel = (db.models.guilds as any)?.Guild;
		const OrganizationModel = (db.models.organizations as any)?.Organization;

		const [publicBots, publicServers, publicOrgs] = await Promise.all([
			BotModel
				? BotModel.find({ privacy: 'public' })
						.select('id vanitySlug updatedAt')
						.limit(500)
						.lean()
						.catch(() => [])
				: [],
			GuildModel
				? GuildModel.find({ privacy: 'public' })
						.select('id vanitySlug updatedAt')
						.limit(500)
						.lean()
						.catch(() => [])
				: [],
			OrganizationModel
				? OrganizationModel.find({ $or: [{ privacy: 'public' }, { 'config.privacy': 'public' }] })
						.select('_id vanitySlug updatedAt')
						.limit(200)
						.lean()
						.catch(() => [])
				: [],
		]);

		const officialIdToSlug: Record<string, string> = {
			'1484880634844287138': 'virtue',
			'782105629572464652': 'todo',
			'881678826906730547': 'metamorphosis',
			'950251264095162418': 'zodiac',
		};
		const seenBotSlugs = new Set<string>(['virtue', 'todo', 'metamorphosis', 'zodiac']);

		for (const bot of publicBots) {
			const slugOrId = bot.vanitySlug || officialIdToSlug[String(bot.id)] || bot.id;
			if (!slugOrId || seenBotSlugs.has(String(slugOrId).toLowerCase())) continue;
			seenBotSlugs.add(String(slugOrId).toLowerCase());
			entries.push({
				url: `https://app.xernerx.com/bots/${encodeURIComponent(String(slugOrId))}`,
				lastModified: bot.updatedAt ? new Date(bot.updatedAt) : now,
				changeFrequency: 'weekly',
				priority: 0.8,
			});
		}

		for (const guild of publicServers) {
			const slugOrId = guild.vanitySlug || guild.id;
			if (!slugOrId) continue;
			entries.push({
				url: `https://app.xernerx.com/servers/${encodeURIComponent(String(slugOrId))}`,
				lastModified: guild.updatedAt ? new Date(guild.updatedAt) : now,
				changeFrequency: 'weekly',
				priority: 0.8,
			});
		}

		for (const org of publicOrgs) {
			const slugOrId = org.vanitySlug || (org._id ? String(org._id) : '');
			if (!slugOrId) continue;
			entries.push({
				url: `https://app.xernerx.com/organization/${encodeURIComponent(String(slugOrId))}`,
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
