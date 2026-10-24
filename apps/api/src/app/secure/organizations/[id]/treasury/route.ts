/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('xernerx');
		const OrganizationModel = (db.models.organizations as any).Organization;

		const org = await OrganizationModel.findOne({ _id: id }).select('treasuryBalance treasuryLedger owner members name').lean();
		if (!org) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		const ledger = Array.isArray(org.treasuryLedger) ? [...org.treasuryLedger].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) : [];

		return NextResponse.json(
			{
				treasuryBalance: Number(org.treasuryBalance) || 0,
				treasuryLedger: ledger,
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error('Failed to fetch organization treasury:', error);
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
		const body = await req.json().catch(() => ({}));
		const action = String(body.action || '').trim();

		const db = await database('xernerx');
		const OrganizationModel = (db.models.organizations as any).Organization;
		const MemberModel = (db.models.organizations as any).Member;
		const CreditModel = (db.models.users as any).Credit;

		const org = await OrganizationModel.findOne({ _id: id }).lean();
		if (!org) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		const isOwner = org.owner === userId;
		const isArrayMember = Array.isArray(org.members) && org.members.includes(userId);
		const memberDoc = !isOwner && !isArrayMember && MemberModel ? await MemberModel.findOne({ organizationId: id, userId }).lean() : null;

		if (!isOwner && !isArrayMember && !memberDoc) {
			return NextResponse.json({ error: 'Forbidden: Only organization members can access the treasury.' }, { status: 403 });
		}

		const username = session?.user?.name || session?.user?.global_name || userId;

		if (action === 'deposit') {
			const amount = Math.floor(Number(body.amount) || 0);
			if (amount < 50) {
				return NextResponse.json({ error: 'Minimum treasury deposit is 50 credits.' }, { status: 400 });
			}

			const userCredit = await CreditModel.findOne({ ownerId: userId }).lean();
			const currentBalance = Number(userCredit?.balance) || 0;
			if (currentBalance < amount) {
				return NextResponse.json({ error: 'Insufficient personal credit balance.' }, { status: 400 });
			}

			const now = new Date();
			await CreditModel.updateOne(
				{ ownerId: userId },
				{
					$inc: { balance: -amount, totalSpent: amount },
					$push: {
						transactions: {
							id: randomUUID(),
							type: 'org_treasury',
							amount: -amount,
							itemId: String(id),
							itemName: `Treasury Deposit: ${org.name}`,
							createdAt: now,
						},
					},
				}
			);

			const ledgerEntry = {
				id: randomUUID(),
				userId,
				username,
				type: 'deposit',
				amount,
				targetId: String(id),
				targetName: org.name,
				createdAt: now,
			};

			const updatedOrg = await OrganizationModel.findOneAndUpdate(
				{ _id: id },
				{
					$inc: { treasuryBalance: amount },
					$push: {
						treasuryLedger: {
							$each: [ledgerEntry],
							$slice: -50,
						},
					},
				},
				{ returnDocument: 'after' }
			).lean();

			return NextResponse.json({
				success: true,
				treasuryBalance: Number(updatedOrg?.treasuryBalance) || 0,
				treasuryLedger: (updatedOrg?.treasuryLedger || []).slice().reverse(),
			});
		}

		if (action === 'boost') {
			const targetType = body.targetType === 'server' ? 'server' : 'bot';
			const targetId = String(body.targetId || '').trim();
			const duration = body.duration === '7d' ? '7d' : '24h';
			const cost = duration === '7d' ? 5000 : 1000;
			const durationMs = duration === '7d' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

			if (!targetId) {
				return NextResponse.json({ error: 'targetId is required' }, { status: 400 });
			}

			const currentTreasury = Number(org.treasuryBalance) || 0;
			if (currentTreasury < cost) {
				return NextResponse.json({ error: 'Insufficient organization treasury balance.' }, { status: 400 });
			}

			let targetName = targetId;
			const now = new Date();

			if (targetType === 'bot') {
				const BotModel = (db.models.bots as any).Bot;
				const bot = await BotModel.findOne({ id: targetId }).lean();
				if (!bot) {
					return NextResponse.json({ error: 'Target bot not found' }, { status: 404 });
				}
				targetName = bot.name || targetId;
				const baseTime = bot.boostedUntil && new Date(bot.boostedUntil) > now ? new Date(bot.boostedUntil).getTime() : now.getTime();
				const boostedUntil = new Date(baseTime + durationMs);
				await BotModel.updateOne({ id: targetId }, { $set: { boostedUntil, promotedUntil: boostedUntil } });
			} else {
				const GuildModel = (db.models.guilds as any).Guild;
				const guild = await GuildModel.findOne({ id: targetId }).lean();
				if (!guild) {
					return NextResponse.json({ error: 'Target server not found' }, { status: 404 });
				}
				targetName = guild.name || targetId;
				const baseTime = guild.boostedUntil && new Date(guild.boostedUntil) > now ? new Date(guild.boostedUntil).getTime() : now.getTime();
				const boostedUntil = new Date(baseTime + durationMs);
				await GuildModel.updateOne({ id: targetId }, { $set: { boostedUntil, promotedUntil: boostedUntil } });
			}

			const ledgerEntry = {
				id: randomUUID(),
				userId,
				username,
				type: 'boost',
				amount: cost,
				targetId,
				targetName: `${targetName} (${duration})`,
				createdAt: now,
			};

			const updatedOrg = await OrganizationModel.findOneAndUpdate(
				{ _id: id },
				{
					$inc: { treasuryBalance: -cost },
					$push: {
						treasuryLedger: {
							$each: [ledgerEntry],
							$slice: -50,
						},
					},
				},
				{ returnDocument: 'after' }
			).lean();

			return NextResponse.json({
				success: true,
				treasuryBalance: Number(updatedOrg?.treasuryBalance) || 0,
				treasuryLedger: (updatedOrg?.treasuryLedger || []).slice().reverse(),
			});
		}

		if (action === 'unlock_vanity') {
			const targetType = body.targetType === 'server' ? 'server' : body.targetType === 'bot' ? 'bot' : 'organization';
			const targetId = String(body.targetId || id).trim();
			const cost = 2000;

			const currentTreasury = Number(org.treasuryBalance) || 0;
			if (currentTreasury < cost) {
				return NextResponse.json({ error: 'Insufficient organization treasury balance (requires 2,000 credits).' }, { status: 400 });
			}

			let targetName = org.name || targetId;
			const now = new Date();

			if (targetType === 'bot') {
				const BotModel = (db.models.bots as any).Bot;
				const bot = await BotModel.findOne({ id: targetId }).lean();
				if (!bot) {
					return NextResponse.json({ error: 'Target bot not found' }, { status: 404 });
				}
				if (bot.vanityUnlocked || bot.vanitySlug || bot.verified) {
					return NextResponse.json({ error: 'Vanity URL is already unlocked for this bot.' }, { status: 400 });
				}
				targetName = bot.name || targetId;
				await BotModel.updateOne({ id: targetId }, { $set: { vanityUnlocked: true } });
			} else if (targetType === 'server') {
				const GuildModel = (db.models.guilds as any).Guild;
				const guild = await GuildModel.findOne({ id: targetId }).lean();
				if (!guild) {
					return NextResponse.json({ error: 'Target server not found' }, { status: 404 });
				}
				if (guild.vanityUnlocked || guild.vanitySlug || guild.verified) {
					return NextResponse.json({ error: 'Vanity URL is already unlocked for this server.' }, { status: 400 });
				}
				targetName = guild.name || targetId;
				await GuildModel.updateOne({ id: targetId }, { $set: { vanityUnlocked: true } });
			} else {
				if (org.vanityUnlocked || org.vanitySlug || org.verified) {
					return NextResponse.json({ error: 'Vanity URL is already unlocked for this organization.' }, { status: 400 });
				}
				await OrganizationModel.updateOne({ _id: id }, { $set: { vanityUnlocked: true } });
			}

			const ledgerEntry = {
				id: randomUUID(),
				userId,
				username,
				type: 'vanity',
				amount: cost,
				targetId,
				targetName: `${targetName} (Vanity URL)`,
				createdAt: now,
			};

			const updatedOrg = await OrganizationModel.findOneAndUpdate(
				{ _id: id },
				{
					$inc: { treasuryBalance: -cost },
					$push: {
						treasuryLedger: {
							$each: [ledgerEntry],
							$slice: -50,
						},
					},
				},
				{ returnDocument: 'after' }
			).lean();

			return NextResponse.json({
				success: true,
				vanityUnlocked: true,
				treasuryBalance: Number(updatedOrg?.treasuryBalance) || 0,
				treasuryLedger: (updatedOrg?.treasuryLedger || []).slice().reverse(),
			});
		}

		return NextResponse.json({ error: 'Invalid treasury action' }, { status: 400 });
	} catch (error: any) {
		console.error('Failed to process organization treasury action:', error);
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}
