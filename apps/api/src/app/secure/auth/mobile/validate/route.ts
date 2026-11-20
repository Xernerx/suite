/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { resolveMobileSessionFromToken } from '@/lib/mobileAuth';

export async function POST(req: NextRequest) {
	try {
		const { token } = await req.json().catch(() => ({}));
		if (!token || typeof token !== 'string') {
			return NextResponse.json({ valid: false, error: 'Missing token' }, { status: 400 });
		}

		const resolved = await resolveMobileSessionFromToken(token);
		if (!resolved) {
			return NextResponse.json({ valid: false, error: 'Mobile session expired or revoked' }, { status: 401 });
		}

		return NextResponse.json({
			valid: true,
			userId: resolved.userId,
			sessionId: resolved.sessionId,
		});
	} catch (error: unknown) {
		return NextResponse.json({ valid: false, error: (error as Error).message }, { status: 500 });
	}
}
