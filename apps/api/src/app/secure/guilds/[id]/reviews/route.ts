/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

async function resolveGuild(db: any, idOrSlug: string) {
	const GuildModel = (db.models.guilds as any).Guild;
	const guild = await GuildModel.findOne({ $or: [{ id: idOrSlug }, { vanitySlug: idOrSlug.toLowerCase() }] }).lean();
	return { guild, guildId: guild?.id || idOrSlug };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('xernerx');
		const { guild, guildId } = await resolveGuild(db, id);

		const session = (await getServerSession(auth)) as any;
		const sessionUserId = session?.user?.id;
		const isOwner = Boolean(sessionUserId && guild && (guild.owner === sessionUserId || guild.ownerId === sessionUserId));
		if (guild?.privacy === 'private' && !isOwner) {
			return NextResponse.json({ error: 'This server is private.' }, { status: 403 });
		}

		const ReviewModel = (db.models.guilds as any).Review;
		const reviews = await ReviewModel.find({ guildId }).sort({ createdAt: -1 }).lean();

		const userIds = [...new Set(reviews.map((r: any) => r.userId))] as string[];
		const userProfiles = await Promise.all(
			userIds.map(async (uid: string) => {
				try {
					const res = await fetch(`https://discord.com/api/v10/users/${uid}`, {
						headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
						next: { revalidate: 3600 },
					});
					if (res.ok) return await res.json();
				} catch (e) {
					console.error(`Failed to fetch discord user ${uid}`, e);
				}
				return { id: uid };
			})
		);
		const profileMap = new Map(userProfiles.map((p: any) => [p.id, p]));

		const populatedReviews = reviews.map((r: any) => ({
			...r,
			user: profileMap.get(r.userId) || null,
		}));

		return NextResponse.json(populatedReviews, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch guild reviews:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const userId = session.user.id;

		const body = await request.json();
		const { rating, content } = body;

		if (!rating || rating < 1 || rating > 5) {
			return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
		}

		if (content && content.length > 2000) {
			return NextResponse.json({ error: 'Content too long' }, { status: 400 });
		}

		const db = await database('xernerx');
		const { guildId } = await resolveGuild(db, id);
		const ReviewModel = (db.models.guilds as any).Review;

		await ReviewModel.updateOne({ guildId, userId }, { $set: { rating, content } }, { upsert: true });

		return NextResponse.json({ success: true, message: 'Review saved successfully' }, { status: 201 });
	} catch (error) {
		console.error('Failed to save guild review:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const userId = session.user.id;

		const db = await database('xernerx');
		const { guildId } = await resolveGuild(db, id);
		const ReviewModel = (db.models.guilds as any).Review;

		await ReviewModel.deleteOne({ guildId, userId });

		return NextResponse.json({ success: true, message: 'Review deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete guild review:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
