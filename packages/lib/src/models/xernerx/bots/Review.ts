/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		botId: { type: String, required: true, index: true },
		userId: { type: String, required: true, index: true },
		rating: { type: Number, required: true, min: 1, max: 5 },
		content: { type: String, maxlength: 2000 },
		upvotes: { type: [String], default: [] },
		downvotes: { type: [String], default: [] },
		devResponse: { type: String, maxlength: 2000 },
	},
	{ timestamps: true }
);
export default schema;
