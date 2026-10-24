/** @format */
import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		senderId: { type: String, required: true },
		targetId: { type: String, required: true },
		category: { type: String, default: 'notification' },
		type: { type: String, required: true },
		status: { type: String, enum: ['unread', 'read', 'pending', 'accepted', 'declined', 'approved', 'denied'], default: 'pending' },
		readAt: { type: Date, default: null },
		readBy: { type: [String], default: [] },
		deletedBy: { type: [String], default: [] },
		data: { type: Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true }
);

schema.index({ targetId: 1, type: 1, status: 1 });
schema.index({ readAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { status: 'read' } });
export default schema;
