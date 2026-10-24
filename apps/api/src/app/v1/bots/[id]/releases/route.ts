/** @format */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';

async function authenticateBotToken(req: NextRequest, botId: string) {
	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return { error: 'Missing Authorization header', status: 401 };

	const tokenValue = authHeader.replace(/^Bearer\s+/i, '').trim();

	const db = await database('xernerx');
	const TokenModel = (db.models.users as any).Token;
	const BotModel = (db.models.bots as any).Profile || (db.models.bots as any).Bot;

	if (!TokenModel || !BotModel) return { error: 'Database models not found', status: 500 };

	const isSystemToken = Boolean((process.env.XERNERX_TOKEN && tokenValue === process.env.XERNERX_TOKEN) || (process.env.XERNERX_APP_TOKEN && tokenValue === process.env.XERNERX_APP_TOKEN));
	const tokenDoc = await TokenModel.findOne({ id: tokenValue });

	if (!tokenDoc && !isSystemToken) return { error: 'Invalid token', status: 401 };
	if (tokenDoc && (tokenDoc.status === 'inactive' || tokenDoc.status === 'suspended')) {
		return { error: 'Token is inactive or suspended', status: 403 };
	}

	const bot = await BotModel.findOne({ $or: [{ id: botId }, { vanitySlug: botId.toLowerCase() }] });
	if (!bot) return { error: 'Bot not found', status: 404 };

	const tokenOwners = tokenDoc?.owners || [];
	const botOwners = bot?.owners || [];
	const hasFullAccess = isSystemToken || tokenDoc?.botId === bot.id || tokenOwners.some((owner: string) => botOwners.includes(owner));

	return { bot, hasFullAccess, tokenDoc, BotModel };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authHeader = req.headers.get('Authorization');

		if (authHeader) {
			const authResult = await authenticateBotToken(req, id);
			if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
			const { bot, hasFullAccess } = authResult;
			if (!hasFullAccess && bot.privacy === 'private') {
				return NextResponse.json({ error: 'This bot profile is private.' }, { status: 403 });
			}
			const releases = (Array.isArray(bot.releases) ? bot.releases : []).slice().sort((a: any, b: any) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
			return NextResponse.json({ releases });
		}

		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;
		const bot = await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		if (bot.privacy === 'private') {
			return NextResponse.json({ error: 'This bot profile is private.' }, { status: 403 });
		}

		const releases = (Array.isArray(bot.releases) ? bot.releases : []).slice().sort((a: any, b: any) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());

		return NextResponse.json({ releases });
	} catch (error) {
		console.error('Failed to GET v1 bot releases:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authResult = await authenticateBotToken(req, id);
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { bot, hasFullAccess, tokenDoc } = authResult;
		if (!hasFullAccess) {
			return NextResponse.json({ error: 'Forbidden: You do not have permission to publish releases for this bot.' }, { status: 403 });
		}

		const body = await req.json().catch(() => ({}));
		const version = String(body.version || '').trim();
		const title = String(body.title || '').trim();
		const releaseBody = String(body.body || '').trim();

		if (!version || !title) {
			return NextResponse.json({ error: 'version and title are required.' }, { status: 400 });
		}

		const newRelease = {
			id: crypto.randomUUID(),
			version,
			title,
			body: releaseBody,
			authorId: tokenDoc?.owners?.[0] || bot.owners?.[0] || 'api',
			createdAt: new Date(),
		};

		bot.releases = [newRelease, ...(Array.isArray(bot.releases) ? bot.releases : [])];
		await bot.save();

		return NextResponse.json({ release: newRelease, releases: bot.releases }, { status: 201 });
	} catch (error) {
		console.error('Failed to POST v1 bot release:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
