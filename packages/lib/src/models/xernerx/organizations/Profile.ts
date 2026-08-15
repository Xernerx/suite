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
		guild: { type: String }, // Discord guild ID (optional, if tied to a server)
		name: { type: String, required: true }, // Organization name
		icon: { type: String }, // Organization icon URL (optional)
		owner: { type: String, required: true }, // Discord user ID of the organization owner
		description: { type: String }, // Short description of the organization
		info: { type: String }, // Long description about the organization
		verified: { type: Boolean, default: false }, // Whether the organization has been verified
		privacy: { type: String, enum: ['public', 'private', 'limited'], default: 'private' }, // Privacy level
		members: { type: [String], default: [] }, // Array of Discord user IDs
		locale: { type: String }, // Locale (e.g., en-US)
		links: {
			invite: { type: String }, // Discord invite link
			support: { type: String }, // Discord support server link (optional)
			website: { type: String }, // Website URL (optional)
			privacy: { type: String }, // Privacy policy URL (optional)
			terms: { type: String }, // Terms of service URL (optional)
			github: { type: String }, // GitHub repository link
		},
		hooks: { type: [hookSchema], default: [] }, // List of webhooks
	},
	{ timestamps: true }
);

export default schema;
