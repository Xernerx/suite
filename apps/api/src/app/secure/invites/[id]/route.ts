import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const body = await req.json();
		const resolvedParams = await params;
		const invite = await (await database('xernerx')).models.core.AppInvite.findOneAndUpdate({ id: resolvedParams.id }, { $set: body }, { new: true });
		if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		return NextResponse.json(invite);
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params;
		const invite = await (await database('xernerx')).models.core.AppInvite.findOneAndDelete({ id: resolvedParams.id });
		if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
