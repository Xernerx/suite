/** @format */

import { Schema } from 'mongoose';

// Define the subscription sub-schema to handle multiple active tiers/products
const subscriptionSchema = new Schema(
	{
		stripeSubscriptionId: { type: String, required: true }, // The ID of the subscription in Stripe
		priceId: { type: String, required: true }, // The specific price/tier they bought
		status: { type: String, required: true }, // e.g., 'active', 'past_due', 'canceled'
		currentPeriodEnd: { type: Date, required: true }, // When this specific subscription expires
	},
	{ _id: false } // Prevents Mongoose from generating a unique _id for every single subscription object
);

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
		permissions: { type: Schema.Types.Mixed }, // User's permissions (optional)
		notifications: { type: Schema.Types.Mixed }, // User's notifications settings (optional)
		seen: { type: Date }, // User's notifications seen settings (optional)
		credits: { balance: { type: Number, default: 0, min: 0 }, streak: { type: Number, default: 0, min: 0 }, giftIn: { type: Date, default: new Date() } },

		// FIXED: Array of objects with an explicit ObjectId type
		organizations: [
			{
				id: { type: Schema.Types.ObjectId, ref: 'Organization' },
				role: { type: String },
			},
		],

		verified: { type: Boolean, default: false }, // Whether the user has been verified
		privacy: { type: String, enum: ['public', 'private', 'limited'], default: 'private' }, // Privacy level of the user
		preferences: { locale: { type: String } }, // User locale (e.g., en-US, es-ES, fr-FR)

		// FIXED: Explicitly defined as a mixed map/object
		links: { type: Schema.Types.Mixed, default: {} },

		// FIXED: Explicitly mapped appearance settings instead of Mixed
		appearance: {
			theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
			accent: { type: String },
			uiZoom: { type: Number, default: 100 },
			uiGap: { type: String, default: '16' },
			textScale: { type: Number, default: 14 },
			clientSync: { type: Boolean, default: false },
			syncFromDiscord: { type: Boolean, default: true },
		},

		hooks: { type: [{ name: String, description: String, url: String, data: String }] }, // List of user webhooks

		// --- STRIPE BILLING & SUBSCRIPTIONS ---
		stripeCustomerId: { type: String, default: null }, // Links this user to a Stripe Customer
		subscriptions: { type: [subscriptionSchema], default: [] }, // Array holding all active/past subscriptions
		staffSubscription: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

export default schema;
