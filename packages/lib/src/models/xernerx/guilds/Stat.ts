/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		id: { type: String, required: true },
		members: { type: Number, default: 0 },
		bots: { type: Number, default: 0 },
		messages: { type: Number, default: 0 },
		boosts: { type: Number, default: 0 },
		voteCount: { type: Number, default: 0 },
		timestamp: { type: Date, required: true },
		data: { type: Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true }
);
export default schema;
