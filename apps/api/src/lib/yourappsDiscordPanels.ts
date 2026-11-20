/** @format */

import crypto from 'crypto';
import { database } from '@xernerx/lib/server';

export function getYourAppsBotToken(): string | null {
	const raw = process.env.YOURAPPS_BOT_TOKEN?.trim()
		.replace(/^["']+|["']+$/g, '')
		.trim();
	return raw || null;
}

export function getPublicAppUrl(): string {
	const env = (process.env.ENVIRONMENT || process.env.NODE_ENV || '').trim().toUpperCase();
	const domain = (process.env.DOMAIN || 'xernerx.com').trim().toLowerCase();
	return env === 'DEVELOPMENT' ? `https://app.dev.${domain}` : `https://app.${domain}`;
}

export function decodeYourAppsApplicationId(): string | null {
	const token = getYourAppsBotToken();
	if (!token || !token.includes('.')) return null;
	try {
		const id = Buffer.from(token.split('.')[0], 'base64').toString('utf8').trim();
		return /^\d{17,20}$/.test(id) ? id : null;
	} catch {
		return null;
	}
}

export async function applyMemberRoleChanges(params: { guildId: string; userId: string; addRoles?: string[]; removeRoles?: string[] }): Promise<boolean> {
	const token = getYourAppsBotToken();
	if (!token || !params.guildId || !params.userId) return false;
	const headers = {
		Authorization: `Bot ${token}`,
		'Content-Type': 'application/json',
	};

	const addSet = Array.from(new Set((params.addRoles || []).map(String).filter(Boolean)));
	const removeSet = Array.from(new Set((params.removeRoles || []).map(String).filter((r) => Boolean(r) && !addSet.includes(r))));
	if (addSet.length === 0 && removeSet.length === 0) return false;

	const ops = [
		...addSet.map((roleId) =>
			fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(params.guildId)}/members/${encodeURIComponent(params.userId)}/roles/${encodeURIComponent(roleId)}`, {
				method: 'PUT',
				headers,
			}).catch(() => null)
		),
		...removeSet.map((roleId) =>
			fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(params.guildId)}/members/${encodeURIComponent(params.userId)}/roles/${encodeURIComponent(roleId)}`, {
				method: 'DELETE',
				headers,
			}).catch(() => null)
		),
	];

	const results = await Promise.all(ops);
	return results.some((r) => Boolean(r && r.ok));
}

const IS_COMPONENTS_V2_FLAG = 32768; // 1 << 15 (MessageFlags.IsComponentsV2)

const STATUS_DISPLAY: Record<string, { label: string; color: number }> = {
	pending: { label: '⏳ Pending Review', color: 0x8b7cf6 },
	interview: { label: '🟣 In Interview', color: 0xa855f7 },
	needs_info: { label: '❓ Clarification Requested', color: 0xf59e0b },
	approved: { label: '✅ Approved', color: 0x22c55e },
	denied: { label: '✖ Denied', color: 0xef4444 },
	withdrawn: { label: '🚫 Withdrawn', color: 0x64748b },
};

function chunkMarkdownBlocks(lines: string[], maxLen = 3500, maxChunks = 3): string[] {
	const chunks: string[] = [];
	let current = '';
	for (const block of lines) {
		const next = current ? `${current}\n\n${block}` : block;
		if (next.length > maxLen && current) {
			chunks.push(current);
			current = block.slice(0, maxLen);
			if (chunks.length >= maxChunks - 1) break;
		} else {
			current = next.slice(0, maxLen);
		}
	}
	if (current && chunks.length < maxChunks) chunks.push(current);
	return chunks;
}

export function buildSubmissionDiscordComponents(guildId: string, submission: any): any[] {
	const status = String(submission.status || 'pending');
	if (!['pending', 'interview', 'needs_info'].includes(status)) {
		return [];
	}

	const dashboardReviewUrl = `${getPublicAppUrl()}/dashboard?tab=applications&guild=${encodeURIComponent(guildId)}&subView=submissions&submission=${encodeURIComponent(String(submission.id))}`;
	const votes: any[] = Array.isArray(submission.votes) ? submission.votes : [];
	const upCount = votes.filter((v) => v.vote === 'up').length;
	const downCount = votes.filter((v) => v.vote === 'down').length;

	const row1 = {
		type: 1,
		components: [
			{ type: 2, style: 3, custom_id: `ya:rev:approve:${submission.id}`, label: 'Approve', emoji: { name: '✅' } },
			{ type: 2, style: 1, custom_id: `ya:rev:approve_note:${submission.id}`, label: 'Approve + Note', emoji: { name: '📝' } },
			{ type: 2, style: 4, custom_id: `ya:rev:deny:${submission.id}`, label: 'Deny', emoji: { name: '✖' } },
			{ type: 2, style: 2, custom_id: `ya:rev:vote:up:${submission.id}`, label: `${upCount}`, emoji: { name: '👍' } },
			{ type: 2, style: 2, custom_id: `ya:rev:vote:down:${submission.id}`, label: `${downCount}`, emoji: { name: '👎' } },
		],
	};

	const row2Components: any[] = [];
	if (!submission.anonymous) {
		if (!submission.interviewChannelId) {
			row2Components.push({ type: 2, style: 2, custom_id: `ya:rev:interview:${submission.id}`, label: 'Interview', emoji: { name: '💬' } });
		}
		row2Components.push({ type: 2, style: 2, custom_id: `ya:rev:ask:${submission.id}`, label: 'Ask Applicant', emoji: { name: '❓' } });
	}
	row2Components.push({ type: 2, style: 2, custom_id: `ya:rev:note:${submission.id}`, label: 'Staff Note', emoji: { name: '🗒️' } });
	row2Components.push({ type: 2, style: 5, label: 'Dashboard', url: dashboardReviewUrl });

	return [row1, { type: 1, components: row2Components }];
}

