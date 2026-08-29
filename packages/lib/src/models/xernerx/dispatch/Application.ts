/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		ownerId: { type: String, required: true },
		targetId: { type: String, required: true },
		status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
		reviewedBy: { type: String },
		reviewNote: { type: String },
		data: { type: Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true }
);
schema.index({ ownerId: 1 });
export default schema;
