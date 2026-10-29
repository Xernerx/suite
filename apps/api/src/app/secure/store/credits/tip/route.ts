/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { dispatchBotWebhook } from '@/lib/webhookDispatcher';

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
		let canonicalBotId = '';
		let resolvedBotDoc: any = null;

		if (botId) {
			resolvedBotDoc = await BotModel.findOne({ $or: [{ id: String(botId) }, { vanitySlug: String(botId).toLowerCase() }] }).lean();
			if (resolvedBotDoc?.id) {
				canonicalBotId = String(resolvedBotDoc.id);
			}
		}

		if (!resolvedRecipientId && botId) {
			if (!resolvedBotDoc || !Array.isArray(resolvedBotDoc.owners) || !resolvedBotDoc.owners[0]) {
				return NextResponse.json({ error: 'Bot or primary bot owner not found.' }, { status: 404 });
			}
			resolvedRecipientId = String(resolvedBotDoc.owners[0]);
			targetLabel = resolvedBotDoc.name || resolvedRecipientId;
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

		const effectiveBotId = canonicalBotId || (botId ? String(botId) : '');

		const senderTx = {
			id: `tx_tip_sent_${txIdBase}`,
			type: 'tip_sent',
			amount: -rawAmount,
			itemId: effectiveBotId ? `tip_bot_${effectiveBotId}` : `tip_user_${resolvedRecipientId}`,
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

		let totalTippedForBot = rawAmount;
		if (effectiveBotId) {
			const validBotTipIds = new Set<string>([`tip_bot_${effectiveBotId}`]);
			if (botId) validBotTipIds.add(`tip_bot_${botId}`);
			if (resolvedBotDoc?.vanitySlug) validBotTipIds.add(`tip_bot_${String(resolvedBotDoc.vanitySlug).toLowerCase()}`);

			const updatedTxList = Array.isArray((updatedSender as any)?.transactions) ? (updatedSender as any).transactions : [];
			totalTippedForBot = updatedTxList
				.filter((tx: any) => (tx?.type === 'tip_sent' || tx?.type === 'tip_out') && typeof tx?.itemId === 'string' && validBotTipIds.has(tx.itemId))
				.reduce((sum: number, tx: any) => sum + Math.abs(Number(tx?.amount) || 0), 0);

			if (!totalTippedForBot || totalTippedForBot < rawAmount) {
				totalTippedForBot = rawAmount;
			}

			try {
				const HookModel = (models.bots as any).Hook;
				const hooks = HookModel ? await HookModel.find({ botId: effectiveBotId }).lean() : [];
				if (hooks?.length) {
					const authorIcon = (session?.user as any)?.image || undefined;
					const finalBotName = resolvedBotDoc?.name || targetLabel || 'Bot';
					const finalBotAvatar = resolvedBotDoc?.avatar
						? String(resolvedBotDoc.avatar).startsWith('http')
							? String(resolvedBotDoc.avatar)
							: `https://cdn.discordapp.com/avatars/${effectiveBotId}/${resolvedBotDoc.avatar}.png`
						: undefined;
					const nowIso = now.toISOString();

					for (const hook of hooks) {
						if (!hook.url || !hook.events?.includes('POST tip')) continue;
						await dispatchBotWebhook({
							botId: effectiveBotId,
							url: hook.url,
							event: 'POST tip',
							secret: hook.secret,
							payload: {
								event: 'POST tip',
								botId: effectiveBotId,
								timestamp: nowIso,
								data: {
									userId: senderId,
									username: senderName,
									avatar: authorIcon || null,
									amount: rawAmount,
									tipped: totalTippedForBot,
									totalTipped: totalTippedForBot,
									note: cleanNote || null,
								},
								username: 'Xernerx App',
								avatar_url: 'https://xernerx.com/logo.png',
								embeds: [
									{
										author: {
											name: senderName,
											icon_url: authorIcon,
										},
										title: 'New Credit Tip!',
										url: `https://xernerx.com/bots/${effectiveBotId}`,
										description: cleanNote
											? `This user just tipped **${rawAmount.toLocaleString()}** credits to your bot!\n\n> ${cleanNote}`
											: `This user just tipped **${rawAmount.toLocaleString()}** credits to your bot!`,
										fields: [
											{
												name: 'Tip Amount',
												value: `**${rawAmount.toLocaleString()}** Credits`,
												inline: true,
											},
											{
												name: 'Total Tipped by User',
												value: `**${totalTippedForBot.toLocaleString()}** Credits`,
												inline: true,
											},
										],
										color: 0xff00a0,
										footer: {
											text: finalBotName,
											icon_url: finalBotAvatar,
										},
										timestamp: nowIso,
									},
								],
							},
						});
					}
				}
			} catch (hookErr) {
				console.error('Failed to trigger bot webhook for tip:', hookErr);
			}
		}

		return NextResponse.json({
			success: true,
			balance: updatedSender.balance ?? 0,
			amount: rawAmount,
			tipped: effectiveBotId ? totalTippedForBot : rawAmount,
			recipientId: resolvedRecipientId,
		});
	} catch (error: any) {
		console.error('Credit tip error:', error);
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}
