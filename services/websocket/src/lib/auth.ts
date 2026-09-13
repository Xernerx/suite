/** @format */

import { database } from '@xernerx/lib/core';
import { jwtVerify } from 'jose';

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

/**
 * Validates whether a token is permitted to use the WebSocket gateway.
 * A token is ONLY valid if its schema state has `permissions.websocket` set to `true`.
 */
export async function verifyWebsocketToken(token: unknown): Promise<TokenVerificationResult> {
	if (!token || typeof token !== 'string') {
		return { valid: false, message: 'Missing or invalid token' };
	}

	try {
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any)?.Token;

		// 1. Direct database Token lookup (Admin / developer generated tokens)
		if (TokenModel) {
			const tokenDoc = await TokenModel.findOne({ id: token });

			if (tokenDoc) {
				if (tokenDoc.status === 'inactive' || tokenDoc.status === 'suspended') {
					return { valid: false, message: `Forbidden: Token is ${tokenDoc.status}` };
				}

				if (!tokenDoc.permissions?.websocket) {
					return {
						valid: false,
						message: 'Forbidden: Token needs websocket allowance',
					};
				}

				return {
					valid: true,
					tokenId: tokenDoc.id,
					userId: tokenDoc.owners?.[0],
					tokenDoc,
				};
			}
		}

		// 2. JWT token verification
		const secret = getSecret();
		if (secret) {
			try {
				const { payload } = await jwtVerify(token, secret);

				// If the JWT payload references a database token ID
				const tokenId = (payload as any)?.tokenId || (payload as any)?.id;
				if (tokenId && typeof tokenId === 'string' && TokenModel) {
					const dbToken = await TokenModel.findOne({ id: tokenId });
					if (!dbToken) {
						return { valid: false, message: 'Token not found' };
					}
					if (dbToken.status === 'inactive' || dbToken.status === 'suspended') {
						return { valid: false, message: `Forbidden: Token is ${dbToken.status}` };
					}
					if (!dbToken.permissions?.websocket) {
						return {
						valid: false,
						message: 'Forbidden: Token needs websocket allowance',
					};
					}
					return {
						valid: true,
						tokenId: dbToken.id,
						userId: (payload as any)?.userId || dbToken.owners?.[0],
						tokenDoc: dbToken,
					};
				}

				// If the JWT payload itself contains the permissions object
				if ((payload as any)?.permissions?.websocket === true || (payload as any)?.websocket === true) {
					return {
						valid: true,
						userId: (payload as any)?.userId,
					};
				}

				return {
					valid: false,
					message: 'Forbidden: Token needs websocket allowance',
				};
			} catch {
				// JWT verification failed, proceed to fallback check
			}
		}

		return { valid: false, message: 'Invalid token' };
	} catch (error) {
		console.error('WebSocket token verification error:', error);
		return { valid: false, message: 'Internal authentication error' };
	}
}

/**
 * Verifies that an already-authenticated token still has active websocket permissions.
 */
export async function checkTokenWebsocketAccess(tokenId: string): Promise<boolean> {
	try {
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any)?.Token;
		if (!TokenModel) return false;

		const tokenDoc = await TokenModel.findOne({ id: tokenId });
		if (!tokenDoc) return false;
		if (tokenDoc.status === 'inactive' || tokenDoc.status === 'suspended') return false;

		return Boolean(tokenDoc.permissions?.websocket);
	} catch (e) {
		console.error('Failed to check token websocket access:', e);
		return false;
	}
}
