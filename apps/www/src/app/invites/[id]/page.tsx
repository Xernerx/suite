/** @format */

import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { buildDiscordBotAuthorizeUrl, getEnabledInviteOptions } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { InviteOptionChooser } from '@/components/InviteOptionChooser';
import { findDefaultOfficialInvite } from '@/lib/defaultOfficialInvites';

export const dynamic = 'force-dynamic';

function resolveAppBaseUrl(host: string | null): string {
	const h = (host || '').toLowerCase();
	if (h.includes('.dev.xernerx.com') || h.startsWith('localhost:')) return 'https://app.dev.xernerx.com';
	if (h.includes('.canary.xernerx.com')) return 'https://app.canary.xernerx.com';
	return 'https://app.xernerx.com';
}

export default async function InviteSlugPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ option?: string; tier?: string }> }) {
	const [resolvedParams, resolvedSearch, reqHeaders] = await Promise.all([params, searchParams, headers()]);
	const appBaseUrl = resolveAppBaseUrl(reqHeaders.get('x-forwarded-host') || reqHeaders.get('host'));

	let invite: any = null;
	let botDoc: any = null;

	if (process.env.MONGO_XERNERX) {
		try {
			const dbLookup = await Promise.race([
				(async () => {
					const db = await database('xernerx');
					const foundInvite: any = await db.models.core.AppInvite.findOne({ id: resolvedParams.id }).lean();
					if (!foundInvite) return null;
					const foundBot = await (db.models.bots as any)?.Bot?.findOne({ id: foundInvite.clientId })
						.select('name avatar description vanitySlug discordCache')
						.lean()
						.catch(() => null);
					return { invite: foundInvite, botDoc: foundBot };
				})(),
				new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
			]);
			if (dbLookup) {
				invite = dbLookup.invite;
				botDoc = dbLookup.botDoc;
			}
		} catch {
			// Fall back to default official invites below
		}
	}

	const fallbackInvite = findDefaultOfficialInvite(resolvedParams.id);
	if (!invite && fallbackInvite) {
		invite = fallbackInvite;
	}

	if (!invite) {
		notFound();
	}

	const targetSlug = botDoc?.vanitySlug || invite.id || invite.clientId;
	const enabledOptions = getEnabledInviteOptions(invite);

	const requestedOption = (resolvedSearch.option || resolvedSearch.tier || '').trim().toLowerCase();
	if (requestedOption) {
		const matched = enabledOptions.find((o) => o.key === requestedOption);
		if (matched) {
			redirect(
				buildDiscordBotAuthorizeUrl({
					clientId: invite.clientId,
					permissions: matched.permissions,
					scopes: invite.scopes,
					redirect: Boolean(invite.redirect),
					targetSlug,
					appBaseUrl,
				})
			);
		}
	}

	if (enabledOptions.length === 1) {
		redirect(
			buildDiscordBotAuthorizeUrl({
				clientId: invite.clientId,
				permissions: enabledOptions[0].permissions,
				scopes: invite.scopes,
				redirect: Boolean(invite.redirect),
				targetSlug,
				appBaseUrl,
			})
		);
	}

	let botName = botDoc?.discordCache?.globalName || botDoc?.discordCache?.username || botDoc?.name || invite.name;
	let botAvatar: string | null =
		botDoc?.discordCache?.avatarUrl ||
		(botDoc?.avatar && typeof botDoc.avatar === 'string'
			? botDoc.avatar.startsWith('http')
				? botDoc.avatar
				: `https://cdn.discordapp.com/avatars/${invite.clientId}/${botDoc.avatar}.png?size=512`
			: fallbackInvite?.defaultAvatarUrl || null);

	const tokens = Array.from(new Set([process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean))) as string[];
	for (const token of tokens) {
		try {
			const res = await fetch(`https://discord.com/api/v10/users/${invite.clientId}`, {
				headers: { Authorization: `Bot ${token}` },
				signal: AbortSignal.timeout(2500),
				next: { revalidate: 300 },
			});
			if (res.ok) {
				const data = await res.json();
				botName = data.global_name || data.username || botName;
				botAvatar = data.avatar
					? `https://cdn.discordapp.com/avatars/${invite.clientId}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}?size=512`
					: fallbackInvite?.defaultAvatarUrl || null;
				break;
			}
		} catch {}
	}

	const chooserOptions = enabledOptions.map((opt) => ({
		...opt,
		discordUrl: buildDiscordBotAuthorizeUrl({
			clientId: invite.clientId,
			permissions: opt.permissions,
			scopes: invite.scopes,
			redirect: Boolean(invite.redirect),
			targetSlug,
			appBaseUrl,
		}),
	}));

	return <InviteOptionChooser id={invite.id} botName={botName} botAvatar={botAvatar} description={botDoc?.description} options={chooserOptions} />;
}
