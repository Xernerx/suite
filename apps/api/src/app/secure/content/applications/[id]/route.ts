/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const Application = models.content.applications;

		// Find by your custom 'id' string, excluding the internal '_id'
		const application = await Application.findOne({ id }, '-_id');

		if (!application) {
			return NextResponse.json({ error: 'Application not found' }, { status: 404 });
		}

		return NextResponse.json(application);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');
		const Application = models.content.applications;

		// Find by custom 'id', apply updates, and return the new document
		const updatedApplication = await Application.findOneAndUpdate({ id }, body, {
			after: true,
			select: '-_id',
		});

		if (!updatedApplication) {
			return NextResponse.json({ error: 'Application not found' }, { status: 404 });
		}

		return NextResponse.json(updatedApplication);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const Application = models.content.applications;

		const deletedApplication = await Application.findOneAndDelete({ id });

		if (!deletedApplication) {
			return NextResponse.json({ error: 'Application not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
