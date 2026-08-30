/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

async function authenticateAndGetBot(req: NextRequest, botId: string) {
	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return { error: 'Missing Authorization header', status: 401 };

	const tokenValue = authHeader.replace(/^Bearer\s+/i, '').trim();

	const db = await database('xernerx');
	const TokenModel = (db.models.users as any).Token;
	const BotModel = (db.models.bots as any).Profile || (db.models.bots as any).Bot;

	if (!TokenModel || !BotModel) return { error: 'Database models not found', status: 500 };

	const tokenDoc = await TokenModel.findOne({ id: tokenValue });
	if (!tokenDoc) return { error: 'Invalid token', status: 401 };
	if (tokenDoc.status === 'inactive' || tokenDoc.status === 'suspended') return { error: 'Token is inactive or suspended', status: 403 };

	const bot = await BotModel.findOne({ id: botId });
	if (!bot) return { error: 'Bot not found', status: 404 };

	// Check full access (Token assigned to bot OR Token owner owns the bot)
	const tokenOwners = tokenDoc.owners || [];
	const botOwners = bot.owners || [];
	const hasFullAccess = tokenDoc.botId === botId || tokenOwners.some((owner: string) => botOwners.includes(owner));

	return { bot, hasFullAccess, BotModel };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authResult = await authenticateAndGetBot(req, id);
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { bot, hasFullAccess } = authResult;

		if (!hasFullAccess && bot.privacy === 'private') {
			return NextResponse.json({ error: 'This bot profile is private.' }, { status: 403 });
		}

		if (hasFullAccess) {
			return NextResponse.json(bot);
		} else {
			// Sanitized public return
			return NextResponse.json({
				id: bot.id,
				name: bot.name,
				avatar: bot.avatar,
				description: bot.description,
				info: bot.info,
				organization: bot.organization,
				verified: bot.verified,
				tags: bot.tags,
				links: bot.links,
				owners: bot.owners,
				voteCount: bot.voteCount,
			});
		}
	} catch (error: any) {
		console.error('Failed to GET bot profile:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authResult = await authenticateAndGetBot(req, id);
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { bot, hasFullAccess, BotModel } = authResult;

		if (!hasFullAccess) {
			return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this bot.' }, { status: 403 });
		}

		const body = await req.json().catch(() => ({}));

		// Prevent mutating critical fields
		delete body._id;
		delete body.id;
		delete body.bot;
		delete body.voteCount;
		delete body.votes;
		delete body.verified;
		delete body.name;
		delete body.avatar;

		await BotModel.updateOne({ id }, { $set: body });

		const updatedBot = await BotModel.findOne({ id });
		return NextResponse.json(updatedBot);
	} catch (error: any) {
		console.error('Failed to PATCH bot profile:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authResult = await authenticateAndGetBot(req, id);
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { hasFullAccess, BotModel } = authResult;

		if (!hasFullAccess) {
			return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this bot.' }, { status: 403 });
		}

		await BotModel.deleteOne({ id });
		return NextResponse.json({ message: 'Bot profile deleted successfully' });
	} catch (error: any) {
		console.error('Failed to DELETE bot profile:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
