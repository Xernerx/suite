/** @format */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { authenticateV1BotRequest } from '@/lib/v1BotAuth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authHeader = req.headers.get('Authorization');

		if (authHeader) {
			const authResult = await authenticateV1BotRequest(req, id, { isMutation: false });
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
		const authResult = await authenticateV1BotRequest(req, id, { isMutation: true });
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { bot, hasFullAccess, tokenDoc } = authResult;
		if (!hasFullAccess) {
			return NextResponse.json({ error: 'Forbidden: You do not have permission to publish releases for this bot.' }, { status: 403 });
		}

		const body = await req.json().catch(() => ({}));
		const version = String(body.version || '').trim();
		const title = String(body.title || '').trim();
		const releaseBody = String(body.body || body.notes || '').trim();

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

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	return POST(req, context);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authResult = await authenticateV1BotRequest(req, id, { isMutation: true });
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { bot, hasFullAccess } = authResult;
		if (!hasFullAccess) {
			return NextResponse.json({ error: 'Forbidden: You do not have permission to modify releases for this bot.' }, { status: 403 });
		}

		const body = await req.json().catch(() => ({}));
		const releaseId = String(req.nextUrl.searchParams.get('releaseId') || body.releaseId || body.id || body.version || '').trim();
		if (!releaseId) {
			return NextResponse.json({ error: 'releaseId, id, or version is required to update a release.' }, { status: 400 });
		}

		const existingReleases = Array.isArray(bot.releases) ? [...bot.releases] : [];
		const targetIndex = existingReleases.findIndex((r: any) => r.id === releaseId || r.version === releaseId);
		if (targetIndex === -1) {
			return NextResponse.json({ error: 'Release not found.' }, { status: 404 });
		}

		if (body.version !== undefined) existingReleases[targetIndex].version = String(body.version).trim();
		if (body.title !== undefined) existingReleases[targetIndex].title = String(body.title).trim();
		if (body.body !== undefined || body.notes !== undefined) existingReleases[targetIndex].body = String(body.body ?? body.notes ?? '').trim();

		bot.releases = existingReleases;
		await bot.save();

		return NextResponse.json({ release: existingReleases[targetIndex], releases: bot.releases });
	} catch (error) {
		console.error('Failed to PATCH v1 bot release:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const authResult = await authenticateV1BotRequest(req, id, { isMutation: true });
		if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

		const { bot, hasFullAccess } = authResult;
		if (!hasFullAccess) {
			return NextResponse.json({ error: 'Forbidden: You do not have permission to delete releases for this bot.' }, { status: 403 });
		}

		const body = await req.json().catch(() => ({}));
		const releaseId = String(req.nextUrl.searchParams.get('releaseId') || body.releaseId || body.id || body.version || '').trim();

		if (releaseId) {
			bot.releases = (Array.isArray(bot.releases) ? bot.releases : []).filter((r: any) => r.id !== releaseId && r.version !== releaseId);
		} else {
			bot.releases = [];
		}

		await bot.save();
		return NextResponse.json({ message: 'Releases updated successfully', releases: bot.releases });
	} catch (error) {
		console.error('Failed to DELETE v1 bot release:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