export function buildSubmissionDiscordEmbed(params: { guildId?: string; submission: any; position?: any; sourceNote?: string; pingContent?: string; includeActions?: boolean }) {
	const { guildId, submission, position, sourceNote, pingContent, includeActions = false } = params;
	const statusKey = String(submission.status || 'pending');
	const meta = STATUS_DISPLAY[statusKey] || STATUS_DISPLAY.pending;
	const isAnonymous = Boolean(submission.anonymous || position?.anonymousResponses);

	const votes: any[] = Array.isArray(submission.votes) ? submission.votes : [];
	const upCount = votes.filter((v) => v.vote === 'up').length;
	const downCount = votes.filter((v) => v.vote === 'down').length;
	const notesCount = Array.isArray(submission.internalNotes) ? submission.internalNotes.length : 0;

	const dossierParts: string[] = [];
	if (!isAnonymous && submission.applicantMeta) {
		if (submission.applicantMeta.accountCreatedAt) {
			const ts = Math.floor(new Date(submission.applicantMeta.accountCreatedAt).getTime() / 1000);
			if (ts > 0) dossierParts.push(`Account <t:${ts}:R>`);
		}
		if (submission.applicantMeta.guildJoinedAt) {
			const ts = Math.floor(new Date(submission.applicantMeta.guildJoinedAt).getTime() / 1000);
			if (ts > 0) dossierParts.push(`Joined <t:${ts}:R>`);
		}
		if (typeof submission.applicantMeta.priorSubmissionsCount === 'number' && submission.applicantMeta.priorSubmissionsCount > 0) {
			dossierParts.push(`${submission.applicantMeta.priorSubmissionsCount} prior app${submission.applicantMeta.priorSubmissionsCount === 1 ? '' : 's'}`);
		}
	}

	const titlePrefix = statusKey === 'pending' ? 'New Application' : meta.label.replace(/^[^\w]+/, '').trim();
	const headerLines = [
		pingContent ? pingContent : null,
		`### ${titlePrefix} • ${position?.name || submission.positionName || 'Position'}`,
		isAnonymous ? '**Applicant:** *Anonymous Respondent*' : `**Applicant:** <@${submission.userId}> (${submission.userTag || submission.userId})`,
		`**Submission ID:** \`${submission.id}\`${sourceNote ? ` *(${sourceNote})*` : ''} • **Status:** ${meta.label}`,
		dossierParts.length > 0 ? `**Applicant Dossier:** ${dossierParts.join(' • ')}` : null,
		votes.length > 0 || notesCount > 0 ? `**Staff Activity:** 👍 ${upCount} • 👎 ${downCount}${notesCount > 0 ? ` • 🗒️ ${notesCount} note${notesCount === 1 ? '' : 's'}` : ''}` : null,
		submission.interviewChannelId ? `**Interview Room:** <#${submission.interviewChannelId}>` : null,
		submission.reviewedBy ? `**Reviewed By:** <@${submission.reviewedBy}>${submission.reviewedByTag ? ` (${submission.reviewedByTag})` : ''}` : null,
		submission.reviewReason ? `**Note / Reason:** ${submission.reviewReason}` : null,
	]
		.filter(Boolean)
		.join('\n');

	const containerChildren: any[] = [];
	if (!isAnonymous && submission.userAvatar && String(submission.userAvatar).startsWith('http')) {
		containerChildren.push({
			type: 9,
			components: [{ type: 10, content: headerLines.slice(0, 3800) }],
			accessory: { type: 11, media: { url: String(submission.userAvatar) } },
		});
	} else {
		containerChildren.push({ type: 10, content: headerLines.slice(0, 3800) });
	}

	const answers: any[] = Array.isArray(submission.answers) ? submission.answers : [];
	if (answers.length > 0) {
		containerChildren.push({ type: 14, divider: true, spacing: 1 });
		const answerBlocks = answers.slice(0, 25).map((a, idx) => `**${idx + 1}. ${String(a.question || 'Question').slice(0, 240)}**\n${String(a.answer || '*No answer provided*').slice(0, 900)}`);
		for (const chunk of chunkMarkdownBlocks(answerBlocks, 3500, 3)) {
			containerChildren.push({ type: 10, content: chunk });
		}
	}

	const clarifications: any[] = Array.isArray(submission.clarifications) ? submission.clarifications : [];
	if (clarifications.length > 0) {
		const latestClar = clarifications[clarifications.length - 1];
		containerChildren.push({ type: 14, divider: true, spacing: 1 });
		containerChildren.push({
			type: 10,
			content: `**❓ Follow-Up Question (${clarifications.length})**\n**Q:** ${String(latestClar.prompt || '').slice(0, 450)}\n**A:** ${latestClar.response ? String(latestClar.response).slice(0, 500) : '*Awaiting applicant response...*'}`,
		});
	}

	if (includeActions && guildId) {
		const actionRows = buildSubmissionDiscordComponents(guildId, submission);
		if (actionRows.length > 0) {
			containerChildren.push({ type: 14, divider: true, spacing: 1 });
			containerChildren.push(...actionRows);
		}
	}

	return {
		type: 17,
		accent_color: meta.color,
		components: containerChildren,
	};
}

export async function publishDiscordNativePoll(params: {
	channelId: string;
	question: string;
	options: string[];
	durationHours?: number;
	allowMultiselect?: boolean;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
	const token = getYourAppsBotToken();
	if (!token) return { ok: false, error: 'YourApps bot token is not configured.' };
	const cleanOpts = (params.options || [])
		.map((o) =>
			String(o || '')
				.trim()
				.slice(0, 55)
		)
		.filter(Boolean)
		.slice(0, 10);

	if (!params.channelId || !params.question?.trim() || cleanOpts.length < 2) {
		return { ok: false, error: 'A target channel, poll question, and at least 2 options are required.' };
	}

	const duration = Math.max(1, Math.min(168, Math.round(Number(params.durationHours) || 48)));

	try {
		const res = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(params.channelId)}/messages`, {
			method: 'POST',
			headers: {
				Authorization: `Bot ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				poll: {
					question: { text: params.question.trim().slice(0, 300) },
					answers: cleanOpts.map((text) => ({
						poll_media: { text },
					})),
					duration,
					allow_multiselect: Boolean(params.allowMultiselect),
				},
			}),
		});

		if (!res.ok) {
			const errBody = await res.json().catch(() => ({}));
			return { ok: false, error: errBody?.message || `Discord returned HTTP ${res.status}` };
		}

		const msg = await res.json();
		return { ok: true, messageId: String(msg.id) };
	} catch (err: any) {
		return { ok: false, error: err?.message || 'Failed to publish native Discord poll.' };
	}
}

