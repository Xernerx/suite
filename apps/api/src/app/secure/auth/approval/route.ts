/** @format */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';
import {
	APPROVAL_REQUEST_TTL_MS,
	extractRequestIp,
	extractRequestLocation,
	generateNumberMatchChallenge,
	mintHandoffTicketFromMobileSession,
	parseRequestDeviceInfo,
	resolveMobileSessionFromRequest,
	sendExpoPushNotification,
} from '@/lib/mobileAuth';

export const dynamic = 'force-dynamic';

const MAX_NUMBER_ATTEMPTS = 2;

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id')?.trim();
		const poll = searchParams.get('poll') === 'true';
		const inbox = searchParams.get('inbox') === 'true';

		const { models } = await database('xernerx');
		const ApprovalModel = (models.users as any).AuthApprovalRequest;

		// Opportunistically mark expired pending requests
		await ApprovalModel.updateMany({ status: 'pending', expiresAt: { $lte: new Date() } }, { $set: { status: 'expired' } }).catch(() => {});

		// 1. Authenticated mobile inbox: list pending + recent approval requests for caller
		if (inbox || !id) {
			const caller = await resolveCallerAuth(req);
			if (!caller.authenticated || !caller.userId) {
				return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
			}

			const [pendingDocs, historyDocs] = await Promise.all([
				ApprovalModel.find({
					userId: caller.userId,
					status: 'pending',
					expiresAt: { $gt: new Date() },
				})
					.select('id status numberChoices deviceInfo ipAddress location attempts expiresAt createdAt')
					.sort({ createdAt: -1 })
					.limit(10)
					.lean(),
				ApprovalModel.find({
					userId: caller.userId,
					status: { $in: ['approved', 'denied', 'expired'] },
				})
					.select('id status deviceInfo ipAddress location createdAt updatedAt')
					.sort({ createdAt: -1 })
					.limit(20)
					.lean(),
			]);

			return NextResponse.json({
				pending: pendingDocs || [],
				history: historyDocs || [],
			});
		}

		// 2. Unauthenticated login screen polling by request ID
		const doc = (await ApprovalModel.findOne({ id }).lean()) as any;
		if (!doc) {
			return NextResponse.json({ status: 'expired' }, { status: 404 });
		}

		if (doc.status === 'pending' && new Date(doc.expiresAt).getTime() <= Date.now()) {
			await ApprovalModel.updateOne({ id }, { $set: { status: 'expired' } }).catch(() => {});
			return NextResponse.json({ status: 'expired' }, { status: 410 });
		}

		if (poll && doc.status === 'approved' && doc.handoffTicket) {
			const ticket = doc.handoffTicket;
			// Consume ticket atomically so it can never be replayed
			await ApprovalModel.updateOne({ id }, { $set: { handoffTicket: null } }).catch(() => {});
			return NextResponse.json({
				status: 'approved',
				handoffTicket: ticket,
			});
		}

		return NextResponse.json({
			id: doc.id,
			status: doc.status,
			deviceInfo: doc.deviceInfo,
			expiresAt: new Date(doc.expiresAt).getTime(),
		});
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}));
		const action = String(body.action || 'request');
		const { models } = await database('xernerx');
		const ApprovalModel = (models.users as any).AuthApprovalRequest;
		const MobileSessionModel = (models.users as any).MobileSession;
		const UserModel = models.users.User as any;

		// Action 1: Web/Desktop requests a targeted Outlook/GitHub-style sign-in approval on the user's phone
		if (action === 'request') {
			const rawIdentifier = String(body.identifier || '').trim();
			if (!rawIdentifier || rawIdentifier.length < 2) {
				return NextResponse.json({ error: 'Enter your Xernerx username, Discord ID, or email address.' }, { status: 400 });
			}

			const lower = rawIdentifier.toLowerCase();
			const escaped = rawIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const exactCaseInsensitive = new RegExp(`^${escaped}$`, 'i');

			const userDoc = (await UserModel.findOne({
				$or: [
					{ id: rawIdentifier },
					{ vanitySlug: lower },
					{ email: exactCaseInsensitive },
					{ name: exactCaseInsensitive },
					{ 'discordCache.username': exactCaseInsensitive },
					{ 'discordCache.globalName': exactCaseInsensitive },
				],
			})
				.select('id name blacklisted discordCache')
				.lean()) as any;

			if (!userDoc || userDoc.blacklisted) {
				return NextResponse.json({ error: 'No Xernerx Mobile device is paired with that account.' }, { status: 404 });
			}

			const activeSessions = (await MobileSessionModel.find({
				userId: userDoc.id,
				revokedAt: null,
				expiresAt: { $gt: new Date() },
			})
				.select('id deviceName platform pushToken')
				.lean()) as any[];

			if (!activeSessions || activeSessions.length === 0) {
				return NextResponse.json({ error: 'No active Xernerx Mobile app found for this account. Sign in on Xernerx Mobile first or use QR code login.' }, { status: 404 });
			}

			// Expire any older pending requests from the same user to avoid notification clutter (keep at most 3 recent)
			const { correctNumber, numberChoices } = generateNumberMatchChallenge();
			const deviceInfo = parseRequestDeviceInfo(req, body);
			const ipAddress = extractRequestIp(req);
			const location = extractRequestLocation(req);
			const expiresAt = new Date(Date.now() + APPROVAL_REQUEST_TTL_MS);

			const created = await ApprovalModel.create({
				id: crypto.randomBytes(16).toString('hex'),
				userId: userDoc.id,
				status: 'pending',
				correctNumber,
				numberChoices,
				deviceInfo,
				ipAddress,
				location,
				userAgent: (req.headers.get('user-agent') || '').slice(0, 256),
				expiresAt,
			});

			const pushTokens = activeSessions.map((s) => s.pushToken).filter(Boolean);
			const pushResult = await sendExpoPushNotification({
				pushTokens,
				title: 'Approve Xernerx Sign-In',
				body: `${deviceInfo}${location ? ` • ${location}` : ''} is trying to sign in. Open to match the 2-digit number.`,
				data: {
					type: 'auth_approval',
					requestId: created.id,
					deviceInfo,
				},
			});

			return NextResponse.json({
				requestId: created.id,
				verificationNumber: correctNumber,
				deviceInfo,
				deviceCount: activeSessions.length,
				pushSent: pushResult.sent,
				expiresAt: expiresAt.getTime(),
			});
		}

		// Action 2: Mobile approves a pending request by tapping the matching 2-digit number
		if (action === 'approve') {
			const mobileSession = await resolveMobileSessionFromRequest(req);
			if (!mobileSession) {
				return NextResponse.json({ error: 'Unauthorized: Authenticated Xernerx Mobile session required.' }, { status: 401 });
			}

			const requestId = String(body.requestId || '').trim();
			const selectedNumber = String(body.selectedNumber || '')
				.trim()
				.padStart(2, '0');

			if (!requestId || !selectedNumber) {
				return NextResponse.json({ error: 'requestId and selectedNumber are required.' }, { status: 400 });
			}

			const doc = (await ApprovalModel.findOne({ id: requestId, userId: mobileSession.userId })) as any;
			if (!doc) {
				return NextResponse.json({ error: 'Sign-in request not found.' }, { status: 404 });
			}

			if (doc.status !== 'pending') {
				return NextResponse.json({ error: `Sign-in request is already ${doc.status}.`, status: doc.status }, { status: 409 });
			}

			if (new Date(doc.expiresAt).getTime() <= Date.now()) {
				doc.status = 'expired';
				await doc.save();
				return NextResponse.json({ error: 'Sign-in request has expired.', status: 'expired' }, { status: 410 });
			}

			if (doc.correctNumber !== selectedNumber) {
				doc.attempts = Number(doc.attempts || 0) + 1;
				const exhausted = doc.attempts >= MAX_NUMBER_ATTEMPTS;
				if (exhausted) {
					doc.status = 'denied';
				}
				await doc.save();

				return NextResponse.json(
					{
						error: exhausted
							? 'Incorrect number selected twice. Request automatically denied for your security.'
							: 'Incorrect number. Check the 2-digit number shown on your login screen.',
						remainingAttempts: Math.max(0, MAX_NUMBER_ATTEMPTS - doc.attempts),
						status: doc.status,
					},
					{ status: 400 }
				);
			}

			const minted = await mintHandoffTicketFromMobileSession(mobileSession);
			if (!minted?.ticket) {
				return NextResponse.json({ error: 'Failed to mint sign-in session ticket. Please re-authenticate on mobile.' }, { status: 500 });
			}

			doc.status = 'approved';
			doc.approvedBySessionId = mobileSession.sessionId;
			doc.handoffTicket = minted.ticket;
			await doc.save();

			await recordAuditLog(req, {
				actorId: mobileSession.userId,
				actorName: minted.username,
				action: 'auth.approval.approved',
				targetType: 'user',
				targetId: mobileSession.userId,
				summary: `Approved mobile sign-in request for ${doc.deviceInfo}`,
				metadata: {
					requestId: doc.id,
					deviceInfo: doc.deviceInfo,
					ipAddress: doc.ipAddress,
					location: doc.location,
					approvedByDevice: mobileSession.session?.deviceName,
				},
			});

			return NextResponse.json({
				success: true,
				status: 'approved',
				deviceInfo: doc.deviceInfo,
			});
		}

		// Action 3: Mobile explicitly denies a pending sign-in request
		if (action === 'deny') {
			const caller = await resolveCallerAuth(req);
			if (!caller.authenticated || !caller.userId) {
				return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
			}

			const requestId = String(body.requestId || '').trim();
			if (!requestId) {
				return NextResponse.json({ error: 'requestId is required.' }, { status: 400 });
			}

			const updated = (await ApprovalModel.findOneAndUpdate(
				{ id: requestId, userId: caller.userId, status: 'pending' },
				{ $set: { status: 'denied', handoffTicket: null } },
				{ returnDocument: 'after' }
			).lean()) as any;

			if (!updated) {
				return NextResponse.json({ error: 'Sign-in request not found or already resolved.' }, { status: 404 });
			}

			await recordAuditLog(req, {
				actorId: caller.userId,
				action: 'auth.approval.denied',
				targetType: 'user',
				targetId: caller.userId,
				summary: `Denied sign-in request from ${updated.deviceInfo}`,
				metadata: {
					requestId: updated.id,
					deviceInfo: updated.deviceInfo,
					ipAddress: updated.ipAddress,
					location: updated.location,
				},
			});

			return NextResponse.json({
				success: true,
				status: 'denied',
				deviceInfo: updated.deviceInfo,
			});
		}

		return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
