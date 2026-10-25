/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog } from '@/lib/auditAndNotify';

async function syncDiscordThreadStatus(threadId: string, status: string, username?: string | null) {
	const primaryToken = process.env.DISCORD_CLIENT_TOKEN || process.env.DISCORD_BOT_TOKEN;
	if (!primaryToken) return;

	try {
		const prefixMap: Record<string, string> = {
			open: 'OPEN',
			'on-hold': 'ON-HOLD',
			resolved: 'RESOLVED',
			closed: 'CLOSED',
		};
		const prefix = prefixMap[status] || 'OPEN';
		const isLocked = status === 'resolved' || status === 'closed';

		const payload: Record<string, any> = {
			locked: isLocked,
		};
		if (username) {
			payload.name = `[${prefix}]-${username}`;
		}
		if (isLocked) {
			payload.auto_archive_duration = 60;
		}

		await fetch(`https://discord.com/api/v10/channels/${threadId}`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bot ${primaryToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});
	} catch {}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { entity } = body;

		const db = await database('xernerx');
		const coreModels = db.models.core as any;

		if (entity === 'ticket') {
			const validStatuses = ['open', 'on-hold', 'resolved', 'closed'];
			const nextStatus = validStatuses.includes(body.status) ? body.status : 'open';

			const updated = await coreModels.SupportTicket.findOneAndUpdate({ id }, { $set: { status: nextStatus } }, { returnDocument: 'after' }).lean();

			if (!updated) {
				return NextResponse.json({ error: 'Support ticket not found.' }, { status: 404 });
			}

			await syncDiscordThreadStatus(id, nextStatus, updated.username);

			await recordAuditLog(req, {
				action: 'support.ticket.updated',
				category: 'setting',
				targetId: id,
				targetLabel: updated.username ? `Ticket (${updated.username})` : `Ticket ${id}`,
				details: { status: nextStatus },
			});

			return NextResponse.json(updated, { status: 200 });
		}

		if (entity === 'channel') {
			const updateFields: Record<string, any> = {};
			if (body.role !== undefined) updateFields.role = body.role || null;
			if (body.type === 'support' || body.type === 'status') updateFields.type = body.type;
			if (body.name !== undefined) updateFields.name = body.name || null;

			const updated = await coreModels.SupportChannel.findOneAndUpdate({ id }, { $set: updateFields }, { returnDocument: 'after' }).lean();

			if (!updated) {
				return NextResponse.json({ error: 'Support channel not found.' }, { status: 404 });
			}

			await recordAuditLog(req, {
				action: 'support.channel.updated',
				category: 'setting',
				targetId: id,
				targetLabel: updated.name ? `#${updated.name}` : id,
				details: updateFields,
			});

			return NextResponse.json(updated, { status: 200 });
		}

		return NextResponse.json({ error: 'Invalid support entity type.' }, { status: 400 });
	} catch (error: any) {
		console.error('Failed to update support item:', error);
		return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const url = new URL(req.url);
		const entity = url.searchParams.get('entity') || 'channel';
		const guild = url.searchParams.get('guild');

		const db = await database('xernerx');
		const coreModels = db.models.core as any;

		if (entity === 'channel') {
			const deleted = await coreModels.SupportChannel.findOneAndDelete({ id }).lean();
			await recordAuditLog(req, {
				action: 'support.channel.deleted',
				category: 'setting',
				targetId: id,
				targetLabel: deleted?.name ? `#${deleted.name}` : id,
			});
			return NextResponse.json({ success: true }, { status: 200 });
		}

		if (entity === 'bot') {
			const query: Record<string, any> = { id };
			if (guild) query.guild = guild;
			const deleted = await coreModels.SupportBot.findOneAndDelete(query).lean();
			await recordAuditLog(req, {
				action: 'support.bot.deleted',
				category: 'setting',
				targetId: id,
				targetLabel: deleted?.name || id,
				details: { guild: guild || deleted?.guild },
			});
			return NextResponse.json({ success: true }, { status: 200 });
		}

		if (entity === 'ticket') {
			const deleted = await coreModels.SupportTicket.findOneAndDelete({ id }).lean();
			await recordAuditLog(req, {
				action: 'support.ticket.deleted',
				category: 'setting',
				targetId: id,
				targetLabel: deleted?.username ? `Ticket (${deleted.username})` : `Ticket ${id}`,
			});
			return NextResponse.json({ success: true }, { status: 200 });
		}

		return NextResponse.json({ error: 'Invalid support entity type.' }, { status: 400 });
	} catch (error: any) {
		console.error('Failed to delete support item:', error);
		return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
	}
}
