/** @format */

import { NextResponse } from 'next/server';
import { fetchGuildRolesCached } from '@/lib/discordGuildResources';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	if (!id) {
		return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
	}

	try {
		const roles = await fetchGuildRolesCached(id);
		if (Array.isArray(roles) && roles.length > 0) {
			return NextResponse.json(roles, { status: 200 });
		}

		return NextResponse.json({ error: 'Failed to fetch Discord guild roles' }, { status: 404 });
	} catch (error) {
		console.error('Failed to fetch Discord guild roles:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
