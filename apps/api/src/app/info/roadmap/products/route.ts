/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');

		const mainOrgSetting = await models.core.Setting.findOne({ id: 'main_org_id' }).lean();
		const mainOrgId = mainOrgSetting?.value ? String(mainOrgSetting.value) : null;

		const bots: { id: string; name: string; avatarUrl: string | null }[] = [];
		const nonPublicIdentifiers = new Set<string>();
		const publicBotIdToName = new Map<string, string>();

		if (models.bots?.Bot) {
			const BotModel = (models.bots as any).Bot;
			const [publicOrgBots, nonPublicBots] = await Promise.all([
				mainOrgId ? BotModel.find({ organization: mainOrgId, privacy: 'public' }).lean() : Promise.resolve([]),
				BotModel.find({ privacy: { $ne: 'public' } })
					.select('id name organization')
					.lean(),
			]);

			const token = process.env.DISCORD_CLIENT_TOKEN;

			for (const nb of nonPublicBots) {
				if (nb?.id) nonPublicIdentifiers.add(String(nb.id).trim().toLowerCase());
				if (nb?.name) nonPublicIdentifiers.add(String(nb.name).trim().toLowerCase());
			}

			await Promise.all([
				...publicOrgBots.map(async (bot: any) => {
					let name = bot.name || bot.id;
					let avatarUrl = bot.avatar || null;

					if (token && bot.id) {
						try {
							const res = await fetch(`https://discord.com/api/v10/users/${bot.id}`, {
								headers: { Authorization: `Bot ${token}` },
								next: { revalidate: 3600 },
							});
							if (res.ok) {
								const discordUser = await res.json();
								name = discordUser.global_name || discordUser.username || name;
								if (discordUser.avatar) {
									avatarUrl = `https://cdn.discordapp.com/avatars/${bot.id}/${discordUser.avatar}.${discordUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`;
								}
							}
						} catch {}
					}

					if (bot.id && name) {
						publicBotIdToName.set(String(bot.id).trim().toLowerCase(), String(name).trim());
					}

					bots.push({
						id: bot.id,
						name,
						avatarUrl,
					});
				}),
				...nonPublicBots
					.filter((nb: any) => mainOrgId && String(nb.organization) === mainOrgId && token && nb.id)
					.map(async (nb: any) => {
						try {
							const res = await fetch(`https://discord.com/api/v10/users/${nb.id}`, {
								headers: { Authorization: `Bot ${token}` },
								next: { revalidate: 3600 },
							});
							if (res.ok) {
								const discordUser = await res.json();
								if (discordUser.global_name) nonPublicIdentifiers.add(String(discordUser.global_name).trim().toLowerCase());
								if (discordUser.username) nonPublicIdentifiers.add(String(discordUser.username).trim().toLowerCase());
							}
						} catch {}
					}),
			]);
		}

		// Fetch unique product IDs from RoadmapItems, Issues, and Suggestions
		const [roadmapProducts, issueProducts, suggestionProducts] = await Promise.all([
			models.core.RoadmapItem.distinct('productId'),
			models.core.Issue.distinct('productId'),
			models.core.Suggestion.distinct('productId'),
		]);

		const botNames = bots.map((b) => b.name).filter(Boolean);
		const publicBotNamesLower = new Set(botNames.map((n) => n.trim().toLowerCase()));

		const rawProducts = ['App', ...botNames, ...roadmapProducts, ...issueProducts, ...suggestionProducts].filter(Boolean).map((prod) => {
			const trimmed = String(prod).trim();
			return publicBotIdToName.get(trimmed.toLowerCase()) || trimmed;
		});

		const uniqueProducts = [...new Set(rawProducts)].filter((prod) => {
			const lower = prod.toLowerCase();
			if (!lower) return false;
			if (publicBotNamesLower.has(lower)) return true;
			if (nonPublicIdentifiers.has(lower)) return false;
			return true;
		});

		return NextResponse.json({ data: uniqueProducts, bots, mainOrgId });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
