/** @format */

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

export async function postSubmissionToDiscordLogChannel(params: {
	guildId: string;
	guildConfig: any;
	position: any;
	submission: any;
}): Promise<{ logChannelId: string | null; logMessageId: string | null; threadId: string | null }> {
	const token = getYourAppsBotToken();
	const logChannel = params.guildConfig?.logChannel ? String(params.guildConfig.logChannel).trim() : '';
	if (!token || !logChannel || !params.submission?.id) {
		return { logChannelId: null, logMessageId: null, threadId: null };
	}

	const headers = {
		Authorization: `Bot ${token}`,
		'Content-Type': 'application/json',
	};

	try {
		const pingRoles: string[] = Array.isArray(params.guildConfig?.submissionPings) ? params.guildConfig.submissionPings.map(String).filter(Boolean) : [];
		const pingContent = pingRoles.length > 0 ? pingRoles.map((r) => `<@&${r}>`).join(' ') : undefined;
		const answers: any[] = Array.isArray(params.submission.answers) ? params.submission.answers : [];
		const dashboardReviewUrl = `${getPublicAppUrl()}/dashboard?tab=applications&guild=${encodeURIComponent(params.guildId)}&subView=submissions&submission=${encodeURIComponent(String(params.submission.id))}`;

		const embed = {
			title: `New Application • ${params.position?.name || params.submission.positionName || 'Position'}`,
			author: {
				name: `${params.submission.userTag || params.submission.userId} (${params.submission.userId})`,
				...(params.submission.userAvatar ? { icon_url: params.submission.userAvatar } : {}),
			},
			description: `**Applicant:** <@${params.submission.userId}>\n**Position:** ${params.position?.name || params.submission.positionName}\n**Submission ID:** \`${params.submission.id}\` *(Submitted on Web)*`,
			color: 0x8b7cf6,
			fields: answers.slice(0, 20).map((a, idx) => ({
				name: `${idx + 1}. ${String(a.question || 'Question').slice(0, 240)}`,
				value: String(a.answer || '*No answer provided*').slice(0, 1024),
				inline: false,
			})),
			timestamp: new Date().toISOString(),
		};

		const components = [
			{
				type: 1,
				components: [
					{ type: 2, style: 3, custom_id: `ya:rev:approve:${params.submission.id}`, label: 'Approve', emoji: { name: '✅' } },
					{ type: 2, style: 1, custom_id: `ya:rev:approve_note:${params.submission.id}`, label: 'Approve with Note', emoji: { name: '📝' } },
					{ type: 2, style: 4, custom_id: `ya:rev:deny:${params.submission.id}`, label: 'Deny', emoji: { name: '✖' } },
					{ type: 2, style: 5, label: 'Review in Dashboard', url: dashboardReviewUrl },
				],
			},
		];

		const res = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(logChannel)}/messages`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				...(pingContent ? { content: pingContent } : {}),
				embeds: [embed],
				components,
				allowed_mentions: { roles: pingRoles },
			}),
		});

		if (!res.ok) {
			return { logChannelId: null, logMessageId: null, threadId: null };
		}

		const msg = await res.json().catch(() => null);
		const logMessageId = msg?.id ? String(msg.id) : null;
		let threadId: string | null = null;

		if (logMessageId && params.guildConfig?.threadPerSubmission) {
			const threadRes = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(logChannel)}/messages/${encodeURIComponent(logMessageId)}/threads`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					name: `${params.submission.userTag || params.submission.userId} • ${params.position?.name || params.submission.positionName}`.slice(0, 95),
					auto_archive_duration: 1440,
				}),
			}).catch(() => null);
			if (threadRes && threadRes.ok) {
				const threadJson = await threadRes.json().catch(() => null);
				if (threadJson?.id) threadId = String(threadJson.id);
			}
		}

		return {
			logChannelId: logMessageId ? logChannel : null,
			logMessageId,
			threadId,
		};
	} catch {
		return { logChannelId: null, logMessageId: null, threadId: null };
	}
}

