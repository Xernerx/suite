/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		ownerId: { type: String, required: true, unique: true }, // user id
		theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
		accent: { type: String },
		uiZoom: { type: Number, default: 100 },
		uiGap: { type: String, default: '16' },
		textScale: { type: Number, default: 14 },
		clientSync: { type: Boolean, default: false },
		syncFromDiscord: { type: Boolean, default: true },
	},
	{ timestamps: true }
);
export default schema;
