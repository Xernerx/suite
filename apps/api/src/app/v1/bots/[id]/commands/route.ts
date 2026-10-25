/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { authenticateV1BotRequest } from '@/lib/v1BotAuth';

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
		const { id: rawId } = await params;
		const authResult = await authenticateV1BotRequest(req, rawId, { isMutation: true });
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { botId: id, hasFullAccess, CommandModel, BotModel } = authResult as Required<typeof authResult>;
		if (!hasFullAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

		const rawBody = await req.json().catch(() => null);
		const body = Array.isArray(rawBody) ? rawBody : Array.isArray(rawBody?.commands) ? rawBody.commands : null;
		if (!Array.isArray(body)) {
			return NextResponse.json({ error: 'Expected an array of Discord application command objects.' }, { status: 400 });
		}

		// Wipe existing commands for full sync
		await CommandModel.deleteMany({ botId: id });

		const insertPayload = body
			.map((cmd: any) => ({
				botId: id,
				commandId: cmd.id || cmd.name,
				name: cmd.name,
				description: cmd.description,
				type: cmd.type || 1,
				body: cmd,
			}))
			.filter((cmd: any) => cmd.name);

		if (insertPayload.length > 0) {
			await CommandModel.insertMany(insertPayload);
		}

		await BotModel.updateOne({ id }, { $set: { commands: body } }).catch(() => {});

		return NextResponse.json({ message: 'Commands synced successfully', count: insertPayload.length }, { status: 201 });
	} catch (error: any) {
		console.error('Failed to sync bot commands:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	return PUT(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	return PUT(req, context);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const authResult = await authenticateV1BotRequest(req, rawId, { isMutation: true });
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { botId: id, hasFullAccess, CommandModel, BotModel } = authResult as Required<typeof authResult>;
		if (!hasFullAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

		const commandId = req.nextUrl.searchParams.get('commandId');

		if (commandId) {
			await CommandModel.deleteOne({ commandId, botId: id });
			const remaining = await CommandModel.find({ botId: id }).lean();
			await BotModel.updateOne({ id }, { $set: { commands: remaining.map((c: any) => c.body || c) } }).catch(() => {});
		} else {
			await CommandModel.deleteMany({ botId: id });
			await BotModel.updateOne({ id }, { $set: { commands: [] } }).catch(() => {});
		}

		return NextResponse.json({ message: 'Commands deleted successfully' });
	} catch (error: any) {
		console.error('Failed to DELETE bot commands:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
