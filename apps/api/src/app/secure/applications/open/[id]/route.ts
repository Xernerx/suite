/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;

		const config = await ApplicationConfig.findOne({ id, status: 'open' }).lean();

		if (!config) {
			return NextResponse.json({ success: false, error: 'Application config not found or not open' }, { status: 404 });
		}

		return NextResponse.json({ success: true, data: config });
	} catch (err: any) {
		console.error('[API] Failed to fetch open application config:', err);
		return NextResponse.json({ success: false, error: err.message }, { status: 500 });
	}
}
