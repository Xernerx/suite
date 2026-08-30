/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = (await database('xernerx')).models.guilds.Guild as any;
		const StatModel = (await database('xernerx')).models.guilds.Stat as any;

		let guild = await db.findOne({ id }).lean();
		let stats = await StatModel.find({ id }).sort({ timestamp: 1 }).lean();

		if (guild) {
			const VoteModel = (await database('xernerx')).models.guilds.Vote as any;
			guild.voteCount = await VoteModel.countDocuments({ guildId: id });
		}

		const botToken = process.env.DISCORD_CLIENT_TOKEN;
		let botInServer = false;
		if (botToken) {
			try {
				// Do a quick check against Discord to see if the bot is in this server
				const discordRes = await fetch(`https://discord.com/api/v10/guilds/${id}?with_counts=false`, {
					headers: { Authorization: `Bot ${botToken}` },
				});
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
						await db.updateOne({ id }, { $set: updates });
					}
				} else if (guild && guild.bot !== botInServer) {
					// Bot is no longer in the server, update the database
					await db.updateOne({ id }, { $set: { bot: botInServer } });
					guild.bot = botInServer;
				}
			} catch (e) {
				console.error('[Guild GET] Error checking bot presence:', e);
			}
		}

		let activeChannels: { id: string; name: string }[] = [];
		if (botInServer && botToken) {
			try {
				const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${id}/channels`, {
					headers: { Authorization: `Bot ${botToken}` },
					next: { revalidate: 60 },
				});
				if (channelsRes.ok) {
					const channelsData = await channelsRes.json();
					activeChannels = channelsData.map((c: any) => ({ id: c.id, name: c.name }));
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
					verified: false,
					bot: botInServer,
					channels: activeChannels,
				},
				{ status: 200 }
			);
		}

		// Map stats into the raw guild document
		const fullGuild = {
			...guild,
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
		const db = (await database('xernerx')).models.guilds.Guild as any;

		const updateData: any = {};
		if (body.name !== undefined) updateData['name'] = body.name;
		if (body.icon !== undefined) updateData['icon'] = body.icon;
		if (body.banner !== undefined) updateData['banner'] = body.banner;
		if (body.description !== undefined) updateData['description'] = body.description;
		if (body.info !== undefined) updateData['info'] = body.info;
		if (body.locale !== undefined) updateData['locale'] = body.locale;
		if (body.organization !== undefined) updateData['organization'] = body.organization;
		if (body.verified !== undefined) updateData['verified'] = body.verified;
		if (body.bot !== undefined) updateData['bot'] = body.bot;
		if (body.privacy !== undefined) updateData['privacy'] = body.privacy;
		if (body.links !== undefined) updateData['links'] = body.links;

		const finalUpdate = Object.keys(updateData).length > 0 ? updateData : body;

		const updatedGuild = await db.findOneAndUpdate({ id }, { $set: finalUpdate }, { returnDocument: 'after', upsert: true, runValidators: true }).lean();

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

		const deletedGuild = await db.findOneAndDelete({ id });

		if (!deletedGuild) {
			return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete guild:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
