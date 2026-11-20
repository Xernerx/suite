/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';
import { resolveMobileSessionFromRequest } from '@/lib/mobileAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const mobileSession = await resolveMobileSessionFromRequest(req);
		const caller = await resolveCallerAuth(req);

		if (!caller.authenticated || !caller.userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = caller.userId;
		const { models } = await database('xernerx');
		const MobileSessionModel = (models.users as any).MobileSession;
		const ApprovalModel = (models.users as any).AuthApprovalRequest;

		const [userDoc, appearanceDoc, creditDoc, levelDoc, subscriptions, activeMobileSessions, pendingApprovalsCount] = await Promise.all([
			models.users.User.findOne({ id: userId }).lean(),
			models.users.Appearance.findOne({ ownerId: userId }).lean(),
			models.users.Credit.findOne({ ownerId: userId }).lean(),
			models.users.Level.findOne({ ownerId: userId }).lean(),
			models.users.Subscription.find({ ownerId: userId }).lean(),
			MobileSessionModel
				? MobileSessionModel.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } })
						.select('-tokenHash -encryptedOAuthPayload')
						.sort({ lastActiveAt: -1 })
						.lean()
				: [],
			ApprovalModel
				? ApprovalModel.countDocuments({
						userId,
						status: 'pending',
						expiresAt: { $gt: new Date() },
					}).catch(() => 0)
				: 0,
		]);

		let safeCurrentSession: any = null;
		if (mobileSession?.session) {
			const { tokenHash: _h, encryptedOAuthPayload: _e, ...rest } = mobileSession.session;
			safeCurrentSession = rest;
		}

		return NextResponse.json({
			session: safeCurrentSession,
			mobileSessions: activeMobileSessions || [],
			user: userDoc || { id: userId },
			appearance: appearanceDoc || {},
			credits: creditDoc || { balance: 0, streak: 0 },
			level: levelDoc || { level: 1, xp: 0 },
			subscriptions: subscriptions || [],
			permissions: caller.permissions,
			isStaff: caller.isStaff,
			isAdmin: Boolean(caller.permissions?.access),
			pendingApprovalsCount: Number(pendingApprovalsCount) || 0,
		});
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest) {
	try {
		const mobileSession = await resolveMobileSessionFromRequest(req);
		if (!mobileSession) {
			return NextResponse.json({ error: 'Unauthorized: Mobile session required' }, { status: 401 });
		}

		const body = await req.json().catch(() => ({}));
		const updates: Record<string, any> = {};

		if (body.pushToken !== undefined) {
			updates.pushToken = body.pushToken ? String(body.pushToken).trim().slice(0, 256) : null;
		}
		if (typeof body.deviceName === 'string' && body.deviceName.trim()) {
			updates.deviceName = body.deviceName.trim().slice(0, 80);
		}
		if (typeof body.biometricsEnabled === 'boolean') {
			updates.biometricsEnabled = body.biometricsEnabled;
		}
		if (typeof body.appVersion === 'string' && body.appVersion.trim()) {
			updates.appVersion = body.appVersion.trim().slice(0, 32);
		}
		if (typeof body.osVersion === 'string') {
			updates.osVersion = body.osVersion.trim().slice(0, 32);
		}

		const { models } = await database('xernerx');
		const MobileSessionModel = (models.users as any).MobileSession;
		const updated = await MobileSessionModel.findOneAndUpdate(
			{ id: mobileSession.sessionId, userId: mobileSession.userId, revokedAt: null },
			{ $set: { ...updates, lastActiveAt: new Date() } },
			{ returnDocument: 'after' }
		)
			.select('-tokenHash -encryptedOAuthPayload')
			.lean();

		return NextResponse.json({ session: updated });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const mobileSession = await resolveMobileSessionFromRequest(req);
		const caller = await resolveCallerAuth(req);
		if (!caller.authenticated || !caller.userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const targetSessionId = searchParams.get('sessionId') || mobileSession?.sessionId;
		if (!targetSessionId) {
			return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const MobileSessionModel = (models.users as any).MobileSession;
		const revoked = (await MobileSessionModel.findOneAndUpdate(
			{ id: targetSessionId, userId: caller.userId, revokedAt: null },
			{ $set: { revokedAt: new Date() } },
			{ returnDocument: 'after' }
		).lean()) as any;

		if (revoked?.deviceId) {
			const trackedId = `mobile-${revoked.deviceId}`
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, '')
				.slice(0, 64);
			await models.users.User.updateOne({ id: caller.userId }, { $pull: { devices: { id: trackedId } } }).catch(() => {});
		}

		return NextResponse.json({ success: true, revokedSessionId: targetSessionId });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
