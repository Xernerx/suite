/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { sendWebhook } from '@xernerx/lib/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';

export async function POST(req: NextRequest) {
	try {
		const caller = await resolveCallerAuth(req);
		if (!caller.isStaff && !caller.isSystemToken) {
			return NextResponse.json({ error: 'Forbidden: Staff or system token required' }, { status: caller.userId ? 403 : 401 });
		}

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
