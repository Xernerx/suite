import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';

export async function GET(request: Request) {
	const session = await getServerSession(auth);
	const cookies = request.headers.get('cookie');

	return NextResponse.json({
		hasSession: !!session,
		sessionUserId: (session?.user as any)?.id || null,
		cookiesReceived: cookies || null,
	});
}
