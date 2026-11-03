/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { normalizeVanitySlug, unlockVanityWithUserCredits, VANITY_SLUG_REGEX } from '@/lib/vanityUnlock';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

const OFFICIAL_BOT_SLUG_TO_ID: Record<string, string> = {
	virtue: '1484880634844287138',
	todo: '782105629572464652',
	'to-do-list': '782105629572464652',
	'to-do-list-bot': '782105629572464652',
	tdl: '782105629572464652',
	metamorphosis: '881678826906730547',
	zodiac: '950251264095162418',
};

const OFFICIAL_BOT_ID_TO_SLUG: Record<string, string> = {
	'1484880634844287138': 'virtue',
	'782105629572464652': 'todo',
	'881678826906730547': 'metamorphosis',
	'950251264095162418': 'zodiac',
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const id = (await params).id;
		const lowerId = id.toLowerCase();
		const mappedOfficialId = OFFICIAL_BOT_SLUG_TO_ID[lowerId];
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;

		const bot = await BotModel.findOne({
			$or: [{ id }, { vanitySlug: lowerId }, ...(mappedOfficialId ? [{ id: mappedOfficialId }] : [])],
		}).lean();

		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		}

		const botId = bot.id;
		if (!bot.vanitySlug && OFFICIAL_BOT_ID_TO_SLUG[botId]) {
			bot.vanitySlug = OFFICIAL_BOT_ID_TO_SLUG[botId];
		}

		// Dynamically compute the overall vote count from the distinct votes collection
		const VoteModel = (db.models.bots as any).Vote;
		const CommandModel = (db.models.bots as any).Command;
		const StatModel = (db.models.bots as any).Stat;
		const ReviewModel = (db.models.bots as any).Review;
		const UserModel = (db.models.users as any)?.User;
		bot.voteCount = await VoteModel.countDocuments({ botId });

		// Attach latest telemetry snapshot & all-time peaks for Profile Overview & Milestones
		if (StatModel) {
			const [latestStat, peakAgg] = await Promise.all([
				StatModel.findOne({ id: botId })
					.sort({ timestamp: -1 })
					.lean()
					.catch(() => null),
				StatModel.aggregate([
					{ $match: { id: botId } },
					{
						$group: {
							_id: null,
							maxGuilds: { $max: '$guildCount' },
							maxUsers: { $max: '$userCount' },
						},
					},
				]).catch(() => []),
			]);

			if (latestStat) {
				bot.latestStat = latestStat;
				bot.guildCount = latestStat.guildCount ?? latestStat.servers ?? 0;
				bot.userCount = latestStat.userCount ?? latestStat.users ?? 0;
				bot.shardCount = latestStat.shardCount ?? (Array.isArray(latestStat.shards) ? latestStat.shards.length : 0);
				bot.onlineSince = latestStat.onlineSince ?? 0;
			}
			bot.peakStats = {
				guildCount: Math.max(Number(peakAgg?.[0]?.maxGuilds) || 0, Number(bot.guildCount) || 0),
				userCount: Math.max(Number(peakAgg?.[0]?.maxUsers) || 0, Number(bot.userCount) || 0),
			};
		}

		// Attach review summary & top 2 helpful reviews
		if (ReviewModel) {
			const allReviews = await ReviewModel.find({ botId })
				.sort({ createdAt: -1 })
				.lean()
				.catch(() => []);
			const totalCount = allReviews.length;
			const avgRating = totalCount > 0 ? Number((allReviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0) / totalCount).toFixed(1)) : 0;
			const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
			for (const r of allReviews) {
				const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
				breakdown[star] = (breakdown[star] || 0) + 1;
			}

			const topReviewsRaw = [...allReviews]
				.sort((a: any, b: any) => {
					const scoreA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
					const scoreB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
					if (scoreB !== scoreA) return scoreB - scoreA;
					return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
				})
				.slice(0, 2);

			const reviewerIds = Array.from(new Set(topReviewsRaw.map((r: any) => r.userId).filter(Boolean)));
			const userDocs =
				UserModel && reviewerIds.length > 0
					? await UserModel.find({ id: { $in: reviewerIds } })
							.lean()
							.catch(() => [])
					: [];
			const userDocMap = new Map<string, any>((userDocs || []).map((u: any) => [u.id, u]));

			const recentReviews = await Promise.all(
				topReviewsRaw.map(async (r: any) => {
					const stored = userDocMap.get(r.userId);
					if (stored) {
						return {
							...r,
							user: {
								id: stored.id,
								username: stored.username || stored.name,
								global_name: stored.globalName || stored.global_name || stored.username || stored.name,
								avatar: stored.avatar,
								avatarUrl: stored.avatarUrl || stored.image,
							},
						};
					}
					if (process.env.DISCORD_CLIENT_TOKEN && r.userId) {
						try {
							const dRes = await fetch(`https://discord.com/api/v10/users/${r.userId}`, {
								headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
								next: { revalidate: 3600 },
							});
							if (dRes.ok) {
								return { ...r, user: await dRes.json() };
							}
						} catch {}
					}
					return { ...r, user: { id: r.userId } };
				})
			);

			bot.reviewSummary = {
				count: totalCount,
				average: avgRating,
				breakdown,
				recent: recentReviews,
			};
		}

		// Attach related bots (More by this developer & Similar bots by tags)
		try {
			const ownerList = Array.isArray(bot.owners) ? bot.owners.filter(Boolean) : [];
			const tagList = Array.isArray(bot.tags) ? bot.tags.filter(Boolean) : [];

			const devConditions: any[] = [];
			if (ownerList.length > 0) devConditions.push({ owners: { $in: ownerList } });
			if (bot.organization) devConditions.push({ organization: bot.organization });

			const developerBotsRaw =
				devConditions.length > 0
					? await BotModel.find({
							id: { $ne: botId },
							privacy: 'public',
							$or: devConditions,
						})
							.select('id vanitySlug name avatar description verified tags voteCount status discordCache')
							.limit(4)
							.lean()
							.catch(() => [])
					: [];

			const devBotIds = new Set<string>([botId, ...developerBotsRaw.map((b: any) => b.id)]);

			const similarBotsRaw =
				tagList.length > 0
					? await BotModel.find({
							id: { $nin: Array.from(devBotIds) },
							privacy: 'public',
							tags: { $in: tagList },
						})
							.select('id vanitySlug name avatar description verified tags voteCount status discordCache')
							.limit(4)
							.lean()
							.catch(() => [])
					: [];

			const allRelatedIds = Array.from(new Set([...developerBotsRaw.map((b: any) => b.id), ...similarBotsRaw.map((b: any) => b.id)]));
			const [relatedStats, relatedVotes] = await Promise.all([
				StatModel && allRelatedIds.length > 0
					? StatModel.aggregate([
							{ $match: { id: { $in: allRelatedIds } } },
							{ $sort: { timestamp: -1 } },
							{
								$group: {
									_id: '$id',
									guildCount: { $first: '$guildCount' },
									userCount: { $first: '$userCount' },
								},
							},
						]).catch(() => [])
					: [],
				VoteModel && allRelatedIds.length > 0 ? VoteModel.aggregate([{ $match: { botId: { $in: allRelatedIds } } }, { $group: { _id: '$botId', count: { $sum: 1 } } }]).catch(() => []) : [],
			]);

			const statMap = new Map<string, any>((relatedStats || []).map((s: any) => [s._id, s]));
			const voteMap = new Map<string, any>((relatedVotes || []).map((v: any) => [v._id, v.count]));

			const enrichBotSummary = (b: any) => {
				const st = statMap.get(b.id);
				const dc = b.discordCache;
				return {
					...b,
					name: dc?.globalName || dc?.username || b.name,
					avatar: b.avatar || dc?.avatarUrl || dc?.avatar,
					discord: dc?.username
						? {
								id: b.id,
								username: dc.username,
								global_name: dc.globalName || dc.username,
								avatar: dc.avatar || b.avatar,
								avatarUrl: dc.avatarUrl || null,
							}
						: undefined,
					guildCount: st?.guildCount ?? 0,
					userCount: st?.userCount ?? 0,
					voteCount: voteMap.get(b.id) ?? b.voteCount ?? 0,
				};
			};

			bot.relatedBots = {
				developerBots: developerBotsRaw.map(enrichBotSummary),
				similarBots: similarBotsRaw.map(enrichBotSummary),
			};
		} catch {}

		if (CommandModel && (!Array.isArray(bot.commands) || bot.commands.length === 0)) {
			const syncedCmds = await CommandModel.find({ botId })
				.sort({ type: 1, name: 1 })
				.lean()
				.catch(() => []);
			if (syncedCmds.length > 0) {
				bot.commands = syncedCmds.map((c: any) => ({
					...(c.body && typeof c.body === 'object' ? c.body : {}),
					name: c.name || c.body?.name,
					description: c.description || c.body?.description || '',
					type: c.type || c.body?.type || 1,
				}));
			}
		}

		if (bot.organization) {
			const OrganizationModel = (db.models.organizations as any).Organization;
			const org = await OrganizationModel.findById(bot.organization).lean();
			if (org) {
				bot.organizationData = org;
			}
		}

		// Fetch Discord Profile (with discordCache fallback & persistence)
		try {
			const tokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];
			let discordUser: any = null;

			for (const token of tokens) {
				const discordRes = await fetch(`https://discord.com/api/v10/users/${botId}`, {
					headers: { Authorization: `Bot ${token}` },
					next: { revalidate: 3600 },
				}).catch(() => null);
				if (discordRes?.ok) {
					discordUser = await discordRes.json();
					break;
				}
			}

			if (discordUser) {
				const avatarUrl = discordUser.avatar ? `https://cdn.discordapp.com/avatars/${botId}/${discordUser.avatar}.${discordUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null;
				const bannerUrl = discordUser.banner ? `https://cdn.discordapp.com/banners/${botId}/${discordUser.banner}.${discordUser.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null;
				bot.discord = {
					...discordUser,
					avatarUrl,
					bannerUrl,
				};
				setTimeout(async () => {
					try {
						await BotModel.updateOne(
							{ id: botId },
							{
								$set: {
									discordCache: {
										username: discordUser.username || '',
										globalName: discordUser.global_name || discordUser.globalName || discordUser.username || '',
										avatar: discordUser.avatar || '',
										banner: discordUser.banner || '',
										avatarUrl: avatarUrl || '',
										bannerUrl: bannerUrl || '',
										updatedAt: new Date(),
									},
								},
							}
						).catch(() => {});
					} catch {}
				}, 0);
			} else if (bot.discordCache?.username || bot.name) {
				const dc = bot.discordCache || {};
				bot.discord = {
					id: botId,
					username: dc.username || bot.name || botId,
					global_name: dc.globalName || bot.name || dc.username || botId,
					avatar: dc.avatar || bot.avatar || null,
					banner: dc.banner || null,
					avatarUrl:
						dc.avatarUrl ||
						(dc.avatar
							? `https://cdn.discordapp.com/avatars/${botId}/${dc.avatar}.png?size=1024`
							: bot.avatar
								? String(bot.avatar).startsWith('http')
									? bot.avatar
									: `https://cdn.discordapp.com/avatars/${botId}/${bot.avatar}.png?size=1024`
								: null),
					bannerUrl: dc.bannerUrl || null,
					bot: true,
				};
			}

			if (Array.isArray(bot.owners) && bot.owners.length > 0) {
				const ownerDocs = UserModel
					? await UserModel.find({ id: { $in: bot.owners } })
							.select('id name icon vanitySlug discordCache')
							.lean()
							.catch(() => [])
					: [];
				const ownerDocMap = new Map<string, any>((ownerDocs || []).map((u: any) => [String(u.id), u]));

				const ownersData = await Promise.all(
					bot.owners.map(async (ownerId: string) => {
						const doc = ownerDocMap.get(String(ownerId));
						const dc = doc?.discordCache;
						if (dc?.username) {
							return {
								id: ownerId,
								vanitySlug: doc?.vanitySlug || undefined,
								username: dc.username,
								global_name: dc.globalName || dc.username,
								avatar: dc.avatar || null,
								avatarUrl: dc.avatarUrl || (dc.avatar ? `https://cdn.discordapp.com/avatars/${ownerId}/${dc.avatar}.png?size=128` : doc?.icon || null),
								discriminator: '0',
							};
						}
						for (const token of tokens) {
							try {
								const res = await fetch(`https://discord.com/api/v10/users/${ownerId}`, {
									headers: { Authorization: `Bot ${token}` },
									next: { revalidate: 3600 },
								});
								if (res.ok) {
									const dJson = await res.json();
									return { ...dJson, vanitySlug: doc?.vanitySlug || undefined };
								}
							} catch {}
						}
						if (doc?.name) {
							return {
								id: ownerId,
								vanitySlug: doc?.vanitySlug || undefined,
								username: doc.name,
								global_name: doc.name,
								avatar: null,
								avatarUrl: doc.icon || null,
								discriminator: '0',
							};
						}
						return null;
					})
				);
				bot.ownersData = ownersData.filter(Boolean);
			}
		} catch (e) {
			console.error('Failed to fetch Discord user:', e);
		}

		bot.vanityUnlocked = Boolean(bot.vanityUnlocked || bot.vanitySlug || bot.verified);
		return NextResponse.json(bot, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bot profile:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const id = (await params).id;
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;

		const body = await request.json();

		const bot = await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] });
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		}

		const caller = await resolveCallerAuth(request, ['bots']);
		const isStaffOrSystem = Boolean(caller.isSystemToken || caller.authorized);
		const session = (await getServerSession(auth).catch(() => null)) as any;
		const actorUserId = caller.userId || session?.user?.id || (Array.isArray(bot.owners) ? bot.owners[0] : undefined);
		const isVanityAlreadyUnlocked = Boolean(bot.vanityUnlocked || bot.vanitySlug || bot.verified || (isStaffOrSystem && (body.vanityUnlocked || body.verified)));

		if (body.action === 'unlock_vanity') {
			if (!isVanityAlreadyUnlocked) {
				const unlockRes = await unlockVanityWithUserCredits(db.models, actorUserId, bot.name || `Bot ${bot.id}`);
				if (!unlockRes.ok) {
					return NextResponse.json({ error: unlockRes.error }, { status: 403 });
				}
				bot.vanityUnlocked = true;
				await bot.save();
				const unlockedObj = bot.toObject ? bot.toObject() : bot;
				return NextResponse.json(
					{
						...unlockedObj,
						bot: Boolean(unlockedObj.bot ?? true),
						vanityUnlocked: true,
						vanitySlug: unlockedObj.vanitySlug || '',
						usedSlot: unlockRes.usedSlot,
						cost: unlockRes.cost,
						message: 'Unlocked successfully',
					},
					{ status: 200 }
				);
			}
			const existingObj = bot.toObject ? bot.toObject() : bot;
			return NextResponse.json(
				{ ...existingObj, bot: Boolean(existingObj.bot ?? true), vanityUnlocked: true, vanitySlug: existingObj.vanitySlug || '', message: 'Already unlocked' },
				{ status: 200 }
			);
		}

		if (body.vanitySlug !== undefined) {
			const rawSlug = normalizeVanitySlug(body.vanitySlug);
			if (rawSlug === '') {
				bot.vanitySlug = undefined;
			} else {
				if (!isVanityAlreadyUnlocked && !isStaffOrSystem) {
					return NextResponse.json({ error: 'Custom Vanity URL is locked. Unlock it first before setting a vanity slug.' }, { status: 403 });
				}
				if (!VANITY_SLUG_REGEX.test(rawSlug)) {
					return NextResponse.json({ error: 'Vanity slug must be 2-32 characters (lowercase letters, numbers, and hyphens).' }, { status: 400 });
				}
				const existing = await BotModel.findOne({ vanitySlug: rawSlug, id: { $ne: bot.id } }).lean();
				if (existing) {
					return NextResponse.json({ error: 'This vanity slug is already taken.' }, { status: 409 });
				}
				bot.vanityUnlocked = true;
				bot.vanitySlug = rawSlug;
			}
		}

		const updatableFields = [
			'name',
			'description',
			'info',
			'privacy',
			'widgets',
			'owners',
			'organization',
			'tags',
			'commands',
			'releases',
			...(isStaffOrSystem ? ['verified', 'vanityUnlocked', 'voteCount', 'promotedUntil', 'boostedUntil'] : []),
		];
		const linksFields = ['invite', 'support', 'community', 'github', 'website', 'privacy', 'terms', 'dashboard'];

		if (body.links && typeof body.links === 'object') {
			if (!bot.links) bot.links = {};
			for (const field of linksFields) {
				if (body.links[field] !== undefined) bot.links[field] = body.links[field];
			}
		}

		for (const field of updatableFields) {
			if (body[field] !== undefined) bot[field] = body[field];
		}

		if (typeof body.bot === 'boolean') {
			bot.bot = body.bot;
		}

		await bot.save();
		const savedObj = bot.toObject ? bot.toObject() : bot;

		await recordAuditLog(request, {
			action: 'bot.update',
			targetType: 'bot',
			targetId: bot.id,
			summary: `Updated bot profile "${savedObj.name || bot.id}"`,
			metadata: {
				privacy: savedObj.privacy,
				verified: Boolean(savedObj.verified),
				vanitySlug: savedObj.vanitySlug || '',
			},
		});

		return NextResponse.json(
			{
				...savedObj,
				bot: Boolean(savedObj.bot ?? true),
				widgets: Boolean(savedObj.widgets),
				vanityUnlocked: Boolean(savedObj.vanityUnlocked || savedObj.vanitySlug || savedObj.verified),
				vanitySlug: savedObj.vanitySlug || '',
				message: 'Updated successfully',
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Failed to update bot profile:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const id = (await params).id;
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;

		const targetBot = await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] })
			.select('id name')
			.lean();
		const result = await BotModel.deleteOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] });
		if (result.deletedCount === 0) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		}

		const targetBotId = targetBot?.id || id;
		const botModels = db.models.bots as any;
		await Promise.all([
			botModels?.Vote?.deleteMany({ $or: [{ botId: targetBotId }, { id: targetBotId }] }).catch(() => {}),
			botModels?.Review?.deleteMany({ $or: [{ botId: targetBotId }, { id: targetBotId }] }).catch(() => {}),
			botModels?.Stat?.deleteMany({ $or: [{ botId: targetBotId }, { id: targetBotId }] }).catch(() => {}),
			botModels?.Command?.deleteMany({ $or: [{ botId: targetBotId }, { id: targetBotId }] }).catch(() => {}),
			botModels?.Hook?.deleteMany({ $or: [{ botId: targetBotId }, { id: targetBotId }] }).catch(() => {}),
		]);

		const TokenModel = (db.models.users as any)?.Token;
		if (TokenModel) {
			await TokenModel.updateMany({ botId: targetBotId }, { $unset: { botId: 1 }, $set: { status: 'pending' } }).catch(() => {});
		}

		await recordAuditLog(request, {
			action: 'bot.delete',
			targetType: 'bot',
			targetId: targetBot?.id || id,
			summary: `Deleted bot "${targetBot?.name || targetBot?.id || id}"`,
		});

		return NextResponse.json({ message: 'Bot deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete bot profile:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
