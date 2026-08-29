/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

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
		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;

		const updatedItem = await ApplicationConfig.findOneAndUpdate({ id }, { $set: body }, { new: true });

		if (!updatedItem) {
			return NextResponse.json({ error: 'Application config not found' }, { status: 404 });
		}

		return NextResponse.json(updatedItem);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;

		const deletedItem = await ApplicationConfig.findOneAndDelete({ id });

		if (!deletedItem) {
			return NextResponse.json({ error: 'Application config not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, deletedId: id });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
