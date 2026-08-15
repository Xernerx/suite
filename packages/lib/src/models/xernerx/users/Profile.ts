/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // User ID
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

		verified: { type: Boolean, default: false }, // Whether the user has been verified
		privacy: { type: String, enum: ['public', 'private', 'limited'], default: 'private' }, // Privacy level of the user
		preferences: { locale: { type: String } }, // User locale (e.g., en-US, es-ES, fr-FR)

		links: {
			website: { type: String },
			github: { type: String },
			twitter: { type: String },
			youtube: { type: String },
			twitch: { type: String },
		},

		hooks: { type: [{ name: String, description: String, url: String, data: String }] }, // List of user webhooks
	},
	{ timestamps: true }
);

export default schema;
