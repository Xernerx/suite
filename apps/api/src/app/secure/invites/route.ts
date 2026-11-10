/** @format */

import { normalizeInviteOptions } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

export async function GET() {
	try {
		const db = await database('xernerx');
		const invitesData = await db.models.core.AppInvite.find().sort({ createdAt: -1 }).lean();
		const clientIds = Array.from(new Set(invitesData.map((i: any) => String(i.clientId)).filter(Boolean)));
		const botDocs =
			clientIds.length > 0 && (db.models.bots as any)?.Bot
				? await (db.models.bots as any).Bot.find({ id: { $in: clientIds } })
						.select('id name avatar description vanitySlug')
						.lean()
						.catch(() => [])
				: [];
		const botMap = new Map<string, any>(botDocs.map((b: any) => [String(b.id), b]));

		const invites = await Promise.all(
			invitesData.map(async (plain: any) => {
				const registeredBot = botMap.get(String(plain.clientId));
				let discordBot: any = null;

				if (process.env.DISCORD_CLIENT_TOKEN) {
					try {
						const res = await fetch(`https://discord.com/api/v10/users/${plain.clientId}`, {
							headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
						});
						if (res.ok) {
							const data = await res.json();
							discordBot = {
								...data,
								avatarUrl: data.avatar ? `https://cdn.discordapp.com/avatars/${plain.clientId}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,
							};
						}
					} catch {}
				}

				const fallbackAvatar =
					registeredBot?.avatar && typeof registeredBot.avatar === 'string'
						? registeredBot.avatar.startsWith('http')
							? registeredBot.avatar
							: `https://cdn.discordapp.com/avatars/${plain.clientId}/${registeredBot.avatar}.png?size=512`
						: null;

				return {
					...plain,
					options: normalizeInviteOptions(plain),
					botName: discordBot?.global_name || discordBot?.username || registeredBot?.name || plain.name,
					botAvatar: discordBot?.avatarUrl || fallbackAvatar || null,
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
