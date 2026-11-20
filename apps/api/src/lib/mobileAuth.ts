/** @format */

import crypto from 'crypto';
import { encryptQrHandoffTicket } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { mergeUserDevices, type TrackedUserDevice } from './userRouteActions';

export const MOBILE_TOKEN_PREFIX = 'xrx_mob_';
export const MOBILE_SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
export const APPROVAL_REQUEST_TTL_MS = 2 * 60 * 1000; // 2 minutes

export interface MobileOAuthPayload {
	sub: string;
	name?: string | null;
	email?: string | null;
	picture?: string | null;
	accessToken?: string;
	refreshToken?: string;
	accessTokenExpires?: number;
}

export interface ResolvedMobileSession {
	session: any;
	userId: string;
	sessionId: string;
	oauthPayload: MobileOAuthPayload | null;
}

function getMobileCryptoKey(): Buffer {
	const rawSecret = process.env.NEXTAUTH_SECRET || process.env.DISCORD_CLIENT_SECRET || 'xernerx-suite-mobile-session-key';
	return crypto.createHash('sha256').update(`mobile:${rawSecret}`).digest();
}

export function encryptMobileOAuthPayload(payload: MobileOAuthPayload): string {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv('aes-256-gcm', getMobileCryptoKey(), iv);
	const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
	const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	const tag = cipher.getAuthTag();
	return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptMobileOAuthPayload(ciphertext?: string | null): MobileOAuthPayload | null {
	if (!ciphertext || typeof ciphertext !== 'string') return null;
	try {
		const parts = ciphertext.split('.');
		if (parts.length !== 3) return null;
		const iv = Buffer.from(parts[0], 'base64url');
		const tag = Buffer.from(parts[1], 'base64url');
		const encrypted = Buffer.from(parts[2], 'base64url');
		const decipher = crypto.createDecipheriv('aes-256-gcm', getMobileCryptoKey(), iv);
		decipher.setAuthTag(tag);
		const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
		const parsed = JSON.parse(decrypted);
		if (!parsed || typeof parsed !== 'object' || !parsed.sub) return null;
		return parsed as MobileOAuthPayload;
	} catch {
		return null;
	}
}

export function hashMobileToken(rawToken: string): string {
	return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateMobileAccessToken(): string {
	return `${MOBILE_TOKEN_PREFIX}${crypto.randomBytes(32).toString('hex')}`;
}

export function extractMobileBearerToken(req: Request): string | null {
	const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
	const token = authHeader.slice(7).trim();
	if (!token.startsWith(MOBILE_TOKEN_PREFIX)) return null;
	return token;
}

export function extractRequestIp(req: Request): string | null {
	const forwardedFor = req.headers.get('x-forwarded-for');
	if (forwardedFor) {
		const first = forwardedFor.split(',')[0]?.trim();
		if (first) return first.replace(/^::ffff:/i, '');
	}
	const realIp = req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip');
	return realIp ? realIp.trim().replace(/^::ffff:/i, '') : null;
}

export function extractRequestLocation(req: Request): string | null {
	const cityRaw = req.headers.get('x-vercel-ip-city') || '';
	const regionRaw = req.headers.get('x-vercel-ip-country-region') || '';
	const countryRaw = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || '';

	const decodeSafe = (val: string) => {
		try {
			return decodeURIComponent(val).trim();
		} catch {
			return val.trim();
		}
	};

	const parts = [decodeSafe(cityRaw), decodeSafe(regionRaw), decodeSafe(countryRaw)].filter(Boolean);
	return parts.length > 0 ? parts.join(', ') : null;
}

export function parseRequestDeviceInfo(req: Request, body?: Record<string, any>): string {
	if (body?.deviceInfo && typeof body.deviceInfo === 'string' && body.deviceInfo.trim()) {
		return body.deviceInfo.trim().slice(0, 120);
	}
	const ua = req.headers.get('user-agent') || '';
	const isElectron = ua.toLowerCase().includes('electron') || ua.includes('XernerxDesktop') || Boolean(body?.isDesktop);
	const isMobileApp = ua.includes('XernerxMobile');

	let browser = 'Web Browser';
	if (isElectron) browser = 'Xernerx Desktop';
	else if (isMobileApp) browser = 'Xernerx Mobile';
	else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
	else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
	else if (ua.includes('Chrome/')) browser = 'Google Chrome';
	else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
	else if (ua.includes('Safari/')) browser = 'Apple Safari';

	let os = 'Device';
	if (ua.includes('Windows')) os = 'Windows';
	else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
	else if (ua.includes('Android')) os = 'Android';
	else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) os = 'iOS';
	else if (ua.includes('Linux')) os = 'Linux';

	return `${browser} (${os})`;
}

export function generateNumberMatchChallenge(): { correctNumber: string; numberChoices: string[] } {
	const picked = new Set<string>();
	while (picked.size < 3) {
		const n = crypto.randomInt(1, 100);
		picked.add(String(n).padStart(2, '0'));
	}
	const arr = Array.from(picked);
	const correctNumber = arr[0];

	// Fisher-Yates shuffle
	for (let i = arr.length - 1; i > 0; i--) {
		const j = crypto.randomInt(0, i + 1);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}

	return { correctNumber, numberChoices: arr };
}

export async function createMobileSession(params: {
	userId: string;
	deviceId: string;
	deviceName?: string;
	platform: 'ios' | 'android';
	osVersion?: string;
	appVersion?: string;
	pushToken?: string | null;
	biometricsEnabled?: boolean;
	oauthPayload: MobileOAuthPayload;
}): Promise<{ accessToken: string; session: any }> {
	const { models } = await database('xernerx');
	const UserModel = models.users.User as any;
	const MobileSessionModel = (models.users as any).MobileSession;

	const userDoc = (await UserModel.findOne({ id: params.userId }).select('id sessionVersion devices name').lean()) as any;
	const currentSessionVersion = Number(userDoc?.sessionVersion) || 1;

	// Revoke previous active sessions for the same deviceId + userId to prevent duplicate stale entries
	await MobileSessionModel.updateMany({ userId: params.userId, deviceId: params.deviceId, revokedAt: null }, { $set: { revokedAt: new Date() } }).catch(() => {});

	const accessToken = generateMobileAccessToken();
	const tokenHash = hashMobileToken(accessToken);
	const now = new Date();
	const expiresAt = new Date(Date.now() + MOBILE_SESSION_TTL_MS);

	const sessionDoc = await MobileSessionModel.create({
		id: crypto.randomUUID(),
		tokenHash,
		userId: params.userId,
		deviceId: params.deviceId,
		deviceName: (params.deviceName || (params.platform === 'ios' ? 'iPhone' : 'Android Device')).slice(0, 80),
		platform: params.platform,
		osVersion: (params.osVersion || '').slice(0, 32),
		appVersion: (params.appVersion || '1.0.0').slice(0, 32),
		pushToken: params.pushToken ? String(params.pushToken).trim() : null,
		biometricsEnabled: params.biometricsEnabled !== false,
		sessionVersion: currentSessionVersion,
		encryptedOAuthPayload: encryptMobileOAuthPayload(params.oauthPayload),
		lastActiveAt: now,
		revokedAt: null,
		expiresAt,
	});

	// Sync mobile device into User.devices so it appears cleanly on web Account -> Devices
	const mobileTrackedDevice: TrackedUserDevice = {
		id: `mobile-${params.deviceId}`
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, '')
			.slice(0, 64),
		browser: `Xernerx Mobile (${sessionDoc.deviceName})`,
		os: params.platform === 'ios' ? `iOS${params.osVersion ? ` ${params.osVersion}` : ''}` : `Android${params.osVersion ? ` ${params.osVersion}` : ''}`,
		deviceType: 'mobile',
		lastActive: now,
	};
	const merged = mergeUserDevices(userDoc?.devices, mobileTrackedDevice);
	await UserModel.updateOne({ id: params.userId }, { $set: { devices: merged.devices } }).catch(() => {});

	return {
		accessToken,
		session: sessionDoc.toObject ? sessionDoc.toObject() : sessionDoc,
	};
}

