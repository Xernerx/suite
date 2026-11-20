/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';
import { handleDeleteUserBotServerProfile, handleGetUserBotServerProfiles, handlePatchUserBotServerProfile } from '@/lib/userBotProfilesAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const caller = await resolveCallerAuth(req, ['users']);
		const isStaffOrSystem = Boolean(caller.isSystemToken || caller.authorized);
		if (!isStaffOrSystem && caller.userId !== id) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		return await handleGetUserBotServerProfiles(id);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const caller = await resolveCallerAuth(req, ['users']);
		if (!caller.isSystemToken && !caller.authorized) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		const body = await req.json().catch(() => ({}));
		return await handlePatchUserBotServerProfile(req, id, body);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const caller = await resolveCallerAuth(req, ['users']);
		if (!caller.isSystemToken && !caller.authorized) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		const url = new URL(req.url);
		return await handleDeleteUserBotServerProfile(req, id, url.searchParams);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
	}
}
