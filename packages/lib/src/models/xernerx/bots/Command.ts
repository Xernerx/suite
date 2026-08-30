/** @format */
import { Schema } from 'mongoose';

const schema = new Schema(
	{
		botId: { type: String, required: true, index: true },
		commandId: { type: String, required: true },
		name: { type: String, required: true },
		description: { type: String },
		type: { type: Number, default: 1 },
		body: { type: Schema.Types.Mixed, required: true },
	},
	{ timestamps: true }
);

export default schema;
