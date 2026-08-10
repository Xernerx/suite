/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		botId: { type: String, required: true }, // The ID of the bot being voted for
		userId: { type: String, required: true }, // The ID of the user casting the vote
	},
	{ timestamps: true } // automatically adds createdAt and updatedAt
);

// Compound index to quickly find the latest vote by a user for a specific bot
schema.index({ botId: 1, userId: 1, createdAt: -1 });

export default schema;
