/** @format */

import { NextRequest, NextResponse } from 'next/server';

import { database } from '@xernerx/lib/server';

export async function POST(req: NextRequest) {
	try {
		const { token } = await req.json();

		if (!token) {
			return NextResponse.json({ error: 'Token is required' }, { status: 400 });
		}

		// 1. Initialize your custom database connection and grab the model
		const db = (await database('xernerx')).models.users.Token;

		// 2. Find the token by the custom 'id' field using the resolved model
		const tokenDoc = await db.findOne({ id: token });

		if (!tokenDoc) {
			return NextResponse.json({ error: 'Token not found' }, { status: 401 });
		}

		// 3. Determine if the token is 'pending' (i.e., missing a link to a bot profile)
		// Replace 'bot' with your actual schema field name if it's named something else (e.g., profile, botId)
		const isPending = !tokenDoc.botId;

		// If it's pending, override status to 'pending'. Otherwise, use the database status.
		const resolvedStatus = isPending ? 'pending' : tokenDoc.status;

		// 4. Return the evaluated data to the middleware
		return NextResponse.json(
			{
				id: tokenDoc.id,
				status: resolvedStatus,
				permissions: tokenDoc.permissions,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Internal token validation failed:', error);
		return NextResponse.json({ error: 'Database error' }, { status: 500 });
	}
}