export async function postSubmissionToDiscordLogChannel(params: {
	guildId: string;
	guildConfig: any;
	position: any;
	submission: any;
	sourceNote?: string;
}): Promise<{ logChannelId: string | null; logMessageId: string | null; threadId: string | null; pollMessageId: string | null }> {
	const token = getYourAppsBotToken();
	const pendingRoles: string[] = Array.isArray(params.position?.pendingRoles) ? params.position.pendingRoles.map(String).filter(Boolean) : [];
	if (pendingRoles.length > 0 && params.submission?.userId && !params.submission?.anonymous) {
		await applyMemberRoleChanges({
			guildId: params.guildId,
			userId: String(params.submission.userId),
			addRoles: pendingRoles,
		}).catch(() => false);
	}

	const rawLogCh = params.position?.logChannelOverride || params.guildConfig?.logChannel;
	const logChannel = rawLogCh ? String(rawLogCh).trim() : '';
	if (!token || !logChannel || !params.submission?.id) {
		return { logChannelId: null, logMessageId: null, threadId: null, pollMessageId: null };
	}

	const headers = {
		Authorization: `Bot ${token}`,
		'Content-Type': 'application/json',
	};

	try {
		const overridePings = Array.isArray(params.position?.submissionPingsOverride) ? params.position.submissionPingsOverride.map(String).filter(Boolean) : [];
		const pingRoles: string[] = overridePings.length > 0 ? overridePings : Array.isArray(params.guildConfig?.submissionPings) ? params.guildConfig.submissionPings.map(String).filter(Boolean) : [];
		const pingContent = pingRoles.length > 0 ? pingRoles.map((r) => `<@&${r}>`).join(' ') : undefined;

		const container = buildSubmissionDiscordEmbed({
			guildId: params.guildId,
			submission: params.submission,
			position: params.position,
			sourceNote: params.sourceNote ?? 'Submitted on Web',
			pingContent,
			includeActions: true,
		});

		const res = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(logChannel)}/messages`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				flags: IS_COMPONENTS_V2_FLAG,
				components: [container],
				allowed_mentions: { roles: pingRoles },
			}),
		});

		if (!res.ok) {
			return { logChannelId: null, logMessageId: null, threadId: null, pollMessageId: null };
		}

		const msg = await res.json().catch(() => null);
		const logMessageId = msg?.id ? String(msg.id) : null;
		let threadId: string | null = null;
		let pollMessageId: string | null = null;

		const useThread =
			params.position?.threadPerSubmissionOverride !== null && params.position?.threadPerSubmissionOverride !== undefined
				? Boolean(params.position.threadPerSubmissionOverride)
				: Boolean(params.guildConfig?.threadPerSubmission);

		if (logMessageId && useThread) {
			const applicantLabel = params.submission.anonymous ? 'Anonymous' : params.submission.userTag || params.submission.userId;
			const threadRes = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(logChannel)}/messages/${encodeURIComponent(logMessageId)}/threads`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					name: `${applicantLabel} • ${params.position?.name || params.submission.positionName}`.slice(0, 95),
					auto_archive_duration: 1440,
				}),
			}).catch(() => null);
			if (threadRes && threadRes.ok) {
				const threadJson = await threadRes.json().catch(() => null);
				if (threadJson?.id) threadId = String(threadJson.id);
			}
		}

		const usePoll =
			params.position?.pollOnSubmissionOverride !== null && params.position?.pollOnSubmissionOverride !== undefined
				? Boolean(params.position.pollOnSubmissionOverride)
				: Boolean(params.guildConfig?.pollOnSubmission);

		if (usePoll && (threadId || logChannel)) {
			const targetPollChannel = threadId || logChannel;
			const applicantLabel = params.submission.anonymous ? 'this submission' : `${params.submission.userTag || params.submission.userId}`;
			const pollDuration = Math.max(1, Math.min(168, Number(params.guildConfig?.pollDurationHours) || 48));
			const pollRes = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(targetPollChannel)}/messages`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					poll: {
						question: { text: `Staff Vote • ${applicantLabel} (${params.position?.name || params.submission.positionName})`.slice(0, 300) },
						answers: [
							{ poll_media: { text: 'Approve', emoji: { name: '✅' } } },
							{ poll_media: { text: 'Interview', emoji: { name: '💬' } } },
							{ poll_media: { text: 'Deny', emoji: { name: '✖' } } },
						],
						duration: pollDuration,
						allow_multiselect: false,
					},
				}),
			}).catch(() => null);
			if (pollRes && pollRes.ok) {
				const pollJson = await pollRes.json().catch(() => null);
				if (pollJson?.id) pollMessageId = String(pollJson.id);
			}
		}

		return {
			logChannelId: logMessageId ? logChannel : null,
			logMessageId,
			threadId,
			pollMessageId,
		};
	} catch {
		return { logChannelId: null, logMessageId: null, threadId: null, pollMessageId: null };
	}
}

export async function syncSubmissionLogMessageInDiscord(params: { guildId: string; position?: any; submission: any }): Promise<void> {
	const token = getYourAppsBotToken();
	if (!token || !params.submission?.logChannelId || !params.submission?.logMessageId) return;

	const container = buildSubmissionDiscordEmbed({
		guildId: params.guildId,
		submission: params.submission,
		position: params.position,
		includeActions: true,
	});

	await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(params.submission.logChannelId)}/messages/${encodeURIComponent(params.submission.logMessageId)}`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bot ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			flags: IS_COMPONENTS_V2_FLAG,
			components: [container],
		}),
	}).catch(() => null);
}

