/** @format */
'use server';

import { NextRequest, NextResponse } from 'next/server';

import { database } from '@xernerx/lib/server';
import { isValidObjectId } from 'mongoose';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('xernerx');

		// Smart query: If it's a valid 24-char hex, search by `_id`, otherwise search by your custom token `id`
		const query = isValidObjectId(id) ? { _id: id } : { id };
		const token = await db.models.tokens.apis.findOne(query);

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

		const existingToken = await db.models.tokens.apis.findOne({ id });
		if (existingToken) {
			return NextResponse.json({ error: 'Token already exists' }, { status: 409 });
		}

		const token = await db.models.tokens.apis.create({ ...body, id });

		return NextResponse.json(token, { status: 201 });
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

		const query = isValidObjectId(id) ? { _id: id } : { id };

		const token = await db.models.tokens.apis.findOneAndUpdate(query, { $set: body }, { returnDocument: 'after', runValidators: true });

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

		const query = isValidObjectId(id) ? { _id: id } : { id };
		const deletedToken = await db.models.tokens.apis.findOneAndDelete(query);

		if (!deletedToken) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, message: 'Token deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('DELETE Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
