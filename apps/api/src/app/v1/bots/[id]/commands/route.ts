/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

async function authCommands(req: NextRequest, botId: string) {
	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return { error: 'Missing Authorization header', status: 401 };

	const tokenValue = authHeader.replace(/^Bearer\s+/i, '').trim();

	const db = await database('xernerx');
	const TokenModel = (db.models.users as any).Token;
	const BotModel = (db.models.bots as any).Profile || (db.models.bots as any).Bot;
	const CommandModel = (db.models.bots as any).Command;

	if (!TokenModel || !BotModel || !CommandModel) return { error: 'Database models not found', status: 500 };

	const tokenDoc = await TokenModel.findOne({ id: tokenValue });
	if (!tokenDoc) return { error: 'Invalid token', status: 401 };
	if (tokenDoc.status === 'inactive' || tokenDoc.status === 'suspended') return { error: 'Token is inactive or suspended', status: 403 };

	const bot = await BotModel.findOne({ id: botId });
	if (!bot) return { error: 'Bot not found', status: 404 };

	const tokenOwners = tokenDoc.owners || [];
	const botOwners = bot.owners || [];
	const hasFullAccess = tokenDoc.botId === botId || tokenOwners.some((owner: string) => botOwners.includes(owner));

	return { hasFullAccess, CommandModel };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('xernerx');
		const CommandModel = (db.models.bots as any).Command;

		if (!CommandModel) return NextResponse.json({ error: 'Database model not found' }, { status: 500 });

		const commands = await CommandModel.find({ botId: id });
		return NextResponse.json(commands);
	} catch (error: any) {
		console.error('Failed to GET bot commands:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authResult = await authCommands(req, id);
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { hasFullAccess, CommandModel } = authResult;
		if (!hasFullAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

		const body = await req.json().catch(() => null);
		if (!Array.isArray(body)) {
			return NextResponse.json({ error: 'Expected an array of Discord application command objects.' }, { status: 400 });
		}

		// Wipe existing commands for full sync
		await CommandModel.deleteMany({ botId: id });

		const insertPayload = body
			.map((cmd: any) => ({
				botId: id,
				commandId: cmd.id || cmd.name, // Fallback to name if Discord ID isn't present
				name: cmd.name,
				description: cmd.description,
				type: cmd.type || 1,
				body: cmd,
			}))
			.filter((cmd: any) => cmd.name);

		if (insertPayload.length > 0) {
			await CommandModel.insertMany(insertPayload);
		}

		return NextResponse.json({ message: 'Commands synced successfully', count: insertPayload.length }, { status: 201 });
	} catch (error: any) {
		console.error('Failed to POST bot commands:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authResult = await authCommands(req, id);
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { hasFullAccess, CommandModel } = authResult;
		if (!hasFullAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

		const commandId = req.nextUrl.searchParams.get('commandId');

		if (commandId) {
			await CommandModel.deleteOne({ commandId, botId: id });
		} else {
			await CommandModel.deleteMany({ botId: id });
		}

		return NextResponse.json({ message: 'Commands deleted successfully' });
	} catch (error: any) {
		console.error('Failed to DELETE bot commands:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
