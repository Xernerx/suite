/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { buildDiscordBotAuthorizeUrl, getEnabledInviteOptions } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { findDefaultOfficialInvite } from '@/lib/defaultOfficialInvites';

function withNoIndexHeaders(res: NextResponse, id?: string): NextResponse {
	res.headers.set('X-Robots-Tag', 'noindex, nofollow');
	if (id) {
		res.headers.set('Link', `<https://www.xernerx.com/invites/${encodeURIComponent(id)}>; rel="canonical"`);
	}
	return res;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; option: string }> }) {
	try {
		const { id, option } = await params;
		let invite: any = null;
		let botDoc: any = null;

		if (process.env.MONGO_XERNERX) {
			try {
				const dbLookup = await Promise.race([
					(async () => {
						const db = await database('xernerx');
						const foundInvite: any = await db.models.core.AppInvite.findOne({ id }).lean();
						if (!foundInvite) return null;
						const foundBot = await (db.models.bots as any)?.Bot?.findOne({ id: foundInvite.clientId })
							.select('vanitySlug')
							.lean()
							.catch(() => null);
						return { invite: foundInvite, botDoc: foundBot };
					})(),
					new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
				]);
				if (dbLookup) {
					invite = dbLookup.invite;
					botDoc = dbLookup.botDoc;
				}
			} catch {
				// Fall back to default official invites
			}
		}

		if (!invite) {
			invite = findDefaultOfficialInvite(id);
		}
		if (!invite) {
			return withNoIndexHeaders(new NextResponse('Not Found', { status: 404 }));
		}

		const targetSlug = botDoc?.vanitySlug || invite.id || invite.clientId;
		const enabledOptions = getEnabledInviteOptions(invite);
		const normalizedOption = option.trim().toLowerCase();
		const matched = enabledOptions.find((o) => o.key === normalizedOption) || (enabledOptions.length === 1 ? enabledOptions[0] : null);

		if (!matched) {
			return withNoIndexHeaders(NextResponse.redirect(new URL(`/invites/${encodeURIComponent(id)}`, req.url)), id);
		}

		const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').toLowerCase();
		const appBaseUrl =
			host.includes('.dev.xernerx.com') || host.startsWith('localhost:')
				? 'https://app.dev.xernerx.com'
				: host.includes('.canary.xernerx.com')
					? 'https://app.canary.xernerx.com'
					: 'https://app.xernerx.com';

		const discordUrl = buildDiscordBotAuthorizeUrl({
			clientId: invite.clientId,
			permissions: matched.permissions,
			scopes: invite.scopes,
			redirect: Boolean(invite.redirect),
			targetSlug,
			appBaseUrl,
		});

		return withNoIndexHeaders(NextResponse.redirect(discordUrl), id);
	} catch (error) {
		console.error(error);
		return withNoIndexHeaders(new NextResponse('Internal Server Error', { status: 500 }));
	}
}
