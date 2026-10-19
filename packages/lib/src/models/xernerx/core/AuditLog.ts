/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		actorId: { type: String, default: 'system' },
		actorName: { type: String, default: null },
		action: { type: String, required: true },
		targetType: { type: String, required: true },
		targetId: { type: String, default: null },
		summary: { type: String, required: true },
		metadata: { type: Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true }
);

export default schema;
