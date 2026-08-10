/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true },
		timestamp: { type: Number, required: true },
		onlineSince: { type: Number, required: true },
		guildCount: { type: Number, required: true },
		userCount: { type: Number, required: true },
		shardCount: { type: Number, required: true },
		voteCount: { type: Number, required: true },
		shards: [
			{ shardId: { type: Number, required: true }, onlineSince: { type: Number, required: true }, guildCount: { type: Number, required: true }, userCount: { type: Number, required: true } },
		],
	},
	{ timestamps: true }
);

export default schema;
