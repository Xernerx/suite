/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params;
		const db = await database('xernerx');
		const invite = await db.models.core.AppInvite.findOne({ id: resolvedParams.id });
		if (!invite) return new NextResponse('Not Found', { status: 404 });

		let url = `https://discord.com/oauth2/authorize?client_id=${invite.clientId}&permissions=${invite.permissions}&scope=${invite.scopes.join('+')}`;

		if (invite.redirect) {
			const bot = await (db.models.bots as any)?.Bot?.findOne({ id: invite.clientId })
				.select('vanitySlug')
				.lean()
				.catch(() => null);
			const targetSlug = bot?.vanitySlug || invite.id || invite.clientId;
			const redirectUri = `https://app.xernerx.com/bots/${targetSlug}`;
			url += `&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
		}

		return NextResponse.redirect(url);
	} catch (error) {
		console.error(error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
