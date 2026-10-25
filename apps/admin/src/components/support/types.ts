/** @format */

export interface SupportChannelItem {
	id: string;
	guild: string;
	name?: string | null;
	role?: string | null;
	type: 'support' | 'status';
	createdAt?: string;
}

export interface SupportBotItem {
	id: string;
	guild: string;
	name?: string | null;
	avatar?: string | null;
	owners?: string[];
	createdAt?: string;
}

export interface SupportTicketItem {
	id: string;
	guildId: string;
	channelId?: string | null;
	userId: string;
	username?: string | null;
	initialMessage?: string | null;
	status: 'open' | 'on-hold' | 'resolved' | 'closed';
	index: number;
	bot?: string | null;
	guild?: { id?: string | null; name?: string | null };
	channel?: { id?: string | null; name?: string | null };
	message?: { id?: string | null };
	command?: { id?: string | null; name?: string | null };
	checks?: Record<string, boolean>;
	createdAt?: string;
	updatedAt?: string;
}

export interface DiscordChannelOption {
	id: string;
	name: string;
	type: number;
	parentId?: string | null;
}

export interface DiscordRoleOption {
	id: string;
	name: string;
	color?: number;
}

export interface RegisteredBotOption {
	id: string;
	name?: string;
	username?: string;
	avatar?: string;
	owners?: string[];
}

export interface BotDiscordProfile {
	id: string;
	name: string;
	username: string;
	avatarUrl: string | null;
}

export interface SupportServerOption {
	id: string;
	name: string;
	isPrimary?: boolean;
}
