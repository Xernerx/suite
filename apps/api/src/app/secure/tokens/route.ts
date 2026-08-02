/** @format */

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth'; // Or `import { auth } from '@/auth'` if you're on NextAuth v5

export async function GET(_: NextRequest) {
	try {
		// Retrieve the current user's session
		// Note: You may need to pass your authOptions here (e.g., `getServerSession(authOptions)`)
		// depending on your NextAuth configuration.
		const session = await getServerSession(auth);

		// Ensure the user is authenticated and their ID is available
		if (!session?.user || !(session.user as any)?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = (session.user as any).id;
		const db = await database('xernerx');

		// Find all tokens where the current user's ID is in the 'owners' array
		const tokens = await db.models.tokens.apis.find({ owners: userId }).select(['_id', 'status', 'name']);

		return NextResponse.json(tokens, { status: 200 });
	} catch (error) {
		console.error('GET Secure Tokens Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
