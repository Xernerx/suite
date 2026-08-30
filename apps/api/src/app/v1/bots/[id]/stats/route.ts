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

		return NextResponse.json({ message: 'Stats updated successfully' }, { status: 201 });
	} catch (error: any) {
		console.error('Failed to process bot stats POST:', error);
		return NextResponse.json({ error: 'Internal Server Error', message: error.message, stack: error.stack }, { status: 500 });
	}
}

async function authStats(req: NextRequest, botId: string) {
	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return { error: 'Missing Authorization header', status: 401 };

	const tokenValue = authHeader.replace(/^Bearer\s+/i, '').trim();

	const db = await database('xernerx');
	const TokenModel = (db.models.users as any).Token;
	const BotModel = (db.models.bots as any).Profile || (db.models.bots as any).Bot;
	const StatModel = (db.models.bots as any).Stat;

	if (!TokenModel || !BotModel || !StatModel) return { error: 'Database models not found', status: 500 };

	const tokenDoc = await TokenModel.findOne({ id: tokenValue });
	if (!tokenDoc) return { error: 'Invalid token', status: 401 };
	if (tokenDoc.status === 'inactive' || tokenDoc.status === 'suspended') return { error: 'Token is inactive or suspended', status: 403 };

	const bot = await BotModel.findOne({ id: botId });
	if (!bot) return { error: 'Bot not found', status: 404 };

	const tokenOwners = tokenDoc.owners || [];
	const botOwners = bot.owners || [];
	const hasFullAccess = tokenDoc.botId === botId || tokenOwners.some((owner: string) => botOwners.includes(owner));

	return { hasFullAccess, StatModel };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('xernerx');
		const StatModel = (db.models.bots as any).Stat;

		if (!StatModel) return NextResponse.json({ error: 'Database model not found' }, { status: 500 });

		const stats = await StatModel.find({ id }).sort({ _id: -1 }).limit(100);
		return NextResponse.json(stats);
	} catch (error: any) {
		console.error('Failed to GET bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authResult = await authStats(req, id);
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { hasFullAccess, StatModel } = authResult;
		if (!hasFullAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

		const statId = req.nextUrl.searchParams.get('statId');
		const body = await req.json().catch(() => ({}));

		delete body._id;
		delete body.id;
		delete body.timestamp;

		if (statId) {
			await StatModel.updateOne({ _id: statId, id }, { $set: body });
		} else {
			const latest = await StatModel.findOne({ id }).sort({ _id: -1 });
			if (latest) {
				await StatModel.updateOne({ _id: latest._id }, { $set: body });
			} else {
				return NextResponse.json({ error: 'No stats found to update' }, { status: 404 });
			}
		}

		return NextResponse.json({ message: 'Stats updated successfully' });
	} catch (error: any) {
		console.error('Failed to PATCH bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authResult = await authStats(req, id);
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { hasFullAccess, StatModel } = authResult;
		if (!hasFullAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

		const statId = req.nextUrl.searchParams.get('statId');

		if (statId) {
			await StatModel.deleteOne({ _id: statId, id });
		} else {
			await StatModel.deleteMany({ id });
		}

		return NextResponse.json({ message: 'Stats deleted successfully' });
	} catch (error: any) {
		console.error('Failed to DELETE bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
