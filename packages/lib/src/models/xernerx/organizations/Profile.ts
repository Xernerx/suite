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
		vanitySlug: { type: String, trim: true, lowercase: true, sparse: true },
		vanityUnlocked: { type: Boolean, default: false },
		name: { type: String, required: true }, // Organization name
		icon: { type: String }, // Organization icon URL (optional)
		iconUrl: { type: String }, // New custom avatar CDN URL
		bannerUrl: { type: String }, // Custom banner CDN URL
		owner: { type: String, required: true }, // Discord user ID of the organization owner
		description: { type: String }, // Short description of the organization
		info: { type: String }, // Long description about the organization
		verified: { type: Boolean, default: false }, // Whether the organization has been verified
		privacy: { type: String, enum: ['public', 'private', 'limited'], default: 'private' }, // Privacy level
		widgets: { type: Boolean, default: false }, // Whether embeddable widgets are enabled
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
		roles: {
			type: [
				{
					id: { type: String, required: true },
					name: { type: String, required: true },
					permissions: { type: String, default: '0' },
				},
			],
			default: [],
		},
		hooks: { type: [hookSchema], default: [] }, // List of webhooks
		treasuryBalance: { type: Number, default: 0, min: 0 }, // Shared Organization Credit Pool
		treasuryLedger: {
			type: [
				{
					id: { type: String },
					userId: { type: String },
					username: { type: String },
					type: { type: String, enum: ['deposit', 'boost', 'vanity'], default: 'deposit' },
					amount: { type: Number, default: 0 },
					targetId: { type: String, default: null },
					targetName: { type: String, default: null },
					createdAt: { type: Date, default: Date.now },
				},
			],
			default: [],
		},
	},
	{ timestamps: true }
);

export default schema;
