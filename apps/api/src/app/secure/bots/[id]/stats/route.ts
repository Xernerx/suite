/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth, MEMBER_MILESTONE_THRESHOLDS, SERVER_MILESTONE_THRESHOLDS } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const url = new URL(req.url);
		const limitParam = url.searchParams.get('limit');
		const afterParam = url.searchParams.get('after');
		const beforeParam = url.searchParams.get('before');

		const limit = limitParam !== null ? Math.max(1, parseInt(limitParam, 10) || 5000) : 5000;

		const db = await database('xernerx');
		const StatModel = (db.models.bots as any).Stat;

		const query: any = { id };
		const andConditions: any[] = [];
		if (afterParam) {
			const afterNumber = parseInt(afterParam, 10);
			if (!Number.isNaN(afterNumber)) {
				andConditions.push({ $or: [{ timestamp: { $gte: afterNumber } }, { timestamp: { $gte: new Date(afterNumber) } }] });
			}
		}
		if (beforeParam) {
			const beforeNumber = parseInt(beforeParam, 10);
			if (!Number.isNaN(beforeNumber)) {
				andConditions.push({ $or: [{ timestamp: { $lte: beforeNumber } }, { timestamp: { $lte: new Date(beforeNumber) } }] });
			}
		}
		if (andConditions.length === 1) {
			Object.assign(query, andConditions[0]);
		} else if (andConditions.length > 1) {
			query.$and = andConditions;
		}

		// Sort ascending by timestamp so milestone threshold crossings and downsampling cover the full history from oldest to newest
		const rawStats = await StatModel.find(query).select('_id timestamp guildCount servers userCount users shardCount shards voteCount votes onlineSince data').sort({ timestamp: 1 }).lean();

		// Always preserve the exact first snapshot that crossed each server or member milestone threshold
		const mustKeepIndices = new Set<number>();
		if (rawStats.length > 0) {
			mustKeepIndices.add(0);
			mustKeepIndices.add(rawStats.length - 1);

			let nextServerIdx = 0;
			let nextMemberIdx = 0;

			for (let i = 0; i < rawStats.length; i++) {
				const s = rawStats[i] as any;
				const guilds = Number(s.guildCount ?? s.servers ?? 0) || 0;
				const users = Number(s.userCount ?? s.users ?? 0) || 0;

				while (nextServerIdx < SERVER_MILESTONE_THRESHOLDS.length && guilds >= SERVER_MILESTONE_THRESHOLDS[nextServerIdx]) {
					mustKeepIndices.add(i);
					nextServerIdx++;
				}
				while (nextMemberIdx < MEMBER_MILESTONE_THRESHOLDS.length && users >= MEMBER_MILESTONE_THRESHOLDS[nextMemberIdx]) {
					mustKeepIndices.add(i);
					nextMemberIdx++;
				}
			}
		}

		// Downsample to max 'limit' items to avoid payload size limits and frontend lag while keeping milestone crossings
		const stats = [];
		const step = Math.max(1, Math.ceil(rawStats.length / limit));
		for (let i = 0; i < rawStats.length; i++) {
			if (i % step === 0 || mustKeepIndices.has(i)) {
				stats.push(rawStats[i]);
			}
		}

		return NextResponse.json(stats, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bot stats:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['bots']);
		const session = await getServerSession(auth).catch(() => null);
		const userId = caller.userId || ((session?.user as any)?.id ? String((session?.user as any).id) : null);
		if (!userId && !caller.isSystemToken) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const url = new URL(req.url);
		let statId = url.searchParams.get('statId');
		if (!statId) {
			const body = await req.json().catch(() => null);
			if (body?.statId) statId = String(body.statId);
		}
		if (!statId) {
			return NextResponse.json({ error: 'Missing statId' }, { status: 400 });
		}

		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;
		const StatModel = (db.models.bots as any).Stat;
		const OrgModel = (db.models.organizations as any)?.Organization;
		const MemberModel = (db.models.organizations as any)?.Member;

		const botDoc = BotModel
			? await BotModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] })
					.lean()
					.catch(() => null)
			: null;

		let isAuthorized = Boolean(caller.isSystemToken || caller.isStaff || caller.authorized);

		if (!isAuthorized && botDoc && userId) {
			const ownerId = String((botDoc as any).ownerId || '');
			const owners: string[] = Array.isArray((botDoc as any).owners) ? (botDoc as any).owners.map(String) : [];
			const orgRef = (botDoc as any).organization || (botDoc as any).organizationId;

			if (ownerId === userId || owners.includes(userId)) {
				isAuthorized = true;
			} else if (orgRef && OrgModel) {
				const [orgDoc, memberDoc] = await Promise.all([
					OrgModel.findById(orgRef)
						.select('owner ownerId members')
						.lean()
						.catch(() => null),
					MemberModel
						? MemberModel.findOne({
								$or: [{ ownerId: String(orgRef) }, { organizationId: String(orgRef) }],
								userId,
							})
								.lean()
								.catch(() => null)
						: null,
				]);
				const members: any[] = Array.isArray((orgDoc as any)?.members) ? (orgDoc as any).members : [];
				if (memberDoc || String((orgDoc as any)?.owner || (orgDoc as any)?.ownerId || '') === userId || members.some((m: any) => String(m?.id || m?.userId || m) === userId)) {
					isAuthorized = true;
				}
			}
		}

		if (!isAuthorized) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const targetBotId = String((botDoc as any)?.id || id);
		const result = await StatModel.deleteOne({ _id: statId, id: { $in: [id, targetBotId] } });
		return NextResponse.json({ deleted: (result?.deletedCount || 0) > 0, statId });
	} catch (error) {
		console.error('Failed to delete bot stat entry:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
