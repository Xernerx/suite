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

export interface UserShowcaseItem {
	id: string;
	title: string;
	description?: string;
	imageUrl?: string;
	linkUrl?: string;
	tag?: string;
}

export interface UserConnectionItem {
	provider: string;
	id: string;
	username: string;
	displayName?: string;
	avatar?: string;
	url?: string;
	showOnProfile?: boolean;
	connectedAt?: string;
}

export interface UserDeviceItem {
	id?: string;
	browser?: string;
	os?: string;
	deviceType?: string;
	lastActive?: string;
}

export interface UserCreditTransaction {
	id?: string;
	type?: string;
	amount?: number;
	multiplierPercent?: number;
	itemId?: string | null;
	itemName?: string | null;
	createdAt?: string;
}

export interface UserAssetEntity {
	id: string;
	name?: string;
	avatar?: string;
	icon?: string;
	privacy?: string;
	verified?: boolean;
	vanitySlug?: string;
	isOwner?: boolean;
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
	vanitySlug?: string;
	vanityUnlocked?: boolean;
	widgets?: boolean;
	agreedTerms?: string | null;
	agreedPrivacy?: string | null;
	locale?: string;
	staffSubscription?: boolean;
	stripeCustomerId?: string;
	showcases?: UserShowcaseItem[];
	connections?: UserConnectionItem[];
	devices?: UserDeviceItem[];
	ownedBots?: UserAssetEntity[];
	ownedServers?: UserAssetEntity[];
	userOrganizations?: UserAssetEntity[];
	credits?: {
		balance?: number;
		streak?: number;
		streakShields?: number;
		totalSpent?: number;
		extraBotSlots?: number;
		extraCdnSlots?: number;
		extraShowcaseSlots?: number;
		extraVanitySlots?: number;
		referredBy?: string | null;
		referralBonusClaimed?: boolean;
		unlockedBadges?: string[];
		activeBadges?: string[];
		claimedAchievements?: string[];
		dotMatrixVariant?: string;
		transactions?: UserCreditTransaction[];
	};
	level?: {
		level?: number;
		xp?: number;
	};
}

export interface UserSummary {
	id: string;
	roles?: string[];
	name: string;
	icon: string;
	verified?: boolean;
	vanitySlug?: string;
	discord?: DiscordProfile | null;
	stripeCustomerId?: string;
	level?: {
		level?: number;
		xp?: number;
	};
	credits?: {
		balance?: number;
		streak?: number;
	};
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
