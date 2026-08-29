/** @format */
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { sendWebhook } from '@xernerx/lib/server';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { url, content, embeds } = body;

		if (!url) {
			return NextResponse.json({ error: 'Missing required field: url' }, { status: 400 });
		}

		await sendWebhook({ url, content, embeds });

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error('Webhook dispatch error:', error);
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}
