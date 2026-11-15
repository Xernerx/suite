/** @format */

import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { dispatchAppCommunityWebhook } from '@/lib/mainDiscordServer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');
		const suggestions = await models.core.Suggestion.find({ status: { $ne: 'declined' } }).sort({ createdAt: -1 }).lean();

		const authorIds = [...new Set(suggestions.map((s) => s.authorId))];
		const users = await models.users.User.find({ id: { $in: authorIds } })
			.select('id name icon vanitySlug discordCache')
			.lean();
		const userMap: Record<string, any> = {};

		await Promise.all(
			authorIds.map(async (id) => {
				const dbUser = users.find((u: any) => u.id === id);
				const cached = dbUser?.discordCache;
				if (cached?.username || cached?.globalName) {
					userMap[id] = {
						id,
						name: cached.globalName || cached.username || dbUser?.name,
						icon: cached.avatarUrl || dbUser?.icon || null,
						vanitySlug: dbUser?.vanitySlug,
					};
					return;
				}
				try {
					const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_CLIENT_TOKEN;
					if (token) {
						const discordRes = await fetch(`https://discord.com/api/v10/users/${id}`, {
							headers: { Authorization: `Bot ${token}` },
							next: { revalidate: 3600 },
						});

						if (discordRes.ok) {
							const data = await discordRes.json();
							const avatarUrl = data.avatar ? `https://cdn.discordapp.com/avatars/${id}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null;
							userMap[id] = {
								id,
								name: data.global_name || data.username,
								icon: avatarUrl,
								vanitySlug: dbUser?.vanitySlug,
							};
							if (dbUser) {
								models.users.User.updateOne(
									{ id },
									{
										$set: {
											name: data.global_name || data.username || dbUser.name,
											...(avatarUrl ? { icon: avatarUrl } : {}),
											discordCache: {
												username: data.username,
												globalName: data.global_name || null,
												avatar: data.avatar || null,
												avatarUrl,
												cachedAt: new Date(),
											},
										},
									}
								).catch(() => {});
							}
							return; // successfully fetched from discord
						}
					}
				} catch (e) {
					console.error('Failed to fetch Discord user for suggestion:', e);
				}

				// Fallback to database
				if (dbUser) {
					userMap[id] = { id, name: dbUser.name, icon: dbUser.icon, vanitySlug: dbUser.vanitySlug };
				} else {
					userMap[id] = { id, name: 'Unknown User', icon: null };
				}
			})
		);

		const data = suggestions.map((s) => ({
			...s,
			author: userMap[s.authorId] || null,
		}));

		return NextResponse.json({ data });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();

		if (!body.title?.trim() || !body.description?.trim() || !body.productId) {
			return NextResponse.json({ error: 'Title, description, and product are required' }, { status: 400 });
		}

		const { models } = await database('xernerx');

		// Prevent duplicates
		const existing = await models.core.Suggestion.findOne({ title: body.title });
		if (existing) {
			return NextResponse.json({ error: 'A suggestion with this title already exists' }, { status: 409 });
		}

		const suggestion = await models.core.Suggestion.create({
			id: crypto.randomUUID(),
			...body,
			authorId: session.user.id,
			status: 'pending',
			upvotes: [session.user.id],
		});

		await dispatchAppCommunityWebhook(
			{ models },
			{
				feedType: 'suggestions',
				title: `💡 New Community Suggestion: ${String(body.title).slice(0, 120)}`,
				url: `https://info.xernerx.com/suggestions?id=${suggestion.id}`,
				description: String(body.description || '').slice(0, 350),
				color: 0x8b7cf6,
				fields: [
					{ name: 'Product', value: `\`${String(body.productId || 'Suite')}\``, inline: true },
					{ name: 'Submitted By', value: `<@${session.user.id}>`, inline: true },
				],
				ctaLinks: [
					{ label: 'Vote & Discuss', url: `https://info.xernerx.com/suggestions?id=${suggestion.id}` },
					{ label: 'Submit Suggestion', url: 'https://info.xernerx.com/suggestions' },
				],
			}
		).catch(() => {});

		return NextResponse.json({ data: suggestion });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
