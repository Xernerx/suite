/** @format */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { publishDiscordApplyPanel } from '@/lib/yourappsDiscord';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('yourapps');
		const ProfileModel = (db.models.guilds as any)?.Profile;
		const FormModel = (db.models.guilds as any)?.Form;

		if (!ProfileModel || !FormModel) {
			return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });
		}

		const channelId = String(body?.channelId || '').trim();
		const positionIds = Array.isArray(body?.positionIds) ? body.positionIds.map(String).filter(Boolean) : [];
		if (!channelId) {
			return NextResponse.json({ error: 'Target channel is required.' }, { status: 400 });
		}

		const query: Record<string, any> = { guild: id };
		if (positionIds.length > 0) {
			query.id = { $in: positionIds };
		} else {
			query.state = 'open';
		}

		const positions = await FormModel.find(query).sort({ createdAt: 1 }).lean();
		if (!positions || positions.length === 0) {
			return NextResponse.json({ error: 'No matching positions found to include on the panel.' }, { status: 400 });
		}

		const title = String(body?.title || 'Server Applications')
			.trim()
			.slice(0, 256);
		const description = String(body?.description || 'Select a position below to fill out and submit your application directly inside Discord.')
			.trim()
			.slice(0, 2000);
		const buttonLabel = String(body?.buttonLabel || (positions.length === 1 ? `Apply for ${positions[0].name}` : 'Select a position to apply...'))
			.trim()
			.slice(0, 80);

		const published = await publishDiscordApplyPanel({
			guildId: id,
			channelId,
			title,
			description,
			buttonLabel,
			positions,
		});

		if (!published.ok || !published.messageId) {
			return NextResponse.json({ error: published.error || 'Failed to post panel message to Discord.' }, { status: 400 });
		}

		const panelEntry = {
			id: `pnl_${crypto.randomBytes(4).toString('hex')}`,
			channelId,
			messageId: published.messageId,
			title,
			description,
			buttonLabel,
			positionIds: positions.map((p: any) => String(p.id)),
			createdAt: new Date(),
		};

		await ProfileModel.findOneAndUpdate(
			{ id },
			{
				$set: { panelChannel: channelId },
				$push: { panels: { $each: [panelEntry], $slice: -20 } },
			}
		);

		return NextResponse.json({ ok: true, panel: panelEntry }, { status: 201 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
