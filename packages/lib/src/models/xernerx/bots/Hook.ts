/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		botId: { type: String, required: true },
		url: { type: String, required: true },
		secret: { type: String, default: '' },
		events: { type: [String], default: [] },
		deliveries: {
			type: [
				{
					id: { type: String },
					event: { type: String },
					url: { type: String },
					status: { type: Number, default: 0 },
					ok: { type: Boolean, default: false },
					latencyMs: { type: Number, default: 0 },
					payload: { type: Schema.Types.Mixed, default: {} },
					responseSnippet: { type: String, default: '' },
					timestamp: { type: Date, default: Date.now },
				},
			],
			default: [],
		},
	},
	{ timestamps: true }
);

export default schema;
