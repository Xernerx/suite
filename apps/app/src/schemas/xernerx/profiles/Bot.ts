/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // Bot ID
		description: { type: String }, // Short description of the bot
		info: { type: String }, // Long description about the bot
		owners: { type: [String] }, // List of user IDs who own the bot
		organization: { type: String }, // Organization or developer of the bot
		verified: { type: Boolean, default: false }, // Whether the bot has been verified
		privacy: { type: String, enum: ['public', 'private', 'limited'], default: 'private' }, // Privacy level of the bot
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
		tags: { type: [String], default: [] }, // Array of tags
		hooks: { type: [{ name: String, description: String, url: String, data: String }] }, // List of bot webhooks
		commands: { type: [{ id: String, name: String, description: String }] }, // List of bot commands
	},
	{ timestamps: true }
);

export default schema;
