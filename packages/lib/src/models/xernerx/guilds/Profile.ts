/** @format */

import { Schema } from 'mongoose';

const hookSchema = new Schema(
	{
		name: { type: String, required: true },
		description: { type: String },
		url: { type: String, required: true },
		data: { type: String },
	},
	{ _id: false }
);

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // Guild ID
		vanitySlug: { type: String, trim: true, lowercase: true, sparse: true },
		vanityUnlocked: { type: Boolean, default: false },
		name: { type: String, required: true }, // Guild name
		icon: { type: String }, // Guild icon URL (optional)
		banner: { type: String },
		description: { type: String }, // Short description of the guild
		info: { type: String }, // Long description about the guild
		owner: { type: String }, // Owner Discord user ID of the guild
		organization: { type: String }, // Organization or developer of the guild
		promotedUntil: { type: Date }, // Timestamp until which the server is promoted
		boostedUntil: { type: Date }, // Timestamp until which the server is spotlight boosted via credits
		boostedBy: { type: String }, // User ID who most recently boosted the server
		verified: { type: Boolean, default: false }, // Whether the guild has been verified
		bot: { type: Boolean, default: false }, // Whether the bot is in this server
		messages: { type: Number, default: 0 }, // Total messages sent in this server
		memberCount: { type: Number, default: 0 }, // Cached member count for sorting
		votes: { type: [{ userId: String, timestamp: Date }], default: [] }, // Array of user votes with timestamps
		voteCount: { type: Number, default: 0 }, // Cached count for sorting
		privacy: {
			type: String,
			enum: ['public', 'private', 'limited'],
			default: 'private',
		}, // Privacy level of the guild
		widgets: { type: Boolean, default: false }, // Whether embeddable widgets are enabled
		locale: { type: String }, // Guild locale (e.g., en-US, es-ES, fr-FR)
		links: {
			invite: { type: String }, // Discord guild invite link
			website: { type: String }, // Guild website URL (optional)
		},
		hooks: { type: [hookSchema], default: [] }, // List of guild webhooks
	},
	{ timestamps: true }
);

export default schema;
