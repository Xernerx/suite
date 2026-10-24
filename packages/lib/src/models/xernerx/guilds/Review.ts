/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		guildId: { type: String, required: true, index: true },
		userId: { type: String, required: true, index: true },
		rating: { type: Number, required: true, min: 1, max: 5 },
		content: { type: String, maxlength: 2000 },
		upvotes: { type: [String], default: [] },
		downvotes: { type: [String], default: [] },
		helpfulUserIds: { type: [String], default: [] },
		devResponse: { type: String, maxlength: 2000 },
		reply: {
			authorId: { type: String },
			content: { type: String, maxlength: 2000 },
			updatedAt: { type: Date },
		},
	},
	{ timestamps: true }
);

export default schema;
