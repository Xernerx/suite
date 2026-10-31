/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('virtue');
		const GuildModel = (db.models.profiles as any)?.Guild;

		if (!GuildModel) {
			return NextResponse.json({ error: 'Virtue models not initialized' }, { status: 500 });
		}

		const profile: any = await GuildModel.findOne({ id }).lean();

		if (!profile) {
			return NextResponse.json({ error: 'Virtue guild setup profile not found', found: false }, { status: 404 });
		}

		const candidateTokens = Array.from(new Set([process.env.VIRTUE_BOT_TOKEN, process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean) as string[]));
		for (const token of candidateTokens) {
			try {
				const [roleRes, channelRes] = await Promise.all([
					fetch(`https://discord.com/api/v10/guilds/${id}/roles`, {
						headers: { Authorization: `Bot ${token}` },
						cache: 'no-store',
					}).catch(() => null),
					fetch(`https://discord.com/api/v10/guilds/${id}/channels`, {
						headers: { Authorization: `Bot ${token}` },
						cache: 'no-store',
					}).catch(() => null),
				]);

				const updateFields: Record<string, unknown> = {};

				if (roleRes && roleRes.ok) {
					const roles = await roleRes.json();
					if (Array.isArray(roles)) {
						profile.serverRoles = roles
							.filter((r: any) => r && r.id && r.id !== id && !r.managed)
							.sort((a: any, b: any) => (Number(b.position) || 0) - (Number(a.position) || 0))
							.map((r: any) => ({
								id: String(r.id),
								name: String(r.name),
								color: Number(r.color) || 0,
								position: Number(r.position) || 0,
								managed: Boolean(r.managed),
							}));
						updateFields.serverRoles = profile.serverRoles;
					}
				}

				if (channelRes && channelRes.ok) {
					const channels = await channelRes.json();
					if (Array.isArray(channels)) {
						profile.serverChannels = channels
							.filter((c: any) => c && c.id && (Number(c.type) === 0 || Number(c.type) === 5 || Number(c.type) === 2 || Number(c.type) === 13))
							.sort((a: any, b: any) => (Number(a.position) || 0) - (Number(b.position) || 0))
							.map((c: any) => ({
								id: String(c.id),
								name: String(c.name),
								type: Number(c.type) || 0,
							}));
						updateFields.serverChannels = profile.serverChannels;
					}
				}

				if (Object.keys(updateFields).length > 0) {
					await GuildModel.updateOne({ id }, { $set: updateFields }).catch(() => null);
					break;
				}
			} catch {
				// Try next candidate token
			}
		}

		return NextResponse.json(profile, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('virtue');
		const GuildModel = (db.models.profiles as any)?.Guild;

		if (!GuildModel) {
			return NextResponse.json({ error: 'Virtue models not initialized' }, { status: 500 });
		}

		const { _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, ...cleanBody } = body || {};
		const stripSubdocId = (arr: any[]) => arr.map(({ _id: _itemOmitId, ...item }: any) => item);
		if (Array.isArray(cleanBody.levelRoles)) {
			cleanBody.levelRoles = stripSubdocId(cleanBody.levelRoles);
		}
		if (Array.isArray(cleanBody.textLevelRoles)) {
			cleanBody.textLevelRoles = stripSubdocId(cleanBody.textLevelRoles);
		}
		if (Array.isArray(cleanBody.voiceLevelRoles)) {
			cleanBody.voiceLevelRoles = stripSubdocId(cleanBody.voiceLevelRoles);
		}
		if (cleanBody.roles && typeof cleanBody.roles === 'object') {
			if (Array.isArray(cleanBody.roles.levels)) {
				cleanBody.roles.levels = stripSubdocId(cleanBody.roles.levels);
			}
			if (Array.isArray(cleanBody.roles.textLevels)) {
				cleanBody.roles.textLevels = stripSubdocId(cleanBody.roles.textLevels);
			}
			if (Array.isArray(cleanBody.roles.voiceLevels)) {
				cleanBody.roles.voiceLevels = stripSubdocId(cleanBody.roles.voiceLevels);
			}
		}

		const updated = await GuildModel.findOneAndUpdate({ id }, { $set: cleanBody }, { returnDocument: 'after', upsert: true, runValidators: true }).lean();

		return NextResponse.json(updated, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