export async function resolveMobileSessionFromToken(rawToken: string): Promise<ResolvedMobileSession | null> {
	if (!rawToken || !rawToken.startsWith(MOBILE_TOKEN_PREFIX)) return null;
	try {
		const { models } = await database('xernerx');
		const MobileSessionModel = (models.users as any).MobileSession;
		const UserModel = models.users.User as any;
		if (!MobileSessionModel) return null;

		const tokenHash = hashMobileToken(rawToken);
		const session = (await MobileSessionModel.findOne({ tokenHash, revokedAt: null }).lean()) as any;
		if (!session) return null;

		if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
			return null;
		}

		const user = (await UserModel.findOne({ id: session.userId }).select('id blacklisted sessionVersion').lean()) as any;
		if (!user || user.blacklisted) return null;

		const currentSessionVersion = Number(user.sessionVersion) || 1;
		if (Number(session.sessionVersion || 1) !== currentSessionVersion) {
			return null;
		}

		// Throttled rolling activity update (every 5 minutes)
		const lastActiveMs = session.lastActiveAt ? new Date(session.lastActiveAt).getTime() : 0;
		if (!Number.isFinite(lastActiveMs) || Date.now() - lastActiveMs > 5 * 60 * 1000) {
			const nextExpiry = new Date(Date.now() + MOBILE_SESSION_TTL_MS);
			MobileSessionModel.updateOne({ id: session.id }, { $set: { lastActiveAt: new Date(), expiresAt: nextExpiry } }).catch(() => {});
		}

		return {
			session,
			userId: String(session.userId),
			sessionId: String(session.id),
			oauthPayload: decryptMobileOAuthPayload(session.encryptedOAuthPayload),
		};
	} catch {
		return null;
	}
}

