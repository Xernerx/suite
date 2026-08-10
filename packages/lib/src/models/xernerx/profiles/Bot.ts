/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // Bot ID
		name: { type: String, required: true }, // Bot Name
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
		hooks: { type: [{ name: String, description: String, url: String, data: String }] }, // List of bot webhooks
		commands: { type: Array, default: [] }, // Discord JSON application commands
		voteCount: { type: Number, default: 0 }, // Fast cache for total votes
	},
	{ timestamps: true }
);

export default schema;
