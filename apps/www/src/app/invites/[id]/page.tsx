/** @format */

import { notFound, redirect } from 'next/navigation';
import { buildDiscordBotAuthorizeUrl, getEnabledInviteOptions } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { InviteOptionChooser } from '@/components/InviteOptionChooser';

export const dynamic = 'force-dynamic';

export default async function InviteSlugPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ option?: string; tier?: string }> }) {
	const resolvedParams = await params;
	const resolvedSearch = await searchParams;

	const db = await database('xernerx');
	const invite: any = await db.models.core.AppInvite.findOne({ id: resolvedParams.id }).lean();
	if (!invite) {
		notFound();
	}
	const botDoc = await (db.models.bots as any)?.Bot?.findOne({ id: invite.clientId })
		.select('name avatar description vanitySlug')
		.lean()
		.catch(() => null);

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
				})
			);
		}
	}

	// Immediately redirect when only 1 invite option URL is set up
	if (enabledOptions.length === 1) {
		redirect(
			buildDiscordBotAuthorizeUrl({
				clientId: invite.clientId,
				permissions: enabledOptions[0].permissions,
				scopes: invite.scopes,
				redirect: Boolean(invite.redirect),
				targetSlug,
			})
		);
	}

	let botName = botDoc?.name || invite.name;
	let botAvatar: string | null =
		botDoc?.avatar && typeof botDoc.avatar === 'string'
			? botDoc.avatar.startsWith('http')
				? botDoc.avatar
				: `https://cdn.discordapp.com/avatars/${invite.clientId}/${botDoc.avatar}.png?size=512`
			: null;

	if (process.env.DISCORD_CLIENT_TOKEN) {
		try {
			const res = await fetch(`https://discord.com/api/v10/users/${invite.clientId}`, {
				headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
				next: { revalidate: 300 },
			});
			if (res.ok) {
				const data = await res.json();
				botName = data.global_name || data.username || botName;
				if (data.avatar) {
					botAvatar = `https://cdn.discordapp.com/avatars/${invite.clientId}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}?size=512`;
				}
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
		}),
	}));

	return <InviteOptionChooser id={invite.id} botName={botName} botAvatar={botAvatar} description={botDoc?.description} options={chooserOptions} />;
}
