/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';
import { handleDeleteGuildBotProfile, handleGetGuildBotProfiles, handlePatchGuildBotProfile } from '@/lib/guildBotProfilesAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const caller = await resolveCallerAuth(req, ['servers']);
		if (!caller.isSystemToken && !caller.authorized) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		return await handleGetGuildBotProfiles(id);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const caller = await resolveCallerAuth(req, ['servers']);
		if (!caller.isSystemToken && !caller.authorized) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		const body = await req.json().catch(() => ({}));
		return await handlePatchGuildBotProfile(req, id, body);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const caller = await resolveCallerAuth(req, ['servers']);
		if (!caller.isSystemToken && !caller.authorized) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		const url = new URL(req.url);
		return await handleDeleteGuildBotProfile(req, id, url.searchParams);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
	}
}
