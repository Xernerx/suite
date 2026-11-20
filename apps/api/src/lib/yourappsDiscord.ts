/** @format */

import {
	applyMemberRoleChanges,
	applySubmissionDecisionInDiscord,
	buildApplyPanelMessagePayload,
	buildSubmissionDiscordComponents,
	buildSubmissionDiscordEmbed,
	closeSubmissionInterviewInDiscord,
	decodeYourAppsApplicationId,
	deleteDiscordMessage,
	editDiscordApplyPanelMessage,
	getPublicAppUrl,
	getYourAppsBotToken,
	notifyClarificationRequestedInDiscord,
	notifyClarificationRespondedInDiscord,
	openSubmissionInterviewInDiscord,
	postSubmissionToDiscordLogChannel,
	publishDiscordApplyPanel,
	publishDiscordNativePoll,
	syncGuildApplyPanels,
	syncSubmissionLogMessageInDiscord,
} from './yourappsDiscordPanels';
import { snowflakeCreatedAtMs } from './yourappsSanitize';

export {
	applyMemberRoleChanges,
	applySubmissionDecisionInDiscord,
	buildApplyPanelMessagePayload,
	buildSubmissionDiscordComponents,
	buildSubmissionDiscordEmbed,
	closeSubmissionInterviewInDiscord,
	decodeYourAppsApplicationId,
	deleteDiscordMessage,
	editDiscordApplyPanelMessage,
	getPublicAppUrl,
	getYourAppsBotToken,
	notifyClarificationRequestedInDiscord,
	notifyClarificationRespondedInDiscord,
	openSubmissionInterviewInDiscord,
	postSubmissionToDiscordLogChannel,
	publishDiscordApplyPanel,
	publishDiscordNativePoll,
	syncGuildApplyPanels,
	syncSubmissionLogMessageInDiscord,
};

export async function fetchYourAppsGuildState(guildId: string): Promise<{
	botPresent: boolean;
	applicationId: string | null;
	guildName?: string;
	guildIconUrl?: string | null;
	serverRoles: Array<{ id: string; name: string; color: number; position: number; managed: boolean }>;
	serverChannels: Array<{ id: string; name: string; type: number }>;
}> {
	const token = getYourAppsBotToken();
	const applicationId = decodeYourAppsApplicationId();
	if (!token) {
		return { botPresent: false, applicationId, serverRoles: [], serverChannels: [] };
	}

	try {
		const [guildRes, rolesRes, channelsRes] = await Promise.all([
			fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}`, {
				headers: { Authorization: `Bot ${token}` },
				cache: 'no-store',
			}).catch(() => null),
			fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/roles`, {
				headers: { Authorization: `Bot ${token}` },
				cache: 'no-store',
			}).catch(() => null),
			fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/channels`, {
				headers: { Authorization: `Bot ${token}` },
				cache: 'no-store',
			}).catch(() => null),
		]);

		if (!guildRes || !guildRes.ok) {
			return { botPresent: false, applicationId, serverRoles: [], serverChannels: [] };
		}

		const guildJson = await guildRes.json().catch(() => ({}));
		const guildName = guildJson?.name ? String(guildJson.name) : undefined;
		const guildIconUrl = guildJson?.icon ? `https://cdn.discordapp.com/icons/${guildId}/${guildJson.icon}.png?size=256` : null;

		let serverRoles: Array<{ id: string; name: string; color: number; position: number; managed: boolean }> = [];
		if (rolesRes && rolesRes.ok) {
			const roles = await rolesRes.json().catch(() => []);
			if (Array.isArray(roles)) {
				serverRoles = roles
					.filter((r: any) => r && r.id && r.id !== guildId && !r.managed)
					.sort((a: any, b: any) => (Number(b.position) || 0) - (Number(a.position) || 0))
					.map((r: any) => ({
						id: String(r.id),
						name: String(r.name),
						color: Number(r.color) || 0,
						position: Number(r.position) || 0,
						managed: Boolean(r.managed),
					}));
			}
		}

		let serverChannels: Array<{ id: string; name: string; type: number }> = [];
		if (channelsRes && channelsRes.ok) {
			const channels = await channelsRes.json().catch(() => []);
			if (Array.isArray(channels)) {
				serverChannels = channels
					.filter((c: any) => c && c.id && (Number(c.type) === 0 || Number(c.type) === 4 || Number(c.type) === 5 || Number(c.type) === 15))
					.sort((a: any, b: any) => (Number(a.position) || 0) - (Number(b.position) || 0))
					.map((c: any) => ({
						id: String(c.id),
						name: String(c.name),
						type: Number(c.type) || 0,
					}));
			}
		}

		return {
			botPresent: true,
			applicationId,
			guildName,
			guildIconUrl,
			serverRoles,
			serverChannels,
		};
	} catch {
		return { botPresent: false, applicationId, serverRoles: [], serverChannels: [] };
	}
}

