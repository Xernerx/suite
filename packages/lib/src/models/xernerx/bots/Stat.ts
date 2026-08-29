/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		id: { type: String, required: true },
		voteCount: { type: Number, default: 0 },
		guildCount: { type: Number, default: 0 },
		userCount: { type: Number, default: 0 },
		shardCount: { type: Number, default: 0 },
		onlineSince: { type: Number, default: 0 },
		shards: { type: Schema.Types.Mixed, default: [] },
		timestamp: { type: Date, required: true },
		data: { type: Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true }
);
export default schema;
