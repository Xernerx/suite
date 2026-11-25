/** @format */

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { buildDiscordBotAuthorizeUrl, getEnabledInviteOptions } from '@xernerx/lib';
import { InviteOptionChooser } from '@/components/InviteOptionChooser';
import { findDefaultOfficialInvite } from '@/lib/defaultOfficialInvites';
import { resolveAppBaseUrlForEnv, resolveDiscordBotProfileCached, resolveInviteCached, resolveInviteHostEnv } from '@/lib/resolveInvite';

export const dynamic = 'force-dynamic';

const METAMORPHOSIS_SEO = {
	title: 'Invite Metamorphosis — Discord Translator | Xernerx',
	description: 'Invite Metamorphosis to Discord with least-privilege OAuth2 presets for real-time multilingual translation, auto-translated channels, and global communities.',
};

const TODO_SEO = {
	title: 'Invite To-Do List Bot — Discord Task Boards | Xernerx',
	description: 'Invite To-Do List Bot to Discord with least-privilege OAuth2 presets for collaborative server task boards, personal checklists, priorities, and reminders.',
};

const OFFICIAL_INVITE_SEO: Record<string, { title: string; description: string }> = {
	virtue: {
		title: 'Invite Virtue — Discord XP & Leveling Bot | Xernerx',
		description: 'Invite Virtue to your Discord server with least-privilege OAuth2 presets. Track text & voice XP, leaderboards, and role rewards with zero message logging.',
	},
	yourapps: {
		title: 'Invite YourApps — Discord Forms & Apps Bot | Xernerx',
		description: 'Invite YourApps to Discord with least-privilege OAuth2 presets. Build Modals V2 applications, web portals, Apply panels, and automated review workflows.',
	},
	meta: METAMORPHOSIS_SEO,
	metamorphosis: METAMORPHOSIS_SEO,
	zodiac: {
		title: 'Invite Zodiac — Discord Astrology & Horoscope Bot',
		description: 'Invite Zodiac to your Discord server with least-privilege OAuth2 presets for daily horoscopes, zodiac sign profiles, compatibility checks, and birth charts.',
	},
	tdl: TODO_SEO,
	todo: TODO_SEO,
	todolistbot: TODO_SEO,
	xernerx: {
		title: 'Invite Xernerx Bot — Official Suite Companion | Xernerx',
		description: 'Invite Xernerx Bot to your Discord server to sync server stats, unlock milestone badges, and enable real-time Xernerx Suite directory & webhook integrations.',
	},
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const [resolvedParams, reqHeaders] = await Promise.all([params, headers()]);
	const id = resolvedParams.id;
	const cleanKey = id.trim().toLowerCase();
	const hostEnv = resolveInviteHostEnv(reqHeaders.get('x-forwarded-host') || reqHeaders.get('host'));

	const resolved = await resolveInviteCached(id, hostEnv).catch(() => null);
	const fallback = resolved?.fallbackInvite || findDefaultOfficialInvite(id);
	const canonicalSlug = resolved?.invite?.id || fallback?.id || id;
	const officialSeo = OFFICIAL_INVITE_SEO[cleanKey] || OFFICIAL_INVITE_SEO[String(canonicalSlug).toLowerCase()] || (fallback ? OFFICIAL_INVITE_SEO[fallback.dictionaryKey] : undefined);

	let botName = resolved?.botDoc?.discordCache?.globalName || resolved?.botDoc?.discordCache?.username || resolved?.botDoc?.name || resolved?.invite?.name || fallback?.name || id;
	let description =
		officialSeo?.description || `Invite ${botName} to your Discord server with verified least-privilege OAuth2 permission presets and manage settings in the unified Xernerx Suite dashboard.`;

	if (!officialSeo && resolved?.status === 'found') {
		const rawDesc = String(resolved.botDoc?.description || '').trim();
		if (rawDesc.length >= 60) {
			description = `Invite ${botName} to Discord: ${rawDesc}`.slice(0, 158);
		}
	}

	const canonicalUrl = `https://www.xernerx.com/invites/${encodeURIComponent(canonicalSlug)}`;
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

export default async function InviteSlugPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ option?: string; tier?: string }> }) {
	const [resolvedParams, resolvedSearch, reqHeaders] = await Promise.all([params, searchParams, headers()]);
	const hostEnv = resolveInviteHostEnv(reqHeaders.get('x-forwarded-host') || reqHeaders.get('host'));
	const appBaseUrl = resolveAppBaseUrlForEnv(hostEnv);

	const resolved = await resolveInviteCached(resolvedParams.id, hostEnv);

	if (resolved.status === 'not_found') {
		notFound();
	}

	if (resolved.status === 'unavailable' || !resolved.invite) {
		throw new Error('Temporarily unable to load invite configuration. Please try again.');
	}

	const { invite, botDoc, fallbackInvite } = resolved;
	const targetSlug = botDoc?.vanitySlug || fallbackInvite?.vanitySlug || invite.id || invite.clientId;
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

	if (resolved.source !== 'api') {
		const discordProfile = await resolveDiscordBotProfileCached(invite.clientId);
		if (discordProfile) {
			botName = discordProfile.name || botName;
			botAvatar = discordProfile.avatarUrl || fallbackInvite?.defaultAvatarUrl || botAvatar;
		}
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
