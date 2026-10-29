/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // User ID
		vanitySlug: { type: String, trim: true, lowercase: true, sparse: true },
		vanityUnlocked: { type: Boolean, default: false },
		name: { type: String }, // User name
		icon: { type: String }, // User icon URL (optional)
		description: { type: String }, // Short description of the user
		info: { type: String }, // Long description about the user
		birthday: { type: Date }, // User's birthday (optional)
		gender: { type: String, enum: ['male', 'female', 'other'] }, // User's gender (optional)
		pronouns: { type: String }, // User's pronouns (optional)
		timezone: { type: String }, // User's timezone (optional)
		email: { type: String }, // User's email (optional)
		role: { type: String }, // todo remove once phased out!
		roles: { type: Array, default: [] }, // User's roles (e.g., admin, moderator, user)
		permissions: { type: [String], default: [] }, // User's permissions (optional)
		notifications: { type: Schema.Types.Mixed, default: {} },
		seen: { type: Date }, // User's notifications seen settings (optional)
		lastSeenVersions: { type: Map, of: String, default: {} }, // User's last seen app versions

		verified: { type: Boolean, default: false }, // Whether the user has been verified
		staffSubscription: { type: Boolean, default: false }, // Infinite staff subscription override
		stripeCustomerId: { type: String, default: null }, // Linked Stripe customer ID
		agreedTerms: { type: Date, default: null }, // Timestamp of when the user agreed to the Terms of Service
		agreedPrivacy: { type: Date, default: null }, // Timestamp of when the user agreed to the Privacy Policy
		privacy: { type: String, enum: ['public', 'private', 'limited'], default: 'private' }, // Privacy level of the user
		widgets: { type: Boolean, default: false }, // Whether public embed widgets are enabled
		preferences: { locale: { type: String } }, // User locale (e.g., en-US, es-ES, fr-FR)

		connections: {
			type: [
				{
					provider: { type: String, required: true },
					id: { type: String, required: true },
					username: { type: String, required: true },
					displayName: { type: String },
					avatar: { type: String },
					url: { type: String },
					secret: { type: String },
					token: { type: String },
					showOnProfile: { type: Boolean, default: true },
					connectedAt: { type: Date, default: Date.now },
				},
			],
			default: [],
		},

		devices: {
			type: [
				{
					id: { type: String },
					browser: { type: String },
					os: { type: String },
					deviceType: { type: String },
					lastActive: { type: Date },
				},
			],
			default: [],
		},

		hooks: { type: [{ name: String, description: String, url: String, data: String }] }, // List of user webhooks

		showcases: {
			type: [
				{
					id: { type: String, required: true },
					title: { type: String, required: true },
					description: { type: String, default: '' },
					imageUrl: { type: String, default: '' },
					linkUrl: { type: String, default: '' },
					tag: { type: String, default: '' },
				},
			],
			default: [],
		},
	},
	{ timestamps: true }
);

export default schema;
