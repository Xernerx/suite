/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { configId, answers } = body;

		if (!configId || !answers) {
			return NextResponse.json({ success: false, error: 'Missing configId or answers payload.' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;
		const Application = models.dispatch.Application as any;

		// 1. Validate Config
		const config = await ApplicationConfig.findOne({ id: configId, status: 'open' }).lean();
		if (!config) {
			return NextResponse.json({ success: false, error: 'Application is no longer open or does not exist.' }, { status: 404 });
		}

		// 2. Authenticate User
		const session = await getServerSession(auth);
		const requireLogin = config.requireLogin !== false; // defaults to true
		const userId = (session?.user as any)?.id || null;

		if (requireLogin && !userId) {
			return NextResponse.json({ success: false, error: 'Unauthorized. You must be logged in to apply for this role.' }, { status: 401 });
		}

		// 3. Validate user hasn't already submitted an application for this config
		if (userId) {
			const existingPending = await Application.findOne({ ownerId: userId, targetId: configId, status: 'pending' });
			if (existingPending) {
				return NextResponse.json({ success: false, error: 'You already have a pending application for this role.' }, { status: 409 });
			}
		}

		// 3. Validate Answers against Config Questions
		for (const q of config.questions || []) {
			if (q.required) {
				const ans = answers[q.id];
				if (ans === undefined || ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
					return NextResponse.json({ success: false, error: `Missing required field: ${q.question}` }, { status: 400 });
				}
			}
		}

		// 4. Save Application
		const newApplication = await Application.create({
			id: crypto.randomUUID(),
			ownerId: userId || 'anonymous',
			targetId: configId,
			status: 'pending',
			data: answers,
		});

		return NextResponse.json({ success: true, applicationId: newApplication.id }, { status: 201 });
	} catch (err: any) {
		console.error('[API] Failed to submit application:', err);
		return NextResponse.json({ success: false, error: err.message }, { status: 500 });
	}
}
