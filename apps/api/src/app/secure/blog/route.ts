/** @format */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';
import { computeReadingTime, ensureSeededBlogPosts, sanitizeSlug, serializeBlogPost } from '@/lib/defaultBlogPosts';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
	try {
		const caller = await resolveCallerAuth(req, ['announcements']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Missing announcements permission.' }, { status: 403 });
		}

		const { models } = await database('xernerx');
		const BlogPost = (models.core as any).BlogPost;

		await ensureSeededBlogPosts(BlogPost);

		const docs = await BlogPost.find({}).sort({ publishedAt: -1, createdAt: -1 }).lean();
		return NextResponse.json(docs.map((d: any) => serializeBlogPost(d, caller.userId, true)));
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const caller = await resolveCallerAuth(req, ['announcements']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Missing announcements permission.' }, { status: 403 });
		}

		const body = await req.json();
		const title = String(body.title || '').trim();
		const content = String(body.content || '').trim();
		if (!title || !content) {
			return NextResponse.json({ error: 'Title and article content are required.' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const BlogPost = (models.core as any).BlogPost;
		const Announcement = (models.core as any).Announcement;
		const Dispatch = (models.dispatch as any).Invite;

		let baseSlug = sanitizeSlug(body.slug || title) || `post-${Date.now()}`;
		const existingSlug = await BlogPost.findOne({ slug: baseSlug }).lean();
		if (existingSlug) {
			baseSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
		}

		const readingTimeMinutes = computeReadingTime(content);
		const publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();
		const articleUrl = `https://blog.xernerx.com/${baseSlug}`;

		const newPost = await BlogPost.create({
			id: crypto.randomUUID(),
			slug: baseSlug,
			title,
			subtitle: String(body.subtitle || '').trim(),
			content,
			coverImage: body.coverImage || null,
			coverGradient: body.coverGradient || 'accent',
			category: body.category || 'announcements',
			audience: body.audience || 'all',
			tags: Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : [],
			privacy: ['public', 'limited', 'private'].includes(body.privacy) ? body.privacy : 'public',
			featured: Boolean(body.featured),
			readingTimeMinutes,
			author: {
				id: caller.userId || body.author?.id || 'system',
				username: body.author?.username || 'Xernerx Studios',
				globalName: body.author?.globalName || body.author?.username || 'Xernerx Studios',
				avatar: body.author?.avatar || null,
				role: body.author?.role || 'Xernerx Staff',
			},
			publishedAt,
		});

		// Optional 1-Click Cross-Post to Discord Webhook & Suite Header Banner
		if (body.crossPostDiscord || body.createHeaderBanner) {
			const expiresAt = body.bannerExpiresAt ? new Date(body.bannerExpiresAt) : new Date(Date.now() + 48 * 3600 * 1000);
			const targetApps = Array.isArray(body.targetApps) && body.targetApps.length > 0 ? body.targetApps : ['all'];
			const webhookUrl = String(body.webhookUrl || '').trim();

			const embedPayload = {
				title: newPost.title,
				url: articleUrl,
				description: newPost.subtitle || content.slice(0, 280) + (content.length > 280 ? '...' : ''),
				color: 0x8b7cf6,
				footer: {
					text: `${newPost.author?.globalName || 'Xernerx Studios'} • ${readingTimeMinutes} min read`,
				},
				timestamp: publishedAt.toISOString(),
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

			if (body.createHeaderBanner || webhookUrl) {
				const announcementDoc = await Announcement.create({
					id: crypto.randomUUID(),
					title: newPost.title,
					channelId: body.channelId || '',
					webhookUrl: webhookUrl || 'https://blog.xernerx.com',
					message: {
						content: newPost.subtitle || `New article published on blog.xernerx.com`,
						embeds: [embedPayload],
						components: componentsPayload,
					},
					scheduledFor: publishedAt,
					startsAt: publishedAt,
					expiresAt: body.createHeaderBanner ? expiresAt : publishedAt,
					targetApps,
					link: articleUrl,
					blogSlug: newPost.slug,
				});

				newPost.linkedAnnouncementId = announcementDoc.id;
				await newPost.save();

				if (body.crossPostDiscord && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
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
					} catch (webhookErr) {
						console.warn('Blog Discord cross-post webhook error:', webhookErr);
					}
				}

				await Dispatch.create({
					id: crypto.randomUUID(),
					senderId: 'system',
					targetId: 'global',
					category: 'announcement',
					type: 'info',
					data: {
						title: newPost.title,
						message: newPost.subtitle || 'Read the latest article on blog.xernerx.com',
						link: articleUrl,
						startsAt: publishedAt.toISOString(),
						expiresAt: expiresAt.toISOString(),
						targetApps,
					},
					status: 'pending',
				});
			}
		}

		await recordAuditLog(req, {
			action: 'blog.created',
			targetType: 'system',
			targetId: newPost.id,
			summary: `Published blog post "${newPost.title}" (/blog/${newPost.slug})`,
			metadata: {
				slug: newPost.slug,
				category: newPost.category,
				privacy: newPost.privacy,
				crossPostDiscord: Boolean(body.crossPostDiscord),
				createHeaderBanner: Boolean(body.createHeaderBanner),
			},
		});

		return NextResponse.json(serializeBlogPost(newPost, caller.userId, true), { status: 201 });
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
