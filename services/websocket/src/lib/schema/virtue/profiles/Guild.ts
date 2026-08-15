/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // Guild ID
		mode: { type: String, required: true, default: 'balanced', enum: ['easy', 'casual', 'balanced', 'hard', 'extreme'] }, // Guild mode for levels
		cycles: {
			monthly: { type: Boolean, default: false },
			weekly: { type: Boolean, default: false },
			daily: { type: Boolean, default: false },
		},
		roles: {
			ignored: { type: [String], default: [] },
			tracked: { type: [String], default: [] },
		},
		levelUp: { type: Boolean, default: true },
		levelMessage: { type: String, default: '[@mention] reached level [@level] :tada:!' },
		levelChannel: { type: String, default: null },
		autoDelete: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

export default schema;
