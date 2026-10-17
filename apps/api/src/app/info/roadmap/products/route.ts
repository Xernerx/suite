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

		if (mainOrgId && models.bots?.Bot) {
			const orgBots = await (models.bots as any).Bot.find({ organization: mainOrgId }).lean();
			const token = process.env.DISCORD_CLIENT_TOKEN;

			await Promise.all(
				orgBots.map(async (bot: any) => {
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

					bots.push({
						id: bot.id,
						name,
						avatarUrl,
					});
				})
			);
		}

		// Fetch unique product IDs from RoadmapItems, Issues, and Suggestions
		const [roadmapProducts, issueProducts, suggestionProducts] = await Promise.all([
			models.core.RoadmapItem.distinct('productId'),
			models.core.Issue.distinct('productId'),
			models.core.Suggestion.distinct('productId'),
		]);

		const botNames = bots.map((b) => b.name).filter(Boolean);
		const uniqueProducts = [...new Set(['App', ...botNames, ...roadmapProducts, ...issueProducts, ...suggestionProducts])].filter(Boolean);

		return NextResponse.json({ data: uniqueProducts, bots, mainOrgId });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
