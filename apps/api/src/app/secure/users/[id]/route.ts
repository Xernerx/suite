/** @format */

'use server';

import { NextRequest, NextResponse } from 'next/server';

import { database } from '@xernerx/lib/server';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');

		const user = await models.profiles.users.findOne({ id });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json(user);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json().catch(() => {});
		const { models } = await database('xernerx');

		// Check if user already exists to prevent duplicate key errors
		const existingUser = await models.profiles.users.findOne({ id });
		if (existingUser) return NextResponse.json({ error: 'User already exists' }, { status: 409 });

		// Create new user, enforcing the ID from the URL
		const newUser = await models.profiles.users.create({ ...body, id });

		return NextResponse.json(newUser, { status: 201 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');

		// findOneAndUpdate with { returnDocument: 'after' } returns the updated document rather than the old one
		const updatedUser = await models.profiles.users.findOneAndUpdate({ id }, { $set: body }, { returnDocument: 'after', runValidators: true });

		if (!updatedUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json(updatedUser);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');

		const deletedUser = await models.profiles.users.findOneAndDelete({ id });

		if (!deletedUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, deletedId: id });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
