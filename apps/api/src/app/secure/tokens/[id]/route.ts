/** @format */
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		const token = await TokenModel.findOne({ id }).lean();

		if (!token) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		return NextResponse.json(token, { status: 200 });
	} catch (error) {
		console.error('GET Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		// The user ID should be provided in the body when creating a token
		const userId = body.userId;
		if (!userId) return NextResponse.json({ error: 'userId required to create a token' }, { status: 400 });

		const existingToken = await TokenModel.findOne({ id });
		if (existingToken) {
			return NextResponse.json({ error: 'Token already exists' }, { status: 409 });
		}

		const newToken = await TokenModel.create({
			...body,
			owners: body.owners || [userId],
			id,
		});

		return NextResponse.json(newToken, { status: 201 });
	} catch (error) {
		console.error('POST Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		const token = await TokenModel.findOneAndUpdate({ id }, body, { new: true });
		if (!token) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		return NextResponse.json(token, { status: 200 });
	} catch (error) {
		console.error('PATCH Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		const token = await TokenModel.findOneAndDelete({ id });

		if (!token) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, message: 'Token deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('DELETE Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
