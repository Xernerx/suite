/** @format */

import { normalizeInviteOptions } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';
import { applyLiveDiscordToBot, buildDiscordAvatarUrl, fetchLiveDiscordUser, isDiscordManagedMediaValue } from '@/lib/botDiscordSync';

export async function GET() {
	try {
		const db = await database('xernerx');
		const invitesData = await db.models.core.AppInvite.find().sort({ createdAt: -1 }).lean();
		const clientIds = Array.from(new Set(invitesData.map((i: any) => String(i.clientId)).filter(Boolean)));
		const BotModel = (db.models.bots as any)?.Bot;
		const botDocs =
			clientIds.length > 0 && BotModel
				? await BotModel.find({ id: { $in: clientIds } })
						.select('id name avatar description vanitySlug discordCache')
						.lean()
						.catch(() => [])
				: [];
		const botMap = new Map<string, any>(botDocs.map((b: any) => [String(b.id), b]));

		const invites = await Promise.all(
			invitesData.map(async (plain: any) => {
				const clientId = String(plain.clientId);
				const registeredBot = botMap.get(clientId);
				const discordUser = await fetchLiveDiscordUser(clientId);
				let liveAvatarUrl: string | null = null;

				if (discordUser) {
					if (registeredBot) {
						liveAvatarUrl = applyLiveDiscordToBot(registeredBot, clientId, discordUser, BotModel, 512).avatarUrl;
					} else {
						liveAvatarUrl = buildDiscordAvatarUrl(clientId, discordUser.avatar, 512);
					}
				}

				const fallbackAvatar =
					registeredBot && !discordUser
						? !isDiscordManagedMediaValue(registeredBot.avatar)
							? String(registeredBot.avatar)
							: registeredBot.discordCache?.avatarUrl || buildDiscordAvatarUrl(clientId, registeredBot.discordCache?.avatar || registeredBot.avatar, 512)
						: null;

				return {
					...plain,
					options: normalizeInviteOptions(plain),
					botName: discordUser?.global_name || discordUser?.username || registeredBot?.name || plain.name,
					botAvatar: liveAvatarUrl || fallbackAvatar || null,
					botVanitySlug: registeredBot?.vanitySlug || null,
					description: plain.description || registeredBot?.description || undefined,
				};
			})
		);

		return NextResponse.json(invites);
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const caller = await resolveCallerAuth(req, ['invites']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Missing invites permission.' }, { status: 403 });
		}

		const body = await req.json();
		const normalizedOptions = normalizeInviteOptions(body);
		const primaryPerms = normalizedOptions.essential.enabled ? normalizedOptions.essential.permissions : normalizedOptions.optional.enabled ? normalizedOptions.optional.permissions : '0';

		const invite = await (
			await database('xernerx')
		).models.core.AppInvite.create({
			...body,
			permissions: primaryPerms,
			options: normalizedOptions,
		});
		await recordAuditLog(req, {
			action: 'invite.created',
			targetType: 'system',
			targetId: invite.id,
			summary: `Created bot invite "${invite.name || invite.id}"`,
			metadata: { clientId: invite.clientId },
		});
		return NextResponse.json({
			...invite.toObject(),
			options: normalizeInviteOptions(invite),
		});
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
