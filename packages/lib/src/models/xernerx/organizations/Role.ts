/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		ownerId: { type: String, required: true }, // org id
		name: { type: String, required: true },
		permissions: { type: [String], default: [] },
	},
	{ timestamps: true }
);
schema.index({ ownerId: 1 });
export default schema;
