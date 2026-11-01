/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

export async function GET(req: Request) {
	try {
		const { models } = await database('xernerx');
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;

		const configs = await ApplicationConfig.find({}).sort({ createdAt: -1 }).lean();

		return NextResponse.json(configs);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const caller = await resolveCallerAuth(req, ['applications_manage']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Application management permission required' }, { status: caller.userId ? 403 : 401 });
		}

		const body = await req.json();
		const { models } = await database('xernerx');
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;

		if (!body.name || !body.id) {
			return NextResponse.json({ error: 'Missing required fields (id, name).' }, { status: 400 });
		}

		// Check for duplicate ID
		const existing = await ApplicationConfig.findOne({ id: body.id });
		if (existing) {
			return NextResponse.json({ error: 'Application type ID already exists.' }, { status: 409 });
		}

		const newConfig = await ApplicationConfig.create({
			id: body.id,
			name: body.name,
			description: body.description,
			rewardRole: body.rewardRole,
			grantVerified: Boolean(body.grantVerified),
			requireLogin: body.requireLogin !== false,
			benefits: body.benefits || [],
			requirements: body.requirements || [],
			questions: body.questions || [],
		});

		await recordAuditLog(req, {
			action: 'application.config.created',
			targetType: 'application',
			targetId: newConfig.id,
			summary: `Created application form "${newConfig.name}"`,
		});

		return NextResponse.json(newConfig, { status: 201 });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
