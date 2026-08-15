/** @format */
import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		name: { type: String, required: true },
		description: { type: String },
		rewardRole: { type: String }, // Role ID to give on approval
		status: { type: String, enum: ['open', 'closed'], default: 'open' },
		public: { type: Boolean, default: true },
		requireLogin: { type: Boolean, default: true },
		benefits: [{ type: String }],
		requirements: [{ type: String }],
		questions: [
			{
				id: { type: String, required: true },
				type: { type: String, enum: ['text', 'textarea', 'select', 'checkbox', 'radio'], required: true },
				question: { type: String, required: true },
				required: { type: Boolean, default: false },
				options: [{ type: String }],
			},
		],
	},
	{ timestamps: true }
);

export default schema;
