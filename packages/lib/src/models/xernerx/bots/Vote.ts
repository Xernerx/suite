/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		botId: { type: String, required: true, index: true },
		userId: { type: String, required: true, index: true },
	},
	{ timestamps: true }
);
export default schema;
