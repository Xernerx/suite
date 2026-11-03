/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';
import { ensureSeededBlogPosts, REACTION_KEYS, type ReactionKey, serializeBlogPost } from '@/lib/defaultBlogPosts';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
	try {
		const { slug } = await params;
		const { searchParams } = new URL(req.url);
		const isPreview = searchParams.get('preview') === 'true';

		const { models } = await database('xernerx');
		const BlogPost = (models.core as any).BlogPost;

		await ensureSeededBlogPosts(BlogPost);

		const caller = await resolveCallerAuth(req, ['announcements']).catch(() => ({
			authenticated: false,
			authorized: false,
			userId: null,
		}));

		const doc = await BlogPost.findOne({
			$or: [{ slug }, { id: slug }],
		});

		if (!doc) {
			return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
		}

		const isFutureScheduled = doc.publishedAt && new Date(doc.publishedAt).getTime() > Date.now();
		const isOwnerOrStaff = Boolean(caller.authorized || (caller.userId && doc.author?.id === caller.userId));

		// Universal 3-Tier Privacy Truth:
		// - public: accessible by anyone once publishedAt <= now
		// - limited: unlisted from directories, but accessible by anyone with direct link once publishedAt <= now
		// - private (or future scheduled): strictly owner/staff only
		if ((doc.privacy === 'private' || isFutureScheduled) && !isOwnerOrStaff) {
			return NextResponse.json({ error: 'Forbidden: This article is private or scheduled for future publication.' }, { status: 403 });
		}

		if (!isPreview) {
			doc.views = (typeof doc.views === 'number' ? doc.views : 0) + 1;
			await doc.save().catch(() => {});
		}

		const relatedDocs = await BlogPost.find({
			slug: { $ne: doc.slug },
			privacy: 'public',
			publishedAt: { $lte: new Date() },
		})
			.sort({ featured: -1, publishedAt: -1 })
			.limit(3)
			.lean();

		return NextResponse.json({
			post: serializeBlogPost(doc, caller.userId, true),
			related: relatedDocs.map((r: any) => serializeBlogPost(r, caller.userId, false)),
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
	try {
		const { slug } = await params;
		const caller = await resolveCallerAuth(req);
		if (!caller.authenticated || !caller.userId) {
			return NextResponse.json({ error: 'Authentication required to react to blog articles.' }, { status: 401 });
		}

		const body = await req.json().catch(() => ({}));
		const reaction = String(body.reaction || '') as ReactionKey;
		if (!REACTION_KEYS.includes(reaction)) {
			return NextResponse.json({ error: 'Invalid reaction type.' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const BlogPost = (models.core as any).BlogPost;

		const doc = await BlogPost.findOne({
			$or: [{ slug }, { id: slug }],
		});

		if (!doc) {
			return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
		}

		if (doc.privacy === 'private' && doc.author?.id !== caller.userId) {
			const staffCheck = await resolveCallerAuth(req, ['announcements']);
			if (!staffCheck.authorized) {
				return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
			}
		}

		if (!doc.reactions) {
			doc.reactions = { rocket: [], heart: [], sparkles: [], shield: [], fire: [] };
		}

		const currentList: string[] = Array.isArray(doc.reactions[reaction]) ? [...doc.reactions[reaction]] : [];
		const userIdStr = String(caller.userId);
		const existingIdx = currentList.indexOf(userIdStr);

		if (existingIdx >= 0) {
			currentList.splice(existingIdx, 1);
		} else {
			currentList.push(userIdStr);
		}

		doc.reactions[reaction] = currentList;
		doc.markModified('reactions');
		await doc.save();

		const serialized = serializeBlogPost(doc, userIdStr, false);
		return NextResponse.json({
			reactionCounts: serialized.reactionCounts,
			totalReactions: serialized.totalReactions,
			viewerReactions: serialized.viewerReactions,
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