function formatDiscordRestError(status: number, errBody: any): string {
	const code = Number(errBody?.code) || 0;
	if (code === 50001) return 'YourApps cannot view that channel (Missing Access). Check channel permission overwrites.';
	if (code === 50013) return 'YourApps lacks Send Messages or Embed Links permission in that channel.';
	if (code === 10003) return 'Selected Discord channel no longer exists.';
	if (errBody?.errors && typeof errBody.errors === 'object') {
		const flat: string[] = [];
		const walk = (obj: any, path: string) => {
			if (!obj || typeof obj !== 'object') return;
			if (Array.isArray(obj._errors)) {
				for (const e of obj._errors) {
					if (e?.message) flat.push(`${path ? `${path}: ` : ''}${e.message}`);
				}
			}
			for (const [k, v] of Object.entries(obj)) {
				if (k !== '_errors') walk(v, path ? `${path}.${k}` : k);
			}
		};
		walk(errBody.errors, '');
		if (flat.length > 0) {
			return `${errBody.message || 'Discord rejected message'}: ${flat[0]}`;
		}
	}
	return errBody?.message || `Discord returned HTTP ${status}`;
}

export function buildApplyPanelMessagePayload(params: {
	guildId?: string;
	title: string;
	description: string;
	buttonLabel: string;
	positions: Array<{ id: string; name: string; description?: string; state?: string; category?: string; opensAt?: any; closesAt?: any; questions?: any[] }>;
}) {
	const appUrl = getPublicAppUrl();
	const cleanTitle = String(params.title || '').trim() || 'Server Applications';
	const cleanDesc = String(params.description || '').trim() || 'Select a position below to fill out and submit your application directly inside Discord or on the web.';
	const cleanBtnLabel = String(params.buttonLabel || '').trim();
	const anyOpen = params.positions.some((p) => p.state !== 'closed');

	const containerChildren: any[] = [
		{
			type: 10,
			content: `### ${cleanTitle.slice(0, 240)}\n${cleanDesc.slice(0, 2000)}`,
		},
	];

	if (params.positions.length > 0) {
		containerChildren.push({ type: 14, divider: true, spacing: 1 });

		if (params.positions.length <= 8) {
			// Native Components V2 Sections: each position gets its own inline 1-click Apply / Vote button
			for (const pos of params.positions) {
				const isOpen = pos.state !== 'closed';
				const posName = String(pos.name || 'Position').trim() || 'Position';
				const posDesc = String(pos.description || '').trim();
				const qCount = Array.isArray(pos.questions) ? pos.questions.length : 0;
				const isPoll = pos.category === 'poll';

				const scheduleParts: string[] = [];
				if (!isOpen && pos.opensAt) {
					const ts = Math.floor(new Date(pos.opensAt).getTime() / 1000);
					if (ts > 0) scheduleParts.push(`Opens <t:${ts}:R>`);
				}
				if (isOpen && pos.closesAt) {
					const ts = Math.floor(new Date(pos.closesAt).getTime() / 1000);
					if (ts > 0) scheduleParts.push(`Closes <t:${ts}:R>`);
				}
				const scheduleSuffix = scheduleParts.length > 0 ? ` • ${scheduleParts.join(' • ')}` : '';
				const descLine = posDesc ? `\n${posDesc.slice(0, 160)}${posDesc.length > 160 ? '…' : ''}` : '';

				const customSingleBtn = params.positions.length === 1 && cleanBtnLabel && !cleanBtnLabel.toLowerCase().startsWith('select a position') ? cleanBtnLabel.slice(0, 80) : null;
				const btnLabel = !isOpen ? 'Closed' : customSingleBtn || (isPoll ? 'Vote' : 'Apply');

				containerChildren.push({
					type: 9,
					components: [
						{
							type: 10,
							content: `${isOpen ? '🟢' : '🔒'} **${posName.slice(0, 100)}** • \`${qCount} question${qCount === 1 ? '' : 's'}\`${scheduleSuffix}${descLine}`,
						},
					],
					accessory: {
						type: 2,
						style: isOpen ? 1 : 2,
						custom_id: `ya:apply:start:${pos.id}`,
						label: btnLabel,
						disabled: !isOpen,
					},
				});
			}
		} else {
			// 9–25 positions: consolidated TextDisplay summary + StringSelectMenu (stays well below 40-component V2 cap)
			const listLines = params.positions.slice(0, 25).map((pos) => {
				const isOpen = pos.state !== 'closed';
				const posName = String(pos.name || 'Position').trim() || 'Position';
				const qCount = Array.isArray(pos.questions) ? pos.questions.length : 0;
				return `${isOpen ? '🟢' : '🔒'} **${posName.slice(0, 80)}** • \`${qCount} question${qCount === 1 ? '' : 's'}\``;
			});
			containerChildren.push({
				type: 10,
				content: listLines.join('\n').slice(0, 3800),
			});
			containerChildren.push({ type: 14, divider: true, spacing: 1 });
			containerChildren.push({
				type: 1,
				components: [
					{
						type: 3,
						custom_id: 'ya:apply:select',
						placeholder: (anyOpen ? cleanBtnLabel || 'Select a position to apply for...' : 'All positions are currently closed').slice(0, 100),
						min_values: 1,
						max_values: 1,
						disabled: !anyOpen,
						options: params.positions.slice(0, 25).map((pos) => {
							const optLabel =
								String(pos.name || 'Position')
									.replace(/\s+/g, ' ')
									.trim() || 'Position';
							const cleanPosDesc = String(pos.description || '')
								.replace(/\s+/g, ' ')
								.trim();
							const optDesc = `${pos.state === 'closed' ? '[Closed] ' : ''}${cleanPosDesc || `${Array.isArray(pos.questions) ? pos.questions.length : 0} questions`}`;
							return {
								label: optLabel.slice(0, 100),
								value: String(pos.id),
								description: optDesc.slice(0, 100),
							};
						}),
					},
				],
			});
		}

		if (params.guildId) {
			const singlePos = params.positions.length === 1 ? params.positions[0] : null;
			const webUrl = singlePos
				? `${appUrl}/servers/${encodeURIComponent(params.guildId)}/applications/${encodeURIComponent(String(singlePos.id))}`
				: `${appUrl}/servers/${encodeURIComponent(params.guildId)}/applications`;

			containerChildren.push({ type: 14, divider: true, spacing: 1 });
			containerChildren.push({
				type: 1,
				components: [
					{
						type: 2,
						style: 5,
						label: singlePos?.category === 'poll' ? 'Vote on Web' : 'Apply on Web',
						url: webUrl,
						disabled: !anyOpen,
					},
				],
			});
		}
	}

	return {
		flags: IS_COMPONENTS_V2_FLAG,
		components: [
			{
				type: 17,
				accent_color: anyOpen ? 0x8b7cf6 : 0x64748b,
				components: containerChildren,
			},
		],
	};
}

