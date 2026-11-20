/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from './auditAndNotify';
import { getCandidateDiscordTokens } from './discordGuildResources';
import { deleteDiscordMessage, fetchYourAppsGuildState } from './yourappsDiscord';

export async function authorizeGuildSetupManager(req: NextRequest, guildId: string): Promise<{ ok: true; userId: string | null } | { ok: false; response: NextResponse }> {
	const caller = await resolveCallerAuth(req, ['servers']);
	if (caller.isSystemToken || caller.authorized) {
		return { ok: true, userId: caller.userId || null };
	}

	const userId = caller.userId;
	if (!userId) {
		return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
	}

	try {
		const xernerxDb = await database('xernerx');
		const guildDoc: any = await (xernerxDb.models.guilds as any)?.Guild?.findOne({ id: guildId })
			.select('owner organization')
			.lean()
			.catch(() => null);

		if (guildDoc?.owner && String(guildDoc.owner) === String(userId)) {
			return { ok: true, userId };
		}

		if (guildDoc?.organization) {
			const orgMember = await (xernerxDb.models.organizations as any)?.Member?.findOne({
				organizationId: String(guildDoc.organization),
				userId: String(userId),
			})
				.lean()
				.catch(() => null);
			if (orgMember) {
				return { ok: true, userId };
			}
		}
	} catch {}

	for (const token of getCandidateDiscordTokens()) {
		try {
			const [guildRes, memberRes, rolesRes] = await Promise.all([
				fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}`, {
					headers: { Authorization: `Bot ${token}` },
					cache: 'no-store',
				}).catch(() => null),
				fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(userId)}`, {
					headers: { Authorization: `Bot ${token}` },
					cache: 'no-store',
				}).catch(() => null),
				fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/roles`, {
					headers: { Authorization: `Bot ${token}` },
					cache: 'no-store',
				}).catch(() => null),
			]);

			if (!guildRes?.ok) continue;
			const guildJson = await guildRes.json().catch(() => null);
			if (guildJson?.owner_id && String(guildJson.owner_id) === String(userId)) {
				return { ok: true, userId };
			}

			if (memberRes?.ok && rolesRes?.ok) {
				const member = await memberRes.json().catch(() => null);
				const roles = await rolesRes.json().catch(() => []);
				const memberRoleIds: string[] = Array.isArray(member?.roles) ? member.roles.map(String) : [];
				if (Array.isArray(roles)) {
					for (const r of roles) {
						if (r && (String(r.id) === guildId || memberRoleIds.includes(String(r.id)))) {
							const perms = BigInt(r.permissions || 0);
							if ((perms & BigInt(0x8)) === BigInt(0x8) || (perms & BigInt(0x20)) === BigInt(0x20)) {
								return { ok: true, userId };
							}
						}
					}
				}
			}
		} catch {}
	}

	return { ok: false, response: NextResponse.json({ error: 'Forbidden: Missing Manage Server permission.' }, { status: 403 }) };
}

export async function handleDeleteVirtueGuildSetup(req: NextRequest, guildId: string): Promise<NextResponse> {
	const authCheck = await authorizeGuildSetupManager(req, guildId);
	if (!authCheck.ok) return authCheck.response;

	const db = await database('virtue');
	const GuildModel = (db.models.profiles as any)?.Guild;
	if (!GuildModel) {
		return NextResponse.json({ error: 'Virtue models not initialized' }, { status: 500 });
	}

	const existing: any = await GuildModel.findOne({ id: guildId })
		.lean()
		.catch(() => null);
	const virtueToken = process.env.VIRTUE_BOT_TOKEN?.trim();
	let botStillInGuild = false;

	if (virtueToken) {
		try {
			const res = await fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}`, {
				headers: { Authorization: `Bot ${virtueToken}` },
				cache: 'no-store',
			});
			botStillInGuild = res.ok;
		} catch {}
	}

	if (botStillInGuild) {
		await GuildModel.deleteOne({ id: guildId });
		await GuildModel.create({
			id: guildId,
			serverRoles: Array.isArray(existing?.serverRoles) ? existing.serverRoles : [],
			serverChannels: Array.isArray(existing?.serverChannels) ? existing.serverChannels : [],
		});
	} else {
		await GuildModel.deleteMany({ id: guildId });
	}

	await recordAuditLog(req, {
		action: 'server.virtue.setup_delete',
		targetType: 'server',
		targetId: guildId,
		summary: `Deleted Virtue server setup data for server "${guildId}"`,
		metadata: { botStillInGuild },
	});

	return NextResponse.json({ success: true, botStillInGuild }, { status: 200 });
}

export async function handleDeleteYourAppsGuildSetup(req: NextRequest, guildId: string): Promise<NextResponse> {
	const authCheck = await authorizeGuildSetupManager(req, guildId);
	if (!authCheck.ok) return authCheck.response;

	const db = await database('yourapps');
	const ProfileModel = (db.models.guilds as any)?.Profile;
	const FormModel = (db.models.guilds as any)?.Form;
	const SubmissionModel = (db.models.guilds as any)?.Submission;
	const DraftModel = (db.models.guilds as any)?.Draft;

	if (!ProfileModel) {
		return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });
	}

	const existing: any = await ProfileModel.findOne({ id: guildId })
		.lean()
		.catch(() => null);

	if (Array.isArray(existing?.panels) && existing.panels.length > 0) {
		await Promise.all(existing.panels.filter((p: any) => p?.channelId && p?.messageId).map((p: any) => deleteDiscordMessage(String(p.channelId), String(p.messageId)).catch(() => false)));
	}
	const discordState = await fetchYourAppsGuildState(guildId).catch(() => ({ botPresent: false, serverRoles: [], serverChannels: [] }));

	const [formsRes, subsRes, draftsRes] = await Promise.all([
		FormModel ? FormModel.deleteMany({ guild: guildId }).catch(() => ({ deletedCount: 0 })) : Promise.resolve({ deletedCount: 0 }),
		SubmissionModel ? SubmissionModel.deleteMany({ guild: guildId }).catch(() => ({ deletedCount: 0 })) : Promise.resolve({ deletedCount: 0 }),
		DraftModel ? DraftModel.deleteMany({ guild: guildId }).catch(() => ({ deletedCount: 0 })) : Promise.resolve({ deletedCount: 0 }),
	]);

	if (discordState.botPresent) {
		await ProfileModel.deleteOne({ id: guildId });
		await ProfileModel.create({
			id: guildId,
			serverRoles: discordState.serverRoles.length > 0 ? discordState.serverRoles : Array.isArray(existing?.serverRoles) ? existing.serverRoles : [],
			serverChannels: discordState.serverChannels.length > 0 ? discordState.serverChannels : Array.isArray(existing?.serverChannels) ? existing.serverChannels : [],
		});
	} else {
		await ProfileModel.deleteMany({ id: guildId });
	}

	const deletedCount = (Number(formsRes?.deletedCount) || 0) + (Number(subsRes?.deletedCount) || 0) + (Number(draftsRes?.deletedCount) || 0);

	await recordAuditLog(req, {
		action: 'server.yourapps.setup_delete',
		targetType: 'server',
		targetId: guildId,
		summary: `Deleted YourApps server setup, forms, and submissions data for server "${guildId}"`,
		metadata: {
			botStillInGuild: discordState.botPresent,
			deletedFormsAndSubmissions: deletedCount,
		},
	});

	return NextResponse.json({ success: true, botStillInGuild: discordState.botPresent, deletedCount }, { status: 200 });
}
