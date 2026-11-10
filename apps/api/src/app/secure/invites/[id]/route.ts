/** @format */

import { normalizeInviteOptions } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['invites']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Missing invites permission.' }, { status: 403 });
		}

		const body = await req.json();
		const resolvedParams = await params;
		const { _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, ...cleanBody } = body || {};

		if (cleanBody.options || cleanBody.permissions !== undefined) {
			const normalizedOptions = normalizeInviteOptions(cleanBody);
			cleanBody.options = normalizedOptions;
			cleanBody.permissions = normalizedOptions.essential.enabled ? normalizedOptions.essential.permissions : normalizedOptions.optional.enabled ? normalizedOptions.optional.permissions : '0';
		}

		const invite: any = await (await database('xernerx')).models.core.AppInvite.findOneAndUpdate({ id: resolvedParams.id }, { $set: cleanBody }, { returnDocument: 'after' }).lean();
		if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		await recordAuditLog(req, {
			action: 'invite.updated',
			targetType: 'setting',
			targetId: resolvedParams.id,
			summary: `Updated invite "${invite.id}"`,
			metadata: { destinationUrl: (invite as any).destinationUrl || null },
		});
		return NextResponse.json({
			...invite,
			options: normalizeInviteOptions(invite),
		});
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['invites']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Missing invites permission.' }, { status: 403 });
		}

		const resolvedParams = await params;
		const invite = await (await database('xernerx')).models.core.AppInvite.findOneAndDelete({ id: resolvedParams.id });
		if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		await recordAuditLog(req, {
			action: 'invite.deleted',
			targetType: 'setting',
			targetId: resolvedParams.id,
			summary: `Deleted invite "${invite.id}"`,
		});
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
