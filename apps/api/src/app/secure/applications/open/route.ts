/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET() {
	try {
		// Connect to the 'xernerx' platform database cluster
		const { models } = await database('xernerx');

		// Access the strictly typed dispatch ApplicationConfig collection
		const ApplicationConfig = models.dispatch.ApplicationConfig;

		// Fetch all application configurations that are actively 'open' and 'public'
		const openApplications = await ApplicationConfig.find({
			status: 'open',
			public: true,
		}).lean();

		return NextResponse.json({
			success: true,
			data: openApplications,
		});
	} catch (error) {
		console.error('[API] Failed to fetch open applications:', error);
		return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
	}
}
