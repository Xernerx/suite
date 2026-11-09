/** @format */

import { Schema } from 'mongoose';

const BonusEntryRuleSchema = new Schema(
	{
		type: {
			type: String,
			enum: ['discord_role', 'active_pass', 'verified', 'badge_or_item', 'global_level'],
			required: true,
		},
		targetId: { type: String, default: '' },
		label: { type: String, default: '' },
		extraEntries: { type: Number, required: true, default: 1, min: 1, max: 50 },
	},
	{ _id: false }
);

const GiveawayEntrySchema = new Schema(
	{
		userId: { type: String, required: true },
		username: { type: String, default: '' },
		avatar: { type: String, default: '' },
		weight: { type: Number, default: 1, min: 1 },
		source: { type: String, enum: ['discord', 'web'], default: 'web' },
		enteredAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const GiveawayWinnerSchema = new Schema(
	{
		userId: { type: String, required: true },
		username: { type: String, default: '' },
		avatar: { type: String, default: '' },
		weight: { type: Number, default: 1 },
		fulfilled: { type: Boolean, default: false },
		fulfillmentNote: { type: String, default: '' },
		wonAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const GiveawaySchema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		title: { type: String, required: true },
		description: { type: String, default: '' },
		bannerUrl: { type: String, default: '' },
		status: {
			type: String,
			enum: ['scheduled', 'active', 'ended', 'cancelled'],
			default: 'active',
			index: true,
		},
		startsAt: { type: Date, default: Date.now },
		endsAt: { type: Date, required: true, index: true },
		endedAt: { type: Date, default: null },
		winnerCount: { type: Number, required: true, default: 1, min: 1, max: 100 },
		hostedBy: { type: String, default: '' },
		guildId: { type: String, default: '' },
		channelId: { type: String, default: '' },
		discordMessageId: { type: String, default: null },
		pingRoleId: { type: String, default: '' },
		showOnWeb: { type: Boolean, default: true },
		targetApps: { type: [String], default: ['all'] },
		prize: {
			type: {
				type: String,
				enum: ['credits', 'store_item', 'discord_role', 'custom'],
				required: true,
				default: 'credits',
			},
			label: { type: String, required: true },
			creditAmount: { type: Number, default: 0, min: 0 },
			storeItemId: { type: String, default: '' },
			durationDays: { type: Number, default: 0, min: 0 },
			discordRoleId: { type: String, default: '' },
			customPrizeValue: { type: String, default: '' },
		},
		requirements: {
			requireAccount: { type: Boolean, default: false },
			requireVerified: { type: Boolean, default: false },
			requireActivePass: { type: Boolean, default: false },
			minGlobalLevel: { type: Number, default: 0, min: 0 },
			minStreak: { type: Number, default: 0, min: 0 },
			minTotalSpent: { type: Number, default: 0, min: 0 },
			roleMatchMode: { type: String, enum: ['any', 'all'], default: 'any' },
			requiredDiscordRoleIds: { type: [String], default: [] },
			excludedDiscordRoleIds: { type: [String], default: [] },
			requiredBadgeOrItemIds: { type: [String], default: [] },
		},
		bonusEntries: {
			type: [BonusEntryRuleSchema],
			default: [],
		},
		entries: {
			type: [GiveawayEntrySchema],
			default: [],
		},
		winners: {
			type: [GiveawayWinnerSchema],
			default: [],
		},
	},
	{ timestamps: true }
);

export default GiveawaySchema;
