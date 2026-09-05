/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // Bot ID
		bot: { type: Boolean, default: true }, // Is it a bot (vs server)
		name: { type: String, required: false }, // Bot Name
		avatar: { type: String }, // Bot Avatar Hash/URL
		description: { type: String }, // Short description of the bot
		info: { type: String }, // Long description about the bot
		owners: { type: [String] }, // List of user IDs who own the bot
		organization: { type: String }, // Organization or developer of the bot
		promotedUntil: { type: Date }, // Timestamp until which the bot is promoted
		verified: { type: Boolean, default: false }, // Whether the bot has been verified
		privacy: { type: String, enum: ['public', 'private', 'limited'], default: 'private' }, // Privacy level of the bot
		tags: { type: Array, default: [] },
		links: {
			invite: { type: String }, // Discord bot invite link
			support: { type: String }, // Support server link
			community: { type: String }, // Discord community link
			github: { type: String }, // GitHub repository link
			website: { type: String }, // Official website link
			privacy: { type: String }, // Privacy policy link
			terms: { type: String }, // Terms of service link
		},
		commands: { type: Array, default: [] }, // Discord JSON application commands
		votes: { type: [{ userId: String, timestamp: Date }], default: [] }, // Array of user votes with timestamps
		voteCount: { type: Number, default: 0 }, // Fast cache for total votes
	},
	{ timestamps: true }
);

export default schema;