export async function fetchGuildMembersPreview(guildId: string): Promise<Array<{ id: string; username: string; displayName: string }>> {
	const token = getYourAppsBotToken();
	if (!token || !guildId) return [];
	try {
		const res = await fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/members?limit=200`, {
			headers: { Authorization: `Bot ${token}` },
			cache: 'no-store',
		});
		if (!res.ok) return [];
		const list = await res.json().catch(() => []);
		if (!Array.isArray(list)) return [];
		return list
			.filter((m: any) => m?.user?.id && !m.user.bot)
			.map((m: any) => ({
				id: String(m.user.id),
				username: String(m.user.username || m.user.id),
				displayName: String(m.nick || m.user.global_name || m.user.username || m.user.id),
			}));
	} catch {
		return [];
	}
}

export async function fetchDiscordGuildMember(
	guildId: string,
	userId: string
): Promise<{
	userId?: string;
	isMember: boolean;
	roles: string[];
	joinedAtMs: number | null;
	accountCreatedAtMs: number | null;
	isAdminOrManageGuild: boolean;
	userTag?: string;
	userAvatar?: string | null;
}> {
	const token = getYourAppsBotToken();
	const accountCreatedAtMs = snowflakeCreatedAtMs(userId);
	if (!token || !guildId || !userId) {
		return { userId, isMember: false, roles: [], joinedAtMs: null, accountCreatedAtMs, isAdminOrManageGuild: false };
	}

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

		if (!memberRes || !memberRes.ok) {
			return { userId, isMember: false, roles: [], joinedAtMs: null, accountCreatedAtMs, isAdminOrManageGuild: false };
		}

		const member = await memberRes.json().catch(() => null);
		if (!member) {
			return { userId, isMember: false, roles: [], joinedAtMs: null, accountCreatedAtMs, isAdminOrManageGuild: false };
		}

		const guild = guildRes && guildRes.ok ? await guildRes.json().catch(() => null) : null;
		const allRoles = rolesRes && rolesRes.ok ? await rolesRes.json().catch(() => []) : [];
		const memberRoles: string[] = Array.isArray(member.roles) ? member.roles.map(String) : [];

		let isAdminOrManageGuild = Boolean(guild?.owner_id && String(guild.owner_id) === String(userId));
		if (!isAdminOrManageGuild && Array.isArray(allRoles)) {
			for (const r of allRoles) {
				if (r && (r.id === guildId || memberRoles.includes(String(r.id)))) {
					const perms = BigInt(r.permissions || 0);
					if ((perms & BigInt(0x8)) === BigInt(0x8) || (perms & BigInt(0x20)) === BigInt(0x20)) {
						isAdminOrManageGuild = true;
						break;
					}
				}
			}
		}

		const joinedAtMs = member.joined_at ? new Date(member.joined_at).getTime() : null;
		const u = member.user;
		const userTag = u?.username ? String(u.username) : undefined;
		const userAvatar = u?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${u.avatar}.png?size=128` : null;

		return {
			userId,
			isMember: true,
			roles: memberRoles,
			joinedAtMs: joinedAtMs && !Number.isNaN(joinedAtMs) ? joinedAtMs : null,
			accountCreatedAtMs,
			isAdminOrManageGuild,
			userTag,
			userAvatar,
		};
	} catch {
		return { userId, isMember: false, roles: [], joinedAtMs: null, accountCreatedAtMs, isAdminOrManageGuild: false };
	}
}

