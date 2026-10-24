/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

const MIN_TIP = 10;
const MAX_TIP = 2500;
const DAILY_CAP = 2500;

export async function POST(req: Request) {
	try {
		const session = await getServerSession(auth);
		const senderId = (session?.user as any)?.id;
		const senderName = (session?.user as any)?.name || senderId;

		if (!senderId) {
			return NextResponse.json({ error: 'Unauthorized: Please sign in to send a credit tip.' }, { status: 401 });
		}

		const body = await req.json().catch(() => ({}));
		const { targetUserId, botId, amount, note } = body;

		const rawAmount = Math.round(Number(amount));
		if (!Number.isFinite(rawAmount) || rawAmount < MIN_TIP || rawAmount > MAX_TIP) {
			return NextResponse.json({ error: `Tip amount must be between ${MIN_TIP.toLocaleString()} and ${MAX_TIP.toLocaleString()} credits.` }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const Credit = (models.users as any).Credit;
		const BotModel = (models.bots as any).Bot;
		const UserModel = (models.users as any).User;

		let resolvedRecipientId = targetUserId ? String(targetUserId).trim() : '';
		let targetLabel = resolvedRecipientId;

		if (!resolvedRecipientId && botId) {
			const bot = await BotModel.findOne({ $or: [{ id: String(botId) }, { vanitySlug: String(botId).toLowerCase() }] }).lean();
			if (!bot || !Array.isArray(bot.owners) || !bot.owners[0]) {
				return NextResponse.json({ error: 'Bot or primary bot owner not found.' }, { status: 404 });
			}
			resolvedRecipientId = String(bot.owners[0]);
			targetLabel = bot.name || resolvedRecipientId;
		} else if (resolvedRecipientId) {
			const recipientUser = await UserModel.findOne({
				$or: [{ id: resolvedRecipientId }, { vanitySlug: resolvedRecipientId.toLowerCase() }],
			}).lean();
			if (recipientUser?.id) {
				resolvedRecipientId = String(recipientUser.id);
				targetLabel = recipientUser.name || resolvedRecipientId;
			}
		}

		if (!resolvedRecipientId) {
			return NextResponse.json({ error: 'A targetUserId or botId is required.' }, { status: 400 });
		}

		if (resolvedRecipientId === senderId) {
			return NextResponse.json({ error: 'You cannot tip yourself.' }, { status: 400 });
		}

		let senderCredit = await Credit.findOne({ ownerId: senderId });
		if (!senderCredit) {
			senderCredit = await Credit.create({ ownerId: senderId, balance: 0, streak: 0 });
		}

		if ((senderCredit.balance || 0) < rawAmount) {
			return NextResponse.json({ error: `Insufficient credits. Need ${rawAmount.toLocaleString()} credits, but you have ${(senderCredit.balance || 0).toLocaleString()}.` }, { status: 400 });
		}

		const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
		const recentTipped = (Array.isArray(senderCredit.transactions) ? senderCredit.transactions : [])
			.filter((tx: any) => (tx?.type === 'tip_sent' || tx?.type === 'tip_out') && new Date(tx?.createdAt || 0).getTime() >= cutoff24h)
			.reduce((sum: number, tx: any) => sum + Math.abs(Number(tx?.amount) || 0), 0);

		if (recentTipped + rawAmount > DAILY_CAP) {
			return NextResponse.json(
				{
					error: `Daily tipping limit reached (${DAILY_CAP.toLocaleString()} credits/day). You have ${Math.max(0, DAILY_CAP - recentTipped).toLocaleString()} credits remaining today.`,
				},
				{ status: 429 }
			);
		}

		const cleanNote = typeof note === 'string' ? note.trim().slice(0, 140) : '';
		const now = new Date();
		const txIdBase = crypto.randomBytes(6).toString('hex');

		const senderTx = {
			id: `tx_tip_sent_${txIdBase}`,
			type: 'tip_sent',
			amount: -rawAmount,
			itemId: botId ? `tip_bot_${botId}` : `tip_user_${resolvedRecipientId}`,
			itemName: cleanNote ? `Tip to ${targetLabel} — "${cleanNote}"` : `Tip to ${targetLabel}`,
			createdAt: now,
		};

		const recipientTx = {
			id: `tx_tip_received_${txIdBase}`,
			type: 'tip_received',
			amount: rawAmount,
			itemId: `tip_from_${senderId}`,
			itemName: cleanNote ? `Tip from ${senderName} — "${cleanNote}"` : `Tip from ${senderName}`,
			createdAt: now,
		};

		const updatedSender = await Credit.findOneAndUpdate(
			{ ownerId: senderId, balance: { $gte: rawAmount } },
			{
				$inc: { balance: -rawAmount, totalSpent: rawAmount },
				$push: { transactions: { $each: [senderTx], $slice: -100 } },
			},
			{ returnDocument: 'after' }
		).lean();

		if (!updatedSender) {
			return NextResponse.json({ error: 'Transaction failed due to insufficient balance.' }, { status: 400 });
		}

		await Credit.findOneAndUpdate(
			{ ownerId: resolvedRecipientId },
			{
				$setOnInsert: { ownerId: resolvedRecipientId, streak: 0 },
				$inc: { balance: rawAmount },
				$push: { transactions: { $each: [recipientTx], $slice: -100 } },
			},
			{ upsert: true, returnDocument: 'after' }
		);

		return NextResponse.json({
			success: true,
			balance: updatedSender.balance ?? 0,
			amount: rawAmount,
			recipientId: resolvedRecipientId,
		});
	} catch (error: any) {
		console.error('Credit tip error:', error);
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}
