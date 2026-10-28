/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { normalizeVanitySlug, unlockVanityWithUserCredits, VANITY_SLUG_REGEX } from '@/lib/vanityUnlock';
import { recordAuditLog } from '@/lib/auditAndNotify';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const id = (await params).id;
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;

		const bot = await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();

		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		}

		const botId = bot.id;

		// Dynamically compute the overall vote count from the distinct votes collection
		const VoteModel = (db.models.bots as any).Vote;
		const CommandModel = (db.models.bots as any).Command;
		bot.voteCount = await VoteModel.countDocuments({ botId });

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

		// Fetch Discord Profile
		try {
			const token = process.env.DISCORD_CLIENT_TOKEN;
			if (token) {
				const discordRes = await fetch(`https://discord.com/api/v10/users/${botId}`, {
					headers: { Authorization: `Bot ${token}` },
				});
				if (discordRes.ok) {
					const discordUser = await discordRes.json();
					bot.discord = discordUser;
				}

				if (bot.owners && bot.owners.length > 0) {
					const ownersData = await Promise.all(
						bot.owners.map(async (ownerId: string) => {
							try {
								const res = await fetch(`https://discord.com/api/v10/users/${ownerId}`, {
									headers: { Authorization: `Bot ${token}` },
								});
								if (res.ok) return await res.json();
							} catch (e) {
								console.error(`Failed to fetch owner ${ownerId}`, e);
							}
							return null;
						})
					);
					bot.ownersData = ownersData.filter(Boolean);
				}
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

		const session = (await getServerSession(auth).catch(() => null)) as any;
		const actorUserId = session?.user?.id || (Array.isArray(bot.owners) ? bot.owners[0] : undefined);
		const isVanityAlreadyUnlocked = Boolean(bot.vanityUnlocked || bot.vanitySlug || bot.verified || body.vanityUnlocked || body.verified);

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
				if (!VANITY_SLUG_REGEX.test(rawSlug)) {
					return NextResponse.json({ error: 'Vanity slug must be 2-32 characters (lowercase letters, numbers, and hyphens).' }, { status: 400 });
				}
				const existing = await BotModel.findOne({ vanitySlug: rawSlug, id: { $ne: bot.id } }).lean();
				if (existing) {
					return NextResponse.json({ error: 'This vanity slug is already taken.' }, { status: 409 });
				}
				if (!isVanityAlreadyUnlocked) {
					const unlockRes = await unlockVanityWithUserCredits(db.models, actorUserId, bot.name || `Bot ${bot.id}`);
					if (!unlockRes.ok) {
						return NextResponse.json({ error: unlockRes.error }, { status: 403 });
					}
					bot.vanityUnlocked = true;
				}
				bot.vanitySlug = rawSlug;
			}
		}

		const updatableFields = ['name', 'description', 'info', 'privacy', 'widgets', 'verified', 'vanityUnlocked', 'owners', 'organization', 'tags', 'commands', 'releases'];
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

		const TokenModel = (db.models.users as any)?.Token;
		if (TokenModel) {
			await TokenModel.updateMany({ botId: targetBot?.id || id }, { $unset: { botId: 1 }, $set: { status: 'pending' } }).catch(() => {});
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
