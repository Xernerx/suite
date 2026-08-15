/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		ownerId: { type: String, required: true },
		uses: { type: Number, default: 0 },
		maxUses: { type: Number, default: 0 },
		expiresAt: { type: Date },
	},
	{ timestamps: true }
);
schema.index({ ownerId: 1 });
export default schema;
