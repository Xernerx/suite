/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { buildDiscordBotAuthorizeUrl, getEnabledInviteOptions } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; option: string }> }) {
	try {
		const { id, option } = await params;
		const db = await database('xernerx');
		const invite: any = await db.models.core.AppInvite.findOne({ id }).lean();
		if (!invite) {
			return new NextResponse('Not Found', { status: 404 });
		}
		const botDoc = await (db.models.bots as any)?.Bot?.findOne({ id: invite.clientId })
			.select('vanitySlug')
			.lean()
			.catch(() => null);

		const targetSlug = botDoc?.vanitySlug || invite.id || invite.clientId;
		const enabledOptions = getEnabledInviteOptions(invite);
		const normalizedOption = option.trim().toLowerCase();
		const matched = enabledOptions.find((o) => o.key === normalizedOption) || (enabledOptions.length === 1 ? enabledOptions[0] : null);

		if (!matched) {
			return NextResponse.redirect(new URL(`/invites/${encodeURIComponent(id)}`, req.url));
		}

		const discordUrl = buildDiscordBotAuthorizeUrl({
			clientId: invite.clientId,
			permissions: matched.permissions,
			scopes: invite.scopes,
			redirect: Boolean(invite.redirect),
			targetSlug,
		});

		return NextResponse.redirect(discordUrl);
	} catch (error) {
		console.error(error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
