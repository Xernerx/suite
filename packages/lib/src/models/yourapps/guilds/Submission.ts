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

const VoteSchema = new Schema(
	{
		userId: { type: String, required: true },
		userTag: { type: String, default: '' },
		vote: { type: String, enum: ['up', 'down'], required: true },
		createdAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const InternalNoteSchema = new Schema(
	{
		id: { type: String, required: true },
		authorId: { type: String, required: true },
		authorTag: { type: String, default: '' },
		content: { type: String, required: true },
		createdAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const ClarificationSchema = new Schema(
	{
		id: { type: String, required: true },
		prompt: { type: String, required: true },
		requestedBy: { type: String, required: true },
		requestedByTag: { type: String, default: '' },
		requestedAt: { type: Date, default: Date.now },
		response: { type: String, default: null },
		respondedAt: { type: Date, default: null },
	},
	{ _id: false }
);

const ApplicantMetaSchema = new Schema(
	{
		accountCreatedAt: { type: Date, default: null },
		guildJoinedAt: { type: Date, default: null },
		rolesSnapshot: { type: [String], default: [] },
		priorSubmissionsCount: { type: Number, default: 0 },
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
		anonymous: { type: Boolean, default: false },
		status: {
			type: String,
			enum: ['pending', 'interview', 'needs_info', 'approved', 'denied', 'withdrawn'],
			default: 'pending',
			index: true,
		},
		answers: {
			type: [AnswerSchema],
			default: [],
		},
		votes: {
			type: [VoteSchema],
			default: [],
		},
		internalNotes: {
			type: [InternalNoteSchema],
			default: [],
		},
		clarifications: {
			type: [ClarificationSchema],
			default: [],
		},
		applicantMeta: {
			type: ApplicantMetaSchema,
			default: null,
		},
		reviewedBy: { type: String, default: null },
		reviewedByTag: { type: String, default: null },
		reviewReason: { type: String, default: null },
		reviewedAt: { type: Date, default: null },
		logChannelId: { type: String, default: null },
		logMessageId: { type: String, default: null },
		archiveMessageId: { type: String, default: null },
		threadId: { type: String, default: null },
		interviewChannelId: { type: String, default: null },
		interviewMode: { type: String, default: null },
		pollMessageId: { type: String, default: null },
	},
	{ timestamps: true }
);

schema.index({ guild: 1, status: 1, createdAt: -1 });
schema.index({ guild: 1, positionId: 1, userId: 1, createdAt: -1 });

export default schema;
