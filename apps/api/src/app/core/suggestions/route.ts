import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');
		const suggestions = await models.core.Suggestion.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();

		const authorIds = [...new Set(suggestions.map((s) => s.authorId))];
		const users = await models.users.User.find({ id: { $in: authorIds } }).lean();
		const userMap: Record<string, any> = {};

		await Promise.all(
			authorIds.map(async (id) => {
				try {
					if (process.env.DISCORD_CLIENT_TOKEN) {
						const discordRes = await fetch(`https://discord.com/api/v10/users/${id}`, {
							headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
							next: { revalidate: 3600 },
						});

						if (discordRes.ok) {
							const data = await discordRes.json();
							userMap[id] = {
								name: data.global_name || data.username,
								icon: data.avatar ? `https://cdn.discordapp.com/avatars/${id}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,
							};
							return; // successfully fetched from discord
						}
					}
				} catch (e) {
					console.error('Failed to fetch Discord user for suggestion:', e);
				}

				// Fallback to database
				const dbUser = users.find((u) => u.id === id);
				if (dbUser) {
					userMap[id] = { name: dbUser.name, icon: dbUser.icon };
				} else {
					userMap[id] = { name: 'Unknown User', icon: null };
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
		return NextResponse.json({ data: suggestion });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
