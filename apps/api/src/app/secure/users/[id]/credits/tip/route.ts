/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';

const MIN_TIP = 50;
const MAX_TIP = 2500;
const DAILY_TIP_LIMIT = 5000;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getServerSession(auth);
		const senderId = (session?.user as any)?.id;
		const senderName = (session?.user as any)?.name || senderId;

		if (!senderId) {
			return NextResponse.json({ error: 'Unauthorized: Please sign in to send a credit tip.' }, { status: 401 });
		}

		const { id: recipientId } = await params;
		if (!recipientId || recipientId === senderId) {
			return NextResponse.json({ error: 'You cannot tip yourself.' }, { status: 400 });
		}

		const body = await req.json().catch(() => ({}));
		const rawAmount = Number(body?.amount);
		const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 140) : '';
		const recipientLabel = typeof body?.recipientName === 'string' && body.recipientName.trim() ? body.recipientName.trim() : recipientId;

		if (!Number.isInteger(rawAmount) || rawAmount < MIN_TIP || rawAmount > MAX_TIP) {
			return NextResponse.json(
				{
					error: `Tip amount must be a whole number between ${MIN_TIP.toLocaleString()} and ${MAX_TIP.toLocaleString()} credits.`,
				},
				{ status: 400 }
			);
		}

		const { models } = await database('xernerx');
		const Credit = (models.users as any).Credit;

		let senderCredit = await Credit.findOne({ ownerId: senderId });
		if (!senderCredit) {
			senderCredit = await Credit.create({ ownerId: senderId, balance: 0, streak: 0 });
		}

		if ((senderCredit.balance || 0) < rawAmount) {
			return NextResponse.json(
				{
					error: `Insufficient credits. Need ${rawAmount.toLocaleString()} credits, but you have ${(senderCredit.balance || 0).toLocaleString()}.`,
				},
				{ status: 400 }
			);
		}

		const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
		const recentTipped = (Array.isArray(senderCredit.transactions) ? senderCredit.transactions : [])
			.filter((tx: any) => tx?.type === 'tip_out' && new Date(tx?.createdAt || 0).getTime() >= cutoff24h)
			.reduce((sum: number, tx: any) => sum + Math.abs(Number(tx?.amount) || 0), 0);

		if (recentTipped + rawAmount > DAILY_TIP_LIMIT) {
			return NextResponse.json(
				{
					error: `Daily tipping limit reached (${DAILY_TIP_LIMIT.toLocaleString()} credits per 24h). You have ${(DAILY_TIP_LIMIT - recentTipped).toLocaleString()} remaining today.`,
				},
				{ status: 429 }
			);
		}

		const txIdBase = crypto.randomBytes(6).toString('hex');
		const now = new Date();

		const senderTx = {
			id: `tx_tip_out_${txIdBase}`,
			type: 'tip_out',
			amount: rawAmount,
			itemId: `tip_to_${recipientId}`,
			itemName: note ? `Tip to @${recipientLabel} — "${note}"` : `Tip to @${recipientLabel}`,
			createdAt: now,
		};

		const recipientTx = {
			id: `tx_tip_in_${txIdBase}`,
			type: 'tip_in',
			amount: rawAmount,
			itemId: `tip_from_${senderId}`,
			itemName: note ? `Tip from @${senderName} — "${note}"` : `Tip from @${senderName}`,
			createdAt: now,
		};

		const updatedSender = await Credit.findOneAndUpdate(
			{ ownerId: senderId },
			{
				$inc: { balance: -rawAmount, totalSpent: rawAmount },
				$push: { transactions: { $each: [senderTx], $slice: -100 } },
			},
			{ returnDocument: 'after' }
		).lean();

		await Credit.findOneAndUpdate(
			{ ownerId: recipientId },
			{
				$setOnInsert: { ownerId: recipientId, streak: 0 },
				$inc: { balance: rawAmount },
				$push: { transactions: { $each: [recipientTx], $slice: -100 } },
			},
			{ upsert: true, returnDocument: 'after' }
		);

		return NextResponse.json({
			success: true,
			amount: rawAmount,
			recipientId,
			balance: updatedSender?.balance ?? 0,
		});
	} catch (err: any) {
		console.error('Creator credit tip error:', err);
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
