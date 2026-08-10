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
		name: { type: String, required: true }, // Guild name
		icon: { type: String }, // Guild icon URL (optional)
		banner: { type: String },
		description: { type: String }, // Short description of the guild
		info: { type: String }, // Long description about the guild
		organization: { type: String }, // Organization or developer of the guild
		verified: { type: Boolean, default: false }, // Whether the guild has been verified
		bot: { type: Boolean, default: false }, // Whether the guild has the xernerx bot inside of it
		privacy: {
			type: String,
			enum: ['public', 'private', 'limited'],
			default: 'private',
		}, // Privacy level of the guild
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
