/** @format */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog } from '@/lib/auditAndNotify';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const CreditModel = (models.users as any).Credit;
		const creditDoc = await CreditModel.findOne({ ownerId: id }).lean();
		return NextResponse.json(creditDoc || { ownerId: id, balance: 0, streak: 0, unlockedBadges: [], activeBadges: [] });
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json().catch(() => ({}));
		const rawAmount = Number(body.amount) || 0;
		const reason = String(body.reason || 'Admin Credit Adjustment').trim();
		const badge = body.badge ? String(body.badge).trim() : null;

		if (rawAmount === 0 && !badge) {
			return NextResponse.json({ error: 'Amount or badge is required' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const CreditModel = (models.users as any).Credit;

		const current = (await CreditModel.findOne({ ownerId: id }).lean()) as any;
		const currentBalance = Number(current?.balance) || 0;
		const nextBalance = Math.max(0, currentBalance + rawAmount);
		const effectiveDelta = nextBalance - currentBalance;

		const updateOps: Record<string, any> = {
			$set: { balance: nextBalance },
		};

		if (badge) {
			updateOps.$addToSet = {
				unlockedBadges: badge,
				activeBadges: badge,
			};
		}

		if (rawAmount !== 0 || badge) {
			updateOps.$push = {
				transactions: {
					id: crypto.randomUUID(),
					type: 'admin_adjust',
					amount: effectiveDelta,
					multiplierPercent: 100,
					itemId: badge || 'admin_adjust',
					itemName: badge ? `${reason} (+Badge: ${badge})` : reason,
					createdAt: new Date(),
				},
			};
		}

		const updated = await CreditModel.findOneAndUpdate({ ownerId: id }, updateOps, {
			upsert: true,
			returnDocument: 'after',
		}).lean();

		await recordAuditLog({
			action: 'user.credits.adjust',
			targetType: 'user',
			targetId: id,
			summary: `Adjusted credits for user ${id} by ${rawAmount >= 0 ? `+${rawAmount}` : rawAmount}${badge ? ` and granted badge "${badge}"` : ''} (${reason})`,
			metadata: { amount: rawAmount, effectiveDelta, badge, reason, newBalance: nextBalance },
		});

		return NextResponse.json({
			success: true,
			credits: updated,
		});
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}
