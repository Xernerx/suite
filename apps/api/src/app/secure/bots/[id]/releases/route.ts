/** @format */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

async function canManageBot(db: any, bot: any, userId: string | undefined) {
	if (!userId || !bot) return false;
	if (Array.isArray(bot.owners) && bot.owners.includes(userId)) return true;
	if (bot.organization) {
		const OrgModel = (db.models.organizations as any).Organization;
		const MemberModel = (db.models.organizations as any).Member;
		const [org, member] = await Promise.all([
			OrgModel.findById(bot.organization)
				.select('owner members')
				.lean()
				.catch(() => null),
			MemberModel.findOne({ organizationId: String(bot.organization), userId })
				.lean()
				.catch(() => null),
		]);
		if (org && (org.owner === userId || (Array.isArray(org.members) && org.members.includes(userId)))) return true;
		if (member) return true;
	}
	return false;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;

		const bot = await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		}

		if (bot.privacy === 'private') {
			const session = (await getServerSession(auth)) as any;
			const userId = session?.user?.id;
			const allowed = await canManageBot(db, bot, userId);
			if (!allowed) {
				return NextResponse.json({ error: 'This bot is private.' }, { status: 403 });
			}
		}

		const releases = (Array.isArray(bot.releases) ? bot.releases : []).slice().sort((a: any, b: any) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());

		return NextResponse.json({ releases }, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bot releases:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		const userId = session?.user?.id;
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;

		const bot = await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] });
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		}

		const allowed = await canManageBot(db, bot, userId);
		if (!allowed) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const body = await req.json().catch(() => ({}));
		const version = String(body.version || '').trim();
		const title = String(body.title || '').trim();
		const releaseBody = String(body.body || '').trim();

		if (!version || !title) {
			return NextResponse.json({ error: 'Version and title are required.' }, { status: 400 });
		}

		const newRelease = {
			id: crypto.randomUUID(),
			version,
			title,
			body: releaseBody,
			authorId: userId,
			createdAt: new Date(),
		};

		bot.releases = [newRelease, ...(Array.isArray(bot.releases) ? bot.releases : [])];
		await bot.save();

		return NextResponse.json({ release: newRelease, releases: bot.releases }, { status: 201 });
	} catch (error) {
		console.error('Failed to publish bot release:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		const userId = session?.user?.id;
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const releaseId = req.nextUrl.searchParams.get('releaseId');
		if (!releaseId) {
			return NextResponse.json({ error: 'releaseId query parameter is required.' }, { status: 400 });
		}

		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;

		const bot = await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] });
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		}

		const allowed = await canManageBot(db, bot, userId);
		if (!allowed) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		bot.releases = (Array.isArray(bot.releases) ? bot.releases : []).filter((r: any) => String(r.id || r._id || r.version) !== String(releaseId));
		await bot.save();

		return NextResponse.json({ success: true, releases: bot.releases }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete bot release:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
