/** @format */

export type InviteOptionKey = 'essential' | 'optional' | 'advanced';

export interface InviteOptionTierConfig {
	enabled: boolean;
	permissions: string;
}

export interface InviteOptionsConfig {
	essential: InviteOptionTierConfig;
	optional: InviteOptionTierConfig;
	advanced: InviteOptionTierConfig;
}

export interface ResolvedInviteOption {
	key: InviteOptionKey;
	permissions: string;
	permissionCount: number;
	permissionLabels: string[];
	additionalCount: number;
	additionalLabels: string[];
}

export const DISCORD_PERMISSION_FLAGS: ReadonlyArray<{ key: string; label: string; bit: bigint }> = [
	{ key: 'CreateInstantInvite', label: 'Create Invite', bit: BigInt(1) << BigInt(0) },
	{ key: 'KickMembers', label: 'Kick Members', bit: BigInt(1) << BigInt(1) },
	{ key: 'BanMembers', label: 'Ban Members', bit: BigInt(1) << BigInt(2) },
	{ key: 'Administrator', label: 'Administrator', bit: BigInt(1) << BigInt(3) },
	{ key: 'ManageChannels', label: 'Manage Channels', bit: BigInt(1) << BigInt(4) },
	{ key: 'ManageGuild', label: 'Manage Server', bit: BigInt(1) << BigInt(5) },
	{ key: 'AddReactions', label: 'Add Reactions', bit: BigInt(1) << BigInt(6) },
	{ key: 'ViewAuditLog', label: 'View Audit Log', bit: BigInt(1) << BigInt(7) },
	{ key: 'PrioritySpeaker', label: 'Priority Speaker', bit: BigInt(1) << BigInt(8) },
	{ key: 'Stream', label: 'Video', bit: BigInt(1) << BigInt(9) },
	{ key: 'ViewChannel', label: 'View Channels', bit: BigInt(1) << BigInt(10) },
	{ key: 'SendMessages', label: 'Send Messages', bit: BigInt(1) << BigInt(11) },
	{ key: 'SendTTSMessages', label: 'Send TTS Messages', bit: BigInt(1) << BigInt(12) },
	{ key: 'ManageMessages', label: 'Manage Messages', bit: BigInt(1) << BigInt(13) },
	{ key: 'EmbedLinks', label: 'Embed Links', bit: BigInt(1) << BigInt(14) },
	{ key: 'AttachFiles', label: 'Attach Files', bit: BigInt(1) << BigInt(15) },
	{ key: 'ReadMessageHistory', label: 'Read Message History', bit: BigInt(1) << BigInt(16) },
	{ key: 'MentionEveryone', label: 'Mention Everyone', bit: BigInt(1) << BigInt(17) },
	{ key: 'UseExternalEmojis', label: 'Use External Emojis', bit: BigInt(1) << BigInt(18) },
	{ key: 'ViewGuildInsights', label: 'View Server Insights', bit: BigInt(1) << BigInt(19) },
	{ key: 'Connect', label: 'Connect', bit: BigInt(1) << BigInt(20) },
	{ key: 'Speak', label: 'Speak', bit: BigInt(1) << BigInt(21) },
	{ key: 'MuteMembers', label: 'Mute Members', bit: BigInt(1) << BigInt(22) },
	{ key: 'DeafenMembers', label: 'Deafen Members', bit: BigInt(1) << BigInt(23) },
	{ key: 'MoveMembers', label: 'Move Members', bit: BigInt(1) << BigInt(24) },
	{ key: 'UseVAD', label: 'Use Voice Activity', bit: BigInt(1) << BigInt(25) },
	{ key: 'ChangeNickname', label: 'Change Nickname', bit: BigInt(1) << BigInt(26) },
	{ key: 'ManageNicknames', label: 'Manage Nicknames', bit: BigInt(1) << BigInt(27) },
	{ key: 'ManageRoles', label: 'Manage Roles', bit: BigInt(1) << BigInt(28) },
	{ key: 'ManageWebhooks', label: 'Manage Webhooks', bit: BigInt(1) << BigInt(29) },
	{ key: 'ManageGuildExpressions', label: 'Manage Expressions', bit: BigInt(1) << BigInt(30) },
	{ key: 'UseApplicationCommands', label: 'Use Application Commands', bit: BigInt(1) << BigInt(31) },
	{ key: 'RequestToSpeak', label: 'Request to Speak', bit: BigInt(1) << BigInt(32) },
	{ key: 'ManageEvents', label: 'Manage Events', bit: BigInt(1) << BigInt(33) },
	{ key: 'ManageThreads', label: 'Manage Threads', bit: BigInt(1) << BigInt(34) },
	{ key: 'CreatePublicThreads', label: 'Create Public Threads', bit: BigInt(1) << BigInt(35) },
	{ key: 'CreatePrivateThreads', label: 'Create Private Threads', bit: BigInt(1) << BigInt(36) },
	{ key: 'UseExternalStickers', label: 'Use External Stickers', bit: BigInt(1) << BigInt(37) },
	{ key: 'SendMessagesInThreads', label: 'Send Messages in Threads', bit: BigInt(1) << BigInt(38) },
	{ key: 'UseEmbeddedActivities', label: 'Use Activities', bit: BigInt(1) << BigInt(39) },
	{ key: 'ModerateMembers', label: 'Timeout Members', bit: BigInt(1) << BigInt(40) },
	{ key: 'ViewCreatorMonetizationAnalytics', label: 'View Monetization Analytics', bit: BigInt(1) << BigInt(41) },
	{ key: 'UseSoundboard', label: 'Use Soundboard', bit: BigInt(1) << BigInt(42) },
	{ key: 'CreateGuildExpressions', label: 'Create Expressions', bit: BigInt(1) << BigInt(43) },
	{ key: 'CreateEvents', label: 'Create Events', bit: BigInt(1) << BigInt(44) },
	{ key: 'UseExternalSounds', label: 'Use External Sounds', bit: BigInt(1) << BigInt(45) },
	{ key: 'SendVoiceMessages', label: 'Send Voice Messages', bit: BigInt(1) << BigInt(46) },
	{ key: 'SendPolls', label: 'Send Polls', bit: BigInt(1) << BigInt(49) },
	{ key: 'UseExternalApps', label: 'Use External Apps', bit: BigInt(1) << BigInt(50) },
	{ key: 'PinMessages', label: 'Pin Messages', bit: BigInt(1) << BigInt(51) },
	{ key: 'BypassSlowmode', label: 'Bypass Slowmode', bit: BigInt(1) << BigInt(52) },
];

