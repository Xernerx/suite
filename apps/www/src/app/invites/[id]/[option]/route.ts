/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { buildDiscordBotAuthorizeUrl, getEnabledInviteOptions } from '@xernerx/lib';
import { resolveAppBaseUrlForEnv, resolveInvite, resolveInviteHostEnv } from '@/lib/resolveInvite';

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
		const hostEnv = resolveInviteHostEnv(req.headers.get('x-forwarded-host') || req.headers.get('host'));
		const resolved = await resolveInvite(id, hostEnv);

		if (resolved.status === 'unavailable') {
			return withNoIndexHeaders(new NextResponse('Service Temporarily Unavailable', { status: 503, headers: { 'Retry-After': '2' } }), id);
		}

		if (resolved.status !== 'found' || !resolved.invite) {
			return withNoIndexHeaders(new NextResponse('Not Found', { status: 404 }));
		}

		const { invite, botDoc, fallbackInvite } = resolved;
		const canonicalId = invite.id || id;
		const targetSlug = botDoc?.vanitySlug || fallbackInvite?.vanitySlug || invite.id || invite.clientId;
		const enabledOptions = getEnabledInviteOptions(invite);
		const normalizedOption = option.trim().toLowerCase();
		const matched = enabledOptions.find((o) => o.key === normalizedOption) || (enabledOptions.length === 1 ? enabledOptions[0] : null);

		if (!matched) {
			return withNoIndexHeaders(NextResponse.redirect(new URL(`/invites/${encodeURIComponent(canonicalId)}`, req.url)), canonicalId);
		}

		const appBaseUrl = resolveAppBaseUrlForEnv(hostEnv);
		const discordUrl = buildDiscordBotAuthorizeUrl({
			clientId: invite.clientId,
			permissions: matched.permissions,
			scopes: invite.scopes,
			redirect: Boolean(invite.redirect),
			targetSlug,
			appBaseUrl,
		});

		return withNoIndexHeaders(NextResponse.redirect(discordUrl), canonicalId);
	} catch (error) {
		console.error(error);
		return withNoIndexHeaders(new NextResponse('Internal Server Error', { status: 500 }));
	}
}