export async function publishDiscordApplyPanel(params: {
	guildId?: string;
	channelId: string;
	title: string;
	description: string;
	buttonLabel: string;
	positions: Array<{ id: string; name: string; description?: string; state?: string; questions?: any[] }>;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
	const token = getYourAppsBotToken();
	if (!token) return { ok: false, error: 'YourApps bot token is not configured.' };
	if (!params.channelId || params.positions.length === 0) {
		return { ok: false, error: 'Select a target channel and at least one position.' };
	}

	const appUrl = getPublicAppUrl();
	const embedFields = params.positions.slice(0, 15).map((pos) => ({
		name: `${pos.state === 'closed' ? '🔒' : '🟢'} ${pos.name}`,
		value: `${pos.description ? `${pos.description.slice(0, 200)}\n` : ''}Questions: **${Array.isArray(pos.questions) ? pos.questions.length : 0}** • Status: **${pos.state === 'closed' ? 'Closed' : 'Open'}**`,
		inline: false,
	}));

	const singlePos = params.positions[0];
	const singleButtons: any[] = [
		{
			type: 2,
			style: 1,
			custom_id: `ya:apply:start:${singlePos.id}`,
			label: (params.buttonLabel || 'Apply in Discord').slice(0, 80),
			disabled: singlePos.state === 'closed',
		},
	];
	if (params.guildId) {
		singleButtons.push({
			type: 2,
			style: 5,
			label: 'Apply on Web',
			url: `${appUrl}/servers/${encodeURIComponent(params.guildId)}/applications/${encodeURIComponent(singlePos.id)}`,
			disabled: singlePos.state === 'closed',
		});
	}

	const components =
		params.positions.length === 1
			? [
					{
						type: 1,
						components: singleButtons,
					},
				]
			: [
					{
						type: 1,
						components: [
							{
								type: 3,
								custom_id: 'ya:apply:select',
								placeholder: (params.buttonLabel || 'Select a position to apply for...').slice(0, 100),
								min_values: 1,
								max_values: 1,
								options: params.positions.slice(0, 25).map((pos) => ({
									label: pos.name.slice(0, 100),
									value: pos.id,
									description: `${pos.state === 'closed' ? '[Closed] ' : ''}${pos.description || `${Array.isArray(pos.questions) ? pos.questions.length : 0} questions`}`.slice(
										0,
										100
									),
								})),
							},
						],
					},
					...(params.guildId
						? [
								{
									type: 1,
									components: [
										{
											type: 2,
											style: 5,
											label: 'Apply on Web',
											url: `${appUrl}/servers/${encodeURIComponent(params.guildId)}/applications`,
										},
									],
								},
							]
						: []),
				];

	try {
		const res = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(params.channelId)}/messages`, {
			method: 'POST',
			headers: {
				Authorization: `Bot ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				embeds: [
					{
						title: (params.title || 'Server Applications').slice(0, 256),
						description: (params.description || 'Select a position below to fill out and submit your application directly inside Discord or on the web.').slice(0, 4000),
						color: 0x8b7cf6,
						fields: embedFields,
						timestamp: new Date().toISOString(),
					},
				],
				components,
			}),
		});

		if (!res.ok) {
			const errBody = await res.json().catch(() => ({}));
			return { ok: false, error: errBody?.message || `Discord returned HTTP ${res.status}` };
		}

		const msg = await res.json();
		return { ok: true, messageId: String(msg.id) };
	} catch (err: any) {
		return { ok: false, error: err?.message || 'Failed to publish panel to Discord' };
	}
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

	if (params.decision === 'approved' && params.position) {
		const rewardRoles: string[] = Array.isArray(params.position.rewardRoles) ? params.position.rewardRoles.map(String).filter(Boolean) : [];
		const removeRoles: string[] = Array.isArray(params.position.removeRoles) ? params.position.removeRoles.map(String).filter(Boolean) : [];

		if (rewardRoles.length > 0 || removeRoles.length > 0) {
			const ops = [
				...rewardRoles.map((roleId) =>
					fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(params.guildId)}/members/${encodeURIComponent(params.submission.userId)}/roles/${encodeURIComponent(roleId)}`, {
						method: 'PUT',
						headers,
					}).catch(() => null)
				),
				...removeRoles.map((roleId) =>
					fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(params.guildId)}/members/${encodeURIComponent(params.submission.userId)}/roles/${encodeURIComponent(roleId)}`, {
						method: 'DELETE',
						headers,
					}).catch(() => null)
				),
			];
			const results = await Promise.all(ops);
			rolesApplied = results.some((r) => Boolean(r && r.ok));
		}
	}

	const color = params.decision === 'approved' ? 0x22c55e : 0xef4444;
	const statusLabel = params.decision === 'approved' ? 'Approved' : 'Denied';
	const answerFields = Array.isArray(params.submission.answers)
		? params.submission.answers.slice(0, 20).map((a: any, i: number) => ({
				name: `${i + 1}. ${String(a.question || 'Question').slice(0, 240)}`,
				value: String(a.answer || '*No response*').slice(0, 1024),
				inline: false,
			}))
		: [];

	const summaryEmbed = {
		title: `${statusLabel} • ${params.submission.positionName || params.position?.name || 'Application'}`,
		description: [
			`**Applicant:** <@${params.submission.userId}> (${params.submission.userTag || params.submission.userId})`,
			`**Submission ID:** \`${params.submission.id}\``,
			`**Reviewed By:** <@${params.reviewerId}>${params.reviewerTag ? ` (${params.reviewerTag})` : ''}`,
			params.reason ? `**Note / Reason:** ${params.reason}` : null,
		]
			.filter(Boolean)
			.join('\n'),
		color,
		fields: answerFields,
		timestamp: new Date().toISOString(),
	};

	if (params.submission.logChannelId && params.submission.logMessageId) {
		await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(params.submission.logChannelId)}/messages/${encodeURIComponent(params.submission.logMessageId)}`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({
				embeds: [summaryEmbed],
				components: [],
			}),
		}).catch(() => null);
	}

	let archiveMessageId: string | null = null;
	const archiveChannel = params.guildConfig?.archiveChannel ? String(params.guildConfig.archiveChannel).trim() : '';
	if (archiveChannel) {
		const archRes = await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(archiveChannel)}/messages`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ embeds: [summaryEmbed] }),
		}).catch(() => null);
		if (archRes && archRes.ok) {
			const archJson = await archRes.json().catch(() => null);
			if (archJson?.id) archiveMessageId = String(archJson.id);
		}
	}

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
					const customMessage = params.decision === 'approved' ? params.position?.acceptMessage : params.position?.denyMessage;
					await fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(dmChannel.id)}/messages`, {
						method: 'POST',
						headers,
						body: JSON.stringify({
							embeds: [
								{
									title: `Application ${statusLabel} — ${params.submission.positionName || params.position?.name || 'Position'}`,
									description: [
										`Your application${params.guildName ? ` in **${params.guildName}**` : ''} has been **${statusLabel.toLowerCase()}**.`,
										customMessage ? `\n${customMessage}` : null,
										params.reason ? `\n**Reviewer Note:** ${params.reason}` : null,
									]
										.filter(Boolean)
										.join('\n'),
									color,
									timestamp: new Date().toISOString(),
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
