/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		if (!id) {
			return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const User = models.users.User as any;
		const Role = models.core.Role as any;
		const Issue = models.core.Issue as any;
		const Suggestion = models.core.Suggestion as any;
		const Application = models.dispatch.Application as any;
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;
		const BotReview = (models.bots as any)?.Review;
		const Bot = (models.bots as any)?.Bot;
		const GuildReview = (models.guilds as any)?.Review;
		const Guild = (models.guilds as any)?.Guild;

		const profile = await User.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] })
			.lean()
			.catch(() => null);
		const resolvedUserId = String(profile?.id || id);

		const isSystemToken = Boolean(req.headers.get('x-token-id'));
		const session = (await getServerSession(auth)) as any;
		const viewerId = session?.user?.id ? String(session.user.id) : null;
		const isOwner = Boolean(viewerId && (viewerId === resolvedUserId || viewerId === id));

		let isAuthorizedStaff = false;
		if (!isOwner && !isSystemToken && viewerId) {
			const viewerUser = await User.findOne({ id: viewerId })
				.select('roles')
				.lean()
				.catch(() => null);
			if (Array.isArray(viewerUser?.roles) && viewerUser.roles.length > 0 && Role) {
				const roleIds = viewerUser.roles.map((r: any) => (typeof r === 'string' ? r : r?.id)).filter(Boolean);
				const roleDocs = await Role.find({ id: { $in: roleIds } })
					.select('permissions')
					.lean()
					.catch(() => []);
				isAuthorizedStaff = roleDocs.some((r: any) => Boolean(r?.permissions?.users || r?.permissions?.applications_review || r?.permissions?.applications_manage));
			}
		}

		if (!isOwner && !isSystemToken && !isAuthorizedStaff) {
			return NextResponse.json({ error: 'Forbidden: You can only view your own account activity.' }, { status: 403 });
		}

		const [issues, suggestions, applications, appConfigs, botReviewsRaw, guildReviewsRaw] = await Promise.all([
			Issue.find({ authorId: resolvedUserId })
				.sort({ createdAt: -1 })
				.lean()
				.catch(() => []),
			Suggestion.find({ $or: [{ authorId: resolvedUserId }, { 'author.id': resolvedUserId }] })
				.sort({ createdAt: -1 })
				.lean()
				.catch(() => []),
			Application.find({ ownerId: resolvedUserId })
				.sort({ createdAt: -1 })
				.lean()
				.catch(() => []),
			ApplicationConfig.find({})
				.lean()
				.catch(() => []),
			BotReview
				? BotReview.find({ userId: resolvedUserId })
						.sort({ createdAt: -1 })
						.lean()
						.catch(() => [])
				: Promise.resolve([]),
			GuildReview
				? GuildReview.find({ userId: resolvedUserId })
						.sort({ createdAt: -1 })
						.lean()
						.catch(() => [])
				: Promise.resolve([]),
		]);

		const botIds = [...new Set((botReviewsRaw || []).map((r: any) => r.botId).filter(Boolean))];
		const guildIds = [...new Set((guildReviewsRaw || []).map((r: any) => r.guildId).filter(Boolean))];

		const [botDocs, guildDocs] = await Promise.all([
			Bot && botIds.length > 0
				? Bot.find({ id: { $in: botIds } })
						.select('id name icon vanitySlug')
						.lean()
						.catch(() => [])
				: Promise.resolve([]),
			Guild && guildIds.length > 0
				? Guild.find({ id: { $in: guildIds } })
						.select('id name icon vanitySlug')
						.lean()
						.catch(() => [])
				: Promise.resolve([]),
		]);

		const botMap = new Map<string, any>((botDocs || []).map((b: any) => [String(b.id), b]));
		const guildMap = new Map<string, any>((guildDocs || []).map((g: any) => [String(g.id), g]));

		const reviews = [
			...(botReviewsRaw || []).map((r: any) => {
				const bot = botMap.get(String(r.botId));
				return {
					id: String(r._id || `bot-${r.botId}`),
					targetType: 'bot',
					targetId: String(r.botId),
					targetName: bot?.name || String(r.botId),
					targetSlug: bot?.vanitySlug || String(r.botId),
					rating: Number(r.rating || 5),
					content: r.content || '',
					createdAt: r.createdAt || r.updatedAt || new Date().toISOString(),
				};
			}),
			...(guildReviewsRaw || []).map((r: any) => {
				const guild = guildMap.get(String(r.guildId));
				return {
					id: String(r._id || `guild-${r.guildId}`),
					targetType: 'server',
					targetId: String(r.guildId),
					targetName: guild?.name || String(r.guildId),
					targetSlug: guild?.vanitySlug || String(r.guildId),
					rating: Number(r.rating || 5),
					content: r.content || '',
					createdAt: r.createdAt || r.updatedAt || new Date().toISOString(),
				};
			}),
		].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		const configMap = new Map<string, any>();
		for (const cfg of appConfigs) {
			if (cfg.id) configMap.set(String(cfg.id), cfg);
			if (cfg._id) configMap.set(String(cfg._id), cfg);
		}

		const enrichedApplications = applications.map((app: any) => {
			const cfg = configMap.get(String(app.targetId));
			return {
				...app,
				configTitle: cfg?.name || cfg?.title || app.targetId || 'Application',
				configDescription: cfg?.description || '',
				questions: Array.isArray(cfg?.questions) ? cfg.questions : [],
			};
		});

		return NextResponse.json({
			profile: profile || { id },
			issues,
			suggestions,
			applications: enrichedApplications,
			reviews,
			exportedAt: new Date().toISOString(),
		});
	} catch (error: any) {
		console.error('[API] Failed to fetch user activity:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
