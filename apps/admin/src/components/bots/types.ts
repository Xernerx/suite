/** @format */

export interface BotDiscordProfile {
	id?: string;
	username?: string;
	global_name?: string;
	globalName?: string;
	avatar?: string | null;
	avatarUrl?: string | null;
	banner?: string | null;
}

export interface AdminBotSummary {
	id: string;
	name?: string;
	avatar?: string | null;
	banner?: string | null;
	vanitySlug?: string;
	vanityUnlocked?: boolean;
	verified?: boolean;
	privacy?: 'public' | 'limited' | 'private' | string;
	widgets?: boolean;
	owners?: string[];
	description?: string;
	info?: string;
	organization?: string | null;
	voteCount?: number;
	stats?: {
		guildCount?: number;
		userCount?: number;
		shardCount?: number;
		voteCount?: number;
	} | null;
	discord?: BotDiscordProfile | null;
}
