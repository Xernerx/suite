/** @format */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { decryptQrHandoffTicket } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { encryptMobileOAuthPayload, type MobileOAuthPayload } from '@/lib/mobileAuth';

export const dynamic = 'force-dynamic';

function sanitizeHandshakeId(raw?: string | null): string | null {
	if (!raw || typeof raw !== 'string') return null;
	const clean = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '');
	return clean.length >= 16 && clean.length <= 80 ? clean : null;
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const handshakeId = sanitizeHandshakeId(searchParams.get('handshakeId'));
		if (!handshakeId) {
			return NextResponse.json({ status: 'invalid' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const doc = (await models.core.Setting.findOne({ id: `mobile_oauth_handshake_${handshakeId}` }).lean()) as any;
		if (!doc?.value) {
			return NextResponse.json({ status: 'pending' });
		}

		let parsed: { code?: string; expiresAt?: number };
		try {
			parsed = JSON.parse(doc.value);
		} catch {
			await models.core.Setting.deleteOne({ id: doc.id }).catch(() => {});
			return NextResponse.json({ status: 'expired' }, { status: 410 });
		}

		if (!parsed.expiresAt || Date.now() > parsed.expiresAt || !parsed.code) {
			await models.core.Setting.deleteOne({ id: doc.id }).catch(() => {});
			return NextResponse.json({ status: 'expired' }, { status: 410 });
		}

		// Consume handshake record once so the code is delivered exclusively to the initiating app
		await models.core.Setting.deleteOne({ id: doc.id }).catch(() => {});
		return NextResponse.json({ status: 'ready', code: parsed.code });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}));
		const rawTicket = typeof body?.handoffTicket === 'string' ? body.handoffTicket : null;
		const handshakeId = sanitizeHandshakeId(body?.handshakeId);

		let oauthPayload: MobileOAuthPayload | null = null;

		if (rawTicket) {
			const ticketData = decryptQrHandoffTicket(rawTicket);
			if (ticketData?.sub) {
				oauthPayload = {
					sub: String(ticketData.sub),
					name: ticketData.name || null,
					email: ticketData.email || null,
					picture: ticketData.picture || null,
					accessToken: ticketData.accessToken,
					refreshToken: ticketData.refreshToken,
					accessTokenExpires: ticketData.accessTokenExpires,
				};
			}
		}

		if (!oauthPayload) {
			const jwtToken =
				(await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET, secureCookie: true }).catch(() => null)) ||
				(await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET, secureCookie: false }).catch(() => null));

			if (jwtToken?.sub) {
				oauthPayload = {
					sub: String(jwtToken.sub),
					name: (jwtToken.name as string) || null,
					email: (jwtToken.email as string) || null,
					picture: (jwtToken.picture as string) || null,
					accessToken: jwtToken.accessToken as string | undefined,
					refreshToken: jwtToken.refreshToken as string | undefined,
					accessTokenExpires: typeof jwtToken.accessTokenExpires === 'number' ? jwtToken.accessTokenExpires : undefined,
				};
			}
		}

		if (!oauthPayload?.sub) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { models } = await database('xernerx');
		const exchangeCode = crypto.randomBytes(24).toString('hex');
		const expiresAt = Date.now() + 2 * 60 * 1000;

		await models.core.Setting.findOneAndUpdate(
			{ id: `mobile_oauth_exchange_${exchangeCode}` },
			{
				$set: {
					id: `mobile_oauth_exchange_${exchangeCode}`,
					value: JSON.stringify({
						userId: oauthPayload.sub,
						encryptedOAuth: encryptMobileOAuthPayload(oauthPayload),
						expiresAt,
					}),
				},
			},
			{ upsert: true }
		);

		if (handshakeId) {
			await models.core.Setting.findOneAndUpdate(
				{ id: `mobile_oauth_handshake_${handshakeId}` },
				{
					$set: {
						id: `mobile_oauth_handshake_${handshakeId}`,
						value: JSON.stringify({
							code: exchangeCode,
							expiresAt,
						}),
					},
				},
				{ upsert: true }
			);
		}

		return NextResponse.json({ code: exchangeCode });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
