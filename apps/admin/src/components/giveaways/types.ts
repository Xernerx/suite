/** @format */

export type GiveawayPrizeType = 'credits' | 'store_item' | 'discord_role' | 'custom';
export type GiveawayStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';
export type BonusEntryType = 'discord_role' | 'active_pass' | 'verified' | 'badge_or_item' | 'global_level';

export interface GiveawayPrize {
	type: GiveawayPrizeType;
	label: string;
	creditAmount?: number;
	storeItemId?: string;
	durationDays?: number;
	discordRoleId?: string;
	customPrizeValue?: string;
}

export interface GiveawayRequirements {
	requireAccount: boolean;
	requireVerified: boolean;
	requireActivePass: boolean;
	minGlobalLevel: number;
	minStreak: number;
	minTotalSpent: number;
	roleMatchMode: 'any' | 'all';
	requiredDiscordRoleIds: string[];
	excludedDiscordRoleIds: string[];
	requiredBadgeOrItemIds: string[];
}

export interface BonusEntryRule {
	type: BonusEntryType;
	targetId?: string;
	label?: string;
	extraEntries: number;
}

export interface GiveawayEntrant {
	userId: string;
	username: string;
	avatar?: string;
	weight: number;
	source: 'discord' | 'web';
	enteredAt: string;
}

export interface GiveawayWinner {
	userId: string;
	username: string;
	avatar?: string;
	weight: number;
	fulfilled: boolean;
	fulfillmentNote?: string;
	wonAt: string;
}

export interface GiveawayItem {
	id: string;
	title: string;
	description?: string;
	bannerUrl?: string;
	status: GiveawayStatus;
	startsAt: string;
	endsAt: string;
	endedAt?: string | null;
	winnerCount: number;
	hostedBy?: string;
	guildId?: string;
	channelId?: string;
	discordMessageId?: string | null;
	pingRoleId?: string;
	showOnWeb: boolean;
	targetApps: string[];
	prize: GiveawayPrize;
	requirements: GiveawayRequirements;
	bonusEntries: BonusEntryRule[];
	entries: GiveawayEntrant[];
	winners: GiveawayWinner[];
	entryCount?: number;
	totalWeight?: number;
	createdAt?: string;
}

export interface SelectOption {
	label: string;
	value: string;
}
