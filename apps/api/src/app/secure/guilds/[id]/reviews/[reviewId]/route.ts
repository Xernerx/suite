/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; reviewId: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, reviewId } = await params;
		const userId = session.user.id;

		const body = await request.json();
		const { action, devResponse, reply } = body;

		const db = await database('xernerx');
		const ReviewModel = (db.models.guilds as any).Review;
		const GuildModel = (db.models.guilds as any).Guild;

		const review = await ReviewModel.findById(reviewId);
		if (!review) {
			return NextResponse.json({ error: 'Review not found' }, { status: 404 });
		}

		if (action === 'devResponse' || action === 'reply') {
			const guild = await GuildModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
			const isOwner = Boolean(guild && (guild.owner === userId || guild.ownerId === userId || (Array.isArray(guild.owners) && guild.owners.includes(userId))));
			if (!isOwner) {
				return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
			}

			const responseText = typeof devResponse === 'string' ? devResponse : typeof reply === 'string' ? reply : reply?.content || '';
			if (responseText.length > 2000) {
				return NextResponse.json({ error: 'Response too long' }, { status: 400 });
			}

			review.devResponse = responseText;
			review.reply = {
				authorId: userId,
				content: responseText,
				updatedAt: new Date(),
			};
		} else if (action === 'upvote' || action === 'helpful') {
			review.downvotes = (review.downvotes || []).filter((uid: string) => uid !== userId);
			if ((review.upvotes || []).includes(userId)) {
				review.upvotes = review.upvotes.filter((uid: string) => uid !== userId);
			} else {
				review.upvotes = [...(review.upvotes || []), userId];
			}
			review.helpfulUserIds = [...review.upvotes];
		} else if (action === 'downvote') {
			review.upvotes = (review.upvotes || []).filter((uid: string) => uid !== userId);
			review.helpfulUserIds = [...review.upvotes];
			if ((review.downvotes || []).includes(userId)) {
				review.downvotes = review.downvotes.filter((uid: string) => uid !== userId);
			} else {
				review.downvotes = [...(review.downvotes || []), userId];
			}
		} else {
			return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
		}

		await review.save();

		if (action === 'devResponse' || action === 'reply') {
			return NextResponse.json({ success: true, message: 'Owner response updated', review }, { status: 200 });
		}

		return NextResponse.json({ success: true, review }, { status: 200 });
	} catch (error) {
		console.error('Failed to update guild review:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
