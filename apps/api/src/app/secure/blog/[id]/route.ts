/** @format */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';
import { computeReadingTime, sanitizeSlug, serializeBlogPost } from '@/lib/defaultBlogPosts';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['announcements']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Missing announcements permission.' }, { status: 403 });
		}

		const { id } = await params;
		const body = await req.json();

		const { models } = await database('xernerx');
		const BlogPost = (models.core as any).BlogPost;
		const Announcement = (models.core as any).Announcement;

		const doc = await BlogPost.findOne({ $or: [{ id }, { slug: id }] });
		if (!doc) {
			return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
		}

		if (typeof body.title === 'string' && body.title.trim()) {
			doc.title = body.title.trim();
		}
		if (typeof body.slug === 'string' && body.slug.trim()) {
			const nextSlug = sanitizeSlug(body.slug);
			if (nextSlug && nextSlug !== doc.slug) {
				const collision = await BlogPost.findOne({ slug: nextSlug, id: { $ne: doc.id } }).lean();
				if (collision) {
					return NextResponse.json({ error: 'Slug is already in use by another article.' }, { status: 409 });
				}
				doc.slug = nextSlug;
			}
		}
		if (typeof body.subtitle === 'string') {
			doc.subtitle = body.subtitle.trim();
		}
		if (typeof body.content === 'string' && body.content.trim()) {
			doc.content = body.content.trim();
			doc.readingTimeMinutes = computeReadingTime(doc.content);
		}
		if (body.coverImage !== undefined) {
			doc.coverImage = body.coverImage || null;
		}
		if (typeof body.coverGradient === 'string') {
			doc.coverGradient = body.coverGradient;
		}
		if (typeof body.category === 'string') {
			doc.category = body.category;
		}
		if (typeof body.audience === 'string') {
			doc.audience = body.audience;
		}
		if (Array.isArray(body.tags)) {
			doc.tags = body.tags.map((t: any) => String(t).trim()).filter(Boolean);
		}
		if (['public', 'limited', 'private'].includes(body.privacy)) {
			doc.privacy = body.privacy;
		}
		if (typeof body.featured === 'boolean') {
			doc.featured = body.featured;
		}
		if (body.publishedAt) {
			doc.publishedAt = new Date(body.publishedAt);
		}
		if (body.author && typeof body.author === 'object') {
			doc.author = {
				...doc.author,
				...body.author,
			};
		}

		const articleUrl = `https://blog.xernerx.com/${doc.slug}`;

		if (body.crossPostDiscord || body.createHeaderBanner) {
			const expiresAt = body.bannerExpiresAt ? new Date(body.bannerExpiresAt) : new Date(Date.now() + 48 * 3600 * 1000);
			const targetApps = Array.isArray(body.targetApps) && body.targetApps.length > 0 ? body.targetApps : ['all'];
			const webhookUrl = String(body.webhookUrl || '').trim();

			const embedPayload = {
				title: doc.title,
				url: articleUrl,
				description: doc.subtitle || doc.content.slice(0, 280),
				color: 0x8b7cf6,
				footer: {
					text: `${doc.author?.globalName || 'Xernerx Studios'} • ${doc.readingTimeMinutes} min read`,
				},
				timestamp: new Date(doc.publishedAt || Date.now()).toISOString(),
			};

			const componentsPayload = [
				{
					type: 1,
					components: [
						{
							type: 2,
							style: 5,
							label: 'Read Full Article',
							url: articleUrl,
						},
					],
				},
			];

			const isScheduledFuture = new Date(doc.publishedAt || Date.now()).getTime() > Date.now() + 5000;
			const defaultChannelId = body.channelId || (body.crossPostDiscord ? '941426815854055484' : '');

			const announcementDoc = await Announcement.create({
				id: crypto.randomUUID(),
				title: doc.title,
				channelId: defaultChannelId,
				webhookUrl: webhookUrl || 'https://blog.xernerx.com',
				message: {
					content: body.discordPingContent || doc.subtitle || 'Read the full update on blog.xernerx.com',
					embeds: [embedPayload],
					components: componentsPayload,
				},
				scheduledFor: doc.publishedAt,
				startsAt: doc.publishedAt,
				expiresAt: body.createHeaderBanner ? expiresAt : doc.publishedAt,
				targetApps,
				link: articleUrl,
				blogSlug: doc.slug,
				sentAt: body.crossPostDiscord ? null : isScheduledFuture ? null : new Date(),
			});

			doc.linkedAnnouncementId = announcementDoc.id;

			if (!isScheduledFuture && body.crossPostDiscord && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
				try {
					const webhookRes = await fetch(`${webhookUrl}?wait=true`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							content: body.discordPingContent || '',
							embeds: [embedPayload],
							components: componentsPayload,
						}),
					});
					if (webhookRes.ok) {
						const webhookData = await webhookRes.json();
						announcementDoc.discordMessageId = webhookData.id;
						announcementDoc.sentAt = new Date();
						await announcementDoc.save();
					}
				} catch (err) {
					console.warn('Failed to cross-post updated blog article to Discord:', err);
				}
			}
		}

		await doc.save();

		await recordAuditLog(req, {
			action: 'blog.updated',
			targetType: 'system',
			targetId: doc.id,
			summary: `Updated blog post "${doc.title}" (/blog/${doc.slug})`,
			metadata: {
				slug: doc.slug,
				category: doc.category,
				privacy: doc.privacy,
			},
		});

		return NextResponse.json(serializeBlogPost(doc, caller.userId, true));
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['announcements']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Missing announcements permission.' }, { status: 403 });
		}

		const { id } = await params;
		const { models } = await database('xernerx');
		const BlogPost = (models.core as any).BlogPost;

		const doc = await BlogPost.findOneAndDelete({ $or: [{ id }, { slug: id }] });
		if (!doc) {
			return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
		}

		await recordAuditLog(req, {
			action: 'blog.deleted',
			targetType: 'system',
			targetId: doc.id,
			summary: `Deleted blog post "${doc.title}" (/blog/${doc.slug})`,
		});

		return NextResponse.json({ deleted: true, id: doc.id });
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
