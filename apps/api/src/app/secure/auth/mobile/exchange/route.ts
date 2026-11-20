/** @format */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { decryptQrHandoffTicket } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { createMobileSession, decryptMobileOAuthPayload, type MobileOAuthPayload } from '@/lib/mobileAuth';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}));
		const mode = body.mode === 'qr' ? 'qr' : 'oauth';
		const deviceId = String(body.deviceId || crypto.randomUUID())
			.trim()
			.slice(0, 80);
		const deviceName = String(body.deviceName || 'Xernerx Mobile')
			.trim()
			.slice(0, 80);
		const platform = body.platform === 'ios' ? 'ios' : 'android';
		const osVersion = String(body.osVersion || '')
			.trim()
			.slice(0, 32);
		const appVersion = String(body.appVersion || '1.0.0')
			.trim()
			.slice(0, 32);
		const pushToken = body.pushToken ? String(body.pushToken).trim() : null;

		const { models } = await database('xernerx');

		let userId: string | null = null;
		let oauthPayload: MobileOAuthPayload | null = null;

		if (mode === 'oauth') {
			const exchangeCode = String(body.code || '').trim();
			if (!exchangeCode) {
				return NextResponse.json({ error: 'Missing OAuth exchange code' }, { status: 400 });
			}

			const doc = (await models.core.Setting.findOne({ id: `mobile_oauth_exchange_${exchangeCode}` }).lean()) as any;
			await models.core.Setting.deleteOne({ id: `mobile_oauth_exchange_${exchangeCode}` }).catch(() => {});

			if (!doc?.value) {
				return NextResponse.json({ error: 'Exchange code expired or invalid' }, { status: 401 });
			}

			const parsed = JSON.parse(doc.value);
			if (!parsed.expiresAt || Date.now() > Number(parsed.expiresAt)) {
				return NextResponse.json({ error: 'Exchange code expired' }, { status: 401 });
			}

			oauthPayload = decryptMobileOAuthPayload(parsed.encryptedOAuth);
			userId = parsed.userId ? String(parsed.userId) : oauthPayload?.sub || null;
		} else {
			// Mode: 'qr' — sign into mobile by scanning a Share QR / entering 6-char Share Code from Account -> Devices
			const rawToken = body.token ? String(body.token).trim() : '';
			const cleanCode = body.code
				? String(body.code)
						.trim()
						.toUpperCase()
						.replace(/[^A-Z0-9]/g, '')
				: '';

			let settingDoc: any = null;
			if (rawToken) {
				settingDoc = await models.core.Setting.findOne({ id: `qr_auth_${rawToken}` }).lean();
			} else if (cleanCode.length === 6) {
				const candidates = await models.core.Setting.find({ id: /^qr_auth_/ }).lean();
				for (const c of candidates) {
					try {
						const parsed = JSON.parse(c.value);
						if (parsed.pairCode === cleanCode && Date.now() < parsed.expiresAt) {
							settingDoc = c;
							break;
						}
					} catch {}
				}
			}

			if (!settingDoc?.value) {
				return NextResponse.json({ error: 'Invalid or expired pairing code' }, { status: 404 });
			}

			const qrRecord = JSON.parse(settingDoc.value);
			if (Date.now() > Number(qrRecord.expiresAt || 0)) {
				await models.core.Setting.deleteOne({ id: settingDoc.id }).catch(() => {});
				return NextResponse.json({ error: 'Pairing code expired' }, { status: 410 });
			}

			if (qrRecord.status !== 'approved' || !qrRecord.handoffTicket) {
				return NextResponse.json({ error: 'This code is a login request, not a device share code. Generate a Share Code in Account → Devices on a signed-in device.' }, { status: 400 });
			}

			const ticketData = decryptQrHandoffTicket(qrRecord.handoffTicket);
			if (!ticketData?.sub) {
				await models.core.Setting.deleteOne({ id: settingDoc.id }).catch(() => {});
				return NextResponse.json({ error: 'Handoff ticket expired or invalid' }, { status: 401 });
			}

			// Consume share challenge once
			await models.core.Setting.deleteOne({ id: settingDoc.id }).catch(() => {});

			userId = String(ticketData.sub);
			oauthPayload = {
				sub: userId,
				name: ticketData.name || null,
				email: ticketData.email || null,
				picture: ticketData.picture || null,
				accessToken: ticketData.accessToken,
				refreshToken: ticketData.refreshToken,
				accessTokenExpires: ticketData.accessTokenExpires,
			};
		}

		if (!userId || !oauthPayload) {
			return NextResponse.json({ error: 'Unable to resolve authenticated user' }, { status: 401 });
		}

		const userDoc = (await models.users.User.findOne({ id: userId }).lean()) as any;
		if (userDoc?.blacklisted) {
			return NextResponse.json({ error: 'This account is restricted from signing in.' }, { status: 403 });
		}

		const { accessToken, session } = await createMobileSession({
			userId,
			deviceId,
			deviceName,
			platform,
			osVersion,
			appVersion,
			pushToken,
			oauthPayload,
		});

		const { tokenHash: _omitHash, encryptedOAuthPayload: _omitOAuth, ...safeSession } = session;

		return NextResponse.json({
			accessToken,
			session: safeSession,
			user: userDoc || { id: userId, name: oauthPayload.name },
		});
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
