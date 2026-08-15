/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		ownerId: { type: String, required: true }, // org id
		userId: { type: String, required: true },
		roles: { type: [String], default: [] },
	},
	{ timestamps: true }
);
schema.index({ ownerId: 1, userId: 1 }, { unique: true });
export default schema;
