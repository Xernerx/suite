/** @format */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { decryptQrHandoffTicket, encryptQrHandoffTicket } from '@xernerx/lib';
import { getToken } from 'next-auth/jwt';
import { extractRequestIp, extractRequestLocation, mintHandoffTicketFromMobileSession, parseRequestDeviceInfo, resolveMobileSessionFromRequest } from '@/lib/mobileAuth';

interface QrChallengeRecord {
	token: string;
	pairCode: string;
	deviceInfo: string;
	ipAddress?: string | null;
	location?: string | null;
	mode?: 'request' | 'share';
	status: 'pending' | 'approved' | 'denied';
	handoffTicket?: string;
	approvedBy?: string;
	expiresAt: number;
}

const CHALLENGE_TTL_MS = 3 * 60 * 1000; // 3 minutes

function generatePairCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let out = '';
	for (let i = 0; i < 6; i++) {
		out += chars[crypto.randomInt(0, chars.length)];
	}
	return out;
}

async function resolveHandoffTicket(req: NextRequest, rawTicket?: string, fallbackUsername?: string) {
	let resolvedTicket: string | null = null;
	let resolvedUsername = fallbackUsername || 'user';

	if (rawTicket && typeof rawTicket === 'string' && decryptQrHandoffTicket(rawTicket)) {
		resolvedTicket = rawTicket;
	} else {
		// 1. Try first-party Xernerx Mobile Bearer session
		const mobileSession = await resolveMobileSessionFromRequest(req);
		if (mobileSession) {
			const minted = await mintHandoffTicketFromMobileSession(mobileSession);
			if (minted?.ticket) {
				return {
					resolvedTicket: minted.ticket,
					resolvedUsername: minted.username || resolvedUsername,
				};
			}
		}

		// 2. Fall back to NextAuth browser session cookie
		const jwtToken =
			(await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET, secureCookie: true }).catch(() => null)) ||
			(await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET, secureCookie: false }).catch(() => null));

		if (jwtToken?.sub) {
			resolvedUsername = (jwtToken.name as string) || resolvedUsername;
			resolvedTicket = encryptQrHandoffTicket({
				sub: jwtToken.sub,
				name: jwtToken.name,
				email: jwtToken.email,
				picture: jwtToken.picture,
				accessToken: jwtToken.accessToken,
				refreshToken: jwtToken.refreshToken,
				accessTokenExpires: jwtToken.accessTokenExpires,
				exp: Date.now() + 5 * 60 * 1000,
			});
		}
	}

	return { resolvedTicket, resolvedUsername };
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const token = searchParams.get('token')?.trim();
		const code = searchParams
			.get('code')
			?.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, '');
		const poll = searchParams.get('poll') === 'true';
		const consume = searchParams.get('consume') === 'true';
		const list = searchParams.get('list') === 'true';

		const { models } = await database('xernerx');

		if (list) {
			const candidates = await models.core.Setting.find({ id: /^qr_auth_/ }).lean();
			const pending: Array<{ token: string; pairCode: string; deviceInfo: string; ipAddress?: string | null; location?: string | null; expiresAt: number }> = [];
			for (const c of candidates) {
				try {
					const parsed: QrChallengeRecord = JSON.parse(c.value);
					if (parsed.status === 'pending' && parsed.mode !== 'share' && Date.now() < parsed.expiresAt) {
						pending.push({
							token: parsed.token,
							pairCode: parsed.pairCode,
							deviceInfo: parsed.deviceInfo,
							ipAddress: parsed.ipAddress || null,
							location: parsed.location || null,
							expiresAt: parsed.expiresAt,
						});
					}
				} catch {}
			}
			return NextResponse.json({ pending });
		}

		let settingDoc: any = null;
		if (token) {
			settingDoc = await models.core.Setting.findOne({ id: `qr_auth_${token}` }).lean();
		} else if (code && code.length === 6) {
			const candidates = await models.core.Setting.find({ id: /^qr_auth_/ }).lean();
			for (const c of candidates) {
				try {
					const parsed: QrChallengeRecord = JSON.parse(c.value);
					if (parsed.pairCode === code && Date.now() < parsed.expiresAt) {
						settingDoc = c;
						break;
					}
				} catch {}
			}
		}

		if (!settingDoc) {
			return NextResponse.json({ status: 'expired' }, { status: 404 });
		}

		let record: QrChallengeRecord;
		try {
			record = JSON.parse(settingDoc.value);
		} catch {
			await models.core.Setting.deleteOne({ id: settingDoc.id });
			return NextResponse.json({ status: 'expired' }, { status: 404 });
		}

		if (Date.now() > record.expiresAt) {
			await models.core.Setting.deleteOne({ id: settingDoc.id });
			return NextResponse.json({ status: 'expired' }, { status: 410 });
		}

		// Cleanly return & clear denied challenge on poll
		if (record.status === 'denied') {
			if (poll || consume) {
				await models.core.Setting.deleteOne({ id: settingDoc.id });
			}
			return NextResponse.json({
				status: 'denied',
				mode: record.mode || 'request',
				deviceInfo: record.deviceInfo,
			});
		}

		// Consume a share code or an approved request code
		if ((consume || (poll && record.mode !== 'share')) && record.status === 'approved' && record.handoffTicket) {
			await models.core.Setting.deleteOne({ id: settingDoc.id });
			return NextResponse.json({
				status: 'approved',
				mode: record.mode || 'request',
				handoffTicket: record.handoffTicket,
			});
		}

		return NextResponse.json({
			status: record.status,
			mode: record.mode || 'request',
			token: record.token,
			pairCode: record.pairCode,
			deviceInfo: record.deviceInfo,
			ipAddress: record.ipAddress || null,
			location: record.location || null,
			expiresAt: record.expiresAt,
		});
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}));
		const action = body.action || 'create';
		const { models } = await database('xernerx');

		// Opportunistically clean up expired QR challenges
		const allQrDocs = await models.core.Setting.find({ id: /^qr_auth_/ }).lean();
		const expiredIds: string[] = [];
		for (const doc of allQrDocs) {
			try {
				const parsed: QrChallengeRecord = JSON.parse(doc.value);
				if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
					expiredIds.push(doc.id);
				}
			} catch {
				expiredIds.push(doc.id);
			}
		}
		if (expiredIds.length > 0) {
			await models.core.Setting.deleteMany({ id: { $in: expiredIds } }).catch(() => {});
		}

		if (action === 'create') {
			const token = crypto.randomBytes(16).toString('hex');
			const pairCode = generatePairCode();
			const deviceInfo = parseRequestDeviceInfo(req, body);
			const ipAddress = extractRequestIp(req);
			const location = extractRequestLocation(req);
			const isShareMode = body.mode === 'share';

			let handoffTicket: string | undefined;
			let approvedBy: string | undefined;

			if (isShareMode) {
				const resolved = await resolveHandoffTicket(req, body.handoffTicket, body.username);
				if (!resolved.resolvedTicket) {
					return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
				}
				handoffTicket = resolved.resolvedTicket;
				approvedBy = resolved.resolvedUsername;
			}

			const record: QrChallengeRecord = {
				token,
				pairCode,
				deviceInfo,
				ipAddress,
				location,
				mode: isShareMode ? 'share' : 'request',
				status: isShareMode ? 'approved' : 'pending',
				handoffTicket,
				approvedBy,
				expiresAt: Date.now() + CHALLENGE_TTL_MS,
			};

			await models.core.Setting.findOneAndUpdate({ id: `qr_auth_${token}` }, { $set: { id: `qr_auth_${token}`, value: JSON.stringify(record) } }, { upsert: true });

			return NextResponse.json({
				token,
				pairCode,
				deviceInfo,
				ipAddress,
				location,
				mode: record.mode,
				expiresAt: record.expiresAt,
			});
		}

		if (action === 'deny') {
			const { token, code } = body;
			let targetDoc: any = null;
			if (token) {
				targetDoc = await models.core.Setting.findOne({ id: `qr_auth_${token}` }).lean();
			} else if (code) {
				const cleanCode = String(code)
					.trim()
					.toUpperCase()
					.replace(/[^A-Z0-9]/g, '');
				for (const doc of allQrDocs) {
					try {
						const parsed: QrChallengeRecord = JSON.parse(doc.value);
						if (parsed.pairCode === cleanCode && Date.now() < parsed.expiresAt) {
							targetDoc = doc;
							break;
						}
					} catch {}
				}
			}

			if (!targetDoc) {
				return NextResponse.json({ error: 'QR challenge expired or not found' }, { status: 404 });
			}

			const record: QrChallengeRecord = JSON.parse(targetDoc.value);
			const updated: QrChallengeRecord = {
				...record,
				status: 'denied',
				handoffTicket: undefined,
			};
			await models.core.Setting.updateOne({ id: targetDoc.id }, { $set: { value: JSON.stringify(updated) } });
			return NextResponse.json({ success: true, status: 'denied', deviceInfo: record.deviceInfo });
		}

		if (action === 'approve') {
			const { token, code, handoffTicket: rawTicket, username } = body;
			const { resolvedTicket, resolvedUsername } = await resolveHandoffTicket(req, rawTicket, username);

			if (!resolvedTicket) {
				return NextResponse.json({ error: 'Not authenticated or missing handoff ticket' }, { status: 401 });
			}

			let targetDoc: any = null;
			if (token) {
				targetDoc = await models.core.Setting.findOne({ id: `qr_auth_${token}` }).lean();
			} else if (code) {
				const cleanCode = String(code)
					.trim()
					.toUpperCase()
					.replace(/[^A-Z0-9]/g, '');
				for (const doc of allQrDocs) {
					try {
						const parsed: QrChallengeRecord = JSON.parse(doc.value);
						if (parsed.pairCode === cleanCode && Date.now() < parsed.expiresAt) {
							targetDoc = doc;
							break;
						}
					} catch {}
				}
			}

			if (!targetDoc) {
				return NextResponse.json({ error: 'QR challenge expired or not found' }, { status: 404 });
			}

			const record: QrChallengeRecord = JSON.parse(targetDoc.value);
			if (Date.now() > record.expiresAt) {
				await models.core.Setting.deleteOne({ id: targetDoc.id });
				return NextResponse.json({ error: 'QR challenge expired' }, { status: 410 });
			}

			const updated: QrChallengeRecord = {
				...record,
				status: 'approved',
				handoffTicket: resolvedTicket,
				approvedBy: resolvedUsername,
			};

			await models.core.Setting.updateOne({ id: targetDoc.id }, { $set: { value: JSON.stringify(updated) } });

			return NextResponse.json({ success: true, deviceInfo: record.deviceInfo });
		}

		return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