function formatDurationSeconds(sec: number): string {
	const total = Math.max(1, Math.round(sec));
	const d = Math.floor(total / 86400);
	const h = Math.floor((total % 86400) / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	const parts: string[] = [];
	if (d > 0) parts.push(`${d}d`);
	if (h > 0) parts.push(`${h}h`);
	if (m > 0) parts.push(`${m}m`);
	if (s > 0 && parts.length === 0) parts.push(`${s}s`);
	return parts.join(' ');
}

export function checkWebApplicantEligibility(params: {
	member: { userId?: string; isMember: boolean; roles: string[]; joinedAtMs: number | null; accountCreatedAtMs?: number | null; isAdminOrManageGuild: boolean };
	guildConfig: any;
	position: any;
	latestSubmission?: any | null;
	activeSubmissionCount?: number;
	approvedSubmissionCount?: number;
}): { ok: true } | { ok: false; reason: string } {
	const { member, guildConfig, position, latestSubmission, activeSubmissionCount, approvedSubmissionCount } = params;

	if (!position) {
		return { ok: false, reason: 'This position no longer exists.' };
	}

	const nowMs = Date.now();
	if (position.opensAt) {
		const opensMs = new Date(position.opensAt).getTime();
		if (!Number.isNaN(opensMs) && opensMs > nowMs && position.state === 'closed') {
			return { ok: false, reason: `Applications for "${position.name}" open in ${formatDurationSeconds((opensMs - nowMs) / 1000)}.` };
		}
	}
	if (position.closesAt) {
		const closesMs = new Date(position.closesAt).getTime();
		if (!Number.isNaN(closesMs) && closesMs <= nowMs) {
			return { ok: false, reason: `The application deadline for "${position.name}" has passed.` };
		}
	}

	if (position.state !== 'open') {
		return { ok: false, reason: `Applications for "${position.name}" are currently closed.` };
	}

	const maxSubs = Number(position.maxSubmissions) || 0;
	if (maxSubs > 0 && typeof activeSubmissionCount === 'number' && activeSubmissionCount >= maxSubs) {
		return { ok: false, reason: `"${position.name}" has reached its maximum of ${maxSubs} submissions.` };
	}

	const maxApps = Number(position.maxApprovals) || 0;
	if (maxApps > 0 && typeof approvedSubmissionCount === 'number' && approvedSubmissionCount >= maxApps) {
		return { ok: false, reason: `All ${maxApps} available spots for "${position.name}" have been filled.` };
	}

	if (!member.isMember) {
		return { ok: false, reason: 'You must be a member of this Discord server to submit an application.' };
	}

	const isGuildAdmin = member.isAdminOrManageGuild || (Array.isArray(guildConfig?.adminRoles) && guildConfig.adminRoles.some((rid: string) => member.roles.includes(String(rid))));

	const blacklistRoles: string[] = Array.isArray(guildConfig?.blacklistRoles) ? guildConfig.blacklistRoles.map(String) : [];
	if (!isGuildAdmin && blacklistRoles.some((rid) => member.roles.includes(rid))) {
		return { ok: false, reason: 'You hold a blacklisted role and cannot submit applications in this server.' };
	}

	const restrictedRoles: string[] = Array.isArray(position.restrictedRoles) ? position.restrictedRoles.map(String) : [];
	if (!isGuildAdmin && restrictedRoles.some((rid) => member.roles.includes(rid))) {
		return { ok: false, reason: 'One of your server roles is restricted from applying for this position.' };
	}

	const requiredRoles: string[] = Array.isArray(position.requiredRoles) ? position.requiredRoles.map(String) : [];
	if (!isGuildAdmin && requiredRoles.length > 0 && !requiredRoles.some((rid) => member.roles.includes(rid))) {
		return { ok: false, reason: 'You do not hold a required server role to apply for this position.' };
	}

	const minAccountSec = Number(position.minimumAccountAge) || 0;
	const createdMs = member.accountCreatedAtMs ?? (member.userId ? snowflakeCreatedAtMs(member.userId) : null);
	if (!isGuildAdmin && minAccountSec > 0 && createdMs) {
		const acctSec = (nowMs - createdMs) / 1000;
		if (acctSec < minAccountSec) {
			return {
				ok: false,
				reason: `Your Discord account must be at least ${formatDurationSeconds(minAccountSec)} old (${formatDurationSeconds(minAccountSec - acctSec)} remaining).`,
			};
		}
	}

	const minJoinSec = Number(position.minimumJoinTime) || 0;
	if (!isGuildAdmin && minJoinSec > 0 && member.joinedAtMs) {
		const inServerSec = (nowMs - member.joinedAtMs) / 1000;
		if (inServerSec < minJoinSec) {
			return {
				ok: false,
				reason: `You must be in this server for at least ${formatDurationSeconds(minJoinSec)} (${formatDurationSeconds(minJoinSec - inServerSec)} remaining).`,
			};
		}
	}

	if (latestSubmission && ['pending', 'interview', 'needs_info'].includes(String(latestSubmission.status))) {
		return { ok: false, reason: `You already have an active application (#${latestSubmission.id}) for "${position.name}".` };
	}

	const cooldownSec = Number(position.cooldown) || 0;
	if (!isGuildAdmin && cooldownSec > 0 && latestSubmission?.createdAt && latestSubmission?.status !== 'withdrawn') {
		const elapsedSec = (nowMs - new Date(latestSubmission.createdAt).getTime()) / 1000;
		if (elapsedSec < cooldownSec) {
			return {
				ok: false,
				reason: `You can re-apply for "${position.name}" in ${formatDurationSeconds(cooldownSec - elapsedSec)}.`,
			};
		}
	}

	return { ok: true };
}
