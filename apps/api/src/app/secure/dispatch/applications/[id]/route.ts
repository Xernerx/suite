/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;

		const item = await ApplicationConfig.findOne({ id }).lean();

		if (!item) {
			return NextResponse.json({ error: 'Application config not found' }, { status: 404 });
		}

		return NextResponse.json(item);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['applications_manage']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Application management permission required' }, { status: caller.userId ? 403 : 401 });
		}

		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;

		const { _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, ...cleanBody } = body || {};
		const updatedItem = await ApplicationConfig.findOneAndUpdate({ id }, { $set: cleanBody }, { returnDocument: 'after' });

		if (!updatedItem) {
			return NextResponse.json({ error: 'Application config not found' }, { status: 404 });
		}

		await recordAuditLog(req, {
			action: 'application.config.updated',
			targetType: 'application',
			targetId: id,
			summary: `Updated application form "${updatedItem.name || id}"`,
		});

		return NextResponse.json(updatedItem);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['applications_manage']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Application management permission required' }, { status: caller.userId ? 403 : 401 });
		}

		const { id } = await params;
		const { models } = await database('xernerx');
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;

		const deletedItem = await ApplicationConfig.findOneAndDelete({ id });

		if (!deletedItem) {
			return NextResponse.json({ error: 'Application config not found' }, { status: 404 });
		}

		await recordAuditLog(req, {
			action: 'application.config.deleted',
			targetType: 'application',
			targetId: id,
			summary: `Deleted application form "${deletedItem.name || id}"`,
		});

		return NextResponse.json({ success: true, deletedId: id });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