export async function publishDiscordApplyPanel(params: {
	guildId?: string;
	channelId: string;
	title: string;
	description: string;
	buttonLabel: string;
	positions: Array<{ id: string; name: string; description?: string; state?: string; category?: string; opensAt?: any; closesAt?: any; questions?: any[] }>;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
	const token = getYourAppsBotToken();
	if (!token) return { ok: false, error: 'YourApps bot token is not configured.' };
	if (!params.channelId || params.positions.length === 0) {
		return { ok: false, error: 'Select a target channel and at least one position.' };
	}

	const payload = buildApplyPanelMessagePayload(params);

	try {
		const res = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(params.channelId)}/messages`, {
			method: 'POST',
			headers: {
				Authorization: `Bot ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const errBody = await res.json().catch(() => ({}));
			return { ok: false, error: formatDiscordRestError(res.status, errBody) };
		}

		const msg = await res.json();
		return { ok: true, messageId: String(msg.id) };
	} catch (err: any) {
		return { ok: false, error: err?.message || 'Failed to publish panel to Discord' };
	}
}

export async function editDiscordApplyPanelMessage(params: {
	guildId?: string;
	channelId: string;
	messageId: string;
	title: string;
	description: string;
	buttonLabel: string;
	positions: Array<{ id: string; name: string; description?: string; state?: string; category?: string; opensAt?: any; closesAt?: any; questions?: any[] }>;
}): Promise<{ ok: boolean; notFound?: boolean; replacedMessageId?: string; error?: string }> {
	const token = getYourAppsBotToken();
	if (!token) return { ok: false, error: 'YourApps bot token is not configured.' };
	const payload = buildApplyPanelMessagePayload(params);

	try {
		const res = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(params.channelId)}/messages/${encodeURIComponent(params.messageId)}`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bot ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		if (res.status === 404) {
			return { ok: false, notFound: true, error: 'Panel message no longer exists in Discord.' };
		}
		if (!res.ok) {
			// Legacy V1 embed messages cannot add IS_COMPONENTS_V2 via PATCH — replace cleanly with a fresh V2 panel
			const rePublished = await publishDiscordApplyPanel(params);
			if (rePublished.ok && rePublished.messageId) {
				await deleteDiscordMessage(params.channelId, params.messageId);
				return { ok: true, replacedMessageId: rePublished.messageId };
			}
			const errBody = await res.json().catch(() => ({}));
			return { ok: false, error: formatDiscordRestError(res.status, errBody) };
		}

		return { ok: true };
	} catch (err: any) {
		return { ok: false, error: err?.message || 'Failed to edit Discord panel message.' };
	}
}

export async function deleteDiscordMessage(channelId: string, messageId: string): Promise<boolean> {
	const token = getYourAppsBotToken();
	if (!token || !channelId || !messageId) return false;
	try {
		const res = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, {
			method: 'DELETE',
			headers: { Authorization: `Bot ${token}` },
		});
		return res.ok || res.status === 404;
	} catch {
		return false;
	}
}

const inFlightGuildPanelSync = new Map<string, Promise<{ ok: boolean; error?: string }>>();

export async function syncGuildApplyPanels(guildId: string): Promise<{ ok: boolean; error?: string }> {
	if (!guildId) return { ok: true };
	const existingSync = inFlightGuildPanelSync.get(guildId);
	if (existingSync) return existingSync;

	const runPromise = (async (): Promise<{ ok: boolean; error?: string }> => {
		try {
			const db = await database('yourapps');
			const ProfileModel = (db.models.guilds as any)?.Profile;
			const FormModel = (db.models.guilds as any)?.Form;
			if (!ProfileModel || !FormModel) return { ok: true };

			const [profile, allPositions] = await Promise.all([ProfileModel.findOne({ id: guildId }).lean(), FormModel.find({ guild: guildId }).sort({ createdAt: 1 }).lean()]);
			if (!profile) return { ok: true };

			const primaryChannelId = (profile as any).panelChannel ? String((profile as any).panelChannel).trim() : '';
			const currentPanels: any[] = Array.isArray((profile as any).panels) ? (profile as any).panels : [];

			if (currentPanels.length === 0 && !primaryChannelId) {
				return { ok: true };
			}

			const posMap = new Map<string, any>();
			for (const p of allPositions || []) {
				posMap.set(String((p as any).id), p);
			}

			const survivingPanels: any[] = [];
			let mutated = false;
			let lastError: string | undefined;

			for (const panel of currentPanels) {
				if (!panel?.channelId || !panel?.messageId) continue;
				if (panel.autoSync === false) {
					survivingPanels.push(panel);
					continue;
				}

				const targetIds: string[] = Array.isArray(panel.positionIds) ? panel.positionIds.map(String) : [];
				const matchedPositions = targetIds.length > 0 ? targetIds.map((pid) => posMap.get(pid)).filter(Boolean) : allPositions || [];

				if (matchedPositions.length === 0) {
					await deleteDiscordMessage(String(panel.channelId), String(panel.messageId));
					mutated = true;
					continue;
				}

				const res = await editDiscordApplyPanelMessage({
					guildId,
					channelId: String(panel.channelId),
					messageId: String(panel.messageId),
					title: String(panel.title || 'Server Applications'),
					description: String(panel.description || ''),
					buttonLabel: String(panel.buttonLabel || 'Apply Now'),
					positions: matchedPositions,
				});

				if (res.notFound) {
					// If this was the primary configured panel channel, self-heal by re-posting it
					if (primaryChannelId && String(panel.channelId) === primaryChannelId) {
						const rePosted = await publishDiscordApplyPanel({
							guildId,
							channelId: primaryChannelId,
							title: String(panel.title || 'Server Applications'),
							description: String(panel.description || ''),
							buttonLabel: String(panel.buttonLabel || 'Apply Now'),
							positions: matchedPositions,
						});
						if (rePosted.ok && rePosted.messageId) {
							survivingPanels.push({
								...panel,
								messageId: rePosted.messageId,
								updatedAt: new Date(),
							});
							mutated = true;
							continue;
						}
						if (rePosted.error) lastError = rePosted.error;
					}
					mutated = true;
					continue;
				}

				if (!res.ok && res.error) {
					lastError = res.error;
				}

				survivingPanels.push({
					...panel,
					...(res.replacedMessageId ? { messageId: res.replacedMessageId } : {}),
					updatedAt: new Date(),
				});
				mutated = true;
			}

			// Auto-publish a live Apply Panel into `panelChannel` when configured in Settings & Channels and no panel exists in that channel yet
			if (primaryChannelId && Array.isArray(allPositions) && allPositions.length > 0) {
				const hasPanelInPrimary = survivingPanels.some((p) => String(p.channelId) === primaryChannelId);
				if (!hasPanelInPrimary) {
					const defaultTitle = 'Server Applications';
					const defaultDesc = 'Select a position below to fill out and submit your application directly inside Discord or on the web.';
					const defaultBtn = allPositions.length === 1 ? `Apply for ${(allPositions[0] as any).name}` : 'Select a position to apply...';

					const published = await publishDiscordApplyPanel({
						guildId,
						channelId: primaryChannelId,
						title: defaultTitle,
						description: defaultDesc,
						buttonLabel: defaultBtn,
						positions: allPositions as any[],
					});

					if (published.ok && published.messageId) {
						survivingPanels.push({
							id: `pnl_${crypto.randomBytes(4).toString('hex')}`,
							channelId: primaryChannelId,
							messageId: published.messageId,
							title: defaultTitle,
							description: defaultDesc,
							buttonLabel: defaultBtn,
							positionIds: [],
							autoSync: true,
							createdAt: new Date(),
							updatedAt: new Date(),
						});
						mutated = true;
					} else if (published.error) {
						lastError = published.error;
					}
				}
			}

			if (mutated) {
				await ProfileModel.updateOne({ id: guildId }, { $set: { panels: survivingPanels.slice(-20) } }).catch(() => null);
			}

			return lastError ? { ok: false, error: lastError } : { ok: true };
		} catch (err: any) {
			return { ok: false, error: err?.message || 'Failed to sync Discord panels.' };
		} finally {
			inFlightGuildPanelSync.delete(guildId);
		}
	})();

	inFlightGuildPanelSync.set(guildId, runPromise);
	return runPromise;
}

export async function openSubmissionInterviewInDiscord(params: {
	guildId: string;
	guildConfig: any;
	position: any;
	submission: any;
	openedById: string;
}): Promise<{ ok: boolean; channelId?: string; mode?: 'thread' | 'channel'; error?: string }> {
	const token = getYourAppsBotToken();
	if (!token) return { ok: false, error: 'YourApps bot token is not configured.' };
	if (params.submission?.anonymous) {
		return { ok: false, error: 'Interviews cannot be opened on anonymous submissions.' };
	}
	if (params.submission?.interviewChannelId) {
		return { ok: true, channelId: String(params.submission.interviewChannelId), mode: (params.submission.interviewMode as any) || 'thread' };
	}

	const headers = {
		Authorization: `Bot ${token}`,
		'Content-Type': 'application/json',
	};

	const mode: 'thread' | 'channel' = params.guildConfig?.interviewMode === 'channel' ? 'channel' : 'thread';
	const roomName = `interview-${String(params.submission.userTag || params.submission.userId)
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, '-')
		.slice(0, 32)}-${String(params.submission.id).slice(-4)}`;

	const reviewerRoles: string[] = Array.from(
		new Set([
			...(Array.isArray(params.guildConfig?.adminRoles) ? params.guildConfig.adminRoles.map(String) : []),
			...(Array.isArray(params.position?.reviewRolesOverride) && params.position.reviewRolesOverride.length > 0
				? params.position.reviewRolesOverride.map(String)
				: Array.isArray(params.guildConfig?.reviewRoles)
					? params.guildConfig.reviewRoles.map(String)
					: []),
		])
	).filter(Boolean);

	let createdChannelId: string | null = null;
	let actualMode: 'thread' | 'channel' = mode;

	if (mode === 'channel') {
		const VIEW_SEND_HISTORY = String(0x400 + 0x800 + 0x10000); // ViewChannel | SendMessages | ReadMessageHistory
		const overwrites: any[] = [
			{ id: params.guildId, type: 0, allow: '0', deny: String(0x400) },
			{ id: String(params.submission.userId), type: 1, allow: VIEW_SEND_HISTORY, deny: '0' },
			...reviewerRoles.slice(0, 20).map((rid) => ({ id: rid, type: 0, allow: VIEW_SEND_HISTORY, deny: '0' })),
		];
		const appId = decodeYourAppsApplicationId();
		if (appId) {
			overwrites.push({ id: appId, type: 1, allow: String(0x400 + 0x800 + 0x10000 + 0x10), deny: '0' });
		}

		const createRes = await fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(params.guildId)}/channels`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				name: roomName,
				type: 0,
				...(params.guildConfig?.interviewCategoryId ? { parent_id: String(params.guildConfig.interviewCategoryId) } : {}),
				permission_overwrites: overwrites,
				topic: `YourApps Interview • ${params.position?.name || params.submission.positionName} • #${params.submission.id}`,
			}),
		}).catch(() => null);

		if (createRes && createRes.ok) {
			const json = await createRes.json().catch(() => null);
			if (json?.id) {
				createdChannelId = String(json.id);
				actualMode = 'channel';
			}
		}
	}

	if (!createdChannelId) {
		const parentTextChannel = String(params.submission.logChannelId || params.position?.logChannelOverride || params.guildConfig?.logChannel || params.guildConfig?.panelChannel || '').trim();
		if (!parentTextChannel) {
			return { ok: false, error: 'Configure a Log Channel or Interview Category first so YourApps knows where to create the interview room.' };
		}

		// Try Private Thread (type 12) first, fall back to Public Thread (type 11)
		let threadRes = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(parentTextChannel)}/threads`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				name: `💬 ${params.submission.userTag || params.submission.userId} • ${params.position?.name || params.submission.positionName}`.slice(0, 95),
				type: 12,
				invitable: false,
				auto_archive_duration: 1440,
			}),
		}).catch(() => null);

		if (!threadRes || !threadRes.ok) {
			threadRes = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(parentTextChannel)}/threads`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					name: `💬 ${params.submission.userTag || params.submission.userId} • ${params.position?.name || params.submission.positionName}`.slice(0, 95),
					type: 11,
					auto_archive_duration: 1440,
				}),
			}).catch(() => null);
		}

		if (!threadRes || !threadRes.ok) {
			return { ok: false, error: 'Could not create an interview thread. Check bot Manage Threads / Create Private Threads permissions.' };
		}

		const threadJson = await threadRes.json().catch(() => null);
		if (!threadJson?.id) {
			return { ok: false, error: 'Discord did not return an interview thread ID.' };
		}
		createdChannelId = String(threadJson.id);
		actualMode = 'thread';

		// Invite applicant + opening reviewer into the private thread
		await Promise.all([
			fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(createdChannelId)}/thread-members/${encodeURIComponent(String(params.submission.userId))}`, {
				method: 'PUT',
				headers,
			}).catch(() => null),
			params.openedById && /^\d{16,21}$/.test(params.openedById)
				? fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(createdChannelId)}/thread-members/${encodeURIComponent(params.openedById)}`, {
						method: 'PUT',
						headers,
					}).catch(() => null)
				: Promise.resolve(null),
		]);
	}

	const roleMentions = reviewerRoles
		.slice(0, 5)
		.map((r) => `<@&${r}>`)
		.join(' ');
	const welcomeContent = `<@${params.submission.userId}> ${roleMentions}`.trim();
	const dashboardUrl = `${getPublicAppUrl()}/dashboard?tab=applications&guild=${encodeURIComponent(params.guildId)}&subView=submissions&submission=${encodeURIComponent(String(params.submission.id))}`;

	await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(createdChannelId)}/messages`, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			flags: IS_COMPONENTS_V2_FLAG,
			components: [
				{
					type: 17,
					accent_color: 0xa855f7,
					components: [
						{
							type: 10,
							content: [
								welcomeContent,
								`### 💬 Application Interview • ${params.position?.name || params.submission.positionName}`,
								`Welcome <@${params.submission.userId}>! Our review team opened this private interview space regarding your application (\`#${params.submission.id}\`).`,
								params.openedById && /^\d{16,21}$/.test(params.openedById) ? `**Opened By:** <@${params.openedById}>` : null,
								'Reviewers can finalize the application or close this room anytime using the controls below.',
							]
								.filter(Boolean)
								.join('\n'),
						},
						{ type: 14, divider: true, spacing: 1 },
						{
							type: 1,
							components: [
								{ type: 2, style: 3, custom_id: `ya:rev:approve:${params.submission.id}`, label: 'Approve', emoji: { name: '✅' } },
								{ type: 2, style: 4, custom_id: `ya:rev:deny:${params.submission.id}`, label: 'Deny', emoji: { name: '✖' } },
								{ type: 2, style: 2, custom_id: `ya:rev:closeint:${params.submission.id}`, label: 'Close Interview', emoji: { name: '🔒' } },
								{ type: 2, style: 5, label: 'Dashboard', url: dashboardUrl },
							],
						},
					],
				},
			],
			allowed_mentions: {
				users: [String(params.submission.userId)],
				roles: reviewerRoles.slice(0, 5),
			},
		}),
	}).catch(() => null);

	return { ok: true, channelId: createdChannelId, mode: actualMode };
}

