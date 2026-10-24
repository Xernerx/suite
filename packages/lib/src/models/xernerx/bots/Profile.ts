/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // Bot ID
		vanitySlug: { type: String, trim: true, lowercase: true, sparse: true },
		vanityUnlocked: { type: Boolean, default: false },
		bot: { type: Boolean, default: true }, // Is it a bot (vs server)
		name: { type: String, required: false }, // Bot Name
		avatar: { type: String }, // Bot Avatar Hash/URL
		description: { type: String }, // Short description of the bot
		info: { type: String }, // Long description about the bot
		owners: { type: [String] }, // List of user IDs who own the bot
		organization: { type: String }, // Organization or developer of the bot
		promotedUntil: { type: Date }, // Timestamp until which the bot is promoted
		boostedUntil: { type: Date }, // Timestamp until which the bot is spotlight boosted via credits
		boostedBy: { type: String }, // User ID who most recently boosted the bot
		verified: { type: Boolean, default: false }, // Whether the bot has been verified
		privacy: { type: String, enum: ['public', 'private', 'limited'], default: 'private' }, // Privacy level of the bot
		widgets: { type: Boolean, default: false }, // Whether embeddable widgets are enabled
		tags: { type: Array, default: [] },
		links: {
			invite: { type: String }, // Discord bot invite link
			support: { type: String }, // Support server link
			community: { type: String }, // Discord community link
			github: { type: String }, // GitHub repository link
			website: { type: String }, // Official website link
			privacy: { type: String }, // Privacy policy link
			terms: { type: String }, // Terms of service link
			dashboard: { type: String }, // Bot dashboard link
		},
		commands: { type: Array, default: [] }, // Discord JSON application commands
		votes: { type: [{ userId: String, timestamp: Date }], default: [] }, // Array of user votes with timestamps
		voteCount: { type: Number, default: 0 }, // Fast cache for total votes
		status: { type: String, enum: ['online', 'idle', 'dnd', 'offline'], default: 'offline' }, // Live presence status tracked by the Xernerx bot
		statusUpdatedAt: { type: Date }, // Timestamp when status was last synced by the Xernerx bot
		activity: { type: String }, // Current Discord activity label
		releases: {
			type: [
				{
					id: { type: String },
					version: { type: String },
					title: { type: String },
					body: { type: String },
					authorId: { type: String },
					createdAt: { type: Date, default: Date.now },
				},
			],
			default: [],
		},
	},
	{ timestamps: true }
);

export default schema;
