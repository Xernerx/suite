/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		guildId: { type: String, required: true },
		channelId: { type: String, default: null },
		userId: { type: String, required: true },
		username: { type: String, default: null },
		initialMessage: { type: String, default: null },
		status: {
			type: String,
			enum: ['open', 'on-hold', 'resolved', 'closed'],
			default: 'open',
		},
		index: { type: Number, default: 0 },
		bot: { type: String, default: null },
		guild: {
			id: { type: String, default: null },
			name: { type: String, default: null },
		},
		channel: {
			id: { type: String, default: null },
			name: { type: String, default: null },
		},
		message: {
			id: { type: String, default: null },
		},
		command: {
			id: { type: String, default: null },
			name: { type: String, default: null },
		},
		checks: { type: Map, of: Boolean, default: {} },
	},
	{ timestamps: true }
);

export default schema;
