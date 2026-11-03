/** @format */

import { NextRequest, NextResponse } from 'next/server';

import { database } from '@xernerx/lib/server';

function isIpAllowed(clientIp: string | undefined | null, allowedIps: unknown): boolean {
	if (!Array.isArray(allowedIps) || allowedIps.length === 0) return true;
	const cleanList = allowedIps.map((ip) => String(ip || '').trim()).filter(Boolean);
	if (cleanList.length === 0) return true;
	if (!clientIp) return true;
	const normalizedClient = String(clientIp)
		.trim()
		.replace(/^::ffff:/i, '');
	if (process.env.ENVIRONMENT?.toLowerCase() === 'development' && (normalizedClient === '127.0.0.1' || normalizedClient === '::1')) {
		return true;
	}
	return cleanList.some((allowed) => {
		const normAllowed = allowed.replace(/^::ffff:/i, '');
		if (normAllowed === normalizedClient || normAllowed === '*') return true;
		if (normAllowed.endsWith('.*')) {
			const prefix = normAllowed.slice(0, -1);
			return normalizedClient.startsWith(prefix);
		}
		return false;
	});
}

export async function POST(req: NextRequest) {
	try {
		const { token, clientIp } = await req.json();

		if (!token) {
			return NextResponse.json({ error: 'Token is required' }, { status: 400 });
		}

		// 1. Initialize your custom database connection and grab the model
		const xernerxDb = await database('xernerx');
		const db = xernerxDb.models.users.Token;

		// 2. Find the token by the custom 'id' field and atomically update usage telemetry
		const tokenDoc = await db.findOneAndUpdate({ id: token }, { $inc: { requestCount: 1 }, $set: { lastUsedAt: new Date() } }, { returnDocument: 'after' });

		if (!tokenDoc) {
			return NextResponse.json({ error: 'Token not found' }, { status: 401 });
		}

		// Check optional TTL expiration (if expiresAt is set)
		if ((tokenDoc as any).expiresAt) {
			const expMs = new Date((tokenDoc as any).expiresAt).getTime();
			if (!Number.isNaN(expMs) && expMs <= Date.now()) {
				return NextResponse.json({ error: 'Token has expired', expired: true }, { status: 401 });
			}
		}

		// Check optional IP allowlist (if allowedIps is non-empty)
		const forwardedFor = req.headers.get('x-forwarded-for');
		const resolvedIp = clientIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip'));
		if (!isIpAllowed(resolvedIp, (tokenDoc as any).allowedIps)) {
			return NextResponse.json({ id: tokenDoc.id, status: 'suspended', ipBlocked: true, permissions: {} }, { status: 200 });
		}

		const ownerIds = Array.isArray(tokenDoc.owners) ? tokenDoc.owners.map(String).filter(Boolean) : [];
		if (ownerIds.length > 0 && xernerxDb.models.users?.User) {
			const blacklistedOwner = await xernerxDb.models.users.User.findOne({ id: { $in: ownerIds }, blacklisted: true })
				.select('id')
				.lean()
				.catch(() => null);
			if (blacklistedOwner) {
				return NextResponse.json({ id: tokenDoc.id, status: 'suspended', permissions: {} }, { status: 200 });
			}
		}

		// 3. Determine if the token is 'pending' (i.e., missing a link to a bot profile)
		// Replace 'bot' with your actual schema field name if it's named something else (e.g., profile, botId)
		const isPending = !tokenDoc.botId;

		// If it's pending, override status to 'pending'. Otherwise, use the database status.
		const resolvedStatus = isPending ? 'pending' : tokenDoc.status;

		// 4. Return the evaluated data to the middleware
		return NextResponse.json(
			{
				id: tokenDoc.id,
				status: resolvedStatus,
				permissions: tokenDoc.permissions,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Internal token validation failed:', error);
		return NextResponse.json({ error: 'Database error' }, { status: 500 });
	}
}
