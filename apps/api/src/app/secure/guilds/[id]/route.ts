/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { normalizeVanitySlug, unlockVanityWithUserCredits, VANITY_SLUG_REGEX } from '@/lib/vanityUnlock';
import { recordAuditLog } from '@/lib/auditAndNotify';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = (await database('xernerx')).models.guilds.Guild as any;
		const StatModel = (await database('xernerx')).models.guilds.Stat as any;

		const guild = await db.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		const guildId = guild?.id || id;
		const stats = await StatModel.find({ id: guildId }).sort({ timestamp: 1 }).lean();

		if (guild) {
			const VoteModel = (await database('xernerx')).models.guilds.Vote as any;
			guild.voteCount = await VoteModel.countDocuments({ guildId });
		}

		const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_CLIENT_TOKEN;
		let activeToken = botToken;
		let botInServer = false;
		if (botToken) {
			try {
				// Do a quick check against Discord to see if the public bot is in this server
				let discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=false`, {
					headers: { Authorization: `Bot ${botToken}` },
				});
				if (!discordRes.ok && process.env.DISCORD_CLIENT_TOKEN && process.env.DISCORD_CLIENT_TOKEN !== botToken) {
					const fallbackRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=false`, {
						headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
					});
					if (fallbackRes.ok) {
						discordRes = fallbackRes;
						activeToken = process.env.DISCORD_CLIENT_TOKEN;
					}
				}
				botInServer = discordRes.ok;

				if (discordRes.ok && guild) {
					const discordGuild = await discordRes.json();

					const updates: any = {};
					let needsUpdate = false;

					if (guild.name !== discordGuild.name) {
						updates.name = discordGuild.name;
						guild.name = discordGuild.name;
						needsUpdate = true;
					}

					if (guild.icon !== discordGuild.icon) {
						updates.icon = discordGuild.icon;
						guild.icon = discordGuild.icon;
						needsUpdate = true;
					}

					if (guild.banner !== discordGuild.banner) {
						updates.banner = discordGuild.banner;
						guild.banner = discordGuild.banner;
						needsUpdate = true;
					}

					if (guild.bot !== botInServer) {
						updates.bot = botInServer;
						guild.bot = botInServer;
						needsUpdate = true;
					}

					if (needsUpdate) {
						await db.updateOne({ id: guildId }, { $set: updates });
					}
				} else if (guild && guild.bot !== botInServer) {
					// Bot is no longer in the server, update the database
					await db.updateOne({ id: guildId }, { $set: { bot: botInServer } });
					guild.bot = botInServer;
				}
			} catch (e) {
				console.error('[Guild GET] Error checking bot presence:', e);
			}
		}

		let activeChannels: { id: string; name: string }[] = [];
		if (botInServer && activeToken) {
			try {
				const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
					headers: { Authorization: `Bot ${activeToken}` },
					next: { revalidate: 60 },
				});
				if (channelsRes.ok) {
					const channelsData = await channelsRes.json();
					if (Array.isArray(channelsData)) {
						activeChannels = channelsData
							.filter((c: any) => c.type === 0 || c.type === 5 || c.type === 15 || c.type === 16)
							.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
							.map((c: any) => ({ id: c.id, name: c.name, type: c.type }));
					}
				}
			} catch (e) {
				console.error('[Guild GET] Error fetching channels:', e);
			}
		}

		if (!guild) {
			// Return an empty/default object instead of 404 so the client can initialize it
			return NextResponse.json(
				{
					id,
					name: 'Unknown Guild',
					privacy: 'private',
					widgets: false,
					verified: false,
					vanityUnlocked: false,
					bot: botInServer,
					channels: activeChannels,
				},
				{ status: 200 }
			);
		}

		// Map stats into the raw guild document
		const fullGuild = {
			...guild,
			widgets: Boolean(guild.widgets),
			vanityUnlocked: Boolean(guild.vanityUnlocked || guild.vanitySlug || guild.verified),
			stats: stats || [],
			channels: activeChannels,
		};

		return NextResponse.json(fullGuild, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch guild:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');
		const db = models.guilds.Guild as any;

		const existingGuild = await db.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		const guildId = existingGuild?.id || id;

		const session = (await getServerSession(auth).catch(() => null)) as any;
		const actorUserId = session?.user?.id || body.owner || existingGuild?.owner;

		const isVanityAlreadyUnlocked = Boolean(existingGuild?.vanityUnlocked || existingGuild?.vanitySlug || existingGuild?.verified || body.vanityUnlocked || body.verified);

		if (body.action === 'unlock_vanity') {
			if (isVanityAlreadyUnlocked) {
				return NextResponse.json({ ...existingGuild, id: guildId, vanityUnlocked: true }, { status: 200 });
			}
			const unlockRes = await unlockVanityWithUserCredits(models, actorUserId, existingGuild?.name || body.name || `Server ${guildId}`);
			if (!unlockRes.ok) {
				return NextResponse.json({ error: unlockRes.error }, { status: 403 });
			}
			const unlockedDoc = await db
				.findOneAndUpdate(
					{ id: guildId },
					{ $set: { id: guildId, name: existingGuild?.name || body.name || 'Server', vanityUnlocked: true } },
					{ returnDocument: 'after', upsert: true, runValidators: true }
				)
				.lean();
			return NextResponse.json(
				{
					...unlockedDoc,
					widgets: Boolean(unlockedDoc.widgets),
					vanityUnlocked: true,
					vanitySlug: unlockedDoc.vanitySlug,
					links: unlockedDoc.links || {},
					usedSlot: unlockRes.usedSlot,
					cost: unlockRes.cost,
				},
				{ status: 200 }
			);
		}

		const updateData: any = { id: guildId };
		const unsetData: any = {};

		if (body.vanitySlug !== undefined) {
			const rawSlug = normalizeVanitySlug(body.vanitySlug);
			if (rawSlug === '') {
				unsetData['vanitySlug'] = 1;
				delete body.vanitySlug;
			} else {
				if (!VANITY_SLUG_REGEX.test(rawSlug)) {
					return NextResponse.json({ error: 'Vanity slug must be 2-32 characters (lowercase letters, numbers, and hyphens).' }, { status: 400 });
				}
				const slugTaken = await db.findOne({ vanitySlug: rawSlug, id: { $ne: guildId } }).lean();
				if (slugTaken) {
					return NextResponse.json({ error: 'This vanity slug is already taken.' }, { status: 409 });
				}
				if (!isVanityAlreadyUnlocked) {
					const unlockRes = await unlockVanityWithUserCredits(models, actorUserId, existingGuild?.name || body.name || `Server ${guildId}`);
					if (!unlockRes.ok) {
						return NextResponse.json({ error: unlockRes.error }, { status: 403 });
					}
					updateData['vanityUnlocked'] = true;
				}
				updateData['vanitySlug'] = rawSlug;
				body.vanitySlug = rawSlug;
			}
		}

		if (body.name !== undefined) updateData['name'] = body.name;
		else if (!existingGuild?.name) updateData['name'] = 'Unknown Guild';
		if (body.icon !== undefined) updateData['icon'] = body.icon;
		if (body.banner !== undefined) updateData['banner'] = body.banner;
		if (body.description !== undefined) updateData['description'] = body.description;
		if (body.info !== undefined) updateData['info'] = body.info;
		if (body.locale !== undefined) updateData['locale'] = body.locale;
		if (body.owner !== undefined) updateData['owner'] = body.owner;
		if (body.organization !== undefined) updateData['organization'] = body.organization;
		if (body.verified !== undefined) updateData['verified'] = Boolean(body.verified);
		if (body.vanityUnlocked !== undefined) updateData['vanityUnlocked'] = Boolean(body.vanityUnlocked);
		if (body.bot !== undefined) updateData['bot'] = body.bot;
		if (body.privacy !== undefined) updateData['privacy'] = body.privacy;
		if (body.widgets !== undefined) updateData['widgets'] = Boolean(body.widgets);
		if (body.links !== undefined) updateData['links'] = body.links;

		const { _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, action: _omitAction, ...cleanBody } = body || {};
		const finalSet = Object.keys(updateData).length > 0 ? updateData : cleanBody;
		const mongoUpdate: any = {};
		if (Object.keys(finalSet).length > 0) mongoUpdate.$set = finalSet;
		if (Object.keys(unsetData).length > 0) mongoUpdate.$unset = unsetData;

		const updatedGuild = await db.findOneAndUpdate({ id: guildId }, mongoUpdate, { returnDocument: 'after', upsert: true, runValidators: true }).lean();

		await recordAuditLog(req, {
			action: 'server.update',
			targetType: 'server',
			targetId: guildId,
			summary: `Updated server "${updatedGuild?.name || guildId}"`,
			metadata: {
				privacy: updatedGuild?.privacy,
				verified: Boolean(updatedGuild?.verified),
				vanitySlug: updatedGuild?.vanitySlug || '',
			},
		});

		// Map to flat object so the frontend receives the correct response structure
		const flatGuild = {
			...updatedGuild,
			name: updatedGuild.name,
			icon: updatedGuild.icon,
			banner: updatedGuild.banner,
			description: updatedGuild.description,
			info: updatedGuild.info,
			locale: updatedGuild.locale,
			organization: updatedGuild.organization,
			verified: updatedGuild.verified,
			bot: updatedGuild.bot,
			privacy: updatedGuild.privacy,
			widgets: Boolean(updatedGuild.widgets),
			vanityUnlocked: Boolean(updatedGuild.vanityUnlocked || updatedGuild.vanitySlug || updatedGuild.verified),
			vanitySlug: updatedGuild.vanitySlug || '',
			links: updatedGuild.links || {},
		};

		return NextResponse.json(flatGuild, { status: 200 });
	} catch (error) {
		console.error('Failed to update guild:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = (await database('xernerx')).models.guilds.Guild as any;

		const deletedGuild = await db.findOneAndDelete({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] });

		if (!deletedGuild) {
			return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
		}

		await recordAuditLog(req, {
			action: 'server.delete',
			targetType: 'server',
			targetId: deletedGuild.id || id,
			summary: `Deleted server "${deletedGuild.name || deletedGuild.id || id}"`,
		});

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete guild:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
