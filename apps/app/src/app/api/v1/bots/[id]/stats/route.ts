/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authHeader = req.headers.get('Authorization');

		if (!authHeader) {
			return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
		}

		// Extract token (support "Bearer <token>" or just "<token>")
		const tokenValue = authHeader.replace(/^Bearer\s+/i, '').trim();

		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token; // Note: Token is usually in users collection (models.users.Token)
		const BotModel = (db.models.bots as any).Bot;
		const StatModel = (db.models.bots as any).Stat;

		if (!TokenModel || !BotModel || !StatModel) {
			return NextResponse.json({ error: 'Database models not found' }, { status: 500 });
		}

		// 1. Fetch Token
		const tokenDoc = await TokenModel.findOne({ id: tokenValue });
		if (!tokenDoc) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		if (tokenDoc.status === 'inactive' || tokenDoc.status === 'suspended') {
			return NextResponse.json({ error: 'Token is inactive or suspended' }, { status: 403 });
		}

		// 2. Parse Body Stats
		const body = await req.json().catch(() => ({}));

		// 3. Token Assignment Logic
		if (!tokenDoc.botId) {
			// First time: claim the bot ID
			const existingBot = await BotModel.findOne({ id });
			if (existingBot) {
				const tokenOwners = tokenDoc.owners || [];
				const botOwners = existingBot.owners || [];

				const hasAccess = tokenOwners.some((owner: string) => botOwners.includes(owner));
				if (!hasAccess) {
					return NextResponse.json({ error: 'Bot ID is already assigned to another profile' }, { status: 403 });
				}

				// If they own it, link it directly without creating a new profile
				await TokenModel.updateOne({ id: tokenValue }, { $set: { botId: id, status: 'active' } });
			} else {
				// Fetch bot info from Discord
				let botName = 'Unknown Bot';
				let botAvatar = null;
				try {
					const discordToken = process.env.DISCORD_CLIENT_TOKEN;
					if (discordToken) {
						const discordRes = await fetch(`https://discord.com/api/v10/users/${id}`, {
							headers: { Authorization: `Bot ${discordToken}` },
						});
						if (discordRes.ok) {
							const discordUser = await discordRes.json();
							botName = discordUser.username;
							botAvatar = discordUser.avatar;
						}
					}
				} catch (e) {
					console.error('Failed to fetch Discord user for bot profile:', e);
				}

				// Create Bot profile
				await BotModel.create({
					id,
					name: botName,
					avatar: botAvatar,
					owners: tokenDoc.owners || [],
				});

				// Update Token
				await TokenModel.updateOne({ id: tokenValue }, { $set: { botId: id, status: 'active' } });
			}
		} else {
			// Recurring: ensure botId matches
			if (tokenDoc.botId !== id) {
				return NextResponse.json({ error: 'Token is not assigned to this bot ID' }, { status: 403 });
			}
		}

		// 4. Update Stats
		const serverCount = typeof body.serverCount === 'number' ? body.serverCount : typeof body.guildCount === 'number' ? body.guildCount : 0;
		const shardCount = typeof body.shardCount === 'number' ? body.shardCount : 0;
		const userCount = typeof body.userCount === 'number' ? body.userCount : 0;

		const VoteModel = (db.models.bots as any).Vote;
		const currentVoteCount = await VoteModel.countDocuments({ botId: id });

		await StatModel.create({
			id,
			guildCount: serverCount,
			shardCount: shardCount,
			userCount: userCount,
			voteCount: currentVoteCount,
			timestamp: new Date(),
		});

		// Fast cache update on BotModel
		const updateFields: any = {};
		if (typeof body.voteCount === 'number') {
			updateFields.voteCount = body.voteCount;
		}

		if (Object.keys(updateFields).length > 0) {
			await BotModel.updateOne({ id }, { $set: updateFields });
		}

		return NextResponse.json(
			{
				message: 'Stats updated successfully',
				warning: 'DEPRECATED: This endpoint will be removed in the next major version. Please update your integrations to use https://api.xernerx.com/v1/bots/[id]/stats instead.',
			},
			{
				status: 201,
				headers: {
					Warning: '299 - "Deprecated API: This endpoint will be removed in the next major version. Please use https://api.xernerx.com/v1/bots/[id]/stats instead."',
				},
			}
		);
	} catch (error: any) {
		console.error('Failed to process bot stats POST:', error);
		return NextResponse.json({ error: 'Internal Server Error', message: error.message, stack: error.stack }, { status: 500 });
	}
}
