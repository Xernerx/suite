import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();

		// If status changed to resolved, set resolvedAt
		if (body.status === 'resolved' && !body.resolvedAt) {
			body.resolvedAt = new Date();
		}

		const { models } = await database('xernerx');
		const updated = await models.core.Issue.findOneAndUpdate({ id }, body, { new: true });
		return NextResponse.json({ data: updated });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		await models.core.Issue.findOneAndDelete({ id });
		return NextResponse.json({ success: true });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
