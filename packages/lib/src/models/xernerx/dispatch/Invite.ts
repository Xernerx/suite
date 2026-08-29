/** @format */
import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		senderId: { type: String, required: true },
		targetId: { type: String, required: true },
		category: { type: String, default: 'notification' },
		type: { type: String, required: true },
		status: { type: String, enum: ['unread', 'read', 'pending', 'accepted', 'declined'], default: 'pending' },
		data: { type: Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true }
);

schema.index({ targetId: 1, type: 1, status: 1 });
export default schema;