export async function closeSubmissionInterviewInDiscord(params: { channelId: string; mode?: string | null; closedById?: string }): Promise<void> {
	const token = getYourAppsBotToken();
	if (!token || !params.channelId) return;
	const headers = {
		Authorization: `Bot ${token}`,
		'Content-Type': 'application/json',
	};

	await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(params.channelId)}/messages`, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			flags: IS_COMPONENTS_V2_FLAG,
			components: [
				{
					type: 17,
					accent_color: 0x64748b,
					components: [
						{
							type: 10,
							content: `### 🔒 Interview Closed\n${params.closedById && /^\d{16,21}$/.test(params.closedById) ? `This interview room was closed by <@${params.closedById}>.` : 'This interview room has been closed.'}`,
						},
					],
				},
			],
		}),
	}).catch(() => null);

	if (params.mode === 'channel') {
		await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(params.channelId)}`, {
			method: 'DELETE',
			headers,
		}).catch(() => null);
	} else {
		await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(params.channelId)}`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({ archived: true, locked: true }),
		}).catch(() => null);
	}
}

export async function notifyClarificationRequestedInDiscord(params: { guildId: string; guildName?: string; guildConfig: any; submission: any; prompt: string }): Promise<void> {
	const token = getYourAppsBotToken();
	if (!token || params.submission?.anonymous) return;
	const headers = {
		Authorization: `Bot ${token}`,
		'Content-Type': 'application/json',
	};

	if (params.guildConfig?.dmNotifications !== false) {
		try {
			const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
				method: 'POST',
				headers,
				body: JSON.stringify({ recipient_id: String(params.submission.userId) }),
			});
			if (dmRes.ok) {
				const dmChannel = await dmRes.json();
				if (dmChannel?.id) {
					const webPortalUrl = `${getPublicAppUrl()}/servers/${encodeURIComponent(params.guildId)}/applications`;
					await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(dmChannel.id)}/messages`, {
						method: 'POST',
						headers,
						body: JSON.stringify({
							flags: IS_COMPONENTS_V2_FLAG,
							components: [
								{
									type: 17,
									accent_color: 0xf59e0b,
									components: [
										{
											type: 10,
											content: [
												`### ❓ Follow-Up Question • ${params.submission.positionName || 'Application'}`,
												`A reviewer${params.guildName ? ` in **${params.guildName}**` : ''} requested a quick clarification on your application (\`#${params.submission.id}\`):`,
												`> ${params.prompt.slice(0, 900)}`,
												`Reply directly on the web below or run \`/submissions\` inside the server.`,
											].join('\n\n'),
										},
										{ type: 14, divider: true, spacing: 1 },
										{
											type: 1,
											components: [{ type: 2, style: 5, label: 'Answer on Web', url: webPortalUrl }],
										},
									],
								},
							],
						}),
					}).catch(() => null);
				}
			}
		} catch {
			// Ignore closed user DMs
		}
	}

	await syncSubmissionLogMessageInDiscord({
		guildId: params.guildId,
		submission: params.submission,
	});
}

