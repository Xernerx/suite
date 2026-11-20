/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { deleteDiscordMessage, editDiscordApplyPanelMessage, publishDiscordApplyPanel } from '@/lib/yourappsDiscord';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; panelId: string }> }) {
	try {
		const { id, panelId } = await params;
		const body = await req.json();
		const db = await database('yourapps');
		const ProfileModel = (db.models.guilds as any)?.Profile;
		const FormModel = (db.models.guilds as any)?.Form;
		if (!ProfileModel || !FormModel) {
			return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });
		}

		const profile: any = await ProfileModel.findOne({ id }).lean();
		const panels: any[] = Array.isArray(profile?.panels) ? [...profile.panels] : [];
		const idx = panels.findIndex((p) => String(p.id) === panelId);
		if (idx < 0) {
			return NextResponse.json({ error: 'Panel not found.' }, { status: 404 });
		}

		const target = panels[idx];
		const nextChannelId = body?.channelId ? String(body.channelId).trim() : String(target.channelId);
		const nextTitle =
			body?.title !== undefined
				? String(body.title || 'Server Applications')
						.trim()
						.slice(0, 256)
				: String(target.title || 'Server Applications');
		const nextDesc =
			body?.description !== undefined
				? String(body.description || '')
						.trim()
						.slice(0, 2000)
				: String(target.description || '');
		const nextBtn =
			body?.buttonLabel !== undefined
				? String(body.buttonLabel || 'Apply Now')
						.trim()
						.slice(0, 80)
				: String(target.buttonLabel || 'Apply Now');
		const nextPosIds = Array.isArray(body?.positionIds) ? body.positionIds.map(String).filter(Boolean) : Array.isArray(target.positionIds) ? target.positionIds.map(String) : [];
		const nextAutoSync = body?.autoSync !== undefined ? Boolean(body.autoSync) : target.autoSync !== false;

		const allPositions = await FormModel.find({ guild: id }).sort({ createdAt: 1 }).lean();
		const matchedPositions = nextPosIds.length > 0 ? allPositions.filter((p: any) => nextPosIds.includes(String(p.id))) : allPositions;

		if (matchedPositions.length === 0) {
			return NextResponse.json({ error: 'Select at least one valid position for this panel.' }, { status: 400 });
		}

		let nextMessageId = String(target.messageId);
		const channelChanged = nextChannelId !== String(target.channelId);

		if (channelChanged) {
			const rePublished = await publishDiscordApplyPanel({
				guildId: id,
				channelId: nextChannelId,
				title: nextTitle,
				description: nextDesc,
				buttonLabel: nextBtn,
				positions: matchedPositions,
			});
			if (!rePublished.ok || !rePublished.messageId) {
				return NextResponse.json({ error: rePublished.error || 'Failed to publish panel to the new channel.' }, { status: 400 });
			}
			await deleteDiscordMessage(String(target.channelId), String(target.messageId));
			nextMessageId = rePublished.messageId;
		} else {
			const editRes = await editDiscordApplyPanelMessage({
				guildId: id,
				channelId: nextChannelId,
				messageId: nextMessageId,
				title: nextTitle,
				description: nextDesc,
				buttonLabel: nextBtn,
				positions: matchedPositions,
			});

			if (editRes.notFound) {
				// Message was deleted in Discord — re-post a fresh panel message automatically
				const rePublished = await publishDiscordApplyPanel({
					guildId: id,
					channelId: nextChannelId,
					title: nextTitle,
					description: nextDesc,
					buttonLabel: nextBtn,
					positions: matchedPositions,
				});
				if (!rePublished.ok || !rePublished.messageId) {
					panels.splice(idx, 1);
					await ProfileModel.updateOne({ id }, { $set: { panels } });
					return NextResponse.json({ error: rePublished.error || 'This panel message was deleted in Discord and could not be re-published.' }, { status: 400 });
				}
				nextMessageId = rePublished.messageId;
			} else if (!editRes.ok) {
				return NextResponse.json({ error: editRes.error || 'Failed to update Discord panel message.' }, { status: 400 });
			} else if (editRes.replacedMessageId) {
				nextMessageId = editRes.replacedMessageId;
			}
		}

		panels[idx] = {
			...target,
			channelId: nextChannelId,
			messageId: nextMessageId,
			title: nextTitle,
			description: nextDesc,
			buttonLabel: nextBtn,
			positionIds: nextPosIds,
			autoSync: nextAutoSync,
			updatedAt: new Date(),
		};

		await ProfileModel.updateOne({ id }, { $set: { panels } });
		return NextResponse.json({ ok: true, panel: panels[idx] }, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; panelId: string }> }) {
	try {
		const { id, panelId } = await params;
		const db = await database('yourapps');
		const ProfileModel = (db.models.guilds as any)?.Profile;
		if (!ProfileModel) {
			return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });
		}

		const profile: any = await ProfileModel.findOne({ id }).lean();
		const panels: any[] = Array.isArray(profile?.panels) ? [...profile.panels] : [];
		const idx = panels.findIndex((p) => String(p.id) === panelId);
		if (idx < 0) {
			return NextResponse.json({ error: 'Panel not found.' }, { status: 404 });
		}

		const target = panels[idx];
		await deleteDiscordMessage(String(target.channelId), String(target.messageId));
		panels.splice(idx, 1);

		const updateFields: Record<string, any> = { panels };
		if (profile?.panelChannel && String(profile.panelChannel) === String(target.channelId) && !panels.some((p) => String(p?.channelId) === String(profile.panelChannel))) {
			updateFields.panelChannel = null;
		}

		await ProfileModel.updateOne({ id }, { $set: updateFields });
		return NextResponse.json({ ok: true, id: panelId }, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
