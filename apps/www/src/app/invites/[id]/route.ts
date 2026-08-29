import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params;
		const invite = await (await database('xernerx')).models.core.AppInvite.findOne({ id: resolvedParams.id });
		if (!invite) return new NextResponse('Not Found', { status: 404 });
		const url = `https://discord.com/oauth2/authorize?client_id=${invite.clientId}&permissions=${invite.permissions}&scope=${invite.scopes.join('+')}`;
		return NextResponse.redirect(url);
	} catch (error) {
		console.error(error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
