/** @format */

import { Schema } from 'mongoose';

const AnswerSchema = new Schema(
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
		id: { type: String, unique: true, required: true },
		guild: { type: String, required: true, index: true },
		positionId: { type: String, required: true, index: true },
		positionName: { type: String, required: true },
		userId: { type: String, required: true, index: true },
		userTag: { type: String, default: '' },
		userAvatar: { type: String, default: '' },
		status: {
			type: String,
			enum: ['pending', 'approved', 'denied', 'withdrawn'],
			default: 'pending',
			index: true,
		},
		answers: {
			type: [AnswerSchema],
			default: [],
		},
		reviewedBy: { type: String, default: null },
		reviewedByTag: { type: String, default: null },
		reviewReason: { type: String, default: null },
		reviewedAt: { type: Date, default: null },
		logChannelId: { type: String, default: null },
		logMessageId: { type: String, default: null },
		archiveMessageId: { type: String, default: null },
		threadId: { type: String, default: null },
	},
	{ timestamps: true }
);

schema.index({ guild: 1, status: 1, createdAt: -1 });
schema.index({ guild: 1, positionId: 1, userId: 1, createdAt: -1 });

export default schema;
