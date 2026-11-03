/** @format */

import { database } from '@xernerx/lib/core';
import { Terminal } from '@xernerx/terminal';
import { jwtVerify } from 'jose';

const terminal = new Terminal({ scope: 'WS:AUTH', title: 'XERNERX', format: ['title', 'scope', 'datetime', 'memory'], spin: false });

function getSecret() {
	return process.env.WS_TOKEN ? new TextEncoder().encode(process.env.WS_TOKEN) : null;
}

export interface TokenVerificationResult {
	valid: boolean;
	message?: string;
	userId?: string;
	tokenId?: string;
	tokenDoc?: any;
}

function isIpAllowed(clientIp: string | undefined, allowedIps: unknown): boolean {
	if (!Array.isArray(allowedIps) || allowedIps.length === 0) return true;
	const cleanList = allowedIps.map((ip) => String(ip || '').trim()).filter(Boolean);
	if (cleanList.length === 0) return true;
	if (!clientIp) return true;
	const normalizedClient = String(clientIp)
		.trim()
		.replace(/^::ffff:/i, '');
	const isDev = process.env.ENVIRONMENT?.toUpperCase() === 'DEVELOPMENT' || process.env.NODE_ENV?.toUpperCase() === 'DEVELOPMENT';
	if (isDev && (normalizedClient === '127.0.0.1' || normalizedClient === '::1')) {
		return true;
	}
	return cleanList.some((allowed) => {
		const normAllowed = allowed.replace(/^::ffff:/i, '');
		if (normAllowed === normalizedClient || normAllowed === '*') return true;
		if (normAllowed.endsWith('.*')) {
			return normalizedClient.startsWith(normAllowed.slice(0, -1));
		}
		return false;
	});
}

/**
 * Validates whether a token is permitted to use the WebSocket gateway.
 * A token is ONLY valid if it exists in `users.tokens`, is not inactive/suspended,
 * and has `permissions.websocket === true`.
 */
export async function verifyWebsocketToken(token: unknown, clientIp?: string): Promise<TokenVerificationResult> {
	if (!token || typeof token !== 'string') {
		return { valid: false, message: 'Missing or invalid token' };
	}

	const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
	if (!cleanToken) {
		return { valid: false, message: 'Missing or invalid token' };
	}

	try {
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any)?.Token;

		if (!TokenModel) {
			return { valid: false, message: 'Token store unavailable' };
		}

		// Resolve candidate token ID (either direct token string or extracted from a signed JWT)
		let candidateTokenId: string | null = cleanToken;
		let jwtUserId: string | undefined;

		const secret = getSecret();
		if (secret && cleanToken.split('.').length === 3) {
			try {
				const { payload } = await jwtVerify(cleanToken, secret);
				const extractedId = (payload as any)?.tokenId || (payload as any)?.id;
				jwtUserId = (payload as any)?.userId;
				if (extractedId && typeof extractedId === 'string') {
					candidateTokenId = extractedId;
				}
			} catch {
				// Not a valid JWT; fall back to checking the literal token string in DB
			}
		}

		const tokenDoc = await TokenModel.findOne({ id: candidateTokenId });

		if (!tokenDoc) {
			return { valid: false, message: 'Unauthorized: Invalid token' };
		}

		if (tokenDoc.status === 'inactive' || tokenDoc.status === 'suspended') {
			return { valid: false, message: `Forbidden: Token is ${tokenDoc.status}` };
		}

		if (tokenDoc.expiresAt) {
			const expMs = new Date(tokenDoc.expiresAt).getTime();
			if (!Number.isNaN(expMs) && expMs <= Date.now()) {
				return { valid: false, message: 'Unauthorized: Token has expired' };
			}
		}

		if (!isIpAllowed(clientIp, tokenDoc.allowedIps)) {
			return { valid: false, message: 'Forbidden: Client IP is not in this token allowlist' };
		}

		if (tokenDoc.permissions?.websocket !== true) {
			return {
				valid: false,
				message: 'Forbidden: Token does not have websocket permission',
			};
		}

		const ownerIds = Array.isArray(tokenDoc.owners) ? tokenDoc.owners.map(String).filter(Boolean) : [];
		if (ownerIds.length > 0 && (db.models.users as any)?.User) {
			const blacklistedOwner = await (db.models.users as any).User.findOne({ id: { $in: ownerIds }, blacklisted: true })
				.select('id')
				.lean()
				.catch(() => null);
			if (blacklistedOwner) {
				return {
					valid: false,
					message: 'Forbidden: Token owner account is blacklisted',
				};
			}
		}

		// Record token usage telemetry and activate pending tokens
		await TokenModel.updateOne(
			{ id: tokenDoc.id },
			{
				$inc: { requestCount: 1 },
				$set: {
					lastUsedAt: new Date(),
					...(tokenDoc.status === 'pending' ? { status: 'active' } : {}),
				},
			}
		).catch(() => {});

		return {
			valid: true,
			tokenId: tokenDoc.id,
			userId: jwtUserId || tokenDoc.owners?.[0],
			tokenDoc,
		};
	} catch (error) {
		terminal.error(`WebSocket token verification error: ${error instanceof Error ? error.message : String(error)}`);
		return { valid: false, message: 'Internal authentication error' };
	}
}

/**
 * Verifies that an already-authenticated token still has active websocket permissions
 * and increments usage telemetry.
 */
export async function checkTokenWebsocketAccess(tokenId: string, clientIp?: string): Promise<boolean> {
	if (!tokenId || typeof tokenId !== 'string') return false;

	try {
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any)?.Token;
		if (!TokenModel) return false;

		const tokenDoc = await TokenModel.findOneAndUpdate(
			{
				id: tokenId,
				status: { $nin: ['inactive', 'suspended'] },
				'permissions.websocket': true,
			},
			{
				$inc: { requestCount: 1 },
				$set: { lastUsedAt: new Date() },
			},
			{ returnDocument: 'after' }
		).lean();

		if (!tokenDoc || (tokenDoc as any).permissions?.websocket !== true) return false;

		if ((tokenDoc as any).expiresAt) {
			const expMs = new Date((tokenDoc as any).expiresAt).getTime();
			if (!Number.isNaN(expMs) && expMs <= Date.now()) {
				return false;
			}
		}

		if (!isIpAllowed(clientIp, (tokenDoc as any).allowedIps)) {
			return false;
		}

		return true;
	} catch (e) {
		terminal.error(`Failed to check token websocket access: ${e instanceof Error ? e.message : String(e)}`);
		return false;
	}
}
