/** @format */

export interface Role {
	id: string; // Random UUID
	name?: string;
	role?: string; // Discord Role ID
	sync?: boolean; // Whether to sync name from Discord
	position?: number;
	permissions?: Record<string, boolean>;
}

export interface DiscordRole {
	id: string;
	name: string;
	color: number;
	position: number;
}
