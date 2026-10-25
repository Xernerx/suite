/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { authenticateV1BotRequest } from '@/lib/v1BotAuth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authHeader = req.headers.get('Authorization');

		if (authHeader) {
			const authResult = await authenticateV1BotRequest(req, id, { isMutation: false });
			if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

			const { bot, hasFullAccess } = authResult;

			if (!hasFullAccess && bot.privacy === 'private') {
				return NextResponse.json({ error: 'This bot profile is private.' }, { status: 403 });
			}

			if (hasFullAccess) {
				return NextResponse.json(bot);
			}

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

		// Unauthenticated public GET fallback
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot || (db.models.bots as any).Profile;
		const bot = await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		if (bot.privacy === 'private') {
			return NextResponse.json({ error: 'This bot profile is private.' }, { status: 403 });
		}

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
	} catch (error: any) {
		console.error('Failed to GET bot profile:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const authResult = await authenticateV1BotRequest(req, rawId, { isMutation: true });
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { botId: id, hasFullAccess, BotModel } = authResult as Required<typeof authResult>;

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

		if (Object.keys(body).length > 0) {
			await BotModel.updateOne({ id }, { $set: body });
		}

		const updatedBot = await BotModel.findOne({ id });
		return NextResponse.json(updatedBot);
	} catch (error: any) {
		console.error('Failed to PATCH bot profile:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	return PATCH(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	return PATCH(req, context);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const authResult = await authenticateV1BotRequest(req, rawId, { isMutation: true });
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { botId: id, hasFullAccess, BotModel, TokenModel } = authResult as Required<typeof authResult>;

		if (!hasFullAccess) {
			return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this bot.' }, { status: 403 });
		}

		await BotModel.deleteOne({ id });
		if (TokenModel) {
			await TokenModel.updateMany({ botId: id }, { $unset: { botId: 1 }, $set: { status: 'pending' } }).catch(() => {});
		}
		return NextResponse.json({ message: 'Bot profile deleted successfully' });
	} catch (error: any) {
		console.error('Failed to DELETE bot profile:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