export function safeParsePermBigInt(raw: string | number | bigint | null | undefined): bigint {
	if (typeof raw === 'bigint') return raw >= BigInt(0) ? raw : BigInt(0);
	if (typeof raw === 'number') return Number.isInteger(raw) && raw >= 0 ? BigInt(raw) : BigInt(0);
	if (typeof raw !== 'string') return BigInt(0);
	const cleaned = raw.trim().replace(/n$/i, '');
	if (!cleaned || !/^(?:\d+|0x[0-9a-fA-F]+)$/.test(cleaned)) return BigInt(0);
	try {
		const val = BigInt(cleaned);
		return val >= BigInt(0) ? val : BigInt(0);
	} catch {
		return BigInt(0);
	}
}

export function decodeDiscordPermissionLabels(bits: bigint): string[] {
	if (bits <= BigInt(0)) return [];
	const labels: string[] = [];
	for (const flag of DISCORD_PERMISSION_FLAGS) {
		if ((bits & flag.bit) === flag.bit) {
			labels.push(flag.label);
		}
	}
	return labels;
}

export function normalizeInviteOptions(invite: { permissions?: string | null; options?: Partial<Record<InviteOptionKey, Partial<InviteOptionTierConfig>>> | null }): InviteOptionsConfig {
	const fallbackBits = safeParsePermBigInt(invite?.permissions);
	const rawOpts = invite?.options;

	const hasExplicitConfig =
		rawOpts && typeof rawOpts === 'object' && (typeof rawOpts.essential?.enabled === 'boolean' || typeof rawOpts.optional?.enabled === 'boolean' || typeof rawOpts.advanced?.enabled === 'boolean');

	if (hasExplicitConfig) {
		let essentialEnabled = Boolean(rawOpts.essential?.enabled);
		const optionalEnabled = Boolean(rawOpts.optional?.enabled);
		const advancedEnabled = Boolean(rawOpts.advanced?.enabled);

		if (!essentialEnabled && !optionalEnabled && !advancedEnabled) {
			essentialEnabled = true;
		}

		const essentialBits = safeParsePermBigInt(rawOpts.essential?.permissions ?? fallbackBits);
		const rawOptionalBits = safeParsePermBigInt(rawOpts.optional?.permissions ?? fallbackBits);
		const effectiveOptionalBits = essentialEnabled ? essentialBits | rawOptionalBits : rawOptionalBits;

		return {
			essential: {
				enabled: essentialEnabled,
				permissions: essentialBits.toString(),
			},
			optional: {
				enabled: optionalEnabled,
				permissions: effectiveOptionalBits.toString(),
			},
			advanced: {
				enabled: advancedEnabled,
				permissions: '0',
			},
		};
	}

	return {
		essential: {
			enabled: true,
			permissions: fallbackBits.toString(),
		},
		optional: {
			enabled: false,
			permissions: fallbackBits.toString(),
		},
		advanced: {
			enabled: false,
			permissions: '0',
		},
	};
}

export function getEnabledInviteOptions(invite: { permissions?: string | null; options?: Partial<Record<InviteOptionKey, Partial<InviteOptionTierConfig>>> | null }): ResolvedInviteOption[] {
	const normalized = normalizeInviteOptions(invite);
	const essentialBits = normalized.essential.enabled ? safeParsePermBigInt(normalized.essential.permissions) : BigInt(0);
	const essentialLabels = decodeDiscordPermissionLabels(essentialBits);
	const essentialSet = new Set(essentialLabels);

	const orderedKeys: InviteOptionKey[] = ['essential', 'optional', 'advanced'];
	const result: ResolvedInviteOption[] = [];

	for (const key of orderedKeys) {
		const tier = normalized[key];
		if (!tier.enabled) continue;

		const bits = key === 'advanced' ? BigInt(0) : safeParsePermBigInt(tier.permissions);
		const labels = decodeDiscordPermissionLabels(bits);
		const additionalLabels = key === 'optional' && normalized.essential.enabled ? labels.filter((l) => !essentialSet.has(l)) : [];

		result.push({
			key,
			permissions: bits.toString(),
			permissionCount: labels.length,
			permissionLabels: labels,
			additionalCount: additionalLabels.length,
			additionalLabels,
		});
	}

	return result;
}

export function buildDiscordBotAuthorizeUrl(params: { clientId: string; permissions: string; scopes?: string[]; redirect?: boolean; targetSlug?: string }): string {
	const scopesList = Array.isArray(params.scopes) && params.scopes.length > 0 ? params.scopes.filter(Boolean) : ['bot', 'applications.commands'];
	let url = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(params.clientId)}&permissions=${encodeURIComponent(params.permissions || '0')}&scope=${scopesList.join('+')}`;

	if (params.redirect) {
		const slug = params.targetSlug || params.clientId;
		const redirectUri = `https://app.xernerx.com/bots/${slug}`;
		url += `&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
	}

	return url;
}