export async function notifyClarificationRespondedInDiscord(params: { guildId: string; submission: any; response: string }): Promise<void> {
	const token = getYourAppsBotToken();
	if (!token) return;
	const headers = {
		Authorization: `Bot ${token}`,
		'Content-Type': 'application/json',
	};

	if (params.submission?.threadId) {
		await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(String(params.submission.threadId))}/messages`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				flags: IS_COMPONENTS_V2_FLAG,
				components: [
					{
						type: 17,
						accent_color: 0x8b7cf6,
						components: [
							{
								type: 10,
								content: `### 📝 Applicant Answered Clarification\n<@${params.submission.userId}> responded to the follow-up question:\n\n> ${params.response.slice(0, 1500)}`,
							},
						],
					},
				],
			}),
		}).catch(() => null);
	}

	await syncSubmissionLogMessageInDiscord({
		guildId: params.guildId,
		submission: params.submission,
	});
}

export async function applySubmissionDecisionInDiscord(params: {
	guildId: string;
	guildName?: string;
	guildConfig: any;
	position: any;
	submission: any;
	decision: 'approved' | 'denied';
	reviewerId: string;
	reviewerTag?: string;
	reason?: string | null;
}): Promise<{ rolesApplied: boolean; archiveMessageId: string | null }> {
	const token = getYourAppsBotToken();
	if (!token) return { rolesApplied: false, archiveMessageId: null };

	const headers = {
		Authorization: `Bot ${token}`,
		'Content-Type': 'application/json',
	};

	let rolesApplied = false;
	const pendingRoles: string[] = Array.isArray(params.position?.pendingRoles) ? params.position.pendingRoles.map(String).filter(Boolean) : [];

	if (params.position && !params.submission?.anonymous) {
		if (params.decision === 'approved') {
			const rewardRoles: string[] = Array.isArray(params.position.rewardRoles) ? params.position.rewardRoles.map(String).filter(Boolean) : [];
			const removeRoles: string[] = [...(Array.isArray(params.position.removeRoles) ? params.position.removeRoles.map(String).filter(Boolean) : []), ...pendingRoles];
			rolesApplied = await applyMemberRoleChanges({
				guildId: params.guildId,
				userId: String(params.submission.userId),
				addRoles: rewardRoles,
				removeRoles,
			});
		} else {
			const denyAddRoles: string[] = Array.isArray(params.position.denyAddRoles) ? params.position.denyAddRoles.map(String).filter(Boolean) : [];
			const denyRemoveRoles: string[] = [...(Array.isArray(params.position.denyRemoveRoles) ? params.position.denyRemoveRoles.map(String).filter(Boolean) : []), ...pendingRoles];
			rolesApplied = await applyMemberRoleChanges({
				guildId: params.guildId,
				userId: String(params.submission.userId),
				addRoles: denyAddRoles,
				removeRoles: denyRemoveRoles,
			});
		}
	}

	const color = params.decision === 'approved' ? 0x22c55e : 0xef4444;
	const statusLabel = params.decision === 'approved' ? 'Approved' : 'Denied';
	const updatedSubmission = {
		...params.submission,
		status: params.decision,
		reviewedBy: params.reviewerId,
		reviewedByTag: params.reviewerTag || null,
		reviewReason: params.reason || null,
		reviewedAt: new Date().toISOString(),
	};

	const summaryContainer = buildSubmissionDiscordEmbed({
		guildId: params.guildId,
		submission: updatedSubmission,
		position: params.position,
		includeActions: false,
	});

	if (params.submission.logChannelId && params.submission.logMessageId) {
		await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(params.submission.logChannelId)}/messages/${encodeURIComponent(params.submission.logMessageId)}`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({
				flags: IS_COMPONENTS_V2_FLAG,
				components: [summaryContainer],
			}),
		}).catch(() => null);
	}

	if (params.submission.interviewChannelId) {
		await closeSubmissionInterviewInDiscord({
			channelId: String(params.submission.interviewChannelId),
			mode: params.submission.interviewMode,
			closedById: params.reviewerId,
		}).catch(() => null);
	}

	let archiveMessageId: string | null = null;
	const rawArchive = params.position?.archiveChannelOverride || params.guildConfig?.archiveChannel;
	const archiveChannel = rawArchive ? String(rawArchive).trim() : '';
	if (archiveChannel) {
		const archRes = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(archiveChannel)}/messages`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				flags: IS_COMPONENTS_V2_FLAG,
				components: [summaryContainer],
			}),
		}).catch(() => null);
		if (archRes && archRes.ok) {
			const archJson = await archRes.json().catch(() => null);
			if (archJson?.id) archiveMessageId = String(archJson.id);
		}
	}

	if (params.guildConfig?.dmNotifications !== false && !params.submission?.anonymous) {
		try {
			const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
				method: 'POST',
				headers,
				body: JSON.stringify({ recipient_id: String(params.submission.userId) }),
			});
			if (dmRes.ok) {
				const dmChannel = await dmRes.json();
				if (dmChannel?.id) {
					const customMessage = params.decision === 'approved' ? params.position?.acceptMessage : params.position?.denyMessage;
					await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(dmChannel.id)}/messages`, {
						method: 'POST',
						headers,
						body: JSON.stringify({
							flags: IS_COMPONENTS_V2_FLAG,
							components: [
								{
									type: 17,
									accent_color: color,
									components: [
										{
											type: 10,
											content: [
												`### ${params.decision === 'approved' ? '✅' : '✖'} Application ${statusLabel} • ${params.submission.positionName || params.position?.name || 'Position'}`,
												`Your application${params.guildName ? ` in **${params.guildName}**` : ''} has been **${statusLabel.toLowerCase()}**.`,
												customMessage ? customMessage : null,
												params.reason ? `**Reviewer Note:** ${params.reason}` : null,
											]
												.filter(Boolean)
												.join('\n\n'),
										},
									],
								},
							],
						}),
					}).catch(() => null);
				}
			}
		} catch {
			// Ignore closed user DMs
		}
	}

	return { rolesApplied, archiveMessageId };
}
