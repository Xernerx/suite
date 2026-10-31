/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { syncSisterServers } from '@/lib/sync/settings';
import { recordAuditLog } from '@/lib/auditAndNotify';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = (await database('xernerx')).models.core as any;
		const SettingModel = db.Setting;

		const setting = await SettingModel.findOne({ id }).lean();

		if (!setting) {
			return NextResponse.json({ id, name: id.replace(/_/g, ' '), value: null }, { status: 200 });
		}

		return NextResponse.json(setting, { status: 200 });
	} catch (error: any) {
		console.warn('Failed to fetch setting:', error?.message || error);
		return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = (await database('xernerx')).models.core as any;
		const SettingModel = db.Setting;

		const { _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, ...cleanBody } = body || {};
		const updateData = { ...cleanBody, id };
		// Make sure it has a name
		if (!updateData.name) {
			updateData.name = id.replace(/_/g, ' ');
		}

		let oldSisterServers: string[] = [];
		if (id === 'sister_servers') {
			const oldSetting = await SettingModel.findOne({ id }).lean();
			try {
				const parsed = JSON.parse(oldSetting?.value || '[]');
				oldSisterServers = parsed.map((s: any) => s.id);
			} catch {}
		}

		if (id === 'virtue_global_xp') {
			let prevParsed: any = {};
			try {
				const prevSetting = await SettingModel.findOne({ id: 'virtue_global_xp' }).lean();
				if (prevSetting?.value) {
					prevParsed = typeof prevSetting.value === 'string' ? JSON.parse(prevSetting.value) : prevSetting.value;
				}
			} catch {}

			let parsed: any = {};
			try {
				parsed = typeof updateData.value === 'string' ? JSON.parse(updateData.value) : updateData.value || {};
			} catch {}

			const prevDiscordEventId = parsed.discordEventId || prevParsed.discordEventId || null;
			const syncDiscordEvent = parsed.syncDiscordEvent !== false;
			const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_CLIENT_TOKEN;

			try {
				const adminServerSetting = await SettingModel.findOne({ id: 'admin_server_id' }).lean();
				const adminServerId = adminServerSetting?.value ? String(adminServerSetting.value).trim() : null;

				if (adminServerId && botToken) {
					const now = Date.now();
					const expMs = parsed.expiresAt ? new Date(parsed.expiresAt).getTime() : NaN;
					const isAlreadyExpired = !Number.isNaN(expMs) && expMs <= now;

					if (!parsed.enabled || !syncDiscordEvent || isAlreadyExpired) {
						if (prevDiscordEventId) {
							await fetch(`https://discord.com/api/v10/guilds/${adminServerId}/scheduled-events/${prevDiscordEventId}`, {
								method: 'DELETE',
								headers: { Authorization: `Bot ${botToken}` },
							}).catch(() => null);
						}
						parsed.discordEventId = null;
						parsed.discordEventGuildId = null;
					} else {
						const rawStartMs = parsed.startsAt ? new Date(parsed.startsAt).getTime() : NaN;
						const isImmediate = Number.isNaN(rawStartMs) || rawStartMs <= now + 30_000;
						const scheduledStartMs = isImmediate ? now + 60_000 : rawStartMs;
						const scheduledEndMs = !Number.isNaN(expMs) && expMs > scheduledStartMs + 60_000 ? expMs : scheduledStartMs + 24 * 3600 * 1000;

						const mult = Math.min(10, Math.max(1, Number(parsed.multiplier) || 2));
						const scopeDesc =
							parsed.scope === 'everything'
								? 'all Virtue servers, Global XP, and Level-Up Credits'
								: parsed.scope === 'global_only'
									? 'Global Xernerx XP'
									: 'Global XP & all Virtue servers';

						const eventPayload: Record<string, any> = {
							name: `⚡ ${parsed.label || 'Double XP Event'} (${mult}x XP)`.slice(0, 100),
							description: `Earn ${mult}x XP across ${scopeDesc}! Chat or hang out in voice channels to level up faster.`,
							privacy_level: 2,
							entity_type: 3,
							entity_metadata: { location: 'https://app.xernerx.com/leaderboard' },
							scheduled_start_time: new Date(scheduledStartMs).toISOString(),
							scheduled_end_time: new Date(scheduledEndMs).toISOString(),
						};

						let syncedEventId: string | null = null;

						if (prevDiscordEventId) {
							const patchRes = await fetch(`https://discord.com/api/v10/guilds/${adminServerId}/scheduled-events/${prevDiscordEventId}`, {
								method: 'PATCH',
								headers: {
									Authorization: `Bot ${botToken}`,
									'Content-Type': 'application/json',
								},
								body: JSON.stringify(eventPayload),
							}).catch(() => null);

							if (patchRes?.ok) {
								const updatedEv = await patchRes.json().catch(() => null);
								syncedEventId = updatedEv?.id || prevDiscordEventId;
							} else if (patchRes && patchRes.status !== 404) {
								// If event is already ACTIVE, Discord rejects scheduled_start_time changes; retry without scheduled_start_time
								const { scheduled_start_time: _omitStart, ...activePayload } = eventPayload;
								const retryRes = await fetch(`https://discord.com/api/v10/guilds/${adminServerId}/scheduled-events/${prevDiscordEventId}`, {
									method: 'PATCH',
									headers: {
										Authorization: `Bot ${botToken}`,
										'Content-Type': 'application/json',
									},
									body: JSON.stringify(activePayload),
								}).catch(() => null);
								if (retryRes?.ok) {
									syncedEventId = prevDiscordEventId;
								}
							}
						}

						if (!syncedEventId) {
							const createRes = await fetch(`https://discord.com/api/v10/guilds/${adminServerId}/scheduled-events`, {
								method: 'POST',
								headers: {
									Authorization: `Bot ${botToken}`,
									'Content-Type': 'application/json',
								},
								body: JSON.stringify(eventPayload),
							}).catch(() => null);

							if (createRes?.ok) {
								const createdEv = await createRes.json().catch(() => null);
								syncedEventId = createdEv?.id || null;

								// If the event starts immediately, transition status to ACTIVE (2) right away
								if (syncedEventId && isImmediate) {
									await fetch(`https://discord.com/api/v10/guilds/${adminServerId}/scheduled-events/${syncedEventId}`, {
										method: 'PATCH',
										headers: {
											Authorization: `Bot ${botToken}`,
											'Content-Type': 'application/json',
										},
										body: JSON.stringify({ status: 2 }),
									}).catch(() => null);
								}
							}
						}

						parsed.discordEventId = syncedEventId;
						parsed.discordEventGuildId = syncedEventId ? adminServerId : null;
					}
				}
			} catch (err) {
				console.warn('Failed to sync Discord scheduled event for virtue_global_xp:', err);
			}

			updateData.value = JSON.stringify(parsed);
		}

		const updatedSetting = await SettingModel.findOneAndUpdate({ id }, { $set: updateData }, { returnDocument: 'after', upsert: true }).lean();

		if (id === 'virtue_global_xp') {
			try {
				const virtueDb = await database('virtue');
				const VirtueGuildModel = (virtueDb.models.profiles as any)?.Guild;
				if (VirtueGuildModel) {
					const rawVal = typeof updateData.value === 'string' ? updateData.value : JSON.stringify(updateData.value ?? {});
					let parsed: any = {};
					try {
						parsed = typeof updateData.value === 'string' ? JSON.parse(updateData.value) : updateData.value || {};
					} catch {}
					const mult = parsed?.enabled ? Math.max(1, Number(parsed?.multiplier) || 2) : 1;
					await VirtueGuildModel.findOneAndUpdate(
						{ id: '__global__' },
						{
							$set: {
								id: '__global__',
								mode: 'balanced',
								xpMultiplier: mult,
								levelMessage: rawVal,
							},
						},
						{ upsert: true }
					);
				}
			} catch (err) {
				console.warn('Failed to mirror virtue_global_xp to virtue/__global__:', err);
			}
		}

		await recordAuditLog(req, {
			action: 'setting.updated',
			category: 'setting',
			targetId: id,
			targetLabel: updateData.name || id,
			details: { value: typeof updateData.value === 'string' && updateData.value.length > 120 ? `${updateData.value.slice(0, 120)}...` : updateData.value },
		});

		if (id === 'sister_servers') {
			let newSisterServers: string[] = [];
			try {
				const parsed = JSON.parse(updatedSetting.value || '[]');
				newSisterServers = parsed.map((s: any) => s.id);
			} catch {}

			const addedServers = newSisterServers.filter((sId) => !oldSisterServers.includes(sId));
			console.log('[Sync] sister_servers PATCH detected');
			console.log('[Sync] Old:', oldSisterServers);
			console.log('[Sync] New:', newSisterServers);
			console.log('[Sync] Added:', addedServers);

			if (addedServers.length > 0) {
				console.log('[Sync] Firing background job for added servers...');
				// Fire and forget background task
				setTimeout(async () => {
					syncSisterServers(addedServers, await database('xernerx')).catch((err) => {
						console.error('Background sync failed:', err);
					});
				}, 0);
			}
		}

		return NextResponse.json(updatedSetting, { status: 200 });
	} catch (error) {
		console.error('Failed to update setting:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
