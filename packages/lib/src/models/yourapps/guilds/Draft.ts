/** @format */

import { Schema } from 'mongoose';

const DraftAnswerSchema = new Schema(
	{
		questionId: { type: String, required: true },
		question: { type: String, required: true },
		type: { type: String, default: 'paragraph' },
		answer: { type: String, default: '' },
	},
	{ _id: false }
);

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // `${guild}:${userId}:${positionId}`
		guild: { type: String, required: true, index: true },
		userId: { type: String, required: true, index: true },
		positionId: { type: String, required: true, index: true },
		currentStep: { type: Number, default: 0 },
		answers: {
			type: [DraftAnswerSchema],
			default: [],
		},
	},
	{ timestamps: true }
);

schema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // Auto-clean stale drafts after 7 days

export default schema;