export async function resolveMobileSessionFromRequest(req: Request): Promise<ResolvedMobileSession | null> {
	const rawToken = extractMobileBearerToken(req);
	if (!rawToken) return null;
	return resolveMobileSessionFromToken(rawToken);
}

async function refreshDiscordTokensIfNeeded(sessionId: string, payload: MobileOAuthPayload): Promise<MobileOAuthPayload> {
	const needsRefresh = payload.refreshToken && (!payload.accessToken || (payload.accessTokenExpires && Date.now() >= payload.accessTokenExpires - 60_000));

	if (!needsRefresh || !process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
		return payload;
	}

	try {
		const res = await fetch('https://discord.com/api/oauth2/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: process.env.DISCORD_CLIENT_ID,
				client_secret: process.env.DISCORD_CLIENT_SECRET,
				grant_type: 'refresh_token',
				refresh_token: payload.refreshToken!,
			}),
		});

		if (!res.ok) return payload;
		const refreshed = await res.json();
		const nextPayload: MobileOAuthPayload = {
			...payload,
			accessToken: refreshed.access_token || payload.accessToken,
			refreshToken: refreshed.refresh_token || payload.refreshToken,
			accessTokenExpires: refreshed.expires_in ? Date.now() + Number(refreshed.expires_in) * 1000 : payload.accessTokenExpires,
		};

		const { models } = await database('xernerx');
		const MobileSessionModel = (models.users as any).MobileSession;
		if (MobileSessionModel) {
			await MobileSessionModel.updateOne({ id: sessionId }, { $set: { encryptedOAuthPayload: encryptMobileOAuthPayload(nextPayload) } }).catch(() => {});
		}

		return nextPayload;
	} catch {
		return payload;
	}
}

export async function mintHandoffTicketFromMobileSession(resolved: ResolvedMobileSession): Promise<{ ticket: string; username: string } | null> {
	try {
		const { models } = await database('xernerx');
		const userDoc = (await models.users.User.findOne({ id: resolved.userId }).select('id name email icon discordCache').lean()) as any;
		const basePayload: MobileOAuthPayload = resolved.oauthPayload || {
			sub: resolved.userId,
			name: userDoc?.discordCache?.globalName || userDoc?.discordCache?.username || userDoc?.name || 'user',
			email: userDoc?.email || null,
			picture: userDoc?.discordCache?.avatarUrl || userDoc?.icon || null,
		};

		const freshPayload = await refreshDiscordTokensIfNeeded(resolved.sessionId, basePayload);
		const username = freshPayload.name || userDoc?.name || 'user';

		const ticket = encryptQrHandoffTicket({
			sub: resolved.userId,
			name: username,
			email: freshPayload.email || userDoc?.email || null,
			picture: freshPayload.picture || userDoc?.discordCache?.avatarUrl || userDoc?.icon || null,
			accessToken: freshPayload.accessToken,
			refreshToken: freshPayload.refreshToken,
			accessTokenExpires: freshPayload.accessTokenExpires || Date.now() + 7 * 24 * 60 * 60 * 1000,
			exp: Date.now() + 5 * 60 * 1000,
		});

		return { ticket, username };
	} catch {
		return null;
	}
}

export async function sendExpoPushNotification(params: { pushTokens: string[]; title: string; body: string; data?: Record<string, any>; channelId?: string }): Promise<{ sent: number }> {
	const validTokens = Array.from(new Set(params.pushTokens.map((t) => String(t || '').trim()).filter((t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))));

	if (validTokens.length === 0) return { sent: 0 };

	try {
		const messages = validTokens.map((to) => ({
			to,
			sound: 'default',
			priority: 'high',
			title: params.title,
			body: params.body,
			data: params.data || {},
			channelId: params.channelId || 'auth-approvals',
		}));

		const res = await fetch('https://exp.host/--/api/v2/push/send', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Accept-Encoding': 'gzip, deflate',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(messages),
		});

		if (!res.ok) {
			console.warn('[MobilePush] Expo Push API returned non-OK status:', res.status);
			return { sent: 0 };
		}

		return { sent: validTokens.length };
	} catch (err) {
		console.warn('[MobilePush] Failed to dispatch Expo push notification:', err);
		return { sent: 0 };
	}
}
