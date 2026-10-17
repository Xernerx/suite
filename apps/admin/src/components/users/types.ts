/** @format */

export interface Role {
	id: string; // Random UUID
	name?: string;
	role?: string; // Discord Role ID
	sync?: boolean; // Whether to sync name from Discord
	permissions?: any;
}

export interface DiscordProfile {
	username: string;
	globalName?: string;
	discriminator?: string;
	banner?: string;
	avatar?: string;
	avatarUrl?: string;
}

export interface FullUser {
	id: string;
	roles?: string[];
	name: string;
	icon: string;
	email?: string;
	description?: string;
	info?: string;
	birthday?: string;
	gender?: string;
	pronouns?: string;
	timezone?: string;
	privacy?: string;
	verified?: boolean;
	locale?: string;
	staffSubscription?: boolean;
	stripeCustomerId?: string;
	credits?: {
		balance?: number;
		streak?: number;
	};
}

export interface UserSummary {
	id: string;
	roles?: string[];
	name: string;
	icon: string;
	discord?: DiscordProfile | null;
	stripeCustomerId?: string;
}

export function getNormalizedRoles(
	obj:
		| {
				roles?: string[];
		  }
		| null
		| undefined
): string[] {
	if (!obj || !Array.isArray(obj.roles)) return [];
	return obj.roles;
}
