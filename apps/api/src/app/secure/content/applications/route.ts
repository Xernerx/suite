/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get('userId');
		const organizationId = searchParams.get('organizationId');

		const { models } = await database('xernerx');
		const Application = models.content.applications;

		let query: any = {};
		if (userId) {
			query.userId = userId;
		} else if (organizationId) {
			query['metadata.organizationId'] = organizationId;
			query.type = 'organization_invite';
		} else {
			// For admins (no userId provided), exclude user-level applications like org invites
			query.type = { $ne: 'organization_invite' };
		}

		// Fetch all matching, simplifying the response to exclude Mongoose's internal _id and heavy metadata
		const applications = await Application.find(query, '-_id id userId type status createdAt metadata').sort({ createdAt: -1 });

		return NextResponse.json(applications);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { models } = await database('xernerx');
		const Application = models.content.applications;

		const newApplication = await Application.create({
			id: crypto.randomUUID(), // Generate standard UUID
			...body,
		});

		return NextResponse.json(newApplication, { status: 201 });
	} catch (err: any) {
		// Intercept MongoDB Duplicate Key Error for the partial index (Anti-spam)
		if (err.code === 11000) {
			return NextResponse.json({ error: 'You already have a pending application of this type.' }, { status: 409 });
		}
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
