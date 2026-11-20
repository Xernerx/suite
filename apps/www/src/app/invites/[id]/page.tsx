/** @format */

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { buildDiscordBotAuthorizeUrl, getEnabledInviteOptions } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { InviteOptionChooser } from '@/components/InviteOptionChooser';
import { findDefaultOfficialInvite } from '@/lib/defaultOfficialInvites';

export const dynamic = 'force-dynamic';

const OFFICIAL_INVITE_SEO: Record<string, { title: string; description: string }> = {
	virtue: {
		title: 'Invite Virtue — Discord XP & Leveling Bot | Xernerx',
		description: 'Invite Virtue to your Discord server with least-privilege OAuth2 presets. Track text & voice XP, leaderboards, and role rewards with zero message logging.',
	},
	yourapps: {
		title: 'Invite YourApps — Discord Forms & Apps Bot | Xernerx',
		description: 'Invite YourApps to Discord with least-privilege OAuth2 presets. Build Modals V2 applications, web portals, Apply panels, and automated review workflows.',
	},
	metamorphosis: {
		title: 'Invite Metamorphosis — Discord Translator | Xernerx',
		description: 'Invite Metamorphosis to Discord with least-privilege OAuth2 presets for real-time multilingual translation, auto-translated channels, and global communities.',
	},
	zodiac: {
		title: 'Invite Zodiac — Discord Astrology & Horoscope Bot',
		description: 'Invite Zodiac to your Discord server with least-privilege OAuth2 presets for daily horoscopes, zodiac sign profiles, compatibility checks, and birth charts.',
	},
	todo: {
		title: 'Invite To-Do List Bot — Discord Task Boards | Xernerx',
		description: 'Invite To-Do List Bot to Discord with least-privilege OAuth2 presets for collaborative server task boards, personal checklists, priorities, and reminders.',
	},
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	const cleanKey = id.trim().toLowerCase();
	const officialSeo = OFFICIAL_INVITE_SEO[cleanKey];
	const fallback = findDefaultOfficialInvite(id);
	let botName = fallback?.name || id;
	let description =
		officialSeo?.description || `Invite ${botName} to your Discord server with verified least-privilege OAuth2 permission presets and manage settings in the unified Xernerx Suite dashboard.`;

	if (!officialSeo && process.env.MONGO_XERNERX) {
		try {
			const dbLookup = await Promise.race([
				(async () => {
					const db = await database('xernerx');
					const foundInvite: any = await db.models.core.AppInvite.findOne({ id }).lean();
					if (!foundInvite) return null;
					const foundBot = await (db.models.bots as any)?.Bot?.findOne({ id: foundInvite.clientId })
						.select('name description discordCache')
						.lean()
						.catch(() => null);
					return { invite: foundInvite, botDoc: foundBot };
				})(),
				new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
			]);
			if (dbLookup?.invite) {
				botName = dbLookup.botDoc?.discordCache?.globalName || dbLookup.botDoc?.discordCache?.username || dbLookup.botDoc?.name || dbLookup.invite.name || botName;
				const rawDesc = String(dbLookup.botDoc?.description || '').trim();
				if (rawDesc.length >= 60) {
					description = `Invite ${botName} to Discord: ${rawDesc}`.slice(0, 158);
				} else {
					description = `Invite ${botName} to your Discord server with verified least-privilege OAuth2 permission presets and manage settings in the unified Xernerx Suite dashboard.`;
				}
			}
		} catch {
			// Fall back to official invite defaults
		}
	}

	const canonicalUrl = `https://www.xernerx.com/invites/${encodeURIComponent(id)}`;
	const title = officialSeo?.title || `Invite ${botName} — Official Discord Bot | Xernerx`;

	return {
		title: { absolute: title },
		description,
		alternates: { canonical: canonicalUrl },
		openGraph: {
			title,
			description,
			url: canonicalUrl,
			siteName: 'Xernerx Studios',
			images: [{ url: '/banner.png', width: 1200, height: 630, alt: title }],
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: ['/banner.png'],
		},
	};
}

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
