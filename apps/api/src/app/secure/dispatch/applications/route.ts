/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';

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
			requireLogin: body.requireLogin !== false,
			benefits: body.benefits || [],
			requirements: body.requirements || [],
			questions: body.questions || [],
		});

		return NextResponse.json(newConfig, { status: 201 });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
